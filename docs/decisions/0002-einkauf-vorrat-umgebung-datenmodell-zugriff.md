# ADR 0002: Einkauf/Vorrat – lokale Umgebung, Datenmodell und Zugriffsschutz

## Status

Accepted (04.10.2026)

## Kontext

Das Modul Einkauf/Vorrat wird nachgeliefert. Das bisherige Supabase-Cloud-Projekt ist pausiert und für das Team nicht erreichbar. Kanban und Haushalte übergeben die `user_id` als URL-Parameter, der Kalender prüft nur beim Anlegen die Haushaltsmitgliedschaft. Keine Tabelle nutzt Row-Level-Security.

## Entscheidung

- **Umgebung:** Entwicklung und Demo laufen gegen ein lokales Supabase in Docker (`npx supabase start`). Die Migrationen unter `supabase/migrations/` sind die einzige Quelle für das Schema.
- **Datenmodell:** Eine Tabelle `shopping_items` mit `status` (`planned`, `bought`, `in_stock`, `used_up`) und den Zeitstempeln `bought_at` und `used_up_at`. Einkaufsliste und Vorrat sind zwei Sichten auf dieselben Zeilen. Es gibt keine eigene Verlaufstabelle.
- **Zugriff:** Jeder Endpunkt unter `/api/shopping` verlangt ein gültiges Supabase-JWT (`get_current_user`) und prüft die Haushaltsmitgliedschaft (`app/core/access.py`). Die Benutzer-ID kommt nie vom Client. Fremde Artikel liefern 404 statt 403, damit keine Artikel-IDs erraten werden können.
- **Keine RLS:** Wie bei Kanban und Kalender nutzt das Backend den Anon-Key. Row-Level-Security würde diesen Zugriff blockieren und eine Umstellung auf den Service-Role-Key erfordern.

## Konsequenzen

- Die Tests laufen ohne Netzwerk gegen einen In-Memory-Ersatz des Supabase-Clients (`backend/tests/fake_supabase.py`).
- Bekanntes Risiko: Wer den Anon-Key kennt, kann die Tabelle direkt über die Supabase-API lesen und ändern. Solange der Key nur im Backend liegt, ist das Risiko begrenzt. Ein Absichern mit RLS wäre ein eigenes Thema.
- Die neue Migration muss in jedem gehosteten Supabase-Projekt eingespielt werden (`supabase db push`).
