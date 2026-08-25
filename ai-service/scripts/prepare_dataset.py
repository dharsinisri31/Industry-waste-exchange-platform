import os
import shutil
import hashlib
import json
from collections import defaultdict
from sklearn.model_selection import train_test_split

RAW_DATASET_DIR = os.path.join("datasets", "raw", "garbage_classification")
PROCESSED_DIR = os.path.join("datasets", "processed", "material_classification")
MANIFEST_PATH = os.path.join("datasets", "manifest.json")

# Explicit duplicate hash list or pair exclusion list to safeguard
EXCLUDE_DUPLICATE_PAIRS = [
    ("glass", "glass115.jpg"), ("metal", "metal91.jpg"),
    ("glass", "glass176.jpg"), ("plastic", "plastic152.jpg"),
    ("glass", "glass389.jpg"), ("plastic", "plastic332.jpg"),
]

def prepare_dataset(train_ratio=0.70, val_ratio=0.15, test_ratio=0.15, seed=42):
    print("=== Starting Dataset Cleaning & Stratified Splitting ===")
    
    if not os.path.exists(RAW_DATASET_DIR):
        raise FileNotFoundError(f"Raw dataset path non-existent: {RAW_DATASET_DIR}")

    classes = sorted([d for d in os.listdir(RAW_DATASET_DIR) if os.path.isdir(os.path.join(RAW_DATASET_DIR, d))])
    print(f"Detected Classes ({len(classes)}): {classes}")

    # Gather all valid non-duplicate files
    all_records = []
    seen_hashes = {}
    duplicates_removed = 0
    total_raw_count = 0

    for cls in classes:
        cls_dir = os.path.join(RAW_DATASET_DIR, cls)
        for fname in os.listdir(cls_dir):
            fpath = os.path.join(cls_dir, fname)
            if not os.path.isfile(fpath):
                continue
            
            total_raw_count += 1

            # Compute MD5
            with open(fpath, "rb") as fp:
                file_hash = hashlib.md5(fp.read()).hexdigest()

            # Check duplicate hash or explicit duplicate list
            if file_hash in seen_hashes:
                first_cls, first_fname = seen_hashes[file_hash]
                print(f"[Duplicate Removed] {cls}/{fname} is identical to {first_cls}/{first_fname}")
                duplicates_removed += 1
                continue

            seen_hashes[file_hash] = (cls, fname)
            all_records.append({
                "class": cls,
                "filename": fname,
                "raw_path": fpath,
                "hash": file_hash
            })

    print(f"Total Raw Images Analyzed: {total_raw_count}")
    print(f"Duplicates Excluded: {duplicates_removed}")
    print(f"Clean Unique Images Retained: {len(all_records)}")

    # Stratified Train/Val/Test Split
    filepaths = [r["raw_path"] for r in all_records]
    labels = [r["class"] for r in all_records]

    # First split: Train vs (Val + Test)
    val_test_ratio = val_ratio + test_ratio
    train_paths, val_test_paths, train_labels, val_test_labels = train_test_split(
        filepaths, labels, test_size=val_test_ratio, random_state=seed, stratify=labels
    )

    # Second split: Val vs Test (equal share of val_test)
    val_share = val_ratio / val_test_ratio
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        val_test_paths, val_test_labels, test_size=(1.0 - val_share), random_state=seed, stratify=val_test_labels
    )

    splits = {
        "train": (train_paths, train_labels),
        "validation": (val_paths, val_labels),
        "test": (test_paths, test_labels)
    }

    # Clean existing processed directory if any
    if os.path.exists(PROCESSED_DIR):
        shutil.rmtree(PROCESSED_DIR)

    split_counts = defaultdict(lambda: defaultdict(int))
    manifest_data = {"classes": classes, "splits": {}}

    for split_name, (paths, lbls) in splits.items():
        manifest_data["splits"][split_name] = []
        for src_path, lbl in zip(paths, lbls):
            fname = os.path.basename(src_path)
            dest_dir = os.path.join(PROCESSED_DIR, split_name, lbl)
            os.makedirs(dest_dir, exist_ok=True)
            dest_path = os.path.join(dest_dir, fname)
            shutil.copy2(src_path, dest_path)
            
            split_counts[split_name][lbl] += 1
            manifest_data["splits"][split_name].append({
                "class": lbl,
                "filename": fname,
                "processed_path": dest_path
            })

    # Save manifest
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest_data, f, indent=2)

    print(f"\nManifest saved to {MANIFEST_PATH}")
    print("\n--- Split Summary ---")
    for split_name in ["train", "validation", "test"]:
        total_split = sum(split_counts[split_name].values())
        print(f"Split: '{split_name}' (Total: {total_split} images)")
        for cls in classes:
            cnt = split_counts[split_name][cls]
            pct = (cnt / total_split * 100) if total_split > 0 else 0
            print(f"  - {cls}: {cnt} ({pct:.2f}%)")
    
    return {
        "total_raw": total_raw_count,
        "duplicates_removed": duplicates_removed,
        "total_clean": len(all_records),
        "train_count": len(train_paths),
        "val_count": len(val_paths),
        "test_count": len(test_paths),
        "classes": classes,
        "split_counts": dict(split_counts)
    }

if __name__ == "__main__":
    prepare_dataset()
