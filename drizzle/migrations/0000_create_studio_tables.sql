create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  sparks integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  kind text not null check (kind in ('Story','Script','Character')),
  genre text not null default '',
  content text not null,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  archetype text not null default '',
  appearance text not null default '',
  style text not null default '',
  details jsonb not null default '{}',
  image_path text,
  created_at timestamptz not null default now()
);

create table public.adventure_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  archetype text not null default '',
  difficulty text not null default '',
  state jsonb not null default '{}',
  finished boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, update, delete on public.entries to authenticated;
grant all on public.entries to service_role;
grant select, insert, update, delete on public.characters to authenticated;
grant all on public.characters to service_role;
grant select, insert, update, delete on public.adventure_sessions to authenticated;
grant all on public.adventure_sessions to service_role;

alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.characters enable row level security;
alter table public.adventure_sessions enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "entries_select_own" on public.entries for select to authenticated using (user_id = auth.uid());
create policy "entries_insert_own" on public.entries for insert to authenticated with check (user_id = auth.uid());
create policy "entries_update_own" on public.entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "entries_delete_own" on public.entries for delete to authenticated using (user_id = auth.uid());
create policy "characters_select_own" on public.characters for select to authenticated using (user_id = auth.uid());
create policy "characters_insert_own" on public.characters for insert to authenticated with check (user_id = auth.uid());
create policy "characters_delete_own" on public.characters for delete to authenticated using (user_id = auth.uid());
create policy "adventure_select_own" on public.adventure_sessions for select to authenticated using (user_id = auth.uid());
create policy "adventure_insert_own" on public.adventure_sessions for insert to authenticated with check (user_id = auth.uid());
create policy "adventure_update_own" on public.adventure_sessions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "adventure_delete_own" on public.adventure_sessions for delete to authenticated using (user_id = auth.uid());

create or replace function public.award_sparks(amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_total integer;
begin
  if amount is null or amount <= 0 then
    return coalesce((select sparks from public.profiles where id = auth.uid()), 0);
  end if;
  update public.profiles
  set sparks = sparks + amount
  where id = auth.uid()
  returning sparks into new_total;
  return coalesce(new_total, 0);
end;
$$;

grant execute on function public.award_sparks(integer) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'creator'), '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
