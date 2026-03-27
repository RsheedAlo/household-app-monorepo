# ADR 0001: Monorepo-Architektur fuer household-app-monorepo

## Status

Accepted

## Kontext

Das Studienprojekt benoetigt eine nachvollziehbare Grundstruktur fuer Frontend, Backend, Infrastruktur und Dokumentation. Fachlogik soll bewusst spaeter umgesetzt werden.

## Entscheidung

- Monorepo mit `frontend/`, `backend/`, `infra/`, `docs/` und `.github/`
- Frontend auf Basis von React + Vite
- Backend auf Basis von Python + FastAPI
- PostgreSQL als Standarddatenbank
- Docker Compose fuer lokale Entwicklung
- GitHub Actions fuer Basispipeline

## Konsequenzen

- Gemeinsame Versionierung aller Projektteile
- Einfachere Abstimmung zwischen Modulen und Querschnittsthemen
- Saubere Basis fuer spaetere fachliche Erweiterungen

