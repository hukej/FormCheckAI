"""
train_and_build.py
==================
Trenuje modele ML dla kazdego cwiczenia i eksportuje do TensorFlow.js.
Wynik trafia bezposrednio do public/models/ - gotowy do wrzucenia na serwer.

Uzycie:  python train_and_build.py
"""
import json, os, sys, shutil, tempfile
import numpy as np

try:
    import tensorflow as tf
    import tensorflowjs as tfjs
except ImportError as e:
    print(f"BRAK BIBLIOTEKI: {e}\nZainstaluj: pip install tensorflow tensorflowjs")
    sys.exit(1)

# Sciezki
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "training_data")
OUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "models")
NUM_FEATURES = 14

# Konfiguracja per cwiczenie
# model_filename musi pasowac do useWorkoutDetection.js:
#   squat -> 'model.json', reszta -> '{id}_model.json'
EXERCISES = {
    "squat": {
        "labels": ["correct", "shallow", "valgus", "lean", "heels_up"],
        "data": "trening_squat.json",
        "model_file": "model.json",
        "labels_file": "labels.json",
        "weights_name": "squat_weights.bin",
    },
    "pushup": {
        "labels": ["correct", "shallow", "sagging_hips", "wide_elbows"],
        "data": "trening_pushup.json",
        "model_file": "pushup_model.json",
        "labels_file": "pushup_labels.json",
        "weights_name": "pushup_weights.bin",
    },
    "lunge": {
        "labels": ["correct", "shallow", "unstable_core", "knee_over_toe"],
        "data": "trening_lunge.json",
        "model_file": "lunge_model.json",
        "labels_file": "lunge_labels.json",
        "weights_name": "lunge_weights.bin",
    },
    "jumping_jacks": {
        "labels": ["correct", "shallow", "arms_too_low", "asymmetry"],
        "data": "trening_jumping_jacks.json",
        "model_file": "jumping_jacks_model.json",
        "labels_file": "jumping_jacks_labels.json",
        "weights_name": "jumping_jacks_weights.bin",
    },
}


def load_data(path, labels):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    X, Y = [], []
    for fr in data.get("frames", []):
        feats = fr.get("features", [])
        if len(feats) != NUM_FEATURES:
            continue
        fl = fr.get("labels", {})
        X.append(feats)
        Y.append([1.0 if fl.get(l) else 0.0 for l in labels])
    return np.array(X, dtype=np.float32), np.array(Y, dtype=np.float32)


def augment(X, Y, noise_factor=3):
    """Szum Gaussowski + oversampling bledow."""
    parts_x, parts_y = [X], [Y]
    for _ in range(noise_factor):
        parts_x.append(X + np.random.normal(0, 0.02, X.shape).astype(np.float32))
        parts_y.append(Y)
    # Oversampling bledow (correct == 0)
    err = Y[:, 0] == 0
    if err.sum() > 0:
        Xe, Ye = X[err], Y[err]
        for _ in range(noise_factor):
            parts_x.append(Xe + np.random.normal(0, 0.03, Xe.shape).astype(np.float32))
            parts_y.append(Ye)
    return np.vstack(parts_x), np.vstack(parts_y)


def build_model(n_labels):
    """Architektura identyczna z ExerciseModel.js."""
    m = tf.keras.Sequential([
        tf.keras.layers.Dense(128, activation="relu", input_shape=(NUM_FEATURES,)),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(n_labels, activation="sigmoid"),
    ])
    m.compile(optimizer=tf.keras.optimizers.Adam(0.001),
              loss="binary_crossentropy", metrics=["accuracy"])
    return m


def train_one(name, cfg):
    src = os.path.join(DATA_DIR, cfg["data"])
    if not os.path.exists(src):
        print(f"  BRAK: {src} - pomijam")
        return False

    labels = cfg["labels"]
    print(f"\n{'='*55}")
    print(f"  {name.upper()}  |  etykiety: {labels}")
    print(f"{'='*55}")

    X, Y = load_data(src, labels)
    print(f"  Klatek: {len(X)}")
    for i, l in enumerate(labels):
        n = int(Y[:, i].sum())
        print(f"    {l:18s} {n:5d}  ({n/len(Y)*100:5.1f}%)")

    Xa, Ya = augment(X, Y)
    print(f"  Po augmentacji: {len(Xa)}")

    # Split
    idx = np.random.RandomState(42).permutation(len(Xa))
    split = int(len(idx) * 0.85)
    Xt, Yt = Xa[idx[:split]], Ya[idx[:split]]
    Xv, Yv = Xa[idx[split:]], Ya[idx[split:]]

    model = build_model(len(labels))
    print(f"  Trening ({len(Xt)} train / {len(Xv)} val)...")

    model.fit(Xt, Yt, validation_data=(Xv, Yv),
              epochs=100, batch_size=32, verbose=0,
              callbacks=[tf.keras.callbacks.EarlyStopping(
                  monitor="val_loss", patience=12, restore_best_weights=True)])

    loss, acc = model.evaluate(Xv, Yv, verbose=0)
    print(f"  val_loss={loss:.4f}  val_acc={acc:.4f}")

    # Per-label F1
    Yp = (model.predict(Xv, verbose=0) > 0.5).astype(int)
    print("  Per-label:")
    for i, l in enumerate(labels):
        tp = ((Yp[:, i] == 1) & (Yv[:, i] == 1)).sum()
        pp = Yp[:, i].sum()
        ap = Yv[:, i].sum()
        p = tp / pp if pp else 0
        r = tp / ap if ap else 0
        f = 2*p*r/(p+r) if (p+r) else 0
        print(f"    {l:18s} P={p:.2f} R={r:.2f} F1={f:.2f}")

    # === EKSPORT do TensorFlow.js ===
    tmp = tempfile.mkdtemp()
    try:
        tfjs.converters.save_keras_model(model, tmp)

        os.makedirs(OUT_DIR, exist_ok=True)

        # Wczytaj model.json i zmien nazwe pliku wag
        mj = os.path.join(tmp, "model.json")
        with open(mj, "r") as f:
            mdata = json.load(f)

        # Znajdz oryginalny bin
        orig_bin = None
        if "weightsManifest" in mdata:
            for wm in mdata["weightsManifest"]:
                if "paths" in wm and wm["paths"]:
                    orig_bin = wm["paths"][0]
                    wm["paths"] = [cfg["weights_name"]]

        # Zapisz model.json z nowa nazwa
        dst_model = os.path.join(OUT_DIR, cfg["model_file"])
        with open(dst_model, "w") as f:
            json.dump(mdata, f)

        # Kopiuj bin
        if orig_bin:
            src_bin = os.path.join(tmp, orig_bin)
            dst_bin = os.path.join(OUT_DIR, cfg["weights_name"])
            shutil.copy2(src_bin, dst_bin)

        # Zapisz labels.json
        dst_labels = os.path.join(OUT_DIR, cfg["labels_file"])
        with open(dst_labels, "w") as f:
            json.dump(labels, f)

        print(f"  Zapisano:")
        print(f"    {dst_model}")
        print(f"    {os.path.join(OUT_DIR, cfg['weights_name'])}")
        print(f"    {dst_labels}")
        return True
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    print("=" * 55)
    print("  FormCheckAI - Trening i Build modeli ML")
    print("=" * 55)

    ok = 0
    for name, cfg in EXERCISES.items():
        if train_one(name, cfg):
            ok += 1

    print(f"\n{'='*55}")
    print(f"  GOTOWE! Wytrenowano {ok}/{len(EXERCISES)} modeli.")
    print(f"  Pliki w: {os.path.abspath(OUT_DIR)}")
    print(f"  Mozesz je wrzucic na serwer (Supabase Storage).")
    print(f"{'='*55}")


if __name__ == "__main__":
    main()
