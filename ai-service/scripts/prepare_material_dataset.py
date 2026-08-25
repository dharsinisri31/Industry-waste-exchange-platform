"""
Prepare Material Classification Dataset
Splits raw dataset (ai-service/datasets/raw/garbage_classification/) into:
  - 70% train
  - 15% validation
  - 15% test
under ai-service/datasets/processed/material_classification/ (stratified by class).
"""
import os
import shutil
import glob
import random
from typing import Dict, List

RAW_DIR = os.path.join("datasets", "raw", "garbage_classification")
OUTPUT_DIR = os.path.join("datasets", "processed", "material_classification")

def prepare_dataset(seed: int = 42):
    random.seed(seed)
    print("=== Starting Dataset Preparation & Stratified Splitting ===")
    print(f"Raw Input Directory: {RAW_DIR}")
    print(f"Processed Output Directory: {OUTPUT_DIR}")

    if not os.path.exists(RAW_DIR):
        raise FileNotFoundError(f"Raw directory not found: {RAW_DIR}")

    classes = sorted([d for d in os.listdir(RAW_DIR) if os.path.isdir(os.path.join(RAW_DIR, d))])
    print(f"Detected {len(classes)} classes: {classes}")

    # Clean / create output directories
    for split in ["train", "validation", "test"]:
        for cls in classes:
            os.makedirs(os.path.join(OUTPUT_DIR, split, cls), exist_ok=True)

    counts = {"train": 0, "validation": 0, "test": 0}
    per_class_summary: Dict[str, Dict[str, int]] = {}

    for cls in classes:
        cls_dir = os.path.join(RAW_DIR, cls)
        image_files = sorted([
            f for f in glob.glob(os.path.join(cls_dir, "*"))
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff'))
        ])
        
        # Shuffle deterministically
        random.shuffle(image_files)
        total = len(image_files)

        n_train = int(total * 0.70)
        n_val = int(total * 0.15)
        # Remainder goes to test to ensure exact 100% accounting
        n_test = total - n_train - n_val

        train_files = image_files[:n_train]
        val_files = image_files[n_train:n_train + n_val]
        test_files = image_files[n_train + n_val:]

        per_class_summary[cls] = {
            "total": total,
            "train": len(train_files),
            "validation": len(val_files),
            "test": len(test_files)
        }

        # Copy to target folders without modifying originals
        for fpath in train_files:
            dest = os.path.join(OUTPUT_DIR, "train", cls, os.path.basename(fpath))
            shutil.copy2(fpath, dest)
            counts["train"] += 1

        for fpath in val_files:
            dest = os.path.join(OUTPUT_DIR, "validation", cls, os.path.basename(fpath))
            shutil.copy2(fpath, dest)
            counts["validation"] += 1

        for fpath in test_files:
            dest = os.path.join(OUTPUT_DIR, "test", cls, os.path.basename(fpath))
            shutil.copy2(fpath, dest)
            counts["test"] += 1

    print("\n--- Stratified Dataset Split Summary ---")
    for cls, cinfo in per_class_summary.items():
        print(f"  Class '{cls}': {cinfo['total']} total -> Train: {cinfo['train']} | Val: {cinfo['validation']} | Test: {cinfo['test']}")

    print(f"\nTotal Processed Images: {counts['train'] + counts['validation'] + counts['test']}")
    print(f"  Train (70%): {counts['train']} images")
    print(f"  Validation (15%): {counts['validation']} images")
    print(f"  Test (15%): {counts['test']} images")
    print("=== Dataset Preparation Complete ===")

if __name__ == "__main__":
    prepare_dataset()
