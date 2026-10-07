![CI Status](https://github.com/RsheedAlo/household-app-monorepo/actions/workflows/ci.yml/badge.svg)
# household-app-monorepo

Monorepo-Grundgeruest fuer eine Haushaltsapp als Webanwendung/PWA mit React im Frontend und FastAPI im Backend.

## Projektziele

- `[Kanban]` ToDo-/Planer-Modul als Kanban-Board
- `[Einkauf/Vorrat]` Einkaufslisten- und Vorrats-Modul
- `[Kalender]` Kalender-Modul mit spaeterer iCal-Integration
- `[Auth]` Nutzerverwaltung und Login
- `[Core]` Gemeinsame Haushaltslogik und Datenbasis
- `[DevOps]` Docker-, CI- und Deployment-Vorbereitung
- `[Docs]` Dokumentation, Architektur und Entscheidungen

## Monorepo-Struktur

```text
frontend/              React + Vite Grundgeruest
backend/               FastAPI Grundgeruest
infra/docker/          Dockerfiles
docs/                  Architektur, Entscheidungen, GitHub-Vorbereitung
.github/workflows/     GitHub Actions
docker-compose.yml     Lokale Entwicklungsumgebung
```

## Lokaler Start

### 1. Umgebungsvariablen (WICHTIG)
Erstelle eine `.env` Datei im Ordner `backend/` mit folgendem Inhalt:
```env
SUPABASE_URL="DEINE_SUPABASE_PROJEKT_URL"
SUPABASE_KEY="DEIN_SUPABASE_ANON_KEY"
```

### Supabase lokal per Docker (empfohlen für Entwicklung und Demo)

Das frühere Cloud-Projekt ist pausiert. Lokal läuft Supabase in Docker. Die Migrationen unter `supabase/migrations/` sind die einzige Quelle für das Datenbankschema.

1. Docker Desktop starten.
2. Im Repo-Root `npx supabase start` ausführen. Beim ersten Mal werden die Images geladen. Nicht benötigte Dienste lassen sich auslassen: `npx supabase start -x storage-api,imgproxy,edge-runtime,logflare,vector,supavisor,mailpit,realtime`.
3. `npx supabase status -o env` zeigt `API_URL`, `ANON_KEY` und `SERVICE_ROLE_KEY`. Daraus `backend/.env` anlegen, Vorlage ist `backend/.env.example`. Die Datei wird nicht committet.
4. Backend und Frontend wie unten starten. Die Datenbank-Oberfläche (Studio) läuft auf http://127.0.0.1:54323.
5. Zurücksetzen: `npx supabase db reset` wendet alle Migrationen neu an und löscht die lokalen Daten. Beenden: `npx supabase stop`.

### Docker Compose

```bash
docker compose up --build
```

### Ohne Docker

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Gehostetes Supabase statt Docker

Der Betrieb gegen ein Projekt bei supabase.com ist in `docs/deployment-supabase-cloud.md` beschrieben (Projekt anlegen, `supabase link`, `supabase db push`, `backend/.env`, Prüfliste, typische Fehler). Diese Anleitung wurde nicht gegen ein echtes gehostetes Projekt erprobt.

Hinweis zu Variablen: Das Backend liest `SUPABASE_URL` und `SUPABASE_KEY` (optional `SUPABASE_SERVICE_ROLE_KEY`), das Frontend die Backend-Adresse aus `VITE_API_URL` (Standard `http://localhost:8000`).

## Funktionsumfang Einkauf/Vorrat

Eine gemeinsame Einkaufsliste und ein Vorrat pro Haushalt, beides Sichten auf die Tabelle `shopping_items`. Artikel durchlaufen die Status `planned`, `bought`, `in_stock` und `used_up`. "Einkauf abschließen" verschiebt alle abgehakten Artikel in den Vorrat. Jeder Zugriff verlangt ein gültiges Token und die Mitgliedschaft im Haushalt. Details zu Datenmodell, Status-Übergängen und API: `docs/modules/einkauf-vorrat.md`.

### Echtzeit

Änderungen an der Einkaufsliste erscheinen bei den anderen Mitgliedern ohne Neuladen. Das Backend meldet über einen WebSocket (`/api/shopping/{household_id}/ws`) nur, dass sich etwas geändert hat, die Clients laden die Liste dann über die geschützte API neu. Die Verbindungen liegen im Speicher eines Backend-Prozesses, mit mehreren Instanzen funktioniert das nicht ohne weitere Arbeit (ADR 0003). Die Echtzeit wurde mit Backend-Tests geprüft, nicht gegen ein echtes Supabase und nicht mit mehreren echten Browsern.

### PWA-Basis

Das Frontend bringt ein Web-App-Manifest (`frontend/public/manifest.webmanifest`), Icons und einen Service Worker (`frontend/public/sw.js`) mit. Der Service Worker wird nur im Produktions-Build registriert und speichert nur die App-Hülle, keine API-Antworten. Die PWA wurde nicht in Chrome getestet.

## Tests ausführen

Backend (kein Netzwerk und kein Supabase nötig, die Tests nutzen einen Ersatz):

```bash
cd backend
pip install -e .[dev]
python -m pytest -q
```

Stand 04.10.2026: 66 Tests bestanden (Einkauf/Vorrat: 65, davon 30 Zugriff und CRUD, 24 Status-Workflow, 11 Echtzeit; dazu `/health`). Statische Prüfung wie in CI: `ruff check app tests`. Für das Frontend gibt es keine automatisierten Tests, CI führt `npm run build` aus.

## Dokumentation

- `docs/modules/einkauf-vorrat.md`: Modul Einkauf/Vorrat
- `docs/deployment-supabase-cloud.md`: Betrieb gegen gehostetes Supabase
- `docs/architecture/overview.md`: Architekturübersicht
- `docs/decisions/`: Architekturentscheidungen (ADR 0002 Umgebung, Datenmodell und Zugriff, ADR 0003 Echtzeit)

## Status

Umgesetzt sind Nutzerverwaltung, Haushalte, `[Kanban]`, `[Kalender]` und `[Einkauf/Vorrat]`. Entscheidungen stehen unter `docs/decisions/`.

