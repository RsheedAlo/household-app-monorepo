from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "household-app-monorepo"
    app_env: str = "development"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    #Supabase Credentials
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")



settings = Settings()

