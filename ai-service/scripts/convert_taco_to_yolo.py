import os
import json
import shutil
import yaml
from sklearn.model_selection import train_test_split

RAW_TACO_DIR = os.path.join("datasets", "raw", "taco", "TACO", "data")
ANNOTATIONS_JSON = os.path.join(RAW_TACO_DIR, "annotations.json")
PROCESSED_DETECTION_DIR = os.path.join("datasets", "processed", "detection")

def convert_taco_to_yolo(train_ratio=0.70, val_ratio=0.15, test_ratio=0.15, seed=42):
    print("=== Starting TACO to YOLO Dataset Conversion ===")
    print(f"Raw TACO Data Path: {RAW_TACO_DIR}")
    print(f"Target Processed Path: {PROCESSED_DETECTION_DIR}")

    if not os.path.exists(ANNOTATIONS_JSON):
        raise FileNotFoundError(f"Annotations JSON missing: {ANNOTATIONS_JSON}")

    with open(ANNOTATIONS_JSON, "r", encoding="utf-8") as f:
        coco_data = json.load(f)

    images = coco_data.get("images", [])
    annotations = coco_data.get("annotations", [])
    categories = coco_data.get("categories", [])

    # Map COCO category_id to contiguous 0-indexed integer
    # Sort categories by ID
    sorted_categories = sorted(categories, key=lambda c: c["id"])
    coco_id_to_yolo_id = {}
    class_names = []
    
    for yolo_id, cat in enumerate(sorted_categories):
        coco_id_to_yolo_id[cat["id"]] = yolo_id
        class_names.append(cat["name"])

    num_classes = len(class_names)
    print(f"Categories ({num_classes}): {class_names[:5]} ... {class_names[-5:]}")

    # Organize annotations by image_id
    image_id_to_anns = {}
    for ann in annotations:
        img_id = ann["image_id"]
        if img_id not in image_id_to_anns:
            image_id_to_anns[img_id] = []
        image_id_to_anns[img_id].append(ann)

    # Validate image records and file paths
    valid_images = []
    for img_rec in images:
        rel_path = img_rec["file_name"]
        abs_path = os.path.join(RAW_TACO_DIR, rel_path.replace("/", os.sep))
        if os.path.exists(abs_path):
            valid_images.append(img_rec)

    print(f"Valid Image Records Verified: {len(valid_images)} / {len(images)}")

    # Split dataset 70/15/15
    val_test_ratio = val_ratio + test_ratio
    train_imgs, val_test_imgs = train_test_split(
        valid_images, test_size=val_test_ratio, random_state=seed
    )

    val_share = val_ratio / val_test_ratio
    val_imgs, test_imgs = train_test_split(
        val_test_imgs, test_size=(1.0 - val_share), random_state=seed
    )

    splits = {
        "train": train_imgs,
        "val": val_imgs,
        "test": test_imgs
    }

    print(f"\n--- Split Summary ---")
    print(f"Train Count: {len(train_imgs)} images (70%)")
    print(f"Val Count  : {len(val_imgs)} images (15%)")
    print(f"Test Count : {len(test_imgs)} images (15%)")

    # Clean target directory
    if os.path.exists(PROCESSED_DETECTION_DIR):
        shutil.rmtree(PROCESSED_DETECTION_DIR)

    # Create subfolder structure
    for split_name in ["train", "val", "test"]:
        os.makedirs(os.path.join(PROCESSED_DETECTION_DIR, "images", split_name), exist_ok=True)
        os.makedirs(os.path.join(PROCESSED_DETECTION_DIR, "labels", split_name), exist_ok=True)

    total_bboxes_written = 0

    # Process images and labels for each split
    for split_name, img_list in splits.items():
        img_dest_dir = os.path.join(PROCESSED_DETECTION_DIR, "images", split_name)
        label_dest_dir = os.path.join(PROCESSED_DETECTION_DIR, "labels", split_name)

        for img_rec in img_list:
            img_id = img_rec["id"]
            rel_path = img_rec["file_name"]
            img_w = float(img_rec["width"])
            img_h = float(img_rec["height"])

            src_img_path = os.path.join(RAW_TACO_DIR, rel_path.replace("/", os.sep))
            
            # Generate unique base name for filename (e.g., batch_1_000001)
            file_stem = rel_path.replace("/", "_").replace("\\", "_").rsplit(".", 1)[0]
            ext = os.path.splitext(rel_path)[1]
            if not ext:
                ext = ".jpg"
                
            dest_img_path = os.path.join(img_dest_dir, f"{file_stem}{ext}")
            dest_label_path = os.path.join(label_dest_dir, f"{file_stem}.txt")

            # Copy image
            shutil.copy2(src_img_path, dest_img_path)

            # Build label lines
            label_lines = []
            anns = image_id_to_anns.get(img_id, [])

            for ann in anns:
                coco_cat_id = ann["category_id"]
                if coco_cat_id not in coco_id_to_yolo_id:
                    continue
                
                yolo_cls_id = coco_id_to_yolo_id[coco_cat_id]
                bbox = ann.get("bbox", []) # [x_min, y_min, width, height]

                if len(bbox) != 4:
                    continue

                x, y, w, h = bbox
                if w <= 0 or h <= 0:
                    continue

                # Calculate normalized coordinates
                x_center = (x + w / 2.0) / img_w
                y_center = (y + h / 2.0) / img_h
                w_norm = w / img_w
                h_norm = h / img_h

                # Clamp to [0.0, 1.0] bounds
                x_center = max(0.0, min(1.0, x_center))
                y_center = max(0.0, min(1.0, y_center))
                w_norm = max(0.0, min(1.0, w_norm))
                h_norm = max(0.0, min(1.0, h_norm))

                label_lines.append(f"{yolo_cls_id} {x_center:.6f} {y_center:.6f} {w_norm:.6f} {h_norm:.6f}")
                total_bboxes_written += 1

            with open(dest_label_path, "w", encoding="utf-8") as lf:
                lf.write("\n".join(label_lines) + ("\n" if label_lines else ""))

    # Create data.yaml
    data_yaml = {
        "path": os.path.abspath(PROCESSED_DETECTION_DIR).replace("\\", "/"),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "nc": num_classes,
        "names": {i: name for i, name in enumerate(class_names)}
    }

    yaml_path = os.path.join(PROCESSED_DETECTION_DIR, "data.yaml")
    with open(yaml_path, "w", encoding="utf-8") as yf:
        yaml.dump(data_yaml, yf, default_flow_style=False, sort_keys=False)

    print(f"\nSaved YOLO data.yaml configuration to {yaml_path}")
    print(f"Total BBoxes written to labels: {total_bboxes_written}")
    print("=== TACO to YOLO Conversion Completed Successfully ===")

    return yaml_path

if __name__ == "__main__":
    convert_taco_to_yolo()
