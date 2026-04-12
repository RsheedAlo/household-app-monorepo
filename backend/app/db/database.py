from supabase import create_client, Client
from app.core.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
supabase_admin: Client | None = (
    create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    if settings.SUPABASE_SERVICE_ROLE_KEY
    else None
)
