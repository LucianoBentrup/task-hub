drop table if exists public.users;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  password text,
  provider text default 'email',
  provider_id text,
  avatar_url text,
  inserted_at timestamptz default now()
);

alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);