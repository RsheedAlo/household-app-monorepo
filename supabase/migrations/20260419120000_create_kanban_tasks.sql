create table if not exists public.kanban_tasks (
    id uuid primary key default gen_random_uuid(),
    household_id uuid not null references public.households(id) on delete cascade,
    title text not null,
    description text default '',
    status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
    position integer not null default 0,
    created_by uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now()
);

create index if not exists idx_kanban_tasks_household_id on public.kanban_tasks(household_id);
create index if not exists idx_kanban_tasks_status on public.kanban_tasks(status);