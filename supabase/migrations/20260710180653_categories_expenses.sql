-- Phase II schema: categories and expenses.
--
-- Each row is owned by a Supabase Auth user via user_id, which defaults to the
-- caller's auth.uid() so authenticated inserts don't need to pass it. Row-Level
-- Security is enabled on both tables from creation, and every policy is scoped
-- to auth.uid() = user_id so a user can only ever touch their own data (FR5).

-- Categories --------------------------------------------------------------

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create index categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "categories are selectable by owner"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "categories are insertable by owner"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "categories are updatable by owner"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories are deletable by owner"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Expenses ----------------------------------------------------------------

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  amount       numeric(12, 2) not null check (amount >= 0),
  expense_date date not null,
  description  text,
  created_at   timestamptz not null default now()
);

create index expenses_user_id_date_idx on public.expenses (user_id, expense_date desc);
create index expenses_category_id_idx on public.expenses (category_id);

alter table public.expenses enable row level security;

create policy "expenses are selectable by owner"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "expenses are insertable by owner"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "expenses are updatable by owner"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "expenses are deletable by owner"
  on public.expenses for delete
  using (auth.uid() = user_id);
