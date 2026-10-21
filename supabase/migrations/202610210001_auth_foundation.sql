-- First migration only: identity and role authorization.
-- Team, requests, booking transactions, and storage policies follow separately.
begin;

create type public.user_role as enum ('participant', 'mentor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null default 'Peserta ADIKARA',
  avatar_url text,
  role public.user_role not null default 'participant',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Remove default broad Supabase grants before exposing the table.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;

create policy "Read own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Update own presentation fields"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Role is deliberately independent of user-editable OAuth metadata.
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Peserta ADIKARA'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill accounts created before applying this migration.
insert into public.profiles (id, full_name, avatar_url)
select id,
  coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), 'Peserta ADIKARA'),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

commit;
