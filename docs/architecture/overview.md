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

