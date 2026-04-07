from fastapi import APIRouter, HTTPException
from app.models.core import HouseholdCreate, Household
from app.db.database import supabase

router = APIRouter()

@router.post("/", response_model=Household)
def create_household(household_in: HouseholdCreate, user_id: str):
    """
    Erstellt einen neuen Haushalt in der Datenbank.
    """
    try:
        h_res = supabase.table("households").insert({
            "name": household_in.name
        }).execute()

        if not h_res.data:
            raise HTTPException(status_code=400, detail="Haushalt-Erstellung fehlgeschlagen")

        new_household = h_res.data[0]
        h_id = new_household["id"]

        m_res = supabase.table("household_members").insert({
            "household_id": h_id,
            "user_id": user_id,
            "role": "admin"
        }).execute()

        if not m_res.data:
            raise HTTPException(status_code=400, detail="Haushalt konnte nicht erstellt werden.")

        return new_household

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Datenbankfehler: {str(e)}")