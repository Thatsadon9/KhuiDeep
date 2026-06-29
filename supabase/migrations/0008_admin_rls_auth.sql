-- Lock down admin writes: only authenticated users listed in admin_users may CRUD.
-- Public (anon) users retain read-only access to active categories/questions.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admins read own profile" on public.admin_users;
create policy "admins read own profile"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Remove permissive open-write policies from migration 0002
drop policy if exists "allow insert for anon and authenticated" on public.categories;
drop policy if exists "allow update for anon and authenticated" on public.categories;
drop policy if exists "allow delete for anon and authenticated" on public.categories;
drop policy if exists "allow insert for anon and authenticated" on public.questions;
drop policy if exists "allow update for anon and authenticated" on public.questions;
drop policy if exists "allow delete for anon and authenticated" on public.questions;

-- Admin: read all rows (including inactive drafts)
drop policy if exists "admin read all categories" on public.categories;
create policy "admin read all categories"
on public.categories
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin read all questions" on public.questions;
create policy "admin read all questions"
on public.questions
for select
to authenticated
using (public.is_admin());

-- Admin: write categories
drop policy if exists "admin insert categories" on public.categories;
create policy "admin insert categories"
on public.categories
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin update categories" on public.categories;
create policy "admin update categories"
on public.categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin delete categories" on public.categories;
create policy "admin delete categories"
on public.categories
for delete
to authenticated
using (public.is_admin());

-- Admin: write questions
drop policy if exists "admin insert questions" on public.questions;
create policy "admin insert questions"
on public.questions
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin update questions" on public.questions;
create policy "admin update questions"
on public.questions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin delete questions" on public.questions;
create policy "admin delete questions"
on public.questions
for delete
to authenticated
using (public.is_admin());

-- Bootstrap first admin (run manually after creating a Supabase Auth user):
-- insert into public.admin_users (user_id, email, display_name)
-- values ('<auth.users.id>', 'you@example.com', 'Admin');
