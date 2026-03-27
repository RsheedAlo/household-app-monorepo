# Backend

`[DevOps]` FastAPI-Grundgeruest fuer das Monorepo.

## Struktur

```text
app/
  api/
  core/
  db/
  models/
  schemas/
  services/
  main.py
tests/
```

## Ziel

- HTTP-API als Basis fuer spaetere Module
- Platzhalter fuer `[Auth]`, `[Core]` und Modul-Endpunkte
- Noch keine Fachlogik oder Persistenzimplementierung

## Lokaler Start

```bash
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

