import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import get_db
from app.models import User
from app.schemas import TokenData

load_dotenv()

# Constants
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days token expiration

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a hashed database password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash for a plain text password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a JWT access token containing claims and expiry timestamp."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Dependency to retrieve the currently logged in user based on JWT headers."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        if email is None or user_id is None:
            raise credentials_exception
        token_data = TokenData(email=email, user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    """Optional auth dependency. Returns None instead of throwing 401 if token is missing/invalid."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id:
            return db.query(User).filter(User.id == user_id).first()
    except Exception:
        pass
    return None
