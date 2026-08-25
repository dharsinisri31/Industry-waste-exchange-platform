# Industrial Waste Exchange - AI Dataset Mapping Guide

This document maps public benchmarks and custom industrial waste datasets to specific AI capabilities within the platform.

---

## 📌 Dataset to Capability Mapping

| Public / Custom Dataset | AI Capability | Target Tasks | Location in Project |
| :--- | :--- | :--- | :--- |
| **TACO (Trash Annotations in Context)** | Waste Object Detection | Multi-object bounding box detection | `datasets/raw/taco/` |
| **TrashCan 1.0** | Material Segmentation | Mask segmentation for waste streams | `datasets/raw/trashcan/` |
| **Garbage Classification (Kaggle)** | General Material Classification | 6-class waste sorting (Glass, Paper, Metal, Plastic, Trash, Cardboard) | `datasets/raw/garbage_classification/` |
| **Plastic Classification Dataset** | Plastic Resin Classification | Polymer sub-typing (PET, HDPE, LDPE, PP, PVC, ABS, Nylon) | `datasets/raw/plastic_classification/` |
| **MVTec AD (Anomaly Detection)** | Surface Anomaly & Defect Detection | Structural damage, cracks, burn marks, surface defects | `datasets/raw/mvtec_ad/` |
| **NEU Surface Defect Dataset** | Industrial Metal Surface Defects | Metal rust, scratches, corrosion, rolled-in scale | `datasets/raw/neu_defect/` |
| **Open Images V7 (Waste Subset)** | Multi-Class Waste Detection | Additional bounding box training | `datasets/raw/open_images/` |
| **Custom Industrial Waste Dataset** | Industrial Quality & Grade Prediction | Quality Grading (Grade A-D), Purity %, Contamination breakdown, Verified Weight | `datasets/raw/custom_industrial/` |

---

## ⚠️ Academic Credibility & Labelling Guidelines

Public datasets (e.g. Kaggle Garbage Classification) are suitable for coarse material sorting, but cannot accurately predict industrial plastic grades (such as PET Grade A vs Grade B) without industrial ground-truth labels.

The platform enforces transparent academic status labels:
- **MODEL TRAINED**: Model weights present in `ai-service/models/` and trained on validated dataset.
- **MODEL NOT TRAINED**: Model weights missing; returns clear `"status": "model_unavailable"` status without fake hardcoded predictions.
- **RULE-BASED FALLBACK**: Heuristic baseline used when ML weights are pending training; explicitly marked as `"Rule-based estimate"`.
- **MANUAL VERIFIED**: Laboratory or scale-verified value entered by plant manager.
- **SYNTHETIC DATA**: Synthetic market simulation data generated for dev testing.
