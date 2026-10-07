"""Fachlogik für Einkauf/Vorrat: erlaubte Statuswechsel und Zeitstempel."""

# Von welchem Status aus ist welcher Wechsel erlaubt?
#   planned  -> bought    abgehakt
#   bought   -> planned   Haken zurückgenommen
#   bought   -> in_stock  Einkauf abgeschlossen
#   in_stock -> used_up   aufgebraucht
#   used_up  -> planned   nachkaufen
#   used_up  -> in_stock  "aufgebraucht" rückgängig
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "planned": {"bought"},
    "bought": {"planned", "in_stock"},
    "in_stock": {"used_up"},
    "used_up": {"planned", "in_stock"},
}


class InvalidTransition(ValueError):
    """Der gewünschte Statuswechsel ist nicht erlaubt."""


def plan_status_change(current_status: str, new_status: str, now: str) -> dict:
    """Liefert die Spalten, die bei diesem Statuswechsel gesetzt werden.

    Die Zeitstempel dokumentieren den Verbrauch:
    - bought_at: wann zuletzt gekauft. Wird beim Zurücknehmen oder Nachkaufen geleert.
    - used_up_at: wann zuletzt aufgebraucht. Bleibt beim Nachkaufen als Hinweis stehen
      und wird erst beim nächsten Kauf oder beim Rückgängigmachen geleert.
    """
    if new_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
        raise InvalidTransition(
            f"Statuswechsel von {current_status} nach {new_status} ist nicht erlaubt"
        )

    changes: dict = {"status": new_status}

    if new_status == "bought":
        changes["bought_at"] = now
        changes["used_up_at"] = None
    elif new_status == "used_up":
        changes["used_up_at"] = now
    elif new_status == "planned":
        changes["bought_at"] = None
    elif current_status == "used_up":  # used_up -> in_stock
        changes["used_up_at"] = None

    return changes
