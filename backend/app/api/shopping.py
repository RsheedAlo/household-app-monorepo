"""Einkauf/Vorrat: gemeinsame Einkaufsliste und Vorrat eines Haushalts.

Jeder Endpunkt verlangt ein gültiges JWT und prüft die Haushaltsmitgliedschaft.
Die Benutzer-ID kommt nie vom Client.
"""

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.access import HouseholdAccess, is_household_member, require_household_member
from app.core.security import get_current_user
from app.db.database import supabase
from app.models.shopping import (
    ItemStatus,
    ShoppingItem,
    ShoppingItemCreate,
    ShoppingItemUpdate,
)

router = APIRouter()

TABLE = "shopping_items"
NOT_FOUND = "Artikel nicht gefunden"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_item(item_id: UUID, user_id: str) -> dict:
    """Lädt einen Artikel, aber nur für Mitglieder seines Haushalts.

    Fremde Artikel liefern bewusst 404 statt 403, damit niemand herausfinden kann,
    ob eine Artikel-ID überhaupt existiert.
    """
    response = supabase.table(TABLE).select("*").eq("id", str(item_id)).limit(1).execute()

    if not response.data or not is_household_member(response.data[0]["household_id"], user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)

    return response.data[0]


@router.get(
    "/{household_id}/items",
    response_model=list[ShoppingItem],
    summary="Artikel eines Haushalts laden",
)
def list_items(
    access: HouseholdAccess = Depends(require_household_member),
    status_filter: list[ItemStatus] | None = Query(default=None, alias="status"),
):
    """Alle Artikel des Haushalts, optional nach Status gefiltert (`?status=planned`)."""
    query = supabase.table(TABLE).select("*").eq("household_id", access.household_id)

    if status_filter:
        query = query.in_("status", status_filter)

    return query.order("created_at").order("id").execute().data or []


@router.post(
    "/{household_id}/items",
    response_model=ShoppingItem,
    status_code=status.HTTP_201_CREATED,
    summary="Artikel anlegen",
)
def create_item(
    item_in: ShoppingItemCreate,
    access: HouseholdAccess = Depends(require_household_member),
):
    payload = item_in.model_dump()
    payload["household_id"] = access.household_id
    payload["created_by"] = access.user_id

    response = supabase.table(TABLE).insert(payload).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Artikel konnte nicht gespeichert werden")

    return response.data[0]


@router.patch("/items/{item_id}", response_model=ShoppingItem, summary="Artikel ändern")
def update_item(
    item_id: UUID,
    item_in: ShoppingItemUpdate,
    current_user: Any = Depends(get_current_user),
):
    _load_item(item_id, str(current_user.id))

    changes = item_in.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Keine Änderungen übergeben")

    changes["updated_at"] = _now()
    response = supabase.table(TABLE).update(changes).eq("id", str(item_id)).execute()

    # Leer heißt: Der Artikel wurde zwischen Laden und Ändern gelöscht
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)

    return response.data[0]


@router.delete(
    "/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Artikel löschen",
)
def delete_item(item_id: UUID, current_user: Any = Depends(get_current_user)):
    _load_item(item_id, str(current_user.id))
    supabase.table(TABLE).delete().eq("id", str(item_id)).execute()
