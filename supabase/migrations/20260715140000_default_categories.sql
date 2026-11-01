-- Seed a set of general default categories for every user so new accounts
-- aren't greeted by empty category lists. A SECURITY DEFINER trigger on
-- auth.users creates them on registration, and a one-time backfill adds any
-- missing defaults to existing users (skipping names they already have, so no
-- duplicates).

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, name)
  select new.id, name
  from (values
    ('Housing'), ('Groceries'), ('Transportation'), ('Dining'),
    ('Utilities'), ('Health'), ('Entertainment'), ('Shopping'),
    ('Savings'), ('Other')
  ) as defaults(name);

  insert into public.income_categories (user_id, name)
  select new.id, name
  from (values
    ('Salary'), ('Self-Employment'), ('Investments'),
    ('Benefits'), ('Gifts'), ('Other')
  ) as defaults(name);

  return new;
end;
$$;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_default_categories();

-- Backfill existing users (case-insensitive skip of names they already have).
insert into public.categories (user_id, name)
select u.id, d.name
from auth.users u
cross join (values
  ('Housing'), ('Groceries'), ('Transportation'), ('Dining'),
  ('Utilities'), ('Health'), ('Entertainment'), ('Shopping'),
  ('Savings'), ('Other')
) as d(name)
where not exists (
  select 1
  from public.categories c
  where c.user_id = u.id and lower(c.name) = lower(d.name)
);

insert into public.income_categories (user_id, name)
select u.id, d.name
from auth.users u
cross join (values
  ('Salary'), ('Self-Employment'), ('Investments'),
  ('Benefits'), ('Gifts'), ('Other')
) as d(name)
where not exists (
  select 1
  from public.income_categories c
  where c.user_id = u.id and lower(c.name) = lower(d.name)
);
