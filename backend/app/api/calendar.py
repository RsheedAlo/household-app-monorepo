from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models.core import EventCreate, EventUpdate, EventResponse
from app.db.database import supabase
from app.core.security import get_current_user

router = APIRouter()

@router.post("/households/{household_id}/events", response_model=EventResponse)
async def create_event(household_id: UUID, event: EventCreate, current_user = Depends(get_current_user)):
    """Einen neuen Termin für einen Haushalt erstellen."""
    membership = supabase.table("household_members").select("*").eq("household_id", str(household_id)).eq("user_id", str(current_user.id)).execute()

    if not membership.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Du hast keine Berechtigung, für diesen Haushalt Termine zu erstellen."
        )

    event_data = event.model_dump(mode="json")
    event_data["household_id"] = str(household_id)
    event_data["created_by"] = str(current_user.id)

    try:
        response = supabase.table("calendar_events").insert(event_data).execute()

        if not response.data:
            raise HTTPException(status_code=400, detail="Eintrag konnte nicht erstellt werden.")

        return response.data[0]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Datenbankfehler: {str(e)}"
        )

@router.get("/households/{household_id}/events", response_model=List[EventResponse])
async def get_events(household_id: UUID, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """
    Alle Termine eines Haushalts abrufen.
    Optional gefiltert nach Zeitraum.
    """
    query= supabase.table("calendar_events").select("*")

    query = query.eq("household_id", str(household_id))

    if start_date:
        query = query.gte("start_time", start_date.isoformat())
    if end_date:
        query = query.lte("end_time", end_date.isoformat())

    # Jetzt sollte .order() nicht mehr rot sein!
    response = query.order("start_time").execute()

    return response.data

@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: UUID, event_update: EventUpdate):
    """Einen bestehenden Termin aktualisieren."""
    update_data = event_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="Keine Daten zum Update geliefert.")

    response = supabase.table("calendar_events").update(update_data).eq("id", str(event_id)).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Termin existiert nicht.")

    return response.data[0]

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: UUID):
    """Einen Termin löschen."""
    response = supabase.table("calendar_events").delete().eq("id", str(event_id)).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Löschen fehlgeschlagen: Termin nicht gefunden.")

    return None