from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/summary")
async def get_analytics_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        # 1. Waste category distribution
        category_stats_raw = db.query(
            models.Waste.category,
            func.count(models.Waste.id).label("count"),
            func.sum(models.Waste.quantity).label("totalQuantity")
        ).group_by(models.Waste.category).all()

        categories = []
        for row in category_stats_raw:
            categories.append({
                "category": row[0],
                "count": row[1],
                "totalQuantity": round(row[2], 2) if row[2] is not None else 0.0
            })

        # 2. Completed transactions monthly aggregates
        completed_transactions = db.query(models.Transaction).filter(
            models.Transaction.status == "completed"
        ).all()

        # Group by month in python to remain database-agnostic (SQLite/PostgreSQL compatible)
        from collections import defaultdict
        monthly_stats = defaultdict(lambda: {"count": 0, "totalVolume": 0.0, "totalValue": 0.0, "carbonSaved": 0.0})

        for trans in completed_transactions:
            if trans.created_at:
                month_idx = trans.created_at.month
                monthly_stats[month_idx]["count"] += 1
                monthly_stats[month_idx]["totalVolume"] += trans.quantity
                monthly_stats[month_idx]["totalValue"] += trans.total_price
                monthly_stats[month_idx]["carbonSaved"] += trans.carbon_saved_kg

        months_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_data = []
        for month_idx in sorted(monthly_stats.keys()):
            monthly_data.append({
                "month": months_labels[month_idx - 1] if 1 <= month_idx <= 12 else f"Month {month_idx}",
                "transactionsCount": monthly_stats[month_idx]["count"],
                "totalVolume": round(monthly_stats[month_idx]["totalVolume"], 2),
                "totalValue": round(monthly_stats[month_idx]["totalValue"], 2),
                "carbonSaved": round(monthly_stats[month_idx]["carbonSaved"], 2)
            })

        # 3. Overall Platform Metrics
        total_exchanged = db.query(models.Transaction).filter(models.Transaction.status == "completed").count()
        total_pending = db.query(models.Transaction).filter(models.Transaction.status == "pending").count()
        total_available = db.query(models.Waste).filter(models.Waste.status == "available").count()

        total_carbon_saved = sum(t.carbon_saved_kg for t in completed_transactions)
        total_transport_cost = sum(t.transport_cost for t in completed_transactions)

        return {
            "categories": categories,
            "monthlyData": monthly_data,
            "platformMetrics": {
                "totalExchanged": total_exchanged,
                "totalPending": total_pending,
                "totalAvailable": total_available,
                "totalCarbonSaved": round(total_carbon_saved, 2),
                "totalTransportCost": round(total_transport_cost, 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
