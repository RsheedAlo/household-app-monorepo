from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "household-app-monorepo"
    app_env: str = "development"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    database_url: str = "postgresql://household_user:change_me@db:5432/household_app"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

