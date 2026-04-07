from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.db.database import supabase
from app.core.security import get_current_user

router = APIRouter()

class UserCredentials(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

@router.post("/signup", summary="Benutzer registrieren")
def signup(credentials: UserCredentials, display_name: str):
    """Registriert einen neuen Benutzer"""
    try:
        # Supabase Hashed und Speichert
        response = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password
        })

        if not response.user:
            raise HTTPException(status_code=400, detail="Registrierung fehlgeschlagen")

        user_id = response.user.id

        profile_response = supabase.table("profiles").insert({
                    "id": user_id,
                    "display_name": display_name
        }).execute()

        if not profile_response.data:
            raise HTTPException(
                status_code=500,
                detail="User wurde angelegt, aber Profil-Erstellung ist fehlgeschlagen."
            )

        return {
            "message": "Benutzer erfolgreich registriert!",
            "user_id": response.user.id if response.user else None
        }
    except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=TokenResponse, summary="Benutzer Login")
def login(credentials: UserCredentials):
    """Loggt einen Benutzer ein und gibt einen Token zurück."""
    try:
        # Supabase prüft das Passwort und generiert Token
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })

        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user_id": response.user.id
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Falsche E-Mail oder Passwort")

@router.get("/me", summary="Eigenen Token abrufen")
def get_my_token(user = Depends(get_current_user)):
    """
    Geschützter Endpunkt zur Überprüfung von Token.
    """
    return {
        "message": "Erfolgreich authentifiziert!",
        "user_id": user.id,
        "email": user.email
    }

@router.get("/profile/{user_id}", summary="Benutzerprofil abrufen")
def get_profile(user_id: str):
    """Holt das Profil eines Users anhand seiner ID."""
    try:
        response = supabase.table("profiles").select("display_name").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Profil nicht gefunden")

        return response.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))