from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from app.schemas.response_schema import NotificationResponse

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        notifications = db.query(models.Notification).filter(
            models.Notification.recipient_id == current_user.id
        ).order_by(models.Notification.created_at.desc()).limit(50).all()
        
        # Serialize list with MongoDB compatibility fields mapping
        result = []
        for n in notifications:
            result.append(NotificationResponse.model_validate(n))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/read-all")
async def mark_all_as_read(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        db.query(models.Notification).filter(
            models.Notification.recipient_id == current_user.id,
            models.Notification.is_read == False
        ).update({"is_read": True}, synchronize_session=False)
        db.commit()
        return {"message": "All notifications marked as read"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{id}/read", response_model=NotificationResponse)
async def mark_as_read(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notification = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized action")

    try:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return NotificationResponse.model_validate(notification)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
