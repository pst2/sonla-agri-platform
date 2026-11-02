from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "Agri Communication Platform - Sơn La"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'database' / 'agri_platform.db').as_posix()}"
    SECRET_KEY: str = "sonla-agri-heritage-secret-key-2026-uet-thesis"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ML_ARTIFACTS_DIR: str = str(BASE_DIR / "ml" / "artifacts")
    ML_DATA_DIR: str = str(BASE_DIR / "ml" / "data")
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
