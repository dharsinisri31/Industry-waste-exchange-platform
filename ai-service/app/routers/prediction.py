from fastapi import APIRouter
from pydantic import BaseModel
from sklearn.ensemble import RandomForestRegressor
import numpy as np

router = APIRouter()

class PriceRequest(BaseModel):
    category: str
    quantity: float

class ForecastRequest(BaseModel):
    category: str

# Categories integer mapping
categories_map = {
    'Plastic Scrap': 0,
    'Metal Scrap': 1,
    'Fly Ash': 2,
    'Glass': 3,
    'Textile Waste': 4,
    'Food Waste': 5,
    'Chemical Containers': 6,
    'Electronic Waste': 7,
    'Other': 8
}

base_rates = {
    0: 12.0,
    1: 45.0,
    2: 8.0,
    3: 15.0,
    4: 10.0,
    5: 5.0,
    6: 25.0,
    7: 80.0,
    8: 10.0
}

# Synthesize startup training dataset
X = []
y = []
for cat_idx, rate in base_rates.items():
    for qty in [10, 50, 100, 500, 1000, 5000]:
        bulk_discount = 0.9 if qty >= 1000 else 1.0
        price = qty * rate * bulk_discount * (1 + np.random.uniform(-0.05, 0.05))
        X.append([cat_idx, qty])
        y.append(price)

# Train the Random Forest Regressor model
rf_model = RandomForestRegressor(n_estimators=10, random_state=42)
rf_model.fit(X, y)
print("[Prediction] Trained Random Forest Regressor successfully.")

@router.post("/predict-price")
async def get_price_prediction(req: PriceRequest):
    try:
        cat_idx = categories_map.get(req.category, categories_map['Other'])
        prediction = rf_model.predict([[cat_idx, req.quantity]])
        predicted_price = float(prediction[0])
        return {"predictedPrice": round(predicted_price, 2)}
    except Exception as e:
        rate = base_rates[categories_map.get(req.category, categories_map['Other'])]
        return {"predictedPrice": round(req.quantity * rate, 2), "error": str(e)}

@router.post("/forecast-demand")
async def get_demand_forecast(req: ForecastRequest):
    try:
        cat_idx = categories_map.get(req.category, categories_map['Other'])
        np.random.seed(cat_idx + 42)
        
        base_demand = np.random.randint(500, 1500)
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        forecast = []
        for i in range(1, 7):
            trend = i * 25
            seasonality = np.sin(i / 12 * 2 * np.pi) * 150
            noise = np.random.uniform(-50, 50)
            demand = max(100, int(base_demand + trend + seasonality + noise))
            forecast.append({
                "month": months[i - 1],
                "demand": demand
            })
            
        return {"forecast": forecast}
    except Exception as e:
        return {"forecast": [], "error": str(e)}
