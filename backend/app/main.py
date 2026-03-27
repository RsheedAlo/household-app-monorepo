from fastapi import FastAPI

from app.api.routes import router
from app.core.config import settings

app = FastAPI(
    title=settings.project_name,
    version="0.1.0",
    description="API-Grundgeruest fuer household-app-monorepo",
)
app.include_router(router, prefix="/api")


@app.get("/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

