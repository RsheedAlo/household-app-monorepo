"""Echtzeit: Änderungen an der Liste werden allen Mitgliedern des Haushalts gemeldet."""

import time

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app
from app.services import realtime
from tests.conftest import HOUSEHOLD_1, HOUSEHOLD_2, USER_A, auth

USER_C = "33333333-3333-4333-8333-333333333333"
ITEMS = f"/api/shopping/{HOUSEHOLD_1}/items"
WS = f"/api/shopping/{HOUSEHOLD_1}/ws"


@pytest.fixture
def live(db):
    """Ein Client, der Event-Loop und Verbindungen über mehrere Aufrufe hinweg teilt.

    Nutzer A und C sind in Haushalt 1, Nutzer B in Haushalt 2.
    """
    db.add_user("token-c", USER_C)
    db.add_member(HOUSEHOLD_1, USER_C)

    with TestClient(app) as client:
        yield client

    assert realtime.hub.count(HOUSEHOLD_1) == 0


def connect(client, token="token-a", household=HOUSEHOLD_1):
    """Öffnet die Verbindung, sendet das Token und wartet auf `ready`."""
    socket = client.websocket_connect(f"/api/shopping/{household}/ws")
    ws = socket.__enter__()
    ws.send_json({"token": token})
    assert ws.receive_json() == {"type": "ready"}
    return socket, ws


def create(client, name="Milch", token="token-a"):
    response = client.post(ITEMS, json={"name": name}, headers=auth(token))
    assert response.status_code == 201
    return response.json()


def test_other_member_sees_create_without_reload(live):
    sock_c, ws_c = connect(live, "token-c")
    try:
        started = time.monotonic()
        create(live)
        assert ws_c.receive_json() == {"type": "changed"}
        assert time.monotonic() - started < 1.0
    finally:
        sock_c.__exit__(None, None, None)


def test_author_is_notified_too(live):
    sock_a, ws_a = connect(live, "token-a")
    try:
        create(live)
        assert ws_a.receive_json() == {"type": "changed"}
    finally:
        sock_a.__exit__(None, None, None)


def test_update_checkout_and_delete_are_announced(live):
    item = create(live)
    sock_c, ws_c = connect(live, "token-c")
    try:
        live.patch(
            f"/api/shopping/items/{item['id']}", json={"status": "bought"}, headers=auth()
        )
        assert ws_c.receive_json() == {"type": "changed"}

        live.post(f"/api/shopping/{HOUSEHOLD_1}/checkout", headers=auth())
        assert ws_c.receive_json() == {"type": "changed"}

        live.delete(f"/api/shopping/items/{item['id']}", headers=auth())
        assert ws_c.receive_json() == {"type": "changed"}
    finally:
        sock_c.__exit__(None, None, None)


def test_other_household_is_not_notified(live):
    sock_b, ws_b = connect(live, "token-b", household=HOUSEHOLD_2)
    sock_c, ws_c = connect(live, "token-c")
    try:
        create(live)
        # C bekommt die Meldung, B (anderer Haushalt) nicht. Ein Ping beweist, dass B
        # noch verbunden ist und trotzdem nur den Pong sieht.
        assert ws_c.receive_json() == {"type": "changed"}
        ws_b.send_text("ping")
        assert ws_b.receive_json() == {"type": "pong"}
    finally:
        sock_c.__exit__(None, None, None)
        sock_b.__exit__(None, None, None)


def test_no_event_for_failed_or_empty_changes(live):
    item = create(live)
    sock_c, ws_c = connect(live, "token-c")
    try:
        # fremder Nutzer: 404, nichts geändert
        assert (
            live.patch(
                f"/api/shopping/items/{item['id']}", json={"name": "x"}, headers=auth("token-b")
            ).status_code
            == 404
        )
        # ungültiger Statuswechsel: 409
        assert (
            live.patch(
                f"/api/shopping/items/{item['id']}", json={"status": "used_up"}, headers=auth()
            ).status_code
            == 409
        )
        # Einkauf abschließen ohne abgehakte Artikel
        assert live.post(f"/api/shopping/{HOUSEHOLD_1}/checkout", headers=auth()).json() == {
            "moved": 0
        }

        ws_c.send_text("ping")
        assert ws_c.receive_json() == {"type": "pong"}
    finally:
        sock_c.__exit__(None, None, None)


def test_closed_connection_is_removed(live):
    sock_c, _ = connect(live, "token-c")
    assert realtime.hub.count(HOUSEHOLD_1) == 1
    sock_c.__exit__(None, None, None)
    # Schreiben nach dem Schließen darf nicht fehlschlagen
    create(live)
    assert realtime.hub.count(HOUSEHOLD_1) == 0


def test_invalid_token_is_rejected(live):
    with live.websocket_connect(WS) as ws:
        ws.send_json({"token": "falsch"})
        with pytest.raises(WebSocketDisconnect) as error:
            ws.receive_json()
    assert error.value.code == 4401


def test_missing_token_is_rejected(live):
    with live.websocket_connect(WS) as ws:
        ws.send_json({"hallo": "welt"})
        with pytest.raises(WebSocketDisconnect) as error:
            ws.receive_json()
    assert error.value.code == 4401


def test_non_member_is_rejected(live):
    # Nutzer B ist gültig angemeldet, aber nicht in Haushalt 1
    with live.websocket_connect(WS) as ws:
        ws.send_json({"token": "token-b"})
        with pytest.raises(WebSocketDisconnect) as error:
            ws.receive_json()
    assert error.value.code == 4403
    assert realtime.hub.count(HOUSEHOLD_1) == 0


def test_silent_client_is_dropped_after_timeout(live, monkeypatch):
    monkeypatch.setattr(realtime, "AUTH_TIMEOUT_SECONDS", 0.2)
    with live.websocket_connect(WS) as ws:
        with pytest.raises(WebSocketDisconnect) as error:
            ws.receive_json()
    assert error.value.code == 4408


def test_user_id_in_token_message_is_ignored(live):
    """Die Identität kommt aus dem Token, nie aus der Nachricht."""
    with live.websocket_connect(WS) as ws:
        ws.send_json({"token": "token-b", "user_id": USER_A})
        with pytest.raises(WebSocketDisconnect) as error:
            ws.receive_json()
    assert error.value.code == 4403
