"""
YOLOv8 Multi-Object Waste Detection Training & Evaluation Script
Usage:
    python training/train_detection.py --epochs 15 --batch-size 16 --imgsz 640
"""

import os
import json
import shutil
import argparse
from typing import Dict, Any

try:
    import torch
    # Patch torch.load for PyTorch 2.6 weights_only default change
    _orig_torch_load = torch.load
    def _custom_torch_load(*args, **kwargs):
        if 'weights_only' not in kwargs:
            kwargs['weights_only'] = False
        return _orig_torch_load(*args, **kwargs)
    torch.load = _custom_torch_load
except Exception:
    pass

try:
    from ultralytics import YOLO
    HAS_ULTRALYTICS = True
except ImportError:
    HAS_ULTRALYTICS = False

DEFAULT_DATA_YAML = os.path.join("datasets", "processed", "detection", "data.yaml")
MODEL_SAVE_DIR = os.path.join("models", "detection")
EVAL_SAVE_DIR = os.path.join("outputs", "evaluation", "detection")
SAMPLES_SAVE_DIR = os.path.join(EVAL_SAVE_DIR, "sample_predictions")

def train_detection_model(
    data_path: str = DEFAULT_DATA_YAML,
    epochs: int = 15,
    batch_size: int = 16,
    imgsz: int = 640,
    output_dir: str = MODEL_SAVE_DIR,
    eval_dir: str = EVAL_SAVE_DIR
):
    print("=== Starting YOLOv8 Multi-Object Waste Detector Training & Evaluation ===")
    print(f"Data YAML Config : {data_path}")
    print(f"Epochs           : {epochs}")
    print(f"Batch Size       : {batch_size}")
    print(f"Image Resolution : {imgsz}x{imgsz}")
    print(f"Model Output Dir : {output_dir}")
    print(f"Eval Output Dir  : {eval_dir}")

    if not HAS_ULTRALYTICS:
        raise ImportError("Ultralytics library missing. Please install ultralytics package.")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data configuration YAML not found at: {data_path}")

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)
    os.makedirs(SAMPLES_SAVE_DIR, exist_ok=True)

    # Load Pretrained YOLOv8 Base Model
    print("\n[YOLO] Initializing YOLOv8 Nano Detection Model ('yolov8n.pt')...")
    model = YOLO("yolov8n.pt")

    # Train Model
    runs_dir = os.path.join("runs", "detect")
    train_results = model.train(
        data=data_path,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        workers=0,
        project=runs_dir,
        name="taco_waste_detector",
        exist_ok=True
    )

    # Save Best Weights to Target Directory
    best_weights_src = os.path.join(runs_dir, "taco_waste_detector", "weights", "best.pt")
    target_weights_path = os.path.join(output_dir, "best_waste_detector.pt")
    target_weights_alias = os.path.join(output_dir, "best.pt")

    if os.path.exists(best_weights_src):
        shutil.copy2(best_weights_src, target_weights_path)
        shutil.copy2(best_weights_src, target_weights_alias)
        print(f"\n[Model Saved] Best weights copied to:")
        print(f"  - {target_weights_path}")
        print(f"  - {target_weights_alias}")
    else:
        print(f"[Warning] Training best weights file non-existent at: {best_weights_src}")

    # Reload best trained weights for final test evaluation
    eval_model_path = target_weights_path if os.path.exists(target_weights_path) else best_weights_src
    best_model = YOLO(eval_model_path)

    print("\n=== Evaluating Model on Test Dataset Split ===")
    val_results = best_model.val(
        data=data_path,
        split="test",
        imgsz=imgsz,
        batch=batch_size,
        workers=0,
        project=runs_dir,
        name="test_eval",
        exist_ok=True
    )

    # Extract Key Metrics
    precision = float(val_results.box.mp)
    recall = float(val_results.box.mr)
    map50 = float(val_results.box.map50)
    map50_95 = float(val_results.box.map)

    print("\n================== EVALUATION METRICS REPORT ==================")
    print(f"Precision (mp) : {precision:.4f} ({precision*100:.2f}%)")
    print(f"Recall (mr)    : {recall:.4f} ({recall*100:.2f}%)")
    print(f"mAP@50         : {map50:.4f} ({map50*100:.2f}%)")
    print(f"mAP@50-95      : {map50_95:.4f} ({map50_95*100:.2f}%)")

    # Save Evaluation JSON
    eval_report = {
        "model_name": "YOLOv8-Nano Waste Detector",
        "dataset": "TACO (Trash Annotations in Context)",
        "input_resolution": f"{imgsz}x{imgsz}",
        "epochs_trained": epochs,
        "precision": precision,
        "recall": recall,
        "map50": map50,
        "map50_95": map50_95,
        "weights_location": target_weights_path
    }

    eval_json_path = os.path.join(eval_dir, "detection_eval.json")
    with open(eval_json_path, "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    print(f"Saved evaluation metrics to: {eval_json_path}")

    # Generate Sample Prediction Overlay Images
    print("\n=== Generating Sample Prediction Images ===")
    test_img_dir = os.path.join("datasets", "processed", "detection", "images", "test")
    if os.path.exists(test_img_dir):
        sample_imgs = [os.path.join(test_img_dir, f) for f in os.listdir(test_img_dir) if f.endswith(('.jpg', '.png'))][:10]
        if sample_imgs:
            preds = best_model.predict(
                source=sample_imgs,
                conf=0.25,
                save=True,
                project=EVAL_SAVE_DIR,
                name="sample_predictions",
                exist_ok=True
            )
            print(f"Saved sample prediction images with bounding boxes under: {SAMPLES_SAVE_DIR}")

    return eval_report

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Custom YOLO Waste Detector")
    parser.add_argument("--data", type=str, default=DEFAULT_DATA_YAML, help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=15, help="Epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--output-dir", type=str, default=MODEL_SAVE_DIR, help="Model weights directory")
    
    args = parser.parse_args()
    train_detection_model(
        data_path=args.data,
        epochs=args.epochs,
        batch_size=args.batch_size,
        imgsz=args.imgsz,
        output_dir=args.output_dir
    )
