import datetime
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    # Use UUID compatible with both SQLite and PostgreSQL
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    premium_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")

    def check_premium_status(self):
        """Helper to verify if the user's premium subscription is still active."""
        if not self.is_premium:
            return False
        if self.premium_expiry and self.premium_expiry < datetime.datetime.utcnow():
            # Premium has expired
            return False
        return True

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True) # Payment gateway transaction reference ID (Stripe / Razorpay ID)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    gateway = Column(String, nullable=False) # "stripe" or "razorpay"
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)
    status = Column(String, nullable=False) # "completed", "pending", "failed"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")
