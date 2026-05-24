from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_premium: bool
    premium_expiry: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

class BillingRequest(BaseModel):
    gateway: str  # "stripe" or "razorpay"

class RazorpayVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

class DownloadRequest(BaseModel):
    url: str
    video_id: str
    format_id: str
    resolution: str
    ext: str
    target: str  # "local" or "drive"
    title: str

class SettingsRequest(BaseModel):
    downloads_dir: str
    google_client_id: str
    google_client_secret: str
