-- Migration: Add talk_modes support to public.questions
alter table public.questions
  add column if not exists talk_modes text[] not null default '{"deep"}';

-- Create Index for fast querying on array contents
create index if not exists questions_talk_modes_idx
  on public.questions using gin (talk_modes);
