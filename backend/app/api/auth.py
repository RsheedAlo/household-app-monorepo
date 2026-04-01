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

@router.post("/signup", summary="Benutzer registrieren")
def signup(credentials: UserCredentials):
    """Registriert einen neuen Benutzer"""
    try:
        # Supabase Hashed und Speichert
        response = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password
        })

        return {
            "message": "Benutzer erfolgreich registriert!",
            "user_id": response.user.id if response.user else None
        }
    except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

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
            "token_type": "bearer"
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Falsche E-Mail oder Passwort")

@router.get("/me", summary="Eigene Nutzerdaten abrufen")
def get_my_profile(user = Depends(get_current_user)):
    """
    Geschützter Endpunkt zur Überprüfung von Token.
    """
    return {
        "message": "Erfolgreich authentifiziert!",
        "user_id": user.id,
        "email": user.email
    }