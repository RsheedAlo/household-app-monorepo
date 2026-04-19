from fastapi import APIRouter, HTTPException

from app.db.database import supabase
from app.models.core import KanbanTask, KanbanTaskCreate, KanbanTaskUpdate

router = APIRouter()


# Prüft, ob der Benutzer überhaupt Mitglied im Haushalt ist.
# So kann man verhindern, dass jemand fremde Haushalte sieht oder ändert.
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


# Lädt alle Kanban-Tasks für einen Haushalt
@router.get("/{household_id}/tasks", response_model=list[KanbanTask])
def get_tasks_for_household(household_id: str, user_id: str):
    """Lädt alle Kanban-Tasks eines Haushalts."""
    try:
        # Erst Zugriff auf Haushalt prüfen
        ensure_household_access(household_id, user_id)

        # Danach alle Tasks dieses Haushalts laden
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


# Erstellt eine neue Aufgabe
@router.post("/tasks", response_model=KanbanTask)
def create_task(task_in: KanbanTaskCreate, user_id: str):
    """Erstellt einen neuen Kanban-Task."""
    try:
        # Prüfen, ob User Zugriff auf diesen Haushalt hat
        ensure_household_access(str(task_in.household_id), user_id)

        # Wir holen uns die höchste Position in dieser Spalte,
        # damit der neue Task am Ende einsortiert wird
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

        # Neue Aufgabe in die Tabelle einfügen
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
# Wird aktuell vor allem für den Statuswechsel verwendet
@router.patch("/tasks/{task_id}", response_model=KanbanTask)
def update_task(task_id: str, task_in: KanbanTaskUpdate, user_id: str):
    """Aktualisiert einen Kanban-Task."""
    try:
        # Aktuellen Task zuerst aus der DB holen
        current_res = (
            supabase.table("kanban_tasks")
            .select("*")
            .eq("id", task_id)
            .execute()
        )

        if not current_res.data:
            raise HTTPException(status_code=404, detail="Task nicht gefunden")

        current_task = current_res.data[0]

        # Wieder prüfen, ob User auf den Haushalt des Tasks zugreifen darf
        ensure_household_access(current_task["household_id"], user_id)

        # Nur Felder updaten, die auch wirklich mitgeschickt wurden
        update_payload = {}
        if task_in.title is not None:
            update_payload["title"] = task_in.title
        if task_in.description is not None:
            update_payload["description"] = task_in.description
        if task_in.status is not None:
            update_payload["status"] = task_in.status
        if task_in.position is not None:
            update_payload["position"] = task_in.position

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

        # Prüfen, ob User auf den Haushalt des Tasks zugreifen darf
        ensure_household_access(current_task["household_id"], user_id)

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