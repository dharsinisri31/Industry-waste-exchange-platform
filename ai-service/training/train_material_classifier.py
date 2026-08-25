"""
Baseline 6-Class Material Classifier Training Script (EfficientNet-B0)
Usage:
    python training/train_material_classifier.py --epochs 30 --batch-size 32 --learning-rate 0.001
"""

import os
import json
import time
import argparse
from typing import Dict, Any, List

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import torchvision
import torchvision.transforms as transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

def train_material_classifier(
    epochs: int = 30,
    batch_size: int = 32,
    learning_rate: float = 0.001,
    image_size: int = 224,
    output_dir: str = os.path.join("models", "classification"),
    dataset_dir: str = os.path.join("datasets", "processed", "material_classification")
):
    print("=== Training 6-Class Industrial Material Classifier (EfficientNet-B0) ===")
    print(f"Dataset Path : {dataset_dir}")
    print(f"Output Path  : {output_dir}")
    print(f"Epochs       : {epochs}")
    print(f"Batch Size   : {batch_size}")
    print(f"Learning Rate: {learning_rate}")
    print(f"Image Size   : {image_size}x{image_size}")

    os.makedirs(output_dir, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device Selected: {device}")

    # Data Transforms
    train_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dir = os.path.join(dataset_dir, "train")
    val_dir = os.path.join(dataset_dir, "validation")
    test_dir = os.path.join(dataset_dir, "test")

    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"Processed training dataset directory not found at: {train_dir}")

    train_dataset = torchvision.datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = torchvision.datasets.ImageFolder(val_dir, transform=val_transform)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    print(f"\nDiscovered {num_classes} Classes: {class_names}")

    # Save class_names.json immediately
    class_names_path = os.path.join(output_dir, "class_names.json")
    with open(class_names_path, "w") as f:
        json.dump(class_names, f, indent=2)
    print(f"Saved class names mapping to: {class_names_path}")

    # Calculate Class Weights to Handle Class Imbalance (~4.34x ratio)
    class_counts = [0] * num_classes
    for _, label in train_dataset.samples:
        class_counts[label] += 1

    total_train_samples = len(train_dataset)
    class_weights = [total_train_samples / (num_classes * count) if count > 0 else 1.0 for count in class_counts]
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)

    print("\nCalculated Class Distribution & Inverse Frequency Weights:")
    for idx, cls_name in enumerate(class_names):
        print(f"  - {cls_name:10s}: {class_counts[idx]:4d} train images | Loss Weight = {class_weights[idx]:.4f}")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # Initialize EfficientNet-B0 with Pretrained ImageNet Weights
    try:
        weights = EfficientNet_B0_Weights.DEFAULT
        model = efficientnet_b0(weights=weights)
        print("\n[Model] Loaded EfficientNet-B0 ImageNet pretrained weights.")
    except Exception as err:
        print(f"\n[Model Warning] Could not download ImageNet weights directly ({err}). Loading baseline architecture.")
        model = efficientnet_b0(weights=None)

    # Replace classifier head for 6 output classes
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2, inplace=True),
        nn.Linear(in_features, num_classes)
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)

    best_val_acc = 0.0
    best_epoch = 0
    best_model_path = os.path.join(output_dir, "material_classifier_efficientnet_b0.pth")

    start_time = time.time()

    print("\n=== Starting Training Loop ===")
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += torch.sum(preds == labels.data).item()
            total_train += labels.size(0)

        epoch_train_loss = running_loss / total_train
        epoch_train_acc = correct_train / total_train

        # Validation Phase
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct_val += torch.sum(preds == labels.data).item()
                total_val += labels.size(0)

        epoch_val_loss = val_loss / total_val
        epoch_val_acc = correct_val / total_val

        scheduler.step(epoch_val_loss)

        print(f"Epoch [{epoch:02d}/{epochs:02d}] "
              f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc*100:.2f}% | "
              f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc*100:.2f}%")

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            best_epoch = epoch
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': best_val_acc,
                'val_loss': epoch_val_loss,
                'class_names': class_names,
                'num_classes': num_classes
            }, best_model_path)
            print(f"  --> Saved new best checkpoint to {best_model_path} (Val Acc: {best_val_acc*100:.2f}%)")

    total_time = time.time() - start_time
    print(f"\nTraining completed in {total_time/60:.2f} minutes.")
    print(f"Best Validation Accuracy: {best_val_acc*100:.2f}% at Epoch {best_epoch}")

    # Save model_config.json
    model_config = {
        "model_name": "EfficientNet-B0",
        "architecture": "efficientnet_b0",
        "input_shape": [3, image_size, image_size],
        "num_classes": num_classes,
        "class_names": class_names,
        "best_epoch": best_epoch,
        "best_val_acc": best_val_acc,
        "epochs_trained": epochs,
        "batch_size": batch_size,
        "learning_rate": learning_rate,
        "model_file": "material_classifier_efficientnet_b0.pth",
        "status": "trained",
        "limitation_note": "6-class baseline model (cardboard, glass, metal, paper, plastic, trash). Does not distinguish PET/HDPE/LDPE or Aluminium/Copper/Steel/Brass."
    }

    config_path = os.path.join(output_dir, "model_config.json")
    with open(config_path, "w") as f:
        json.dump(model_config, f, indent=2)
    print(f"Saved model config to: {config_path}")

    return model_config

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Baseline Material Classifier")
    parser.add_argument("--epochs", type=int, default=30, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--learning-rate", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--image-size", type=int, default=224, help="Input image dimension")
    parser.add_argument("--output-dir", type=str, default=os.path.join("models", "classification"), help="Output directory for model weights and configs")
    parser.add_argument("--dataset-dir", type=str, default=os.path.join("datasets", "processed", "material_classification"), help="Processed dataset directory")

    args = parser.parse_args()
    train_material_classifier(
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        image_size=args.image_size,
        output_dir=args.output_dir,
        dataset_dir=args.dataset_dir
    )
