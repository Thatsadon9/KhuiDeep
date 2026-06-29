-- Anonymous usage analytics for admin dashboard (page views, play events, card stats)

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  occurred_at timestamptz not null default now(),
  session_id text,
  talk_mode text,
  category_slug text,
  question_id uuid references public.questions (id) on delete set null,
  depth smallint,
  audience text,
  room_id text,
  page_path text,
  metadata jsonb not null default '{}'::jsonb,
  constraint analytics_events_type_check check (
    event_type in (
      'page_view',
      'play_start',
      'card_draw',
      'card_open',
      'deck_reset',
      'room_create'
    )
  )
);

create index if not exists analytics_events_type_time_idx
  on public.analytics_events (event_type, occurred_at desc);

create index if not exists analytics_events_session_idx
  on public.analytics_events (session_id, occurred_at desc);

create index if not exists analytics_events_category_idx
  on public.analytics_events (category_slug, occurred_at desc);

create index if not exists analytics_events_question_idx
  on public.analytics_events (question_id)
  where question_id is not null;

alter table public.analytics_events enable row level security;

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
