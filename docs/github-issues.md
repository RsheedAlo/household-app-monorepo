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

## Zusaetzlich angelegte Milestones und Issues

### M2 - Kanban

#### [Kanban] Aufgaben im Board verwalten
- User Story: Ich als Haushaltsmitglied moechte Aufgaben in einem Board anlegen, bearbeiten und verschieben koennen, damit gemeinsame Planung transparent wird.
- Akzeptanzkriterien:
  - Aufgaben koennen fachlich als Board-Eintraege modelliert werden.
  - Grundstruktur fuer Titel, Beschreibung und Status ist beschrieben.
  - UI- und API-Grundlage sind konzeptionell vorbereitet.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine Echtzeit-Synchronisation.
- Labels: `kanban`, `frontend`, `backend`, `enhancement`

#### [Kanban] Board-Spalten und Statusmodell definieren
- User Story: Ich als Projektteam moechte ein konsistentes Spalten- und Statusmodell fuer das Kanban-Board definieren, damit Aufgaben eindeutig einsortiert werden koennen.
- Akzeptanzkriterien:
  - Spalten und Statuswerte sind dokumentiert.
  - Uebergaenge zwischen Stati sind beschrieben.
  - Bezug zur gemeinsamen `[Core]`-Datenbasis ist geklaert.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine Automatisierungsregeln fuer Workflows.
- Labels: `kanban`, `docs`, `core`, `enhancement`

### M3 - Einkauf und Vorrat

#### [Einkauf/Vorrat] Einkaufs- und Vorratslisten verwalten
- User Story: Ich als Haushaltsmitglied moechte Einkaufs- und Vorratslisten verwalten koennen, damit Bedarf und Bestand gemeinsam gepflegt werden koennen.
- Akzeptanzkriterien:
  - Listenstruktur fuer Einkauf und Vorrat ist beschrieben.
  - Artikel koennen fachlich Listen zugeordnet werden.
  - Grundlegende UI- und API-Struktur ist vorgesehen.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine Barcode- oder externe Produktintegration.
- Labels: `einkauf-vorrat`, `frontend`, `backend`, `enhancement`

#### [Einkauf/Vorrat] Artikelstatus und Verbrauch dokumentieren
- User Story: Ich als Haushaltsmitglied moechte den Status von Artikeln und ihren Verbrauch festhalten koennen, damit der Vorrat aktuell bleibt.
- Akzeptanzkriterien:
  - Status wie geplant, gekauft, vorhanden oder aufgebraucht sind beschrieben.
  - Verbrauchsereignisse sind fachlich vorgesehen.
  - Verbindung zu Vorratslisten ist dokumentiert.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine automatische Bestandsprognose.
- Labels: `einkauf-vorrat`, `backend`, `core`, `enhancement`

### M4 - Kalender und iCal

#### [Kalender] Termine verwalten
- User Story: Ich als Haushaltsmitglied moechte Termine im gemeinsamen Kalender verwalten koennen, damit gemeinsame Planung sichtbar ist.
- Akzeptanzkriterien:
  - Termin-Grundstruktur ist definiert.
  - Erstellung, Bearbeitung und Anzeige sind fachlich beschrieben.
  - Bezug zu Haushalt oder Mitgliedern ist vorgesehen.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine externe Kalender-Synchronisation.
- Labels: `kalender`, `frontend`, `backend`, `enhancement`

#### [Kalender] Haushaltsbezug fuer Termine modellieren
- User Story: Ich als Projektteam moechte Termine mit Haushaltskontext verknuepfen, damit Eintraege spaeter sinnvoll Modulen und Mitgliedern zugeordnet werden koennen.
- Akzeptanzkriterien:
  - Termine koennen Haushalt, Mitgliedern oder Aktivitaeten zugeordnet werden.
  - Schnittstelle zu `[Core]` ist beschrieben.
  - Datenmodell-Annahmen sind dokumentiert.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine Benachrichtigungslogik.
- Labels: `kalender`, `core`, `docs`, `enhancement`

#### [Kalender] iCal-Integration vorbereiten
- User Story: Ich als Projektteam moechte eine spaetere iCal-Integration vorbereiten, damit externe Kalender angebunden werden koennen.
- Akzeptanzkriterien:
  - Import-/Export-Richtung ist beschrieben.
  - Technische Risiken und offene Fragen sind dokumentiert.
  - API- oder Service-Schnittstelle ist skizziert.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine produktive iCal-Implementierung.
- Labels: `kalender`, `backend`, `docs`, `enhancement`

### M5 - Core Erweiterungen

#### [Core] Push-Benachrichtigungen vorbereiten
- User Story: Ich als Haushaltsmitglied moechte spaeter Benachrichtigungen erhalten koennen, damit wichtige Aenderungen sichtbar werden.
- Akzeptanzkriterien:
  - Einsatzfaelle fuer Push-Benachrichtigungen sind dokumentiert.
  - Technische Grundstruktur fuer Benachrichtigungsereignisse ist beschrieben.
  - Abhaengigkeiten zu Frontend und Backend sind sichtbar.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine fertige Push-Zustellung.
- Labels: `core`, `frontend`, `backend`, `enhancement`

#### [Core] QR-Code-Einladung fuer Haushaltsbeitritt vorbereiten
- User Story: Ich als Haushaltsadministrator moechte spaeter Mitglieder per QR-Code einladen koennen, damit Haushalte einfach geteilt werden koennen.
- Akzeptanzkriterien:
  - Einladungsfluss ist beschrieben.
  - Sicherheits- und Ablaufannahmen sind dokumentiert.
  - Schnittstellen zu `[Auth]` und `[Core]` sind vorgesehen.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine produktive QR-Code-Erzeugung.
- Labels: `core`, `auth`, `docs`, `enhancement`

#### [Core] Echtzeit-Synchronisation vorbereiten
- User Story: Ich als Haushaltsmitglied moechte spaeter Aenderungen in Echtzeit sehen koennen, damit alle denselben Stand haben.
- Akzeptanzkriterien:
  - Bedarf fuer Echtzeit-Synchronisation ist beschrieben.
  - Technische Optionen wie WebSocket oder Polling sind bewertet.
  - Auswirkungen auf Module und Datenkonsistenz sind dokumentiert.
- Abgrenzung / Nicht Teil dieses Issues:
  - Keine produktive Echtzeit-Implementierung.
- Labels: `core`, `backend`, `devops`, `enhancement`

### M6 - Deployment und Releasevorbereitung

#### [DevOps] Deployment vorbereiten
- User Story: Ich als Entwickler moechte eine technische Deployment-Vorbereitung haben, damit das Projekt spaeter reproduzierbar ausgeliefert werden kann.
- Akzeptanzkriterien:
  - Zielumgebung und Deployment-Ansatz sind dokumentiert.
  - Anforderungen an Container, Konfiguration und CI/CD sind beschrieben.
  - Offene Infrastrukturfragen sind sichtbar.
- Abgrenzung / Nicht Teil dieses Issues:
  - Kein produktiver Live-Rollout.
- Labels: `devops`, `docs`, `enhancement`

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
gh issue create --title "[Kanban] Aufgaben im Board verwalten" --label kanban --label frontend --label backend --label enhancement --body-file docs/issue-bodies/kanban-board-tasks.md
gh issue create --title "[Kanban] Board-Spalten und Statusmodell definieren" --label kanban --label docs --label core --label enhancement --body-file docs/issue-bodies/kanban-status-model.md
gh issue create --title "[Einkauf/Vorrat] Einkaufs- und Vorratslisten verwalten" --label einkauf-vorrat --label frontend --label backend --label enhancement --body-file docs/issue-bodies/einkauf-listen.md
gh issue create --title "[Einkauf/Vorrat] Artikelstatus und Verbrauch dokumentieren" --label einkauf-vorrat --label backend --label core --label enhancement --body-file docs/issue-bodies/einkauf-verbrauch.md
gh issue create --title "[Kalender] Termine verwalten" --label kalender --label frontend --label backend --label enhancement --body-file docs/issue-bodies/kalender-termine.md
gh issue create --title "[Kalender] Haushaltsbezug fuer Termine modellieren" --label kalender --label core --label docs --label enhancement --body-file docs/issue-bodies/kalender-haushaltsbezug.md
gh issue create --title "[Kalender] iCal-Integration vorbereiten" --label kalender --label backend --label docs --label enhancement --body-file docs/issue-bodies/kalender-ical.md
gh issue create --title "[Core] Push-Benachrichtigungen vorbereiten" --label core --label frontend --label backend --label enhancement --body-file docs/issue-bodies/core-push.md
gh issue create --title "[Core] QR-Code-Einladung fuer Haushaltsbeitritt vorbereiten" --label core --label auth --label docs --label enhancement --body-file docs/issue-bodies/core-qr-invite.md
gh issue create --title "[Core] Echtzeit-Synchronisation vorbereiten" --label core --label backend --label devops --label enhancement --body-file docs/issue-bodies/core-realtime.md
gh issue create --title "[DevOps] Deployment vorbereiten" --label devops --label docs --label enhancement --body-file docs/issue-bodies/devops-deployment.md
```
