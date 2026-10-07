# Architekturuebersicht

## Zielbild

- `[Frontend]` React + Vite fuer Webanwendung/PWA-Basis
- `[Backend]` FastAPI fuer REST-API-Basis
- `[Core]` Gemeinsame Datenbasis und Haushaltskontext
- `[Auth]` Gemeinsame Nutzerverwaltung fuer alle Module
- `[DevOps]` Docker Compose fuer lokale Entwicklung
- `[DevOps]` GitHub Actions fuer Build- und Qualitaetschecks

## Modulabgrenzung

- `[Kanban]` Aufgaben, Boards, Spalten, Zuweisungen
- `[Einkauf/Vorrat]` Einkaufslisten, Artikel, Vorratsstatus
- `[Kalender]` Termine, Planung, spaetere iCal-Schnittstellen
- `[Core]` Haushalt, Mitglieder, Rollen, Benachrichtigungsbasis, gemeinsame Stammdaten
- `[Auth]` Login, Session-/Token-Basis, Nutzerkonto

## Schnittprinzip

Alle fachlichen Module greifen auf gemeinsame `[Core]`- und `[Auth]`-Bausteine zu. In Phase 1 wird nur die technische Struktur vorbereitet.


## Einkauf/Vorrat und Echtzeit

- Eine Tabelle `shopping_items` je Haushalt, Einkaufsliste und Vorrat sind Sichten auf dieselben Zeilen (Status `planned`, `bought`, `in_stock`, `used_up`). Erlaubte Statuswechsel stehen in `backend/app/services/shopping.py`.
- Das Backend (`backend/app/api/shopping.py`) prueft bei jedem Aufruf das Supabase-Token und die Haushaltsmitgliedschaft (`backend/app/core/access.py`). Es nutzt den Anon-Key, Row-Level-Security gibt es nicht (ADR 0002).
- Echtzeit laeuft ueber einen FastAPI-WebSocket (ADR 0003). Der Server sendet nach Schreibvorgaengen nur `{"type": "changed"}`, die Clients laden die Liste ueber die geschuetzte REST-API neu. Der Verbindungs-Hub (`backend/app/services/realtime.py`) lebt im Speicher eines Prozesses, mehrere Instanzen brauchen einen gemeinsamen Kanal.
- Das Frontend nutzt den Hook `useLiveUpdates` mit Wiederverbindung. Dazu kommt eine PWA-Basis (Manifest, Service Worker fuer die App-Huelle, keine zwischengespeicherten API-Antworten).
- Betrieb gegen lokales oder gehostetes Supabase: `docs/deployment-supabase-cloud.md`. Moduldetails: `docs/modules/einkauf-vorrat.md`.
