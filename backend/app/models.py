import datetime
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable for Google OAuth users
    google_id = Column(String, nullable=True, unique=True)  # for Sign in with Google
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    premium_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Google Drive OAuth token stored per user (JSON string)
    google_drive_token = Column(Text, nullable=True)
    google_drive_email = Column(String, nullable=True)
    google_drive_storage_limit = Column(String, nullable=True)

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")

    def check_premium_status(self):
        """Helper to verify if the user's premium subscription is still active."""
        if not self.is_premium:
            return False
        if self.premium_expiry and self.premium_expiry < datetime.datetime.utcnow():
            return False
        return True

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    gateway = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")
