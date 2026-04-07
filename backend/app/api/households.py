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

@router.get("/user/{user_id}")
def get_user_households(user_id: str):
    """Holt alle Haushalte, in denen der User Mitglied ist."""
    try:
       res = supabase.table("household_members") \
            .select("role, households(id, name)") \
            .eq("user_id", user_id) \
            .execute()

       if not res.data:
           return []

       my_households = []
       for item in res.data:
           if item.get("households"):
                my_households.append({
                    "id": item["households"]["id"],
                    "name": item["households"]["name"],
                    "role": item["role"]
                })

       return my_households
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Haushalte: {str(e)}")