"""Zugriffsprüfung für haushaltsbezogene Endpunkte."""

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user
from app.db.database import supabase


def is_household_member(household_id: str, user_id: str) -> bool:
    """Prüft, ob der Benutzer Mitglied des Haushalts ist."""
    response = (
        supabase.table("household_members")
        .select("user_id")
        .eq("household_id", household_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return bool(response.data)


@dataclass(frozen=True)
class HouseholdAccess:
    """Ergebnis einer erfolgreichen Prüfung: Wer darf auf welchen Haushalt zugreifen."""

    household_id: str
    user_id: str


def require_household_member(
    household_id: UUID,
    current_user: Any = Depends(get_current_user),
) -> HouseholdAccess:
    """FastAPI-Dependency für Routen mit `{household_id}` im Pfad.

    Der Benutzer kommt ausschließlich aus dem geprüften JWT, nie aus dem Request.
    """
    user_id = str(current_user.id)

    if not is_household_member(str(household_id), user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kein Zugriff auf diesen Haushalt",
        )

    return HouseholdAccess(household_id=str(household_id), user_id=user_id)
