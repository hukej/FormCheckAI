"""
extract_qevd.py
===============
Ekstrakcja danych treningowych z benchmarku QEVD-FIT-COACH.
Przetwarza filmy wideo, wyciąga szkielety 3D za pomocą MediaPipe Tasks API,
i automatycznie etykietuje klatki na podstawie komentarzy trenerskich.

Wynik: pliki trening_<exercise>_qevd.json w folderze training_data/
       z 14-wymiarowymi cechami i etykietami błędów.
"""

import json
import os
import sys
import cv2
import math
import numpy as np

# ============================================================
#  GEOMETRIA 3D (identyczna z ExerciseModel.js)
# ============================================================

def calculate_angle_3d(a, b, c):
    ba = [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
    bc = [c[0] - b[0], c[1] - b[1], c[2] - b[2]]
    dot = ba[0]*bc[0] + ba[1]*bc[1] + ba[2]*bc[2]
    norm_ba = math.hypot(math.hypot(ba[0], ba[1]), ba[2])
    norm_bc = math.hypot(math.hypot(bc[0], bc[1]), bc[2])
    if norm_ba == 0 or norm_bc == 0:
        return 0.0
    cosine_angle = max(min(dot / (norm_ba * norm_bc), 1.0), -1.0)
    return math.acos(cosine_angle) * 180.0 / math.pi


def extract_features(lms):
    """Wyciąga 14 cech geometrycznych ze szkieletu 3D (zgodne z ExerciseModel.js)."""
    if not lms or len(lms) < 33:
        return None

    shoulderLeft, shoulderRight = lms[11], lms[12]
    hipLeft, hipRight = lms[23], lms[24]
    kneeLeft, kneeRight = lms[25], lms[26]
    ankleLeft, ankleRight = lms[27], lms[28]
    heelLeft, heelRight = lms[29], lms[30]
    toeLeft, toeRight = lms[31], lms[32]

    kneeL = calculate_angle_3d(hipLeft, kneeLeft, ankleLeft) / 180.0
    kneeR = calculate_angle_3d(hipRight, kneeRight, ankleRight) / 180.0
    hipL = calculate_angle_3d(shoulderLeft, hipLeft, kneeLeft) / 180.0
    hipR = calculate_angle_3d(shoulderRight, hipRight, kneeRight) / 180.0
    ankleL = calculate_angle_3d(kneeLeft, ankleLeft, toeLeft) / 180.0
    ankleR = calculate_angle_3d(kneeRight, ankleRight, toeRight) / 180.0

    pelvis = (
        (hipLeft[0] + hipRight[0]) / 2,
        (hipLeft[1] + hipRight[1]) / 2,
        (hipLeft[2] + hipRight[2]) / 2
    )
    neck = (
        (shoulderLeft[0] + shoulderRight[0]) / 2,
        (shoulderLeft[1] + shoulderRight[1]) / 2,
        (shoulderLeft[2] + shoulderRight[2]) / 2
    )
    vertical = (pelvis[0], pelvis[1] - 1, pelvis[2])
    torsoLean = calculate_angle_3d(neck, pelvis, vertical) / 180.0

    kneeDist = math.hypot(math.hypot(kneeLeft[0] - kneeRight[0], kneeLeft[1] - kneeRight[1]),
                          kneeLeft[2] - kneeRight[2])
    hipDist = math.hypot(math.hypot(hipLeft[0] - hipRight[0], hipLeft[1] - hipRight[1]),
                         hipLeft[2] - hipRight[2])
    valgusIndex = (kneeDist / hipDist) if hipDist > 0 else 1.0

    torsoSize = math.hypot(math.hypot(pelvis[0] - neck[0], pelvis[1] - neck[1]),
                           pelvis[2] - neck[2])
    if torsoSize == 0:
        torsoSize = 1.0

    heelLiftL = (heelLeft[1] - toeLeft[1]) / torsoSize
    heelLiftR = (heelRight[1] - toeRight[1]) / torsoSize

    avgKneeY = (kneeLeft[1] + kneeRight[1]) / 2
    depthIndex = (pelvis[1] - avgKneeY) / torsoSize

    shoulderWidth = abs(shoulderLeft[0] - shoulderRight[0])
    bodyHeight = abs(pelvis[1] - neck[1])
    compressionRatio = shoulderWidth / bodyHeight if bodyHeight > 0 else 1.0

    footCenterX = (toeLeft[0] + toeRight[0]) / 2
    balanceShift = pelvis[0] - footCenterX

    hipSymmetry = abs(hipLeft[1] - hipRight[1]) / torsoSize

    return [
        round(kneeL, 6), round(kneeR, 6),
        round(hipL, 6), round(hipR, 6),
        round(ankleL, 6), round(ankleR, 6),
        round(torsoLean, 6), round(valgusIndex, 6),
        round(heelLiftL, 6), round(heelLiftR, 6),
        round(depthIndex, 6),
        round(compressionRatio, 6),
        round(balanceShift, 6),
        round(hipSymmetry, 6)
    ]


# ============================================================
#  KLASYFIKACJA FEEDBACKU -> ETYKIETY BŁĘDÓW
# ============================================================

# Słowa kluczowe, które NIE powinny uruchamiać etykiet błędów
# (są to ogólne zachęty, odliczanie, itp.)
IGNORE_PATTERNS = [
    "keep it up", "let's go", "come on", "work it",
    "moving on", "first up", "let's get started",
    "time for", "reps", "smashed it", "almost there",
    "welcome back", "get back at it", "start",
    "you can start", "anytime now", "any time now",
    "next one", "that was really", "we are at",
    "still waiting", "i know"
]

def is_ignorable(text):
    """Sprawdza czy tekst to ogólna zachęta, a nie konkretny feedback o technice."""
    t = text.lower()
    for p in IGNORE_PATTERNS:
        if p in t:
            return True
    # Odliczanie (same liczby)
    if t.strip().isdigit():
        return True
    return False


def analyze_feedback(text, exercise):
    """
    Analizuje tekst komentarza trenerskiego i zwraca słownik etykiet.
    Zwraca None, jeśli nie da się wyciągnąć żadnej sensownej etykiety.
    """
    t = text.lower().strip()
    if not t:
        return None

    labels = {
        "correct": False, "up": False, "down": False, "shallow": False,
        "valgus": False, "lean": False, "heels_up": False,
        "wide_elbows": False, "sagging_hips": False,
        "knee_over_toe": False, "unstable_core": False,
        "arms_too_low": False, "asymmetry": False
    }

    is_error = False

    # ---------- SQUAT ----------
    if exercise == "squat":
        if any(w in t for w in ["shallow", "deeper", "go down", "not deep enough", "go lower"]):
            labels["shallow"] = True; is_error = True
        if any(w in t for w in ["narrow", "widen", "stance", "valgus", "feet wider"]):
            labels["valgus"] = True; is_error = True
        if any(w in t for w in ["lean", "back straight", "upright", "don't bend forward",
                                 "chest up", "leaning"]):
            labels["lean"] = True; is_error = True
        if any(w in t for w in ["heel", "toes", "flat foot"]):
            labels["heels_up"] = True; is_error = True

    # ---------- PUSHUP ----------
    elif exercise == "pushup":
        if any(w in t for w in ["lower", "go down", "not low enough", "deeper",
                                 "more range", "shallow"]):
            labels["shallow"] = True; is_error = True
        if any(w in t for w in ["back straight", "sagging", "hip", "butt",
                                 "body straight", "plank", "core", "don't sag"]):
            labels["sagging_hips"] = True; is_error = True
        if any(w in t for w in ["elbow", "wide", "flare", "tuck"]):
            labels["wide_elbows"] = True; is_error = True
        if any(w in t for w in ["stretch your leg", "the other way", "not right",
                                 "that's not", "knee push"]):
            labels["sagging_hips"] = True; is_error = True

    # ---------- LUNGE / HIGH KNEES ----------
    elif exercise == "lunge":
        if any(w in t for w in ["low", "higher", "not high enough", "waist height",
                                 "knees up", "get those knees"]):
            labels["shallow"] = True; is_error = True
        if any(w in t for w in ["smooth step", "balance", "wobble", "stable",
                                 "control", "steady"]):
            labels["unstable_core"] = True; is_error = True
        if any(w in t for w in ["knee over", "knee past", "knee forward"]):
            labels["knee_over_toe"] = True; is_error = True

    # ---------- JUMPING JACKS ----------
    elif exercise == "jumping_jacks":
        if any(w in t for w in ["only moving your arms", "don't forget your arms",
                                 "arms up", "put the arms", "arms higher",
                                 "hands straight", "hands out"]):
            labels["arms_too_low"] = True; is_error = True
        if any(w in t for w in ["together", "fluid motion", "one motion",
                                 "synchronize", "same time", "legs, arms"]):
            labels["asymmetry"] = True; is_error = True
        if any(w in t for w in ["only moving your arms", "not jumping",
                                 "start jumping", "get jumping"]):
            labels["shallow"] = True; is_error = True

    # ---------- POZYTYWNY FEEDBACK (correct) ----------
    if not is_error:
        positive_words = ["nice", "good", "excellent", "awesome", "great",
                          "love", "perfect", "that's it", "yes!", "fantastic",
                          "well done", "beautiful", "smashed"]
        if any(w in t for w in positive_words):
            labels["correct"] = True

    # Jeśli żadna etykieta nie została ustawiona, lub to ogólna zachęta - pomijamy
    if not any(labels.values()):
        return None
    if is_ignorable(t) and not is_error:
        return None

    return labels


# ============================================================
#  DETEKCJA TYPU ĆWICZENIA Z WIDEO
# ============================================================

EXERCISE_KEYWORDS = {
    "squat":         ["squat", "squats", "let's squat"],
    "pushup":        ["push up", "pushup", "push-up", "pushups", "push ups"],
    "lunge":         ["lunge", "lunges", "high knee", "high knees"],
    "jumping_jacks": ["jumping jack", "jumping jacks"],
}

def detect_exercises_in_video(feedbacks):
    """
    Analizuje wszystkie komentarze i zwraca LISTĘ ćwiczeń wykrytych w danym filmie
    wraz z zakresami klatek, w których się pojawiają.
    Filmy z benchmarku mogą zawierać wiele ćwiczeń po sobie!
    """
    full = " ".join(feedbacks).lower()
    exercises_found = []
    for ex, keywords in EXERCISE_KEYWORDS.items():
        if any(kw in full for kw in keywords):
            exercises_found.append(ex)
    return exercises_found


def detect_exercise_at_frame(feedbacks, frame_idx):
    """
    Patrzy wstecz od bieżącej klatki, żeby ustalić jakie ćwiczenie
    aktualnie trwa na filmie (bo mogą się zmieniać).
    """
    for i in range(frame_idx, max(-1, frame_idx - 300), -1):
        if i < len(feedbacks):
            t = feedbacks[i].lower()
            for ex, keywords in EXERCISE_KEYWORDS.items():
                for kw in keywords:
                    if f"moving on to {kw}" in t or f"first up are {kw}" in t or \
                       f"time for {kw}" in t or f"let's {kw}" in t or \
                       f"it's {kw}" in t or f"started with the {kw}" in t:
                        return ex
    return None


# ============================================================
#  GŁÓWNA PĘTLA
# ============================================================

def main():
    BENCHMARK_DIR = r"C:\Users\Kacpe\Desktop\QEVD-FIT-COACH-Benchmark\QEVD-FIT-COACH-Benchmark"
    MODEL_PATH = r"c:\Users\Kacpe\Desktop\Practisy pzdr\FormCheckAI\pose_landmarker_heavy.task"
    OUTPUT_DIR = r"c:\Users\Kacpe\Desktop\Practisy pzdr\FormCheckAI\project\ml\training_data"

    json_path = os.path.join(BENCHMARK_DIR, "feedbacks_long_range.json")

    print("Ladowanie feedbackow...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"Znaleziono {len(data)} plikow wideo.\n")

    # --- MediaPipe Tasks API ---
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

    base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    options = mp_vision.PoseLandmarkerOptions(
        base_options=base_options,
        output_segmentation_masks=False,
    )
    detector = mp_vision.PoseLandmarker.create_from_options(options)

    datasets = {
        "squat": [],
        "pushup": [],
        "lunge": [],
        "jumping_jacks": [],
    }

    total_extracted = 0
    total_errors = 0
    total_correct = 0
    skipped_videos = 0

    for vid_idx, video_data in enumerate(data):
        vid_file = video_data["long_range_video_file"].replace("./", "")
        vid_path = os.path.join(BENCHMARK_DIR, vid_file)
        feedbacks = video_data.get("feedbacks", [])

        if not os.path.exists(vid_path):
            skipped_videos += 1
            continue

        # Sprawdź czy film zawiera interesujące nas ćwiczenia
        exercises_in_video = detect_exercises_in_video(feedbacks)
        if not exercises_in_video:
            skipped_videos += 1
            continue

        print(f"[{vid_idx+1}/{len(data)}] {vid_file} -> {', '.join(exercises_in_video)}")

        cap = cv2.VideoCapture(vid_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Przetwarzamy co N-tą klatkę, żeby przyspieszyć (ale tylko tam, gdzie jest feedback)
        SAMPLE_EVERY = 3  # co 3 klatka
        frame_idx = 0
        extracted_this_video = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Pomiń klatki bez feedbacku lub co SAMPLE_EVERY
            if frame_idx >= len(feedbacks) or frame_idx % SAMPLE_EVERY != 0:
                frame_idx += 1
                continue

            txt = feedbacks[frame_idx].strip()
            if not txt:
                frame_idx += 1
                continue

            # Ustal jakie ćwiczenie trwa w tej klatce
            current_ex = detect_exercise_at_frame(feedbacks, frame_idx)
            if not current_ex:
                # Fallback: użyj pierwszego wykrytego ćwiczenia
                current_ex = exercises_in_video[0]

            labels = analyze_feedback(txt, current_ex)
            if not labels:
                frame_idx += 1
                continue

            # --- Ekstrakcja landmarków z MediaPipe Tasks API ---
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

            try:
                result = detector.detect(mp_image)
            except Exception as e:
                frame_idx += 1
                continue

            if result.pose_world_landmarks and len(result.pose_world_landmarks) > 0:
                wl = result.pose_world_landmarks[0]
                lms = [[lm.x, lm.y, lm.z] for lm in wl]

                features = extract_features(lms)
                if features:
                    datasets[current_ex].append({
                        "features": features,
                        "labels": labels,
                        "frame": frame_idx,
                    })
                    extracted_this_video += 1
                    total_extracted += 1

                    if labels.get("correct"):
                        total_correct += 1
                    else:
                        total_errors += 1

            frame_idx += 1

        cap.release()

        if extracted_this_video > 0:
            print(f"  -> Wyciagnieto {extracted_this_video} klatek")

    # --- Zapis ---
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("\n" + "=" * 60)
    print("PODSUMOWANIE EKSTRAKCJI")
    print("=" * 60)

    for ex, frames in datasets.items():
        if len(frames) > 0:
            out_file = os.path.join(OUTPUT_DIR, f"trening_{ex}.json")
            out_data = {
                "exercise": ex,
                "frames": frames,
                "totalFrames": len(frames),
                "featuresCount": 14,
                "source": "QEVD-FIT-COACH-Benchmark"
            }
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(out_data, f, separators=(",", ":"))

            # Policz statystyki błędów
            err_count = sum(1 for fr in frames if not fr["labels"].get("correct", False))
            cor_count = sum(1 for fr in frames if fr["labels"].get("correct", False))
            unique_errors = set()
            for fr in frames:
                for k, v in fr["labels"].items():
                    if v and k != "correct":
                        unique_errors.add(k)

            print(f"\n  {ex.upper()}:")
            print(f"    Klatek ogółem: {len(frames)}")
            print(f"    Poprawnych:    {cor_count}")
            print(f"    Z błędami:     {err_count}")
            print(f"    Typy błędów:   {', '.join(sorted(unique_errors)) if unique_errors else 'brak'}")
            print(f"    Zapisano do:   {out_file}")
        else:
            print(f"\n  {ex.upper()}: BRAK DANYCH (żaden film nie zawierał tego ćwiczenia)")

    print(f"\n  SUMA: {total_extracted} klatek ({total_correct} poprawnych, {total_errors} z błędami)")
    print(f"  Pominietych filmow: {skipped_videos}")
    print("=" * 60)
    print("Gotowe!")


if __name__ == "__main__":
    main()
