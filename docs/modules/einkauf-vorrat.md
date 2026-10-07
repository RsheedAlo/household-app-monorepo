# Modul Einkauf/Vorrat

Stand: 04.10.2026. Grundlage sind der Code im Branch `feature/38/pwa-basis` und die ADRs 0002 und 0003.

## Zweck

Die Mitglieder eines Haushalts führen gemeinsam eine Einkaufsliste und sehen, was im Vorrat ist. Einkaufsliste und Vorrat sind zwei Sichten auf dieselbe Tabelle `shopping_items`. Ein Artikel wandert über seinen Status von der Liste in den Vorrat und, wenn er aufgebraucht ist, wieder zurück auf die Liste. Änderungen eines Mitglieds erscheinen bei den anderen ohne manuelles Neuladen (siehe Echtzeit).

## Datenmodell

Tabelle `public.shopping_items`, angelegt durch `supabase/migrations/20261004120000_create_shopping_items.sql`.

| Feld | Typ | Regeln |
| --- | --- | --- |
| `id` | uuid | Primärschlüssel, Standard `gen_random_uuid()` |
| `household_id` | uuid | Pflicht, Fremdschlüssel auf `households(id)`, `on delete cascade` |
| `name` | text | Pflicht, 1 bis 120 Zeichen (Check-Constraint) |
| `quantity` | numeric(10, 2) | Pflicht, Standard 1, größer 0 |
| `unit` | text | optional, 1 bis 20 Zeichen, sonst `null` |
| `status` | text | Pflicht, Standard `planned`, erlaubt: `planned`, `bought`, `in_stock`, `used_up` |
| `created_by` | uuid | Fremdschlüssel auf `profiles(id)`, `on delete set null` |
| `created_at` | timestamptz | Standard `now()` |
| `updated_at` | timestamptz | Standard `now()`, wird vom Backend bei jeder Änderung gesetzt |
| `bought_at` | timestamptz | wann zuletzt gekauft, siehe Zeitstempel |
| `used_up_at` | timestamptz | wann zuletzt aufgebraucht, siehe Zeitstempel |

Index: `idx_shopping_items_household_status` auf `(household_id, status)`. Row-Level-Security ist nicht aktiviert (ADR 0002).

Bedeutung der Status:

| Status | Bedeutung | Sicht |
| --- | --- | --- |
| `planned` | steht auf der Einkaufsliste | Einkaufsliste |
| `bought` | abgehakt, noch nicht abgeschlossen | Einkaufsliste |
| `in_stock` | im Vorrat | Vorrat |
| `used_up` | aufgebraucht | Vorrat |

Eingabeprüfung im Backend (`backend/app/models/shopping.py`):

- `name` und `unit` werden vor der Prüfung an den Rändern von Leerzeichen befreit. Ein leerer `unit` wird zu `null`.
- `quantity` muss größer 0 und höchstens 9999,99 sein, wird auf zwei Nachkommastellen gerundet und muss danach mindestens 0,01 betragen.
- Beim Anlegen sind nur die Status `planned` (Standard) und `in_stock` erlaubt.
- Beim Ändern darf nur `unit` auf `null` gesetzt werden. `name`, `quantity` und `status` dürfen nicht `null` sein.

## Status-Workflow

Abgeleitet aus `ALLOWED_TRANSITIONS` in `backend/app/services/shopping.py`. Jeder andere Wechsel wird mit 409 abgelehnt. Ein Wechsel auf den aktuellen Status ist keine Änderung und wird ohne Fehler und ohne Meldung an die Clients beantwortet.

| Von | Nach | Bedeutung | Zeitstempel |
| --- | --- | --- | --- |
| `planned` | `bought` | abgehakt | `bought_at` = jetzt, `used_up_at` = `null` |
| `bought` | `planned` | Haken zurückgenommen | `bought_at` = `null` |
| `bought` | `in_stock` | Einkauf abgeschlossen | keine Änderung |
| `in_stock` | `used_up` | aufgebraucht | `used_up_at` = jetzt |
| `used_up` | `planned` | nachkaufen | `bought_at` = `null`, `used_up_at` bleibt als Hinweis stehen |
| `used_up` | `in_stock` | "aufgebraucht" rückgängig | `used_up_at` = `null` |

Nicht erlaubt sind zum Beispiel `planned` nach `in_stock`, `in_stock` nach `planned` oder `in_stock` nach `bought`. Neue Artikel können aber direkt mit `in_stock` angelegt werden.

Der Endpunkt `checkout` setzt alle Artikel des Haushalts mit Status `bought` auf `in_stock` (derselbe Übergang `bought` nach `in_stock`), ohne die Zeitstempel zu ändern.

Gleichzeitige Änderungen: Beim Statuswechsel prüft das Update zusätzlich den zuvor gelesenen Status (`where status = <alt>`). Hat jemand den Status inzwischen geändert, antwortet der Server mit 409 und der Meldung "Der Artikel wurde zwischenzeitlich geändert. Lade die Liste neu."

## API-Referenz

Basis-URL: `API_URL`, Pfade beginnen mit `/api/shopping`. Alle HTTP-Endpunkte verlangen den Header `Authorization: Bearer <access_token>`. Das Token liefert `POST /api/auth/login` (alternativ `POST /auth/login`, beide Router sind eingebunden). Die Benutzer-ID wird aus dem Token abgeleitet, nie aus dem Request.

Fehlerformat: `{"detail": "<Text>"}`. Bei 422 ist `detail` die Fehlerliste von FastAPI/Pydantic, mit Ausnahme von "Keine Änderungen übergeben" (Text).

Fehlercodes:

| Code | Wann |
| --- | --- |
| 401 | Header fehlt (in der getesteten Umgebung) oder Token ungültig: "Ungültiges Token oder nicht eingeloggt" |
| 403 | Benutzer ist kein Mitglied des Haushalts im Pfad: "Kein Zugriff auf diesen Haushalt" |
| 404 | Artikel existiert nicht oder gehört zu einem fremden Haushalt: "Artikel nicht gefunden" (bewusst kein 403, damit IDs nicht erraten werden können) |
| 409 | Statuswechsel nicht erlaubt oder Artikel zwischenzeitlich geändert |
| 422 | Eingabe ungültig, Pfad-ID keine UUID oder PATCH ohne Änderung |

### Übersicht

| Methode | Pfad | Zweck | Erfolg | Mögliche Fehler |
| --- | --- | --- | --- | --- |
| GET | `/api/shopping/{household_id}/items` | Artikel laden, optional `?status=` (mehrfach möglich) | 200 | 401, 403, 422 |
| POST | `/api/shopping/{household_id}/items` | Artikel anlegen | 201 | 401, 403, 422 |
| PATCH | `/api/shopping/items/{item_id}` | Artikel ändern, auch Status | 200 | 401, 404, 409, 422 |
| DELETE | `/api/shopping/items/{item_id}` | Artikel löschen | 204 | 401, 404, 422 |
| POST | `/api/shopping/{household_id}/checkout` | Einkauf abschließen | 200 | 401, 403, 422 |
| WS | `/api/shopping/{household_id}/ws` | Änderungshinweise | siehe Echtzeit | Schließcodes 4401, 4403, 4408 |

Das 403 gilt nur für Pfade mit `household_id`. Bei Pfaden mit `item_id` wird die Mitgliedschaft über den Haushalt des Artikels geprüft, ein Nicht-Mitglied erhält 404.

Die Liste ist nach `created_at`, dann `id` sortiert.

### GET /api/shopping/{household_id}/items

```http
GET /api/shopping/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/items?status=planned&status=bought
Authorization: Bearer <access_token>
```

```json
[
  {
    "id": "5b0c0f0e-0000-4000-8000-000000000001",
    "household_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "name": "Milch",
    "quantity": 2.0,
    "unit": "l",
    "status": "planned",
    "created_by": "11111111-1111-4111-8111-111111111111",
    "created_at": "2026-10-04T10:00:00+00:00",
    "updated_at": "2026-10-04T10:00:00+00:00",
    "bought_at": null,
    "used_up_at": null
  }
]
```

### POST /api/shopping/{household_id}/items

```json
{ "name": "Milch", "quantity": 2, "unit": "l", "status": "planned" }
```

`quantity` (Standard 1), `unit` und `status` (Standard `planned`, oder `in_stock`) sind optional. Antwort 201 mit dem angelegten Artikel (Format wie oben). `created_by` wird aus dem Token gesetzt. Ein `status` wie `bought` ergibt 422.

### PATCH /api/shopping/items/{item_id}

Nur mitgeschickte Felder werden geändert. Status und andere Felder können zusammen geändert werden.

```json
{ "status": "bought" }
```

Antwort 200 mit dem aktualisierten Artikel, hier mit gesetztem `bought_at`. Beispiel 409:

```json
{ "detail": "Statuswechsel von planned nach in_stock ist nicht erlaubt" }
```

Ein leerer Body `{}` oder `null` bei `name`, `quantity` oder `status` ergibt 422.

### DELETE /api/shopping/items/{item_id}

Antwort 204 ohne Body.

### POST /api/shopping/{household_id}/checkout

Kein Body. Antwort 200:

```json
{ "moved": 3 }
```

`moved` ist die Zahl der Artikel, die von `bought` nach `in_stock` gewandert sind. Ein zweiter Aufruf liefert `{"moved": 0}`.

## Echtzeit-Protokoll

Entscheidung und Begründung: ADR 0003. Der Kanal ist nur ein Hinweis, er enthält keine Artikeldaten.

Ablauf:

1. Client öffnet `ws://<host>/api/shopping/{household_id}/ws` (bei HTTPS `wss://`). Der Server nimmt die Verbindung an.
2. Der Client sendet innerhalb von 5 Sekunden als erste Nachricht `{"token": "<access_token>"}`. Das Token steht nicht in der URL.
3. Der Server prüft das Token über Supabase und die Haushaltsmitgliedschaft.
4. Bei Erfolg antwortet der Server `{"type": "ready"}`.
5. Nach jeder Änderung über die API sendet der Server `{"type": "changed"}` an alle Clients des Haushalts, auch an den Urheber. Die Clients laden die Liste über `GET .../items` neu.
6. Sendet der Client den Text `ping`, antwortet der Server `{"type": "pong"}`.

Nachrichten des Servers:

| Nachricht | Bedeutung |
| --- | --- |
| `{"type": "ready"}` | Anmeldung erfolgreich |
| `{"type": "changed"}` | Es hat sich etwas geändert, Liste neu laden |
| `{"type": "pong"}` | Antwort auf `ping` |

Nachrichten des Clients: `{"token": "..."}` (genau einmal, zuerst) und der Text `ping`.

Schließcodes des Servers:

| Code | Grund |
| --- | --- |
| 4401 | Token fehlt, ist leer oder von Supabase abgelehnt |
| 4403 | Token gültig, Benutzer ist kein Mitglied des Haushalts |
| 4408 | Innerhalb von 5 Sekunden kam keine Token-Nachricht |

Bricht der Client vor der ersten Nachricht ab oder schickt kein gültiges JSON, beendet der Server die Verbindung ohne eigenen Code. Eine `user_id` in der Token-Nachricht wird ignoriert (getestet).

Gemeldet wird nur nach Schreibvorgängen, die etwas geändert haben: anlegen, ändern, löschen und `checkout` mit `moved` größer 0. Fehlgeschlagene Anfragen (404, 409), leere Änderungen und Statuswechsel auf den aktuellen Status senden nichts. Tote Verbindungen entfernt der Hub beim nächsten Senden.

## Zugriffsschutz

- Jeder HTTP-Endpunkt ruft `get_current_user` auf. Das Backend lässt das Token von Supabase prüfen (`supabase.auth.get_user`).
- Endpunkte mit `household_id` im Pfad nutzen `require_household_member` (`backend/app/core/access.py`) und prüfen `household_members`.
- Endpunkte mit `item_id` laden den Artikel und prüfen die Mitgliedschaft im Haushalt des Artikels, sonst 404.
- Der WebSocket führt dieselben Prüfungen in der ersten Nachricht aus.
- Es gibt keine Rollenunterscheidung: Jedes Mitglied darf alles, auch löschen.
- Es gibt keine Row-Level-Security. Das Backend nutzt den Anon-Key. Wer diesen Key kennt, kann die Tabelle direkt über die Supabase-API lesen und ändern (ADR 0002). Der Key gehört deshalb nur ins Backend.

## Frontend-Aufbau

| Datei | Aufgabe |
| --- | --- |
| `frontend/src/pages/ShoppingBoard.jsx` | Seite `/shopping`: Ansichten Einkaufsliste und Vorrat, Anlegen, Bearbeiten, Abhaken, Aufbrauchen, Löschen mit Rückfrage, Einkauf abschließen. Statuswechsel werden sofort in der Anzeige übernommen und bei Fehler oder 409 durch Neuladen korrigiert |
| `frontend/src/pages/ShoppingBoard.css` | Styles der Seite |
| `frontend/src/hooks/useLiveUpdates.js` | WebSocket-Verbindung, Wiederverbindung, Statusanzeige |
| `frontend/src/hooks/useFlip.js` | Gleitende Bewegung beim Gruppenwechsel von Artikeln |
| `frontend/src/lib/shoppingFormat.js` | `formatNumber`, `quantityLabel`, `plural` |
| `frontend/src/pages/Dashboard.jsx` | liest die Artikel (nur lesend) für Kennzahlen und Vorschau |
| `frontend/src/App.jsx` | Route `/shopping` |
| `frontend/src/config.js` | `API_URL` aus `VITE_API_URL`, Standard `http://localhost:8000` |

`useLiveUpdates(token, householdId, onChange)`:

- Status: `off` (ohne Anmeldung oder Haushalt), `connecting`, `live`, `offline`. Angezeigt als "Live", "Verbindet …", "Getrennt". Bei `off` wird nichts angezeigt.
- Wiederverbindung mit Abstand 1 s, jeweils verdoppelt bis höchstens 15 s. Nach `ready` wird der Abstand zurückgesetzt.
- Bei 4401 und 4403 gibt der Hook auf, weil ein erneuter Versuch nichts bringt. Bei 4408 wird weiter versucht.
- Neuladen bei jedem `ready`, bei `changed`, wenn der Tab sichtbar wird und wenn das Netz zurückkehrt. Mehrere Auslöser innerhalb von 120 ms ergeben ein Neuladen.
- Keepalive: `ping` alle 25 Sekunden.
- Bei Verbindungsverlust bleibt die Seite benutzbar.

PWA-Basis (siehe auch README): `frontend/public/manifest.webmanifest`, `frontend/public/sw.js`, Icons unter `frontend/public/icons/`. Der Service Worker wird nur im Produktions-Build registriert (`frontend/src/main.jsx`). Er speichert die App-Hülle (HTML, `/assets/`, `/icons/`) und fasst Anfragen an andere Ursprünge, also die API, nicht an. Haushaltsdaten werden nicht zwischengespeichert, ohne Netz ist die Liste deshalb nicht verfügbar. Die PWA wurde nicht in Chrome getestet.

## Tests

Backend, ohne Netzwerk, gegen einen In-Memory-Ersatz des Supabase-Clients (`backend/tests/fake_supabase.py`, Fixtures in `backend/tests/conftest.py`). Letzter Lauf: 66 Tests bestanden (`python -m pytest -q` im Ordner `backend`).

| Datei | Tests | Inhalt |
| --- | --- | --- |
| `backend/tests/test_shopping.py` | 30 | Login und Mitgliedschaft, Haushaltstrennung, Anlegen, Filter, Validierung, Teil-Updates, 404, Löschen |
| `backend/tests/test_shopping_status.py` | 24 | erlaubte und verbotene Übergänge, Zeitstempel, 409, gleichzeitige Änderung, `checkout` |
| `backend/tests/test_shopping_realtime.py` | 11 | Hinweis an Mitglieder, anderer Haushalt bleibt still, Abweisung bei ungültigem Token, Nicht-Mitglied und Zeitüberschreitung |
| `backend/tests/test_health.py` | 1 | `/health` |

Die Zahlen sind die gesammelten Testfälle inklusive Parametrisierung. Für das Frontend gibt es keine automatisierten Tests, CI baut es nur (`npm run build`).

Nicht getestet: der Betrieb gegen ein echtes Supabase (lokal oder gehostet), Echtzeit mit mehreren echten Browsern, die PWA in Chrome (Installation, Offline-Start).

## Grenzen

- Die WebSocket-Verbindungen leben im Speicher eines Prozesses. Mit mehreren Prozessen oder Instanzen sieht jede nur ihre eigenen Clients (ADR 0003).
- Nur Änderungen über diese API lösen Hinweise aus, direkte Änderungen in der Datenbank nicht.
- Keine Row-Level-Security, kein Rollenmodell innerhalb des Haushalts.
- Kein Verlauf: Es gibt keine Verlaufstabelle, nur `bought_at` und `used_up_at` der letzten Runde.
- Keine Kategorien, Preise, Mindestbestände oder Barcodes.
- Es gibt keine Offline-Bearbeitung. Ohne Verbindung zur API sind Änderungen nicht möglich.
- CORS erlaubt im Backend nur `http://localhost:5173` und `http://127.0.0.1:5173` (`backend/app/main.py`).
