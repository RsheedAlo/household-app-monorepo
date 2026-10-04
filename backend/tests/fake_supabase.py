"""Minimaler In-Memory-Ersatz für den Supabase-Client.

Er kennt nur, was die Tests brauchen: table().select/insert/update/delete mit
eq/in_/order/limit sowie auth.get_user(). So laufen die Tests ohne Netzwerk und
ohne echtes Supabase, auch in der CI.
"""

import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

# Spalten, die in der echten Datenbank per Default befüllt werden
DEFAULTS = {
    "shopping_items": {
        "quantity": 1,
        "unit": None,
        "status": "planned",
        "bought_at": None,
        "used_up_at": None,
    },
}


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, db, table):
        self._db = db
        self._table = table
        self._action = "select"
        self._payload = None
        self._filters = []
        self._orders = []
        self._limit = None

    def select(self, *_columns):
        self._action = "select"
        return self

    def insert(self, payload):
        self._action = "insert"
        self._payload = payload
        return self

    def update(self, payload):
        self._action = "update"
        self._payload = payload
        return self

    def delete(self):
        self._action = "delete"
        return self

    def eq(self, column, value):
        self._filters.append(lambda row: str(row.get(column)) == str(value))
        return self

    def in_(self, column, values):
        allowed = {str(value) for value in values}
        self._filters.append(lambda row: str(row.get(column)) in allowed)
        return self

    def order(self, column, desc=False):
        self._orders.append((column, desc))
        return self

    def limit(self, count):
        self._limit = count
        return self

    def execute(self):
        rows = self._db.tables.setdefault(self._table, [])
        matching = [row for row in rows if all(check(row) for check in self._filters)]

        if self._action == "insert":
            now = self._db.tick()
            row = {**DEFAULTS.get(self._table, {}), **self._payload}
            row.setdefault("id", str(uuid.uuid4()))
            row.setdefault("created_at", now)
            if self._table == "shopping_items":
                row.setdefault("updated_at", now)
            rows.append(row)
            return FakeResponse([dict(row)])

        if self._action == "update":
            for row in matching:
                row.update(self._payload)
            return FakeResponse([dict(row) for row in matching])

        if self._action == "delete":
            for row in matching:
                rows.remove(row)
            return FakeResponse([dict(row) for row in matching])

        for column, desc in reversed(self._orders):
            matching.sort(key=lambda row: row.get(column), reverse=desc)
        if self._limit is not None:
            matching = matching[: self._limit]
        return FakeResponse([dict(row) for row in matching])


class FakeAuth:
    def __init__(self):
        self._users = {}

    def get_user(self, token):
        user = self._users.get(token)
        if user is None:
            raise Exception("Ungültiges Token")
        return SimpleNamespace(user=user)


class FakeSupabase:
    def __init__(self):
        self.tables = {}
        self.auth = FakeAuth()
        self._clock = datetime(2026, 10, 4, 10, 0, tzinfo=timezone.utc)

    def tick(self) -> str:
        """Liefert streng aufsteigende Zeitstempel, damit Sortierungen stabil testbar sind."""
        self._clock += timedelta(seconds=1)
        return self._clock.isoformat()

    def table(self, name):
        return FakeQuery(self, name)

    def add_user(self, token, user_id):
        self.auth._users[token] = SimpleNamespace(id=user_id, email=f"{user_id}@example.test")

    def add_member(self, household_id, user_id, role="member"):
        self.tables.setdefault("household_members", []).append(
            {"household_id": household_id, "user_id": user_id, "role": role}
        )
