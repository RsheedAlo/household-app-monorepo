-- Einkauf/Vorrat: gemeinsame Einkaufsliste und Vorrat pro Haushalt.
--
-- Status eines Artikels:
--   planned  = steht auf der Einkaufsliste
--   bought   = abgehakt (im Einkaufswagen)
--   in_stock = im Vorrat
--   used_up  = aufgebraucht
--
-- Es gibt bewusst keine Row-Level-Security. Der Zugriff wird wie bei kanban_tasks
-- und calendar_events im Backend geprueft (JWT + Haushaltsmitgliedschaft).
create table if not exists public.shopping_items (
    id uuid primary key default gen_random_uuid(),
    household_id uuid not null references public.households(id) on delete cascade,
    name text not null check (char_length(name) between 1 and 120),
    quantity numeric(10, 2) not null default 1 check (quantity > 0),
    unit text check (unit is null or char_length(unit) between 1 and 20),
    status text not null default 'planned'
        check (status in ('planned', 'bought', 'in_stock', 'used_up')),
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    bought_at timestamptz,
    used_up_at timestamptz
);

create index if not exists idx_shopping_items_household_status
    on public.shopping_items(household_id, status);
