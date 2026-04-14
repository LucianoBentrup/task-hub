create table if not exists public.events (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  date date,
  starttime text,
  endtime text,
  location text,
  organizer text,
  description text,
  inserted_at timestamptz default now()
);

create index if not exists events_user_id_idx on public.events(user_id);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  password text,
  provider text default 'email',
  provider_id text,
  avatar_url text,
  inserted_at timestamptz default now()
);

alter table public.events enable row level security;
alter table public.users enable row level security;

drop policy if exists "Users can read own events" on public.events;
create policy "Users can read own events"
on public.events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own events" on public.events;
create policy "Users can insert own events"
on public.events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own events" on public.events;
create policy "Users can update own events"
on public.events
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own events" on public.events;
create policy "Users can delete own events"
on public.events
for delete
to authenticated
using (auth.uid() = user_id);

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