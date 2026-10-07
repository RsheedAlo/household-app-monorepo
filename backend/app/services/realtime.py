"""Echtzeit-Benachrichtigungen für Einkauf/Vorrat.

Der Hub hält die offenen WebSocket-Verbindungen pro Haushalt im Speicher dieses Prozesses.
Grenze: Läuft die API in mehreren Prozessen, sieht jeder Prozess nur seine eigenen Verbindungen.
Für Skalierung wäre ein gemeinsamer Kanal nötig (z. B. Redis Pub/Sub oder Supabase Realtime).

Der Server sendet nur den Hinweis "es hat sich etwas geändert". Die Clients laden die Liste
dann über die normale, geschützte API neu. So können über den Kanal nie Artikeldaten abfließen.
"""

import asyncio
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# So lange darf ein neuer Client brauchen, um sich mit Token auszuweisen
AUTH_TIMEOUT_SECONDS = 5.0

CHANGED_EVENT = {"type": "changed"}


class ConnectionHub:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}

    def add(self, household_id: str, websocket: WebSocket) -> None:
        self._connections.setdefault(household_id, set()).add(websocket)

    def remove(self, household_id: str, websocket: WebSocket) -> None:
        sockets = self._connections.get(household_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            del self._connections[household_id]

    def count(self, household_id: str) -> int:
        return len(self._connections.get(household_id, ()))

    async def notify_changed(self, household_id: str) -> None:
        """Sagt allen Clients dieses Haushalts, dass sie neu laden sollen."""
        sockets = list(self._connections.get(household_id, ()))
        if not sockets:
            return

        results = await asyncio.gather(
            *(socket.send_json(CHANGED_EVENT) for socket in sockets),
            return_exceptions=True,
        )

        # Tote Verbindungen aufräumen, damit sie nicht liegen bleiben
        for socket, result in zip(sockets, results):
            if isinstance(result, Exception):
                logger.debug("Verbindung entfernt: %s", result)
                self.remove(household_id, socket)


hub = ConnectionHub()
