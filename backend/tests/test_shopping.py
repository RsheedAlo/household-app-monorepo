import pytest

from tests.conftest import HOUSEHOLD_1, HOUSEHOLD_2, USER_A, USER_B, auth


def items_url(household_id: str = HOUSEHOLD_1) -> str:
    return f"/api/shopping/{household_id}/items"


def create(client, name="Milch", token="token-a", household_id=HOUSEHOLD_1, **extra):
    response = client.post(
        items_url(household_id), json={"name": name, **extra}, headers=auth(token)
    )
    assert response.status_code == 201, response.text
    return response.json()


# --- Zugriff -----------------------------------------------------------------


def test_requires_login(client):
    assert client.get(items_url()).status_code == 401
    assert client.post(items_url(), json={"name": "Milch"}).status_code == 401


def test_rejects_invalid_token(client):
    response = client.get(items_url(), headers=auth("gibt-es-nicht"))

    assert response.status_code == 401


def test_non_member_cannot_use_household(client):
    assert client.get(items_url(), headers=auth("token-b")).status_code == 403
    response = client.post(items_url(), json={"name": "Milch"}, headers=auth("token-b"))
    assert response.status_code == 403


def test_other_households_items_are_not_listed(client):
    create(client, "Milch")
    create(client, "Brot", token="token-b", household_id=HOUSEHOLD_2)

    response = client.get(items_url(), headers=auth())

    assert [item["name"] for item in response.json()] == ["Milch"]


# --- Anlegen und Laden ---------------------------------------------------------


def test_create_sets_defaults_and_takes_user_from_token(client):
    response = client.post(
        items_url(),
        json={"name": "Milch", "created_by": USER_B, "household_id": HOUSEHOLD_2},
        headers=auth(),
    )

    item = response.json()
    assert response.status_code == 201
    assert item["household_id"] == HOUSEHOLD_1
    assert item["created_by"] == USER_A
    assert item["status"] == "planned"
    assert item["quantity"] == 1
    assert item["unit"] is None


def test_list_keeps_creation_order(client):
    for name in ["Milch", "Brot", "Käse"]:
        create(client, name)

    response = client.get(items_url(), headers=auth())

    assert [item["name"] for item in response.json()] == ["Milch", "Brot", "Käse"]


def test_list_filters_by_status(client):
    create(client, "Milch")
    create(client, "Reis", status="in_stock")

    only_stock = client.get(items_url(), params={"status": "in_stock"}, headers=auth())
    both = client.get(
        items_url(), params=[("status", "planned"), ("status", "in_stock")], headers=auth()
    )
    unknown = client.get(items_url(), params={"status": "kaputt"}, headers=auth())

    assert [item["name"] for item in only_stock.json()] == ["Reis"]
    assert len(both.json()) == 2
    assert unknown.status_code == 422


def test_text_fields_are_trimmed(client):
    item = create(client, "  Milch  ", unit="   ")

    assert item["name"] == "Milch"
    assert item["unit"] is None


# --- Validierung ---------------------------------------------------------------


@pytest.mark.parametrize(
    "body",
    [
        {"name": ""},
        {"name": "   "},
        {"name": "x" * 121},
        {"name": "Milch", "quantity": 0},
        {"name": "Milch", "quantity": -1},
        {"name": "Milch", "quantity": 10000},
        {"name": "Milch", "quantity": 0.001},
        {"name": "Milch", "unit": "x" * 21},
        {"name": "Milch", "status": "bought"},
        {"name": "Milch", "status": "kaputt"},
    ],
)
def test_create_rejects_invalid_input(client, body):
    response = client.post(items_url(), json=body, headers=auth())

    assert response.status_code == 422


def test_create_accepts_limits(client):
    item = create(client, "x" * 120, quantity=9999.99, unit="y" * 20)

    assert len(item["name"]) == 120
    assert item["quantity"] == 9999.99


# --- Ändern --------------------------------------------------------------------


def test_update_changes_only_sent_fields(client):
    item = create(client, "Milch", quantity=2, unit="l")

    response = client.patch(
        f"/api/shopping/items/{item['id']}", json={"quantity": 3.5}, headers=auth()
    )

    updated = response.json()
    assert response.status_code == 200
    assert updated["quantity"] == 3.5
    assert updated["name"] == "Milch"
    assert updated["unit"] == "l"
    assert updated["updated_at"] > item["updated_at"]


def test_update_can_clear_unit(client):
    item = create(client, "Milch", unit="l")

    response = client.patch(
        f"/api/shopping/items/{item['id']}", json={"unit": None}, headers=auth()
    )

    assert response.json()["unit"] is None


@pytest.mark.parametrize(
    "body", [{}, {"name": None}, {"quantity": None}, {"status": None}, {"name": ""}]
)
def test_update_rejects_empty_or_null_changes(client, body):
    item = create(client, "Milch")

    response = client.patch(f"/api/shopping/items/{item['id']}", json=body, headers=auth())

    assert response.status_code == 422


def test_update_requires_login(client):
    item = create(client, "Milch")

    response = client.patch(f"/api/shopping/items/{item['id']}", json={"name": "Brot"})

    assert response.status_code == 401


def test_foreign_item_looks_like_it_does_not_exist(client):
    item = create(client, "Milch")

    patch = client.patch(
        f"/api/shopping/items/{item['id']}", json={"name": "Hacked"}, headers=auth("token-b")
    )
    delete = client.delete(f"/api/shopping/items/{item['id']}", headers=auth("token-b"))

    assert patch.status_code == 404
    assert delete.status_code == 404
    still_there = client.get(items_url(), headers=auth()).json()
    assert [entry["name"] for entry in still_there] == ["Milch"]


def test_unknown_item_is_404(client):
    unknown = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"

    response = client.patch(
        f"/api/shopping/items/{unknown}", json={"name": "Brot"}, headers=auth()
    )

    assert response.status_code == 404


# --- Löschen -------------------------------------------------------------------


def test_delete_removes_item(client):
    item = create(client, "Milch")

    first = client.delete(f"/api/shopping/items/{item['id']}", headers=auth())
    second = client.delete(f"/api/shopping/items/{item['id']}", headers=auth())

    assert first.status_code == 204
    assert second.status_code == 404
    assert client.get(items_url(), headers=auth()).json() == []
