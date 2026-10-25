import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-presence-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-presence-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Database
    raw_db_url = os.getenv("DATABASE_URL", "sqlite:///presence_dev.db")
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
        try:
            import psycopg2
            raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        except ImportError:
            pass
    SQLALCHEMY_DATABASE_URI = raw_db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis Cache
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Storage
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "presence-face-storage")
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    
    # CORS
    CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")

class DevConfig(Config):
    DEBUG = True

class ProdConfig(Config):
    DEBUG = False

config_by_name = {
    "development": DevConfig,
    "production": ProdConfig,
    "default": DevConfig,
}
