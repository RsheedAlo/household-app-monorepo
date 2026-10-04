# Betrieb gegen ein gehostetes Supabase-Projekt

Diese Anleitung beschreibt, wie die App statt gegen das lokale Supabase in Docker gegen ein Projekt bei supabase.com läuft. Der Standardweg für Entwicklung und Demo bleibt das lokale Supabase (README, Abschnitt "Supabase lokal per Docker").

Hinweis zum Prüfstand: Der Betrieb gegen ein gehostetes Supabase-Projekt wurde für diese Anleitung nicht ausprobiert. Die Schritte folgen dem Code und der Supabase-CLI. Die Oberfläche des Supabase-Dashboards ändert sich gelegentlich, Menünamen können abweichen.

## Voraussetzungen

- Konto bei Supabase (supabase.com)
- Node.js, damit `npx supabase` läuft
- Python 3.11 oder neuer für das Backend, Node.js für das Frontend
- Dieses Repository, Befehle im Repo-Root

## 1. Projekt anlegen

1. Im Supabase-Dashboard "New project" wählen.
2. Name vergeben, Region in der EU wählen (zum Beispiel Frankfurt oder eine andere EU-Region der Liste).
3. Ein Datenbank-Passwort festlegen und im eigenen Passwortmanager speichern. Es wird für `supabase link` und `db push` abgefragt, gehört aber nicht ins Repository.
4. Warten, bis das Projekt bereit ist.

## 2. URL und Anon-Key finden

Im Dashboard unter den Projekteinstellungen (Bereich API bzw. API Keys):

- Project URL, Form `https://<project-ref>.supabase.co`
- Den Anon-Key (je nach Dashboard-Stand als "anon public" oder "publishable" bezeichnet)
- Die Projekt-Referenz (`<project-ref>`) steht in der URL und in den allgemeinen Projekteinstellungen

Der Service-Role-Key ist im Backend optional (`SUPABASE_SERVICE_ROLE_KEY`). Er umgeht jede Zugriffsbeschränkung und darf nie ins Frontend oder ins Repository.

## 3. Schema einspielen

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

- `login` öffnet den Browser oder fragt nach einem Zugriffstoken des eigenen Supabase-Kontos.
- `link` fragt das Datenbank-Passwort aus Schritt 1 ab.
- `db push` spielt alle Dateien unter `supabase/migrations/` ein, die im Projekt noch fehlen. Aktuell sind das sieben:
  1. `20260403083901_create_core_tables.sql`
  2. `20260412090000_create_household_invites.sql`
  3. `20260412143000_add_households_created_by.sql`
  4. `20260419120000_create_kanban_tasks.sql`
  5. `20260513143957_create_calendar_events.sql`
  6. `20260522001000_extend_kanban_tasks.sql`
  7. `20261004120000_create_shopping_items.sql`
- Die CLI zeigt vor dem Ausführen, welche Migrationen angewendet werden, und fragt nach.

Kontrolle: Im Dashboard unter dem Table Editor müssen unter anderem `profiles`, `households`, `household_members`, `kanban_tasks`, `calendar_events` und `shopping_items` erscheinen.

Für den Betrieb ein neues Projekt verwenden. Ein Projekt mit einem Schema, das nicht aus diesen Migrationen stammt, kann bei `db push` zu Fehlern führen.

## 4. Auth-Einstellungen

Im Dashboard unter Authentication:

- E-Mail und Passwort muss als Anmeldeart aktiv sein (Standard).
- E-Mail-Bestätigung: Lokal ist sie ausgeschaltet (`enable_confirmations = false` in `supabase/config.toml`). Bei gehosteten Projekten ist sie standardmäßig eingeschaltet. Dann kann sich ein neuer Nutzer erst nach Klick auf den Link in der Bestätigungsmail anmelden, und `POST /api/auth/login` antwortet bis dahin mit 401. Für eine Demo mit Testkonten lässt sich die Bestätigung im Dashboard ausschalten. Für Konten echter Personen sollte sie eingeschaltet bleiben.
- Der eingebaute Mailversand von Supabase ist laut Anbieter für Tests gedacht und begrenzt. Für mehr als wenige Konten ist ein eigener SMTP-Dienst vorgesehen.
- Site URL und Redirect URLs betreffen nur Links in Bestätigungsmails. Die App selbst nutzt keine Weiterleitungen von Supabase.

Zeilenebene-Sicherheit (RLS): Die Migrationen aktivieren keine RLS, und das Backend funktioniert nur ohne sie (ADR 0002). Prüfe im Dashboard, dass RLS auf den Tabellen aus Schritt 3 nicht aktiv ist, falls dein Projekt eine Option für automatisch aktivierte RLS bei neuen Tabellen anbietet. Ist RLS aktiv und gibt es keine Policies, liefert das Backend mit dem Anon-Key leere Ergebnisse oder Fehler.

## 5. Backend konfigurieren

Die Einstellungen liest `backend/app/core/config.py` (Pydantic-Settings) aus Umgebungsvariablen oder aus `backend/.env`:

| Variable | Pflicht | Inhalt |
| --- | --- | --- |
| `SUPABASE_URL` | ja | Project URL aus Schritt 2 |
| `SUPABASE_KEY` | ja | Anon-Key aus Schritt 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | nein | nur für Admin-Funktionen (`supabase_admin` in `backend/app/db/database.py`) |

Vorlage ist `backend/.env.example`. Die Variablennamen sind groß geschrieben und stimmen mit der README überein. Beispiel `backend/.env` (Platzhalter durch eigene Werte ersetzen, die Datei wird nicht committet):

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<dein-anon-key>
```

Nur wenn Admin-Funktionen gebraucht werden, zusätzlich `SUPABASE_SERVICE_ROLE_KEY=<dein-service-role-key>` setzen.

Beim Start erzeugt das Backend den Supabase-Client sofort. Fehlt `SUPABASE_URL` oder `SUPABASE_KEY`, bricht der Start mit einem Validierungsfehler ab.

## 6. Backend starten

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Prüfung: `http://localhost:8000/health` liefert `{"status": "ok"}`. Das sagt noch nichts über die Verbindung zu Supabase aus (siehe Prüfliste).

CORS: `backend/app/main.py` erlaubt nur die Ursprünge `http://localhost:5173` und `http://127.0.0.1:5173`. Läuft das Frontend unter einer anderen Adresse, zum Beispiel bei einem gehosteten Frontend, lehnt der Browser die Anfragen ab, bis `allow_origins` dort angepasst wird. Das ist eine Codeänderung, die nicht Teil dieser Dokumentation ist.

## 7. Frontend starten

Das Frontend liest die Adresse des Backends aus `VITE_API_URL` (`frontend/src/config.js`, Standard `http://localhost:8000`).

```bash
cd frontend
npm install
# Standard (Backend auf demselben Rechner): keine Variable nötig
npm run dev
```

Bei abweichender Backend-Adresse, zum Beispiel in `frontend/.env.local`:

```env
VITE_API_URL=https://<backend-host>
```

Die Variable wird beim Build bzw. Start eingelesen. Nach einer Änderung muss Vite neu gestartet oder neu gebaut werden. Achtung: `docker-compose.yml` setzt für das Frontend `VITE_API_BASE_URL`. Diesen Namen liest der Code nicht, wirksam ist nur `VITE_API_URL`.

Der WebSocket nutzt dieselbe Adresse (`http` wird zu `ws`, `https` zu `wss`). Ein Frontend über HTTPS braucht ein Backend über HTTPS, sonst blockiert der Browser die unverschlüsselte Verbindung.

## 8. Prüfliste nach dem Setup

1. `GET /health` antwortet `{"status": "ok"}`.
2. Registrieren über die App (`/auth/signup` im Backend). Im Dashboard unter Authentication erscheint der Nutzer, in der Tabelle `profiles` die Zeile dazu.
3. Anmelden. Bei Fehler 401 zuerst die E-Mail-Bestätigung (Schritt 4) prüfen.
4. Haushalt anlegen. Er erscheint in `households` und `household_members`.
5. Unter `/shopping` einen Artikel anlegen, er erscheint in `shopping_items`.
6. Zweites Mitglied einladen und in einem zweiten Browserfenster anmelden. Ein Artikel, der im ersten Fenster angelegt wird, erscheint im zweiten ohne Neuladen, die Statusanzeige zeigt "Live".
7. Backend neu starten: Die Anzeige wechselt kurz auf "Getrennt", dann wieder auf "Live", die Liste bleibt erhalten.
8. Optional im Backend-Ordner `python -m pytest -q`. Die Tests laufen ohne Netzwerk gegen einen Ersatz und prüfen die Supabase-Verbindung nicht.

## 9. Typische Fehler

| Symptom | Mögliche Ursache | Abhilfe |
| --- | --- | --- |
| Backend startet nicht, Validierungsfehler für `SUPABASE_URL` oder `SUPABASE_KEY` | `backend/.env` fehlt, liegt am falschen Ort oder hat falsche Namen | Datei im Ordner `backend/` anlegen, Namen wie in Schritt 5, Backend im Ordner `backend/` starten |
| Login liefert 401 "Falsche E-Mail oder Passwort" | falsche Daten oder E-Mail noch nicht bestätigt | Bestätigung abschließen oder ausschalten (Schritt 4) |
| Registrieren liefert 500 | Tabelle `profiles` fehlt (Migrationen nicht eingespielt) oder E-Mail existiert schon | `npx supabase db push` prüfen, Fehlertext der Antwort lesen |
| Alle Anfragen 401 | Anon-Key oder URL gehören zu einem anderen Projekt | Werte im Dashboard erneut kopieren |
| Fehler 500 beim Laden von Artikeln, Meldung zur fehlenden Tabelle | `db push` nicht ausgeführt oder falsches Projekt verlinkt | `npx supabase link --project-ref ...` und `db push` wiederholen |
| Leere Listen trotz vorhandener Daten, Fehler bei Schreibzugriffen | RLS auf den Tabellen aktiv | RLS ausschalten (Schritt 4), Abwägung siehe unten |
| Browser meldet CORS-Fehler | Frontend läuft nicht auf `localhost:5173` oder `127.0.0.1:5173` | `allow_origins` im Backend anpassen |
| Frontend ruft `localhost:8000` statt des Backends auf | `VITE_API_URL` nicht gesetzt oder Vite nicht neu gestartet | Variable setzen, neu starten oder bauen |
| Statusanzeige bleibt "Getrennt" oder "Verbindet …" | Hosting-Dienst oder Proxy lässt WebSockets nicht durch, `http`/`https` nicht passend, Token ungültig | siehe nächster Abschnitt, Browser-Konsole und Backend-Log prüfen |
| `db push` verlangt Passwort oder bricht ab | falsches Datenbank-Passwort oder Projekt nicht verlinkt | `link` erneut ausführen |
| Projekt antwortet nicht mehr | Gratis-Projekt wurde pausiert | im Dashboard wieder aktivieren (siehe Vergleich) |

## 10. Wichtige Einschränkungen

- Der Anon-Key gehört nicht ins Frontend. Das Frontend spricht nur mit dem Backend, der Key liegt in `backend/.env`. Das Frontend enthält ihn nicht, und er darf nicht in `VITE_`-Variablen stehen, weil Vite diese in den ausgelieferten Code einbettet.
- Es gibt keine Row-Level-Security (ADR 0002). Das Backend nutzt den Anon-Key und prüft Zugriffe selbst. Wer den Anon-Key kennt, kann die Tabellen direkt über die Supabase-API lesen und ändern. Bei einem gehosteten Projekt ist die API aus dem Internet erreichbar, bei lokalem Docker nur auf dem eigenen Rechner (sofern der Port nicht freigegeben wird). Der Key ist deshalb wie ein Geheimnis zu behandeln und nicht in Repository, Chat oder Tickets zu legen. Das Absichern mit RLS ist ein eigenes, noch offenes Thema.
- Die WebSocket-Verbindungen der Echtzeit liegen im Speicher des Backend-Prozesses (ADR 0003). Mit mehreren Prozessen oder Instanzen sehen sich Clients auf verschiedenen Instanzen nicht. Ein Neustart des Backends trennt alle Verbindungen, die Clients verbinden sich selbst neu.
- Wird das Backend gehostet, braucht der Dienst Unterstützung für langlebige WebSocket-Verbindungen. Reine Funktions-Hosting-Angebote ohne dauerhaften Prozess eignen sich dafür nicht. Auch Proxys und Lastverteiler müssen WebSockets zulassen und dürfen untätige Verbindungen nicht zu früh schließen (der Client sendet alle 25 Sekunden ein `ping`).
- Nicht getestet: Das Zusammenspiel von Backend, Echtzeit und PWA gegen ein echtes Supabase-Projekt, auch nicht die PWA in Chrome.

## 11. Vergleich: lokal (Docker) und gehostet

| Punkt | Lokal (Docker) | Gehostet (supabase.com) |
| --- | --- | --- |
| Wo liegen die Daten | auf dem eigenen Rechner | beim Anbieter, in der gewählten Region |
| Erreichbarkeit | nur vom eigenen Rechner (oder Netz, falls freigegeben) | aus dem Internet, auch ohne eigenen Rechner |
| Gemeinsamer Zugriff mehrerer Personen auf dieselbe Datenbank | nur im selben Netz mit Freigabe | ohne weiteres möglich |
| Pausierung | keine, solange Docker läuft | Gratis-Projekte werden laut Anbieter nach Inaktivität pausiert (das frühere Cloud-Projekt dieses Repos ist pausiert), aktuelle Bedingungen beim Anbieter prüfen |
| Reproduzierbarkeit | `supabase db reset` baut den Stand aus den Migrationen neu auf | Stand lebt im Projekt, Neuaufbau über ein neues Projekt und `db push` |
| Datenverlust-Risiko | Zurücksetzen und Docker-Volumes löschen Daten | Daten bleiben beim Anbieter, Sicherungen hängen vom Tarif ab |
| Mail-Versand | lokal abgefangen (Mailpit, falls gestartet), Bestätigung in der Konfiguration aus | echter Versand mit Begrenzung, Bestätigung standardmäßig an |
| Voraussetzungen | Docker Desktop, Ressourcen auf dem Rechner | Konto beim Anbieter, Internetzugang |
| Kosten | keine Anbieterkosten | Gratis-Tarif mit Grenzen, darüber kostenpflichtig |

Eine Aussage, welche Variante sicherer ist, ergibt sich daraus nicht. Beide haben dieselbe Lücke durch fehlendes RLS. Bei der gehosteten Variante ist die Supabase-API aus dem Internet erreichbar, bei der lokalen nicht, dafür liegt die Verantwortung für Sicherung und Rechner bei dir.
