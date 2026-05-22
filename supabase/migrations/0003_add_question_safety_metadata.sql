alter table public.questions
  add column if not exists audience text[] not null default '{}',
  add column if not exists sensitivity text[] not null default '{}',
  add column if not exists requires_consent boolean not null default false,
  add column if not exists default_pool boolean not null default true,
  add column if not exists content_note text,
  add column if not exists aftercare_level smallint not null default 0;

alter table public.questions
  drop constraint if exists questions_aftercare_level_range;

alter table public.questions
  add constraint questions_aftercare_level_range check (aftercare_level between 0 and 3);

create index if not exists questions_audience_idx
  on public.questions using gin (audience);

create index if not exists questions_sensitivity_idx
  on public.questions using gin (sensitivity);

create index if not exists questions_default_pool_idx
  on public.questions (default_pool);
