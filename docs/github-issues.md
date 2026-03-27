# GitHub Issues und Backlog

## M1 - Core Setup und Auth

### 1. [Core] Projektanforderungen analysieren und dokumentieren
- User Story: Ich als Projektteam moechte die Anforderungen und Abgrenzungen dokumentieren, damit alle dieselbe fachliche und technische Ausgangsbasis haben.
- Akzeptanzkriterien:
  - Projektziele und Modulabgrenzungen sind dokumentiert.
  - Querschnittsthemen `[Core]`, `[Auth]`, `[DevOps]`, `[Docs]` sind beschrieben.
  - Offene Punkte sind sichtbar markiert.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine Implementierung von Fachlogik.
- Labels: `core`, `docs`, `enhancement`

### 2. [Core] Zielarchitektur festlegen
- User Story: Ich als Projektteam moechte eine verbindliche Zielarchitektur festlegen, damit Frontend, Backend und Infrastruktur konsistent aufgebaut werden.
- Akzeptanzkriterien:
  - Architekturuebersicht liegt vor.
  - Technologieentscheidungen sind dokumentiert.
  - Monorepo-Ordnerstruktur ist begruendet.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine Detailarchitektur pro Fachmodul.
- Labels: `core`, `docs`, `enhancement`

### 3. [DevOps] Monorepo-Basisstruktur anlegen
- User Story: Ich als Entwickler moechte eine saubere Monorepo-Struktur haben, damit Frontend, Backend, Infrastruktur und Dokumentation gemeinsam versioniert werden koennen.
- Akzeptanzkriterien:
  - Ordnerstruktur gemaess Zielbild ist vorhanden.
  - Basis-READMEs und `.gitignore` sind angelegt.
  - `.env.example` ist vorhanden.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine fachlichen Module fertig implementieren.
- Labels: `devops`, `docs`, `enhancement`

### 4. [DevOps] React-Frontend scaffolden
- User Story: Ich als Entwickler moechte ein React-Frontend-Grundgeruest haben, damit die UI-Struktur fuer die Haushaltsapp vorbereitet ist.
- Akzeptanzkriterien:
  - Vite-basierte Frontend-Struktur ist vorhanden.
  - Start- und Build-Skripte sind definiert.
  - Eine Platzhalter-Startseite existiert.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine fertigen `[Kanban]`, `[Einkauf/Vorrat]` oder `[Kalender]`-Screens.
- Labels: `frontend`, `devops`, `enhancement`

### 5. [DevOps] Python-Backend scaffolden
- User Story: Ich als Entwickler moechte ein FastAPI-Backend-Grundgeruest haben, damit API, Konfiguration und Tests vorbereitet sind.
- Akzeptanzkriterien:
  - FastAPI-Anwendung startet.
  - Healthcheck-Endpunkt ist vorhanden.
  - Test- und Linting-Grundlage ist vorbereitet.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine fachlichen Endpunkte fuer Module.
- Labels: `backend`, `devops`, `enhancement`

### 6. [DevOps] Docker-Compose fuer lokale Entwicklung anlegen
- User Story: Ich als Entwickler moechte Frontend, Backend und Datenbank lokal per Docker Compose starten koennen, damit das Team eine einheitliche Entwicklungsumgebung hat.
- Akzeptanzkriterien:
  - `docker-compose.yml` existiert.
  - Dockerfiles fuer Frontend und Backend sind vorhanden.
  - PostgreSQL ist als lokaler Service vorgesehen.
- Abgrenzung / Nicht Teil dieses Issues:
  - Kein produktionsreifes Deployment.
- Labels: `devops`, `enhancement`

### 7. [DevOps] GitHub-Actions-Basisworkflow anlegen
- User Story: Ich als Entwickler moechte automatische Basispruefungen im Repository haben, damit Build- und Qualitaetsprobleme frueh sichtbar werden.
- Akzeptanzkriterien:
  - Frontend-Install und -Build sind im Workflow vorgesehen.
  - Backend-Install sowie Lint/Test-Placeholder sind im Workflow vorgesehen.
  - Workflow liegt unter `.github/workflows/`.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine vollstaendige Release-Pipeline.
- Labels: `devops`, `enhancement`

### 8. [Docs] README und Setup-Dokumentation erstellen
- User Story: Ich als Teammitglied moechte eine nachvollziehbare Setup-Dokumentation haben, damit ich das Projekt lokal starten und die Struktur verstehen kann.
- Akzeptanzkriterien:
  - Root-README beschreibt Struktur und Start.
  - Frontend- und Backend-README sind vorhanden.
  - Architektur- und Entscheidungsdokumente sind verlinkt oder auffindbar.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine Benutzerdokumentation fuer Fachfunktionen.
- Labels: `docs`, `enhancement`

### 9. [Auth] Basis fuer Nutzerverwaltung vorbereiten
- User Story: Ich als Entwickler moechte eine technische Grundstruktur fuer Nutzerverwaltung und Login vorbereiten, damit spaeter Authentifizierung konsistent integriert werden kann.
- Akzeptanzkriterien:
  - `[Auth]` ist in Architektur und Backlog beschrieben.
  - Platzhalter fuer Auth-nahe Backend-Struktur sind vorgesehen.
  - Schnittstelle zu `[Core]` ist konzeptionell erwaehnt.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine Registrierung, kein Login-Flow, keine Rollenlogik.
- Labels: `auth`, `backend`, `enhancement`

## Backlog fuer spaetere Milestones

- `[Kanban]` Aufgaben im Board verwalten
- `[Kanban]` Board-Spalten und Statusmodell definieren
- `[Einkauf/Vorrat]` Einkaufs- und Vorratslisten verwalten
- `[Einkauf/Vorrat]` Artikelstatus und Verbrauch dokumentieren
- `[Kalender]` Termine verwalten
- `[Kalender]` iCal-Integration vorbereiten
- `[Core]` Push-Benachrichtigungen vorbereiten
- `[Core]` QR-Code-Einladung fuer Haushaltsbeitritt
- `[Core]` Echtzeit-Synchronisation vorbereiten
- `[DevOps]` Deployment vorbereiten

## Kopierbare `gh`-Befehle

```bash
gh issue create --title "[Core] Projektanforderungen analysieren und dokumentieren" --label core --label docs --label enhancement --body-file docs/issue-bodies/core-analyse.md
gh issue create --title "[Core] Zielarchitektur festlegen" --label core --label docs --label enhancement --body-file docs/issue-bodies/core-architektur.md
gh issue create --title "[DevOps] Monorepo-Basisstruktur anlegen" --label devops --label docs --label enhancement --body-file docs/issue-bodies/devops-monorepo.md
gh issue create --title "[DevOps] React-Frontend scaffolden" --label frontend --label devops --label enhancement --body-file docs/issue-bodies/devops-frontend.md
gh issue create --title "[DevOps] Python-Backend scaffolden" --label backend --label devops --label enhancement --body-file docs/issue-bodies/devops-backend.md
gh issue create --title "[DevOps] Docker-Compose fuer lokale Entwicklung anlegen" --label devops --label enhancement --body-file docs/issue-bodies/devops-docker.md
gh issue create --title "[DevOps] GitHub-Actions-Basisworkflow anlegen" --label devops --label enhancement --body-file docs/issue-bodies/devops-ci.md
gh issue create --title "[Docs] README und Setup-Dokumentation erstellen" --label docs --label enhancement --body-file docs/issue-bodies/docs-readme.md
gh issue create --title "[Auth] Basis fuer Nutzerverwaltung vorbereiten" --label auth --label backend --label enhancement --body-file docs/issue-bodies/auth-bootstrap.md
```

