"""Datenmodelle für das Modul Einkauf/Vorrat."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

# planned = steht auf der Einkaufsliste, bought = abgehakt,
# in_stock = im Vorrat, used_up = aufgebraucht
ItemStatus = Literal["planned", "bought", "in_stock", "used_up"]

# Neue Artikel starten entweder auf der Einkaufsliste oder direkt im Vorrat
InitialItemStatus = Literal["planned", "in_stock"]

# Passt zu numeric(10, 2) in der Datenbank, nach oben bewusst begrenzt
MAX_QUANTITY = 9999.99


def _strip(value: object) -> object:
    """Entfernt Leerzeichen am Rand, bevor die Längenprüfung greift."""
    return value.strip() if isinstance(value, str) else value


def _round_quantity(value: float) -> float:
    rounded = round(value, 2)
    if rounded <= 0:
        raise ValueError("Die Menge muss mindestens 0,01 betragen")
    return rounded


def _blank_to_none(value: str | None) -> str | None:
    return value or None


class ShoppingItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    quantity: float = Field(default=1, gt=0, le=MAX_QUANTITY)
    unit: str | None = Field(default=None, max_length=20)
    status: InitialItemStatus = "planned"

    strip_text = field_validator("name", "unit", mode="before")(_strip)
    check_quantity = field_validator("quantity")(_round_quantity)
    clean_unit = field_validator("unit")(_blank_to_none)


class ShoppingItemUpdate(BaseModel):
    """Teil-Update: nur mitgeschickte Felder werden geändert.

    `unit` darf bewusst auf null gesetzt werden, alle anderen Felder nicht.
    """

    name: str | None = Field(default=None, min_length=1, max_length=120)
    quantity: float | None = Field(default=None, gt=0, le=MAX_QUANTITY)
    unit: str | None = Field(default=None, max_length=20)
    status: ItemStatus | None = None

    strip_text = field_validator("name", "unit", mode="before")(_strip)
    clean_unit = field_validator("unit")(_blank_to_none)

    @field_validator("name", "quantity", "status", mode="before")
    @classmethod
    def not_null(cls, value: object) -> object:
        if value is None:
            raise ValueError("Dieses Feld darf nicht leer sein")
        return value

    @field_validator("quantity")
    @classmethod
    def round_quantity(cls, value: float | None) -> float | None:
        return None if value is None else _round_quantity(value)


class CheckoutResult(BaseModel):
    """Wie viele gekaufte Artikel beim Abschließen in den Vorrat gewandert sind."""

    moved: int


class ShoppingItem(BaseModel):
    id: UUID
    household_id: UUID
    name: str
    quantity: float
    unit: str | None = None
    status: ItemStatus
    created_by: UUID | None = None
    created_at: datetime
    updated_at: datetime
    bought_at: datetime | None = None
    used_up_at: datetime | None = None
