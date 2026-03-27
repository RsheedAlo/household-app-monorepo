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
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Status

Dieses Repository enthaelt bewusst nur die technische Basisstruktur. Fachlogik fuer `[Kanban]`, `[Einkauf/Vorrat]`, `[Kalender]` und `[Auth]` ist noch nicht implementiert.

