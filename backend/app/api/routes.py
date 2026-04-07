from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.households import router as households_router
from app.schemas.info import ApiInfo

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(households_router, prefix="/households", tags=["households"])


@router.get("/", response_model=ApiInfo, tags=["meta"])
def api_info() -> ApiInfo:
    return ApiInfo(
        name="household-app-monorepo",
        status="bootstrap",
        modules=["[Kanban]", "[Einkauf/Vorrat]", "[Kalender]", "[Auth]", "[Core]"],
    )
