import os
import shutil
import numpy as np
from PIL import Image
from ultralytics import YOLO

def generate_synthetic_dataset():
    print("[Dataset Generator] Synthesizing image dataset for waste classification...")
    base_dir = "./synthetic_waste_data"
    
    classes = [
        'Plastic Scrap', 'Metal Scrap', 'Fly Ash', 'Glass', 
        'Textile Waste', 'Food Waste', 'Chemical Containers', 'Electronic Waste'
    ]
    
    for split in ['train', 'val']:
        for cls in classes:
            dir_path = os.path.join(base_dir, split, cls)
            os.makedirs(dir_path, exist_ok=True)
            
            # Generate 5 dummy images per class
            for i in range(5):
                img_data = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
                img = Image.fromarray(img_data)
                img.save(os.path.join(dir_path, f"img_{i}.jpg"))
                
    print(f"[Dataset Generator] Generated synthetic dataset under {base_dir}")
    return base_dir

def train_model():
    dataset_dir = generate_synthetic_dataset()
    
    print("[YOLO Trainer] Initializing YOLOv8-cls model...")
    model = YOLO("yolov8n-cls.pt")
    
    print("[YOLO Trainer] Training YOLOv8 model for 1 epoch on synthetic waste dataset...")
    try:
        model.train(data=dataset_dir, epochs=1, imgsz=64, device="cpu")
        print("[YOLO Trainer] Model training completed successfully.")
    except Exception as e:
        print(f"[YOLO Trainer] Training failed: {e}. (This is normal if compiler utilities are missing).")
    finally:
        # Cleanup dataset folder
        if os.path.exists(dataset_dir):
            shutil.rmtree(dataset_dir)
            print("[YOLO Trainer] Cleared synthetic datasets folder.")

if __name__ == "__main__":
    train_model()
