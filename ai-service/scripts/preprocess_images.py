"""
Batch Image Preprocessing & Split Utility
Usage:
    python preprocess_images.py --input datasets/raw/ --output datasets/processed/ --split 0.8
"""
import os
import glob
import cv2
import argparse
from typing import List

def process_batch(input_dir: str, output_dir: str, train_ratio: float = 0.8):
    print(f"=== Starting Batch Image Preprocessing & Splitting ===")
    print(f"Input Directory: {input_dir}")
    print(f"Output Directory: {output_dir}")
    
    os.makedirs(os.path.join(output_dir, "train"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "val"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "test"), exist_ok=True)

    image_files = glob.glob(os.path.join(input_dir, "**", "*.[jJ][pP]*[gG]"), recursive=True)
    print(f"Found {len(image_files)} raw image files.")

    count = 0
    for img_path in image_files:
        img = cv2.imread(img_path)
        if img is None:
            continue
        
        # Resize to 640x640
        resized = cv2.resize(img, (640, 640))
        fname = os.path.basename(img_path)
        
        if count % 10 < 8:
            dest = os.path.join(output_dir, "train", fname)
        elif count % 10 == 8:
            dest = os.path.join(output_dir, "val", fname)
        else:
            dest = os.path.join(output_dir, "test", fname)
            
        cv2.imwrite(dest, resized)
        count += 1

    print(f"[Completed] Processed {count} images saved under {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="datasets/raw")
    parser.add_argument("--output", default="datasets/processed")
    parser.add_argument("--split", type=float, default=0.8)
    args = parser.parse_args()
    process_batch(args.input, args.output, args.split)
