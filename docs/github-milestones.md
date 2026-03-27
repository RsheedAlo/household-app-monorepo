# GitHub Milestones

## Geplante Milestones

### M1 - Core Setup und Auth

Beschreibung:
Basisprojekt, Monorepo-Struktur, Docker-Setup, GitHub Actions, Dokumentation, Nutzerverwaltung-Grundgeruest

### M2 - Kanban

Beschreibung:
Grundlagen fuer Aufgabenverwaltung, Board-Struktur, Spaltenmodell und Statuslogik

### M3 - Einkauf und Vorrat

Beschreibung:
Grundlagen fuer Einkaufslisten, Vorratslisten, Artikelstatus und Verbrauchsdokumentation

### M4 - Kalender und iCal

Beschreibung:
Grundlagen fuer Terminverwaltung, Haushaltsbezug und spaetere iCal-Integration

### M5 - Core Erweiterungen

Beschreibung:
Querschnittserweiterungen fuer Benachrichtigungen, Einladungen und Echtzeit-Synchronisation

### M6 - Deployment und Releasevorbereitung

Beschreibung:
Vorbereitung fuer Deployment, Build-Release-Prozess und technische Auslieferung

## Kopierbare `gh`-Befehle

```bash
gh label create frontend --color 1f6feb --description "Frontend-bezogene Aufgaben"
gh label create backend --color 0e8a16 --description "Backend-bezogene Aufgaben"
gh label create auth --color d93f0b --description "Authentifizierung und Nutzerverwaltung"
gh label create devops --color 5319e7 --description "Build, CI, Docker, Deployment"
gh label create docs --color 0052cc --description "Dokumentation und Struktur"
gh label create enhancement --color a2eeef --description "Neue Funktion oder Verbesserung"
gh label create kanban --color c5def5 --description "Kanban-Modul"
gh label create einkauf-vorrat --color fbca04 --description "Einkauf- und Vorrats-Modul"
gh label create kalender --color 006b75 --description "Kalender-Modul"
gh label create core --color bfd4f2 --description "Gemeinsame Kernlogik"

gh api repos/:owner/:repo/milestones -f title='M1 - Core Setup und Auth' -f description='Basisprojekt, Monorepo-Struktur, Docker-Setup, GitHub Actions, Dokumentation, Nutzerverwaltung-Grundgeruest'
gh api repos/:owner/:repo/milestones -f title='M2 - Kanban' -f description='Grundlagen fuer Aufgabenverwaltung, Board-Struktur, Spaltenmodell und Statuslogik'
gh api repos/:owner/:repo/milestones -f title='M3 - Einkauf und Vorrat' -f description='Grundlagen fuer Einkaufslisten, Vorratslisten, Artikelstatus und Verbrauchsdokumentation'
gh api repos/:owner/:repo/milestones -f title='M4 - Kalender und iCal' -f description='Grundlagen fuer Terminverwaltung, Haushaltsbezug und spaetere iCal-Integration'
gh api repos/:owner/:repo/milestones -f title='M5 - Core Erweiterungen' -f description='Querschnittserweiterungen fuer Benachrichtigungen, Einladungen und Echtzeit-Synchronisation'
gh api repos/:owner/:repo/milestones -f title='M6 - Deployment und Releasevorbereitung' -f description='Vorbereitung fuer Deployment, Build-Release-Prozess und technische Auslieferung'
```
