-- Ensure roles can write/read analytics_events (fixes silent RLS/grant failures on some projects)

grant usage on schema public to anon, authenticated;
grant insert on table public.analytics_events to anon, authenticated;
grant select on table public.analytics_events to authenticated;

drop policy if exists "public insert analytics events" on public.analytics_events;
create policy "public insert analytics events"
on public.analytics_events
for insert
to anon, authenticated
with check (
  event_type in (
    'page_view',
    'play_start',
    'card_draw',
    'card_open',
    'deck_reset',
    'room_create'
  )
);

drop policy if exists "admin read analytics events" on public.analytics_events;
create policy "admin read analytics events"
on public.analytics_events
for select
to authenticated
using (public.is_admin());
