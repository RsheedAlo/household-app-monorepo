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

## Status

Umgesetzt sind Nutzerverwaltung, Haushalte, `[Kanban]`, `[Kalender]` und `[Einkauf/Vorrat]`. Entscheidungen stehen unter `docs/decisions/`.

