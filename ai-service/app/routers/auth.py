import os
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.industry_schema import IndustryRegister, IndustryResponse
from app.schemas.response_schema import AdminRegister, AdminResponse, LoginRequest, TokenResponse, UserResponse
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    get_current_user,
    JWT_REFRESH_SECRET
)

router = APIRouter()

ADMIN_REGISTRATION_SECRET = os.getenv("ADMIN_REGISTRATION_SECRET", "admin_secret_key_ideathon_2026")

def set_refresh_token_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        httponly=True,
        max_age=7 * 24 * 3600,  # 7 days
        expires=7 * 24 * 3600,
        samesite="lax",
        secure=False  # Set to True in production with HTTPS
    )

@router.post("/register-industry", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_industry(req: IndustryRegister, response: Response, db: Session = Depends(get_db)):
    # Check if email is already taken
    existing_user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    # Check if registration number is already taken
    existing_industry = db.query(models.Industry).filter(models.Industry.registration_number == req.registration_number).first()
    if existing_industry:
        raise HTTPException(status_code=400, detail="Registration number is already registered")

    try:
        # Create User
        hashed_password = get_password_hash(req.password)
        new_user = models.User(
            email=req.email.lower(),
            password=hashed_password,
            role="industry_user",
            is_verified=True  # Auto-verify in local template
        )
        db.add(new_user)
        db.flush()  # Generate user.id

        # Create Industry Profile
        new_industry = models.Industry(
            user_id=new_user.id,
            company_name=req.company_name,
            registration_number=req.registration_number,
            address=req.address,
            city=req.city,
            latitude=req.latitude,
            longitude=req.longitude,
            contact_phone=req.contact_phone,
            industry_type=req.industry_type,
            description=req.description
        )
        db.add(new_industry)

        # Create initial empty Carbon Report
        new_report = models.CarbonReport(
            industry_id=new_user.id,
            total_carbon_saved=0.0,
            transport_emissions=0.0,
            reuse_emissions=0.0,
            net_savings=0.0
        )
        db.add(new_report)
        
        db.commit()
        db.refresh(new_user)
        db.refresh(new_industry)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database registration failed: {str(e)}")

    # Generate tokens
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    set_refresh_token_cookie(response, refresh_token)

    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": UserResponse.model_validate(new_user),
        "profile": IndustryResponse.model_validate(new_industry)
    }

@router.post("/register-admin", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_admin(req: AdminRegister, response: Response, db: Session = Depends(get_db)):
    # Validate secret key
    if req.admin_secret != ADMIN_REGISTRATION_SECRET:
        raise HTTPException(status_code=400, detail="Invalid admin registration secret")

    # Check if email is already taken
    existing_user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    try:
        # Create User
        hashed_password = get_password_hash(req.password)
        new_user = models.User(
            email=req.email.lower(),
            password=hashed_password,
            role="admin",
            is_verified=True
        )
        db.add(new_user)
        db.flush()

        # Create Admin Profile
        new_admin = models.Admin(
            user_id=new_user.id,
            full_name=req.full_name,
            phone=req.phone
        )
        db.add(new_admin)
        
        db.commit()
        db.refresh(new_user)
        db.refresh(new_admin)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Admin registration failed: {str(e)}")

    # Generate tokens
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    set_refresh_token_cookie(response, refresh_token)

    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": UserResponse.model_validate(new_user),
        "profile": AdminResponse.model_validate(new_admin)
    }

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Fetch corresponding profile
    profile = None
    if user.role == "industry_user":
        profile_obj = db.query(models.Industry).filter(models.Industry.user_id == user.id).first()
        if profile_obj:
            profile = IndustryResponse.model_validate(profile_obj)
    elif user.role == "admin":
        profile_obj = db.query(models.Admin).filter(models.Admin.user_id == user.id).first()
        if profile_obj:
            profile = AdminResponse.model_validate(profile_obj)

    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    set_refresh_token_cookie(response, refresh_token)

    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": UserResponse.model_validate(user),
        "profile": profile
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refreshToken")
    return {"message": "Logged out successfully"}

@router.post("/refresh")
async def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refreshToken")
    if not refresh_token:
         raise HTTPException(status_code=401, detail="Refresh token not found")

    payload = verify_token(refresh_token, JWT_REFRESH_SECRET)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Generate new access token
    new_access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"accessToken": new_access_token}

@router.get("/me", response_model=TokenResponse)
async def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = None
    if current_user.role == "industry_user":
        profile_obj = db.query(models.Industry).filter(models.Industry.user_id == current_user.id).first()
        if profile_obj:
            profile = IndustryResponse.model_validate(profile_obj)
    elif current_user.role == "admin":
        profile_obj = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
        if profile_obj:
            profile = AdminResponse.model_validate(profile_obj)

    # Generate quick dummy fresh token response to keep payload structure intact
    return {
        "accessToken": "",
        "refreshToken": "",
        "user": UserResponse.model_validate(current_user),
        "profile": profile
    }
