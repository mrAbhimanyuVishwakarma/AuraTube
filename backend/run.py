import uvicorn
from app.config import load_settings

if __name__ == "__main__":
    settings = load_settings()
    print(f"Starting server on http://{settings.host}:{settings.port}")
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
