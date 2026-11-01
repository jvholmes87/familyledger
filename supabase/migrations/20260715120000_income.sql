-- Income feature: recurring/one-off income sources and their categories.
--
-- Mirrors the categories/expenses shape (owner-scoped via user_id defaulting to
-- auth.uid(), RLS enabled from creation). Income is modeled as "series" — a
-- named amount with a start date, an optional end date, and a compact
-- recurrence spec (frequency kind + interval + days_of_month). A one-off income
-- is simply a series with frequency 'one_time'. The application expands each
-- series into real calendar occurrences; nothing here generates rows per pay
-- date.

-- Income categories -------------------------------------------------------

create table public.income_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create index income_categories_user_id_idx on public.income_categories (user_id);

alter table public.income_categories enable row level security;

create policy "income categories are selectable by owner"
  on public.income_categories for select
  using (auth.uid() = user_id);

create policy "income categories are insertable by owner"
  on public.income_categories for insert
  with check (auth.uid() = user_id);

create policy "income categories are updatable by owner"
  on public.income_categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "income categories are deletable by owner"
  on public.income_categories for delete
  using (auth.uid() = user_id);

-- Income series -----------------------------------------------------------

create table public.income_series (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id    uuid references public.income_categories (id) on delete set null,
  name           text not null check (char_length(name) between 1 and 120),
  amount         numeric(12, 2) not null check (amount >= 0),
  -- Engine cadence. The eleven UI presets collapse onto these six kinds.
  frequency      text not null check (frequency in (
                   'one_time', 'every_n_days', 'every_n_weeks',
                   'every_n_months', 'every_n_years', 'days_of_month'
                 )),
  -- The "X" in every-X-days/weeks/months/years (1 for the simple cadences).
  interval_count integer not null default 1 check (interval_count >= 1),
  -- Days hit for the days_of_month cadence; 0 is the sentinel for "Last day".
  days_of_month  integer[] not null default '{}',
  start_date     date not null,
  end_date       date,
  created_at     timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index income_series_user_id_start_idx on public.income_series (user_id, start_date);
create index income_series_category_id_idx on public.income_series (category_id);

alter table public.income_series enable row level security;

create policy "income series are selectable by owner"
  on public.income_series for select
  using (auth.uid() = user_id);

create policy "income series are insertable by owner"
  on public.income_series for insert
  with check (auth.uid() = user_id);

create policy "income series are updatable by owner"
  on public.income_series for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "income series are deletable by owner"
  on public.income_series for delete
  using (auth.uid() = user_id);
