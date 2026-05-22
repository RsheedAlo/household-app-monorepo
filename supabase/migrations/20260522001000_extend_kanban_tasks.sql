alter table public.kanban_tasks
add column if not exists priority text not null default 'medium';

alter table public.kanban_tasks
add column if not exists due_date timestamptz;

alter table public.kanban_tasks
add column if not exists label text;

alter table public.kanban_tasks
add column if not exists assigned_to uuid references public.profiles(id) on delete set null;