from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.database import supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Überprüft den gültigen Token des Benutzers
    """
    token = credentials.credentials

    try:
        # Supabase prüft, ob das Token gültig ist
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise Exception("Kein User gefunden")

        return user_response.user

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiges Token oder nicht eingeloggt",
            headers={"WWW-Authenticate": "Bearer"},
        )