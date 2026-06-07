from fastapi import APIRouter, HTTPException, status, Response
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime

from fastapi.params import Depends
from icalendar import Calendar, Event as IcalEvent
from app.models.core import EventCreate, EventUpdate, EventResponse
from app.db.database import supabase
from app.core.security import get_current_user

router = APIRouter()

@router.post("/households/{household_id}/events", response_model=EventResponse)
async def create_event(household_id: UUID, event: EventCreate, current_user: Any = Depends(get_current_user)):
    """Einen neuen Termin für einen Haushalt erstellen."""
    user_id = str(current_user.id)

    membership = supabase.table("household_members").select("*").eq("household_id", str(household_id)).eq("user_id", str(user_id)).execute()

    if not membership.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Du hast keine Berechtigung, für diesen Haushalt Termine zu erstellen."
        )

    event_data = event.model_dump(mode="json")
    event_data["household_id"] = str(household_id)
    event_data["created_by"] = str(user_id)

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
async def get_events(household_id: UUID, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, current_user = Depends(get_current_user)):
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

    response = query.order("start_time").execute()

    return response.data

@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: UUID, event_update: EventUpdate, current_user = Depends(get_current_user)):
    """Einen bestehenden Termin aktualisieren."""
    update_data = event_update.model_dump(mode="json", exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="Keine Daten zum Update geliefert.")

    response = supabase.table("calendar_events").update(update_data).eq("id", str(event_id)).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Termin existiert nicht.")

    return response.data[0]

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: UUID, current_user = Depends(get_current_user)):
    """Einen Termin löschen."""
    response = supabase.table("calendar_events").delete().eq("id", str(event_id)).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Löschen fehlgeschlagen: Termin nicht gefunden.")

    return None

@router.get("/households/{household_id}/export")
async def export_calender(household_id: UUID, current_user = Depends(get_current_user)):
    response = supabase.table("calendar_events").select("*").eq("household_id", str(household_id)).execute()
    events = response.data

    if not events:
        raise HTTPException(status_code=404, detail="Keine Termine zum Exportieren gefunden.")

    cal = Calendar()
    cal.add('prodid', '-//Household App Calendar//DE//')
    cal.add('version', '2.0')

    for db_event in events:
        ical_event = IcalEvent()
        ical_event.add('summary', db_event['title'])

        if db_event.get('description'):
            ical_event.add('description', db_event['description'])

        start_dt = datetime.fromisoformat(db_event['start_time'].replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(db_event['end_time'].replace("Z", "+00:00"))

        ical_event.add('dtstart', start_dt)
        ical_event.add('dtend', end_dt)

        cal.add_component(ical_event)

    file_content = cal.to_ical()
    filename = f"haushalt_{household_id}.ics"

    return Response(
        content=file_content,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )