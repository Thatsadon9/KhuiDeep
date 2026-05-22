-- Enable full CRUD access on categories for anonymous and authenticated users
drop policy if exists "allow insert for anon and authenticated" on public.categories;
create policy "allow insert for anon and authenticated"
on public.categories for insert
to anon, authenticated
with check (true);

drop policy if exists "allow update for anon and authenticated" on public.categories;
create policy "allow update for anon and authenticated"
on public.categories for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "allow delete for anon and authenticated" on public.categories;
create policy "allow delete for anon and authenticated"
on public.categories for delete
to anon, authenticated
using (true);

-- Enable full CRUD access on questions for anonymous and authenticated users
drop policy if exists "allow insert for anon and authenticated" on public.questions;
create policy "allow insert for anon and authenticated"
on public.questions for insert
to anon, authenticated
with check (true);

drop policy if exists "allow update for anon and authenticated" on public.questions;
create policy "allow update for anon and authenticated"
on public.questions for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "allow delete for anon and authenticated" on public.questions;
create policy "allow delete for anon and authenticated"
on public.questions for delete
to anon, authenticated
using (true);
