from fastapi import APIRouter, HTTPException

from app.db.database import supabase
from app.models.core import KanbanTask, KanbanTaskCreate, KanbanTaskUpdate

router = APIRouter()


# Prüft, ob der Benutzer überhaupt Mitglied im Haushalt ist.
# Damit kann man verhindern, dass jemand auf fremde Haushalte zugreift.
def ensure_household_access(household_id: str, user_id: str):
    membership_res = (
        supabase.table("household_members")
        .select("user_id")
        .eq("household_id", household_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not membership_res.data:
        raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Haushalt")


# Hilfsfunktion:
# Datetime-Werte müssen für Supabase / JSON in Strings umgewandelt werden.
def serialize_datetime(value):
    if value is None:
        return None
    return value.isoformat()


# Lädt alle Kanban-Tasks für einen bestimmten Haushalt
@router.get("/{household_id}/tasks", response_model=list[KanbanTask])
def get_tasks_for_household(household_id: str, user_id: str):
    """Lädt alle Kanban-Tasks eines Haushalts."""
    try:
        # Zuerst prüfen, ob der User überhaupt auf diesen Haushalt zugreifen darf
        ensure_household_access(household_id, user_id)

        # Danach alle Tasks aus der Tabelle holen, die zu diesem Haushalt gehören
        response = (
            supabase.table("kanban_tasks")
            .select("*")
            .eq("household_id", household_id)
            .order("position")
            .execute()
        )

        return response.data or []
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Tasks: {exc}")


# Lädt Mitglieder des Haushalts
# Das wird für die Zuweisung von Aufgaben an Personen verwendet
@router.get("/{household_id}/members")
def get_household_members(household_id: str, user_id: str):
    """Lädt Mitglieder des Haushalts für Zuweisungen."""
    try:
        # Auch hier zuerst Zugriff prüfen
        ensure_household_access(household_id, user_id)

        # Zuerst alle Mitglieder des Haushalts holen
        members_res = (
            supabase.table("household_members")
            .select("user_id, role")
            .eq("household_id", household_id)
            .execute()
        )

        members = members_res.data or []
        if not members:
            return []

        user_ids = [member["user_id"] for member in members]

        # Danach Profile holen, damit im Frontend Namen statt UUIDs angezeigt werden können
        profiles_res = (
            supabase.table("profiles")
            .select("id, display_name")
            .in_("id", user_ids)
            .execute()
        )

        profiles = profiles_res.data or []
        profile_map = {profile["id"]: profile["display_name"] for profile in profiles}

        result = []
        for member in members:
            result.append(
                {
                    "user_id": member["user_id"],
                    "role": member["role"],
                    "display_name": profile_map.get(member["user_id"], member["user_id"]),
                }
            )

        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden der Mitglieder: {exc}")


# Erstellt eine neue Aufgabe
@router.post("/tasks", response_model=KanbanTask)
def create_task(task_in: KanbanTaskCreate, user_id: str):
    """Erstellt einen neuen Kanban-Task."""
    try:
        # Prüfen, ob der Benutzer im Haushalt ist
        ensure_household_access(str(task_in.household_id), user_id)

        # Höchste Position in der Zielspalte holen,
        # damit der neue Task am Ende der Spalte landet
        max_position_res = (
            supabase.table("kanban_tasks")
            .select("position")
            .eq("household_id", str(task_in.household_id))
            .eq("status", task_in.status)
            .order("position", desc=True)
            .limit(1)
            .execute()
        )

        next_position = 0
        if max_position_res.data:
            next_position = (max_position_res.data[0].get("position") or 0) + 1

        # Neue Aufgabe in die Datenbank einfügen
        response = (
            supabase.table("kanban_tasks")
            .insert(
                {
                    "household_id": str(task_in.household_id),
                    "title": task_in.title,
                    "description": task_in.description,
                    "status": task_in.status,
                    "position": next_position,
                    "created_by": user_id,
                    # Erweiterte Felder
                    "priority": task_in.priority,
                    "due_date": serialize_datetime(task_in.due_date),
                    "label": task_in.label,
                    "assigned_to": str(task_in.assigned_to) if task_in.assigned_to else None,
                }
            )
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Task konnte nicht erstellt werden")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Erstellen des Tasks: {exc}")


# Aktualisiert eine bestehende Aufgabe
# Wird z. B. für Statuswechsel, Bearbeiten, Priorität oder Deadline verwendet
@router.patch("/tasks/{task_id}", response_model=KanbanTask)
def update_task(task_id: str, task_in: KanbanTaskUpdate, user_id: str):
    """Aktualisiert einen Kanban-Task."""
    try:
        # Zuerst den aktuellen Task aus der DB laden
        current_res = (
            supabase.table("kanban_tasks")
            .select("*")
            .eq("id", task_id)
            .execute()
        )

        if not current_res.data:
            raise HTTPException(status_code=404, detail="Task nicht gefunden")

        current_task = current_res.data[0]

        # Danach prüfen, ob der User auf den Haushalt zugreifen darf
        ensure_household_access(current_task["household_id"], user_id)

        # Nur die Felder updaten, die wirklich mitgeschickt wurden
        update_payload = {}

        if task_in.title is not None:
            update_payload["title"] = task_in.title

        if task_in.description is not None:
            update_payload["description"] = task_in.description

        if task_in.status is not None:
            update_payload["status"] = task_in.status

        if task_in.position is not None:
            update_payload["position"] = task_in.position

        if task_in.priority is not None:
            update_payload["priority"] = task_in.priority

        # due_date / label / assigned_to dürfen auch bewusst auf null gesetzt werden
        if "due_date" in task_in.model_fields_set:
            update_payload["due_date"] = serialize_datetime(task_in.due_date)

        if "label" in task_in.model_fields_set:
            update_payload["label"] = task_in.label

        if "assigned_to" in task_in.model_fields_set:
            update_payload["assigned_to"] = str(task_in.assigned_to) if task_in.assigned_to else None

        response = (
            supabase.table("kanban_tasks")
            .update(update_payload)
            .eq("id", task_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Task konnte nicht aktualisiert werden")

        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Aktualisieren des Tasks: {exc}")


# Löscht eine Aufgabe
@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, user_id: str):
    """Löscht einen Kanban-Task."""
    try:
        # Zuerst prüfen, ob es den Task überhaupt gibt
        current_res = (
            supabase.table("kanban_tasks")
            .select("*")
            .eq("id", task_id)
            .execute()
        )

        if not current_res.data:
            raise HTTPException(status_code=404, detail="Task nicht gefunden")

        current_task = current_res.data[0]

        # Wieder prüfen, ob der Benutzer Zugriff auf den zugehörigen Haushalt hat
        ensure_household_access(current_task["household_id"], user_id)

        # Task aus der Datenbank löschen
        response = (
            supabase.table("kanban_tasks")
            .delete()
            .eq("id", task_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=400, detail="Task konnte nicht gelöscht werden")

        return {"message": "Task erfolgreich gelöscht"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fehler beim Löschen des Tasks: {exc}")