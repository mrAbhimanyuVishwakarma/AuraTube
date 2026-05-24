import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL URL or SQLite fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aura_tube.db")

# Check if SQLite is being used
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """DB session dependency generator for FastAPI endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
