# ADR 0003: Einkauf/Vorrat – Echtzeit über FastAPI-WebSocket

## Status

Accepted (04.10.2026)

## Kontext

Mehrere Haushaltsmitglieder bearbeiten dieselbe Einkaufsliste, oft gleichzeitig im Laden. Ohne Aktualisierung kaufen zwei Personen dasselbe. Supabase Realtime scheidet aus: Es bräuchte den Anon-Key im Browser und Row-Level-Security, beides gibt es in diesem Projekt nicht (siehe ADR 0002).

## Entscheidung

- **Kanal:** `WS /api/shopping/{household_id}/ws`. Der Client sendet als erste Nachricht `{"token": "<JWT>"}`. Das Token steht nicht in der URL, weil URLs in Logs landen. Der Server prüft Token und Haushaltsmitgliedschaft innerhalb von 5 Sekunden, sonst schließt er die Verbindung (Code 4401 Token ungültig, 4403 kein Mitglied, 4408 Zeitüberschreitung).
- **Nur ein Hinweis, keine Daten:** Nach jedem Schreibvorgang (anlegen, ändern, löschen, Einkauf abschließen) sendet der Server `{"type": "changed"}` an alle Clients dieses Haushalts. Die Clients laden die Liste über die normale, geschützte API neu. Über den Kanal können dadurch nie Artikeldaten abfließen, die Rechteprüfung bleibt an einer Stelle.
- **Nur bei echter Änderung:** Fehlgeschlagene Anfragen (404, 409) und leere Änderungen senden nichts.
- **Client:** Hook `useLiveUpdates` mit Wiederverbindung (Abstand 1 s, verdoppelt bis 15 s), Neuladen bei jedem Verbinden, beim Sichtbarwerden des Tabs und beim Zurückkehren des Netzes, Keepalive per `ping`. Statusanzeige „Live“, „Verbindet …“, „Getrennt“. Bei „Getrennt“ bleibt die Seite voll benutzbar.

## Konsequenzen

- **Grenze:** Die Verbindungen leben im Speicher eines Prozesses (`app/services/realtime.py`). Läuft die API in mehreren Prozessen oder Instanzen, sieht jede nur ihre eigenen Verbindungen. Für Skalierung wäre ein gemeinsamer Kanal nötig, zum Beispiel Redis Pub/Sub oder Supabase Realtime.
- Der Hub meldet nur Änderungen, die über diese API laufen. Wer die Tabelle direkt in der Datenbank ändert, löst keine Meldung aus.
- Getestet mit dem WebSocket-Testclient (`backend/tests/test_shopping_realtime.py`): Meldung unter 1 Sekunde, anderer Haushalt bleibt still, ungültiges Token, Nicht-Mitglied und Zeitüberschreitung werden abgewiesen.
