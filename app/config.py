from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    llm_provider: Literal["openai", "gemini", "claude"] = "openai"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"

    google_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"

    upload_dir: str = "./uploads"


settings = Settings()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
