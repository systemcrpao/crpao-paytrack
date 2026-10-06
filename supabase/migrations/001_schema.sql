-- crpao-paytrack — โครงสร้างตาราง (เทียบชีต Data + User)
-- รันใน Supabase Dashboard → SQL Editor (หรือ supabase db push)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  name text not null default '',
  role text not null default 'User',
  created_at timestamptz not null default now(),
  constraint profiles_username_unique unique (username)
);

create table if not exists public.dika (
  id text primary key,
  dika_no text not null default '',
  date text not null default '',
  subject text not null default '',
  amount numeric,
  payee text not null default '',
  department text not null default '',
  assignee text not null default '',
  status text not null default 'ส่งต่อเจ้าหน้าที่',
  created_at_display text not null default '',
  finishtime text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists dika_status_idx on public.dika (status);
create index if not exists dika_assignee_idx on public.dika (assignee);

alter table public.profiles enable row level security;
alter table public.dika enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "dika_select_authenticated"
  on public.dika for select
  to authenticated
  using (true);

create policy "dika_insert_authenticated"
  on public.dika for insert
  to authenticated
  with check (true);

create policy "dika_update_authenticated"
  on public.dika for update
  to authenticated
  using (true)
  with check (true);
