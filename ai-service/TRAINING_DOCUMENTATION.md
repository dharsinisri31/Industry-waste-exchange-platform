# AI Model Training & Evaluation Documentation

This guide documents the dataset preparation, hyperparameters, execution commands, and evaluation outputs for all machine learning models in the AI microservice.

---

## 🏋️ 1. Material Classification Model

- **Architecture**: EfficientNet-B0 / ResNet-50 Transfer Learning
- **Dataset**: `datasets/splits/` (Plastic, Metal, Paper, Glass, Rubber, Textile, Wood, E-Waste, Organic, Chemical)
- **Target Location**: `ai-service/models/classification/material_classifier.pt`

### Execution Commands:
```bash
# Preprocess & Split Images
python scripts/preprocess_images.py --input datasets/raw/ --output datasets/processed/

# Train Classifier
python scripts/train_material_classifier.py --epochs 20

# Evaluate Model & Output Metrics
python scripts/evaluate_material_classifier.py
```
*Evaluation Report Saved to*: `outputs/evaluation/material_classifier_eval.json`

---

## 💰 2. Industrial Waste Price Valuation Model

- **Architecture**: RandomForestRegressor / XGBoost Tabular Model
- **Dataset**: `datasets/raw/price_history.csv`
- **Features**: `material`, `purity`, `contamination`, `quantity`, `location`, `distance_km`, `demand_index`
- **Target Location**: `ai-service/models/pricing/price_rf_model.joblib`

### Execution Commands:
```bash
# Train Price Model
python scripts/train_price_model.py

# Evaluate Regressor (MAE, RMSE, R²)
python scripts/evaluate_price_model.py
```
*Evaluation Report Saved to*: `outputs/evaluation/price_model_eval.json`

---

## 📈 3. Demand Forecasting Model

- **Architecture**: LSTM / Time-Series Recurrent Network
- **Target Location**: `ai-service/models/forecasting/demand_model.pt`

### Execution Commands:
```bash
# Train Demand Forecaster
python scripts/train_demand_model.py

# Evaluate Forecaster
python scripts/evaluate_demand_model.py
```
*Evaluation Report Saved to*: `outputs/evaluation/demand_model_eval.json`

---

## 🎯 4. YOLOv8 Multi-Object Detection

- **Architecture**: YOLOv8n Bounding Box Detector
- **Target Location**: `ai-service/models/detection/best_detection.pt`

### Execution Commands:
```bash
# Train Detector
python scripts/train_detection.py --data datasets/annotations/data.yaml --epochs 25

# Evaluate mAP Score
python scripts/evaluate_detection.py
```
*Evaluation Report Saved to*: `outputs/evaluation/detection_model_eval.json`
