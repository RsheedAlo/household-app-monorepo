from fastapi import APIRouter, HTTPException

from app.db.database import supabase
from app.models.core import KanbanTask, KanbanTaskCreate, KanbanTaskUpdate

router = APIRouter()


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


@router.get("/{household_id}/tasks", response_model=list[KanbanTask])
def get_tasks_for_household(household_id: str, user_id: str):
    """Lädt alle Kanban-Tasks eines Haushalts."""
    try:
        ensure_household_access(household_id, user_id)

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


@router.post("/tasks", response_model=KanbanTask)
def create_task(task_in: KanbanTaskCreate, user_id: str):
    """Erstellt einen neuen Kanban-Task."""
    try:
        ensure_household_access(str(task_in.household_id), user_id)

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


@router.patch("/tasks/{task_id}", response_model=KanbanTask)
def update_task(task_id: str, task_in: KanbanTaskUpdate, user_id: str):
    """Aktualisiert einen Kanban-Task."""
    try:
        current_res = (
            supabase.table("kanban_tasks")
            .select("*")
            .eq("id", task_id)
            .execute()
        )

        if not current_res.data:
            raise HTTPException(status_code=404, detail="Task nicht gefunden")

        current_task = current_res.data[0]
        ensure_household_access(current_task["household_id"], user_id)

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


@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, user_id: str):
    """Löscht einen Kanban-Task."""
    try:
        current_res = (
            supabase.table("kanban_tasks")
            .select("*")
            .eq("id", task_id)
            .execute()
        )

        if not current_res.data:
            raise HTTPException(status_code=404, detail="Task nicht gefunden")

        current_task = current_res.data[0]
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