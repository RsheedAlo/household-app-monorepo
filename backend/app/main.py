from fastapi import FastAPI

from app.api.routes import router
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, households

app = FastAPI(
    title=settings.project_name,
    version="0.1.0",
    description="API-Grundgeruest fuer household-app-monorepo",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(households.router, prefix="/households", tags=["households"])

app.include_router(router, prefix="/api")


@app.get("/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

