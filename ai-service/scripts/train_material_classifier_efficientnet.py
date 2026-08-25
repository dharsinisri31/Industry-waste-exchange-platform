"""
EfficientNet-B0 Material Classifier Trainer & Evaluator
Trains transfer learning model on datasets/processed/material_classification/ (train, validation, test).
Handles class imbalance with weighted CrossEntropyLoss.
Tracks loss, accuracy, precision, recall, F1-score.
Generates confusion matrix and classification report JSONs under outputs/evaluation/material_classifier/.
"""
import os
import json
import time
from typing import Dict, Any, List

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import torchvision
import torchvision.transforms as transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

PROCESSED_DIR = os.path.join("datasets", "processed", "material_classification")
MODEL_SAVE_DIR = os.path.join("models", "classification")
EVAL_SAVE_DIR = os.path.join("outputs", "evaluation", "material_classifier")

def train_and_evaluate(epochs: int = 12, batch_size: int = 32, lr: float = 0.001):
    print("=== Starting EfficientNet-B0 Material Classifier Training & Evaluation ===")
    start_time = time.time()

    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    os.makedirs(EVAL_SAVE_DIR, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device Selected: {device}")

    # Image Transforms & Augmentation
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Load Datasets
    train_dir = os.path.join(PROCESSED_DIR, "train")
    val_dir = os.path.join(PROCESSED_DIR, "validation")
    test_dir = os.path.join(PROCESSED_DIR, "test")

    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"Processed training directory missing: {train_dir}")

    train_dataset = torchvision.datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = torchvision.datasets.ImageFolder(val_dir, transform=val_test_transform)
    test_dataset = torchvision.datasets.ImageFolder(test_dir, transform=val_test_transform)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    total_images = len(train_dataset) + len(val_dataset) + len(test_dataset)

    print(f"Total Dataset Images: {total_images}")
    print(f"  Train Split: {len(train_dataset)} images")
    print(f"  Validation Split: {len(val_dataset)} images")
    print(f"  Test Split: {len(test_dataset)} images")
    print(f"Classes ({num_classes}): {class_names}")

    # Calculate Class Weights to Handle Class Imbalance
    class_counts = [0] * num_classes
    for _, label in train_dataset.samples:
        class_counts[label] += 1
    
    total_samples = sum(class_counts)
    class_weights = [total_samples / (num_classes * count) if count > 0 else 1.0 for count in class_counts]
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)
    
    print("\nCalculated Class Weights for Loss Weighting:")
    for idx, cls in enumerate(class_names):
        print(f"  {cls} ({class_counts[idx]} train images): weight = {class_weights[idx]:.3f}")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # Initialize EfficientNet-B0 Architecture
    try:
        weights = EfficientNet_B0_Weights.DEFAULT
        model = efficientnet_b0(weights=weights)
    except Exception:
        model = efficientnet_b0(pretrained=True)

    # Replace Classification Head
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=2)

    best_val_acc = 0.0
    best_val_f1 = 0.0
    epoch_history = []

    print(f"\n--- Training for {epochs} Epochs ---")
    for epoch in range(1, epochs + 1):
        # --- Training Phase ---
        model.train()
        running_loss = 0.0
        train_preds, train_targets = [], []

        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            train_preds.extend(predicted.cpu().numpy())
            train_targets.extend(targets.cpu().numpy())

        train_loss = running_loss / len(train_dataset)
        train_acc = accuracy_score(train_targets, train_preds)

        # --- Validation Phase ---
        model.eval()
        val_loss_sum = 0.0
        val_preds, val_targets = [], []

        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, targets)
                val_loss_sum += loss.item() * inputs.size(0)

                _, predicted = outputs.max(1)
                val_preds.extend(predicted.cpu().numpy())
                val_targets.extend(targets.cpu().numpy())

        val_loss = val_loss_sum / len(val_dataset)
        val_acc = accuracy_score(val_targets, val_preds)
        val_prec, val_rec, val_f1, _ = precision_recall_fscore_support(
            val_targets, val_preds, average='weighted', zero_division=0
        )

        scheduler.step(val_acc)

        print(f"Epoch [{epoch:02d}/{epochs:02d}] "
              f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}% "
              f"|| Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}% | Val F1: {val_f1:.4f}")

        epoch_history.append({
            "epoch": epoch,
            "trainLoss": round(train_loss, 4),
            "trainAccuracy": round(train_acc, 4),
            "validationLoss": round(val_loss, 4),
            "validationAccuracy": round(val_acc, 4),
            "validationPrecision": round(val_prec, 4),
            "validationRecall": round(val_rec, 4),
            "validationF1": round(val_f1, 4)
        })

        # Save Best Model Weights
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_val_f1 = val_f1
            best_path = os.path.join(MODEL_SAVE_DIR, "best_material_classifier_efficientnet.pt")
            main_path = os.path.join(MODEL_SAVE_DIR, "material_classifier.pt")
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "class_names": class_names,
                "best_val_acc": best_val_acc,
                "best_val_f1": best_val_f1,
                "architecture": "EfficientNet-B0"
            }, best_path)
            torch.save(model.state_dict(), main_path)
            print(f"  [Checkpoint] Saved best model to {best_path} (Val Acc: {best_val_acc*100:.2f}%)")

    # --- Test Phase Evaluation ---
    print("\n=== Running Final Test Set Evaluation ===")
    best_checkpoint = torch.load(os.path.join(MODEL_SAVE_DIR, "best_material_classifier_efficientnet.pt"))
    model.load_state_dict(best_checkpoint["model_state_dict"])
    model.eval()

    test_loss_sum = 0.0
    test_preds, test_targets = [], []

    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            test_loss_sum += loss.item() * inputs.size(0)

            _, predicted = outputs.max(1)
            test_preds.extend(predicted.cpu().numpy())
            test_targets.extend(targets.cpu().numpy())

    test_loss = test_loss_sum / len(test_dataset)
    test_acc = accuracy_score(test_targets, test_preds)

    # Calculate Macro and Weighted Precision, Recall, F1
    t_prec_macro, t_rec_macro, t_f1_macro, _ = precision_recall_fscore_support(
        test_targets, test_preds, average='macro', zero_division=0
    )
    t_prec_weight, t_rec_weight, t_f1_weight, _ = precision_recall_fscore_support(
        test_targets, test_preds, average='weighted', zero_division=0
    )

    cm = confusion_matrix(test_targets, test_preds)
    clf_report_dict = classification_report(test_targets, test_preds, target_names=class_names, output_dict=True)

    elapsed_time = round(time.time() - start_time, 2)

    # Construct Evaluation Outputs
    metrics_data = {
        "architecture": "EfficientNet-B0 Transfer Learning",
        "numClasses": num_classes,
        "classes": class_names,
        "totalDatasetImages": total_images,
        "trainImages": len(train_dataset),
        "validationImages": len(val_dataset),
        "testImages": len(test_dataset),
        "epochs": epochs,
        "bestValidationAccuracy": round(best_val_acc, 4),
        "bestValidationF1": round(best_val_f1, 4),
        "testLoss": round(test_loss, 4),
        "testAccuracy": round(test_acc, 4),
        "testPrecisionMacro": round(t_prec_macro, 4),
        "testRecallMacro": round(t_rec_macro, 4),
        "testF1ScoreMacro": round(t_f1_macro, 4),
        "testPrecisionWeighted": round(t_prec_weight, 4),
        "testRecallWeighted": round(t_rec_weight, 4),
        "testF1ScoreWeighted": round(t_f1_weight, 4),
        "trainingDurationSeconds": elapsed_time,
        "epochHistory": epoch_history
    }

    cm_data = {
        "classes": class_names,
        "confusionMatrix": cm.tolist()
    }

    # Save to JSON outputs
    with open(os.path.join(EVAL_SAVE_DIR, "metrics.json"), "w") as f:
        json.dump(metrics_data, f, indent=2)

    with open(os.path.join(EVAL_SAVE_DIR, "confusion_matrix.json"), "w") as f:
        json.dump(cm_data, f, indent=2)

    with open(os.path.join(EVAL_SAVE_DIR, "classification_report.json"), "w") as f:
        json.dump(clf_report_dict, f, indent=2)

    print(f"\n=======================================================")
    print(f"=== EFFICIENTNET-B0 TRAINING & EVALUATION COMPLETED ===")
    print(f"=======================================================")
    print(f"Total Dataset Images  : {total_images}")
    print(f"Number of Classes     : {num_classes} ({class_names})")
    print(f"Epochs Trained        : {epochs}")
    print(f"Best Validation Acc   : {best_val_acc * 100:.2f}%")
    print(f"Test Accuracy         : {test_acc * 100:.2f}%")
    print(f"Test Precision        : {t_prec_weight * 100:.2f}% (Weighted) | {t_prec_macro * 100:.2f}% (Macro)")
    print(f"Test Recall           : {t_rec_weight * 100:.2f}% (Weighted) | {t_rec_macro * 100:.2f}% (Macro)")
    print(f"Test F1-Score         : {t_f1_weight * 100:.2f}% (Weighted) | {t_f1_macro * 100:.2f}% (Macro)")
    print(f"Evaluation Saved To   : {EVAL_SAVE_DIR}")
    print(f"Best Model Saved To   : {os.path.join(MODEL_SAVE_DIR, 'best_material_classifier_efficientnet.pt')}")
    print(f"=======================================================")

if __name__ == "__main__":
    train_and_evaluate(epochs=12, batch_size=32, lr=0.001)
