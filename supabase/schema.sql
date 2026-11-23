-- 75-Day War Room — cloud sync schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).

create table if not exists public.war_room_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  device_label text
);

-- Row Level Security: a user can only ever touch their own row.
alter table public.war_room_states enable row level security;

drop policy if exists "own state read" on public.war_room_states;
drop policy if exists "own state insert" on public.war_room_states;
drop policy if exists "own state update" on public.war_room_states;
drop policy if exists "own state delete" on public.war_room_states;

create policy "own state read" on public.war_room_states
  for select using (auth.uid() = user_id);

create policy "own state insert" on public.war_room_states
  for insert with check (auth.uid() = user_id);

create policy "own state update" on public.war_room_states
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own state delete" on public.war_room_states
  for delete using (auth.uid() = user_id);

-- Keeping `data` small and fast to diff.
alter table public.war_room_states
  alter column data set storage plain;
