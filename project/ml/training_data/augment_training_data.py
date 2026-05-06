import json
import os
import random
import numpy as np

def augment_data(input_file, output_file, factor=3):
    if not os.path.exists(input_file):
        print(f"Pominiecie: {input_file} (nie istnieje)")
        return

    print(f"\n--- Analiza i Augmentacja: {input_file} ---")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    original_frames = data.get('frames', [])
    if not original_frames:
        print(f"Brak klatek w {input_file}")
        return

    # Analiza błędów
    error_counts = {}
    correct_count = 0
    for frame in original_frames:
        labels = frame['labels']
        if labels.get('correct'):
            correct_count += 1
        else:
            for label, val in labels.items():
                if val and label != 'correct':
                    error_counts[label] = error_counts.get(label, 0) + 1

    print(f"Statystyki surowe:")
    print(f"  - Poprawne: {correct_count}")
    for err, count in error_counts.items():
        print(f"  - Blad '{err}': {count}")
    
    if not error_counts:
        print("!!! UWAGA: Brak wykrytych bledow w tym pliku. Model nie bedzie umial ich rozpoznawac.")

    augmented_frames = []
    
    # Zachowaj oryginalne klatki
    augmented_frames.extend(original_frames)
    
    for frame in original_frames:
        features = frame['features']
        labels = frame['labels']
        
        # Generuj dodatkowe wersje z szumem
        for _ in range(factor):
            # Mały szum dla cech (normalny rozkład)
            noise = np.random.normal(0, 0.012, len(features))
            noisy_features = [max(-1, min(2, round(float(f + n), 6))) for f, n in zip(features, noise)]
            
            augmented_frames.append({
                "features": noisy_features,
                "labels": labels,
                "augmented": True
            })
            
    # Pomieszaj klatki
    random.shuffle(augmented_frames)
    
    data['frames'] = augmented_frames
    data['totalFrames'] = len(augmented_frames)
    data['augmented'] = True
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    
    print(f"Zakonczono! Nowa liczba klatek: {len(augmented_frames)} (zapisano do {output_file})")

if __name__ == "__main__":
    DATA_DIR = r"project/ml/training_data"
    
    # Lista plików do augmentacji
    files_to_augment = [
        "trening_squat_3d.json",
        "trening_pushup.json",
        "trening_lunge.json",
        "trening_jumping_jacks.json"
    ]
    
    for filename in files_to_augment:
        input_path = os.path.join(DATA_DIR, filename)
        output_name = filename.replace(".json", "_augmented.json")
        output_path = os.path.join(DATA_DIR, output_name)
        
        augment_data(input_path, output_path, factor=4)
