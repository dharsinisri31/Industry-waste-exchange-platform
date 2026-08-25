"""
XGBoost / Random Forest Price Prediction Model Trainer
Usage:
    python train_price_model.py
"""
import os
import numpy as np

def train_price_regressor():
    print("=== Training Random Forest / XGBoost Industrial Waste Valuation Model ===")
    # Generate tabular training dataset sample
    features = ["material_code", "purity", "contamination", "quantity", "demand_index", "distance_km"]
    print(f"Features Used: {features}")
    
    try:
        from sklearn.ensemble import RandomForestRegressor
        import joblib
        
        # Synthetic dataset for model artifact initialization
        X = np.random.rand(100, len(features))
        y = X[:, 1] * 40.0 + X[:, 0] * 20.0 - X[:, 2] * 10.0
        
        rf = RandomForestRegressor(n_estimators=50, random_state=42)
        rf.fit(X, y)
        
        os.makedirs("models", exist_ok=True)
        joblib.dump(rf, "models/price_rf_model.joblib")
        print("[Saved] Valuations model saved to ai-service/models/price_rf_model.joblib")
    except Exception as e:
        print(f"[Notice] scikit-learn error or missing: {e}")

if __name__ == "__main__":
    train_price_regressor()
