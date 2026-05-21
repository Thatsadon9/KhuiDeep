create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  accent text not null default '#f7e7a7',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  question text not null,
  helper_text text,
  level smallint not null default 1,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_level_range check (level between 1 and 5),
  constraint questions_question_not_blank check (length(trim(question)) > 0)
);

create index if not exists categories_active_sort_idx
  on public.categories (is_active, sort_order);

create index if not exists questions_active_category_level_idx
  on public.questions (is_active, category_id, level);

create index if not exists questions_tags_idx
  on public.questions using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_questions_updated_at on public.questions;
create trigger set_questions_updated_at
before update on public.questions
for each row
execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.questions enable row level security;

drop policy if exists "read active categories" on public.categories;
create policy "read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "read active questions" on public.questions;
create policy "read active questions"
on public.questions
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.categories
    where categories.id = questions.category_id
      and categories.is_active = true
  )
);
