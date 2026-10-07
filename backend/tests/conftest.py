import os

# Muss vor dem Import der App passieren, denn der Supabase-Client wird beim Import
# erzeugt. Die Tests sprechen nie mit einem echten Supabase (siehe fake_supabase.py).
if not os.environ.get("SUPABASE_URL"):
    os.environ["SUPABASE_URL"] = "http://127.0.0.1:54321"
if not os.environ.get("SUPABASE_KEY"):
    os.environ["SUPABASE_KEY"] = "test.test.test"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from tests.fake_supabase import FakeSupabase  # noqa: E402

USER_A = "11111111-1111-4111-8111-111111111111"
USER_B = "22222222-2222-4222-8222-222222222222"
HOUSEHOLD_1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
HOUSEHOLD_2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"

# Module, die `supabase` direkt importiert haben
SUPABASE_USERS = ("app.api.shopping", "app.core.access", "app.core.security")


@pytest.fixture
def db(monkeypatch) -> FakeSupabase:
    """Fake-Datenbank: Nutzer A ist in Haushalt 1, Nutzer B in Haushalt 2."""
    fake = FakeSupabase()
    fake.add_user("token-a", USER_A)
    fake.add_user("token-b", USER_B)
    fake.add_member(HOUSEHOLD_1, USER_A, role="admin")
    fake.add_member(HOUSEHOLD_2, USER_B, role="admin")

    for module in SUPABASE_USERS:
        monkeypatch.setattr(f"{module}.supabase", fake)

    return fake


@pytest.fixture
def client(db) -> TestClient:
    return TestClient(app)


def auth(token: str = "token-a") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
