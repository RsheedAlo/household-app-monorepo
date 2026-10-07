import pytest

from app.services.shopping import ALLOWED_TRANSITIONS, InvalidTransition, plan_status_change
from tests.conftest import HOUSEHOLD_1, HOUSEHOLD_2, auth

NOW = "2026-10-04T12:00:00+00:00"


def items_url(household_id: str = HOUSEHOLD_1) -> str:
    return f"/api/shopping/{household_id}/items"


def item_url(item: dict) -> str:
    return f"/api/shopping/items/{item['id']}"


def checkout_url(household_id: str = HOUSEHOLD_1) -> str:
    return f"/api/shopping/{household_id}/checkout"


def create(client, name="Milch", token="token-a", household_id=HOUSEHOLD_1, **extra):
    response = client.post(
        items_url(household_id), json={"name": name, **extra}, headers=auth(token)
    )
    assert response.status_code == 201, response.text
    return response.json()


def set_status(client, item, status, token="token-a"):
    return client.patch(item_url(item), json={"status": status}, headers=auth(token))


# --- Reine Fachlogik -------------------------------------------------------------


@pytest.mark.parametrize(
    ("current", "new", "expected"),
    [
        ("planned", "bought", {"status": "bought", "bought_at": NOW, "used_up_at": None}),
        ("bought", "planned", {"status": "planned", "bought_at": None}),
        ("bought", "in_stock", {"status": "in_stock"}),
        ("in_stock", "used_up", {"status": "used_up", "used_up_at": NOW}),
        ("used_up", "planned", {"status": "planned", "bought_at": None}),
        ("used_up", "in_stock", {"status": "in_stock", "used_up_at": None}),
    ],
)
def test_allowed_transitions_set_timestamps(current, new, expected):
    assert plan_status_change(current, new, NOW) == expected


@pytest.mark.parametrize(
    ("current", "new"),
    [
        ("planned", "in_stock"),
        ("planned", "used_up"),
        ("bought", "used_up"),
        ("in_stock", "planned"),
        ("in_stock", "bought"),
        ("used_up", "bought"),
        ("planned", "planned"),
    ],
)
def test_invalid_transitions_raise(current, new):
    with pytest.raises(InvalidTransition):
        plan_status_change(current, new, NOW)


def test_every_status_has_a_rule():
    assert set(ALLOWED_TRANSITIONS) == {"planned", "bought", "in_stock", "used_up"}


# --- Statuswechsel über die API --------------------------------------------------


def test_full_cycle_tracks_timestamps(client):
    item = create(client, "Milch")
    assert item["bought_at"] is None
    assert item["used_up_at"] is None

    bought = set_status(client, item, "bought").json()
    assert bought["status"] == "bought"
    assert bought["bought_at"]
    assert bought["used_up_at"] is None

    stocked = set_status(client, item, "in_stock").json()
    assert stocked["status"] == "in_stock"
    assert stocked["bought_at"] == bought["bought_at"]

    used_up = set_status(client, item, "used_up").json()
    assert used_up["status"] == "used_up"
    assert used_up["used_up_at"]

    replanned = set_status(client, item, "planned").json()
    assert replanned["bought_at"] is None
    assert replanned["used_up_at"] == used_up["used_up_at"]

    rebought = set_status(client, item, "bought").json()
    assert rebought["used_up_at"] is None


def test_undo_used_up_clears_timestamp(client):
    item = create(client, "Reis", status="in_stock")
    set_status(client, item, "used_up")

    restored = set_status(client, item, "in_stock").json()

    assert restored["status"] == "in_stock"
    assert restored["used_up_at"] is None


def test_invalid_transition_is_409_and_changes_nothing(client):
    item = create(client, "Milch")

    response = set_status(client, item, "in_stock")

    assert response.status_code == 409
    assert client.get(items_url(), headers=auth()).json()[0]["status"] == "planned"


def test_same_status_is_a_noop(client):
    item = create(client, "Milch")

    response = set_status(client, item, "planned")

    assert response.status_code == 200
    assert response.json()["updated_at"] == item["updated_at"]


def test_status_and_fields_can_change_together(client):
    item = create(client, "Milch")

    response = client.patch(
        item_url(item), json={"status": "bought", "quantity": 3}, headers=auth()
    )

    body = response.json()
    assert body["status"] == "bought"
    assert body["quantity"] == 3
    assert body["bought_at"]


def test_concurrent_status_change_is_409(client, monkeypatch):
    item = create(client, "Milch")
    stale = dict(item)  # Zustand, den dieser Request vor der fremden Änderung geladen hat
    set_status(client, item, "bought")  # jemand anderes war schneller
    monkeypatch.setattr("app.api.shopping._load_item", lambda *_args: stale)

    response = set_status(client, item, "bought")

    assert response.status_code == 409


# --- Einkauf abschließen -----------------------------------------------------------


def test_checkout_moves_bought_items_to_stock(client):
    milk = create(client, "Milch")
    bread = create(client, "Brot")
    create(client, "Käse")
    create(client, "Reis", status="in_stock")
    set_status(client, milk, "bought")
    set_status(client, bread, "bought")

    response = client.post(checkout_url(), headers=auth())

    assert response.status_code == 200
    assert response.json() == {"moved": 2}
    statuses = {
        item["name"]: item["status"]
        for item in client.get(items_url(), headers=auth()).json()
    }
    assert statuses == {
        "Milch": "in_stock",
        "Brot": "in_stock",
        "Käse": "planned",
        "Reis": "in_stock",
    }


def test_checkout_twice_moves_nothing(client):
    item = create(client, "Milch")
    set_status(client, item, "bought")

    client.post(checkout_url(), headers=auth())
    second = client.post(checkout_url(), headers=auth())

    assert second.json() == {"moved": 0}


def test_checkout_ignores_other_households(client):
    other = create(client, "Brot", token="token-b", household_id=HOUSEHOLD_2)
    set_status(client, other, "bought", token="token-b")
    mine = create(client, "Milch")
    set_status(client, mine, "bought")

    client.post(checkout_url(), headers=auth())

    other_items = client.get(items_url(HOUSEHOLD_2), headers=auth("token-b")).json()
    assert [item["status"] for item in other_items] == ["bought"]


def test_checkout_requires_login_and_membership(client):
    assert client.post(checkout_url()).status_code == 401
    assert client.post(checkout_url(), headers=auth("token-b")).status_code == 403
