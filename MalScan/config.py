import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MongoDB Configs
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "malscan")
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "scans")
    
    # Model Configurations
    BASE_DIR: Path = Path(__file__).resolve().parent
    MODELS_DIR: Path = BASE_DIR / "models"
    MODEL_PATH: Path = MODELS_DIR / "malware_model.pkl"
    FEATURE_COLUMNS_PATH: Path = MODELS_DIR / "feature_columns.pkl"
    
    # API Configurations
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # JWT Authentication Configurations
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "75320a519959cc6d089ea3eba33c38caccb7f138a025ea439bc9686cdb79ded4")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
