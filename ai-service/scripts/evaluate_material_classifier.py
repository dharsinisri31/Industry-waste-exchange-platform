"""
Evaluation script for 6-Class Material Classifier (EfficientNet-B0)
Calculates Accuracy, Precision, Recall, Macro F1, Weighted F1, Confusion Matrix, and Per-Class metrics.
Usage:
    python scripts/evaluate_material_classifier.py
"""

import os
import json
import torch
import torch.nn as nn
import torchvision
import torchvision.transforms as transforms
from torchvision.models import efficientnet_b0
from torch.utils.data import DataLoader
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

MODEL_DIR = os.path.join("models", "classification")
MODEL_PATH = os.path.join(MODEL_DIR, "material_classifier_efficientnet_b0.pth")
DATASET_DIR = os.path.join("datasets", "processed", "material_classification")
TEST_DIR = os.path.join(DATASET_DIR, "test")
EVAL_SAVE_DIR = os.path.join("outputs", "evaluation", "material_classifier")

def evaluate_model(image_size: int = 224, batch_size: int = 32):
    print("=== Starting Material Classifier Evaluation ===")
    os.makedirs(EVAL_SAVE_DIR, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model checkpoint file not found at: {MODEL_PATH}")

    if not os.path.exists(TEST_DIR):
        raise FileNotFoundError(f"Test split dataset directory not found at: {TEST_DIR}")

    # Load Model Checkpoint
    checkpoint = torch.load(MODEL_PATH, map_location=device)
    class_names = checkpoint.get("class_names", ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash'])
    num_classes = len(class_names)

    # Initialize Architecture
    model = efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2, inplace=True),
        nn.Linear(in_features, num_classes)
    )
    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()

    # Transforms & DataLoader
    test_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    test_dataset = torchvision.datasets.ImageFolder(TEST_DIR, transform=test_transform)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    print(f"Test Split Dataset: {len(test_dataset)} images across {num_classes} classes")

    y_true = []
    y_pred = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)

            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    # Metrics Calculation
    accuracy = accuracy_score(y_true, y_pred)
    macro_precision, macro_recall, macro_f1, _ = precision_recall_fscore_support(y_true, y_pred, average='macro')
    weighted_precision, weighted_recall, weighted_f1, _ = precision_recall_fscore_support(y_true, y_pred, average='weighted')
    per_class_precision, per_class_recall, per_class_f1, per_class_support = precision_recall_fscore_support(y_true, y_pred, average=None)

    cm = confusion_matrix(y_true, y_pred)
    cls_report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)

    print("\n================== EVALUATION REPORT ==================")
    print(f"Overall Test Accuracy: {accuracy*100:.2f}%")
    print(f"Macro Precision       : {macro_precision:.4f}")
    print(f"Macro Recall          : {macro_recall:.4f}")
    print(f"Macro F1-Score        : {macro_f1:.4f}")
    print(f"Weighted F1-Score     : {weighted_f1:.4f}")

    print("\n--- Per-Class Performance ---")
    per_class_metrics = {}
    for idx, cls in enumerate(class_names):
        print(f"  Class '{cls:10s}': Precision = {per_class_precision[idx]:.4f} | Recall = {per_class_recall[idx]:.4f} | F1 = {per_class_f1[idx]:.4f} | Support = {per_class_support[idx]}")
        per_class_metrics[cls] = {
            "precision": float(per_class_precision[idx]),
            "recall": float(per_class_recall[idx]),
            "f1_score": float(per_class_f1[idx]),
            "support": int(per_class_support[idx])
        }

    print("\n--- Confusion Matrix ---")
    print(f"Classes: {class_names}")
    print(cm)

    # Save Results JSON
    eval_results = {
        "model_name": "EfficientNet-B0",
        "num_test_samples": int(len(test_dataset)),
        "classes": class_names,
        "accuracy": float(accuracy),
        "macro_metrics": {
            "precision": float(macro_precision),
            "recall": float(macro_recall),
            "macro_f1": float(macro_f1)
        },
        "weighted_metrics": {
            "precision": float(weighted_precision),
            "recall": float(weighted_recall),
            "weighted_f1": float(weighted_f1)
        },
        "per_class_performance": per_class_metrics,
        "confusion_matrix": cm.tolist(),
        "classification_report": cls_report
    }

    eval_json_path = os.path.join(EVAL_SAVE_DIR, "material_classifier_eval.json")
    with open(eval_json_path, "w") as f:
        json.dump(eval_results, f, indent=2)

    print(f"\nEvaluation metrics successfully saved to: {eval_json_path}")
    return eval_results

if __name__ == "__main__":
    evaluate_model()
