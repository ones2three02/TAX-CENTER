import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database URL configuration
    DATABASE_URL: str = "mysql+pymysql://root:root-0213@192.168.31.129:3306/tax_center?charset=utf8mb4"
    
    # Upload folder configuration (relative or absolute)
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    
    class Config:
        env_file = ".env"

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
