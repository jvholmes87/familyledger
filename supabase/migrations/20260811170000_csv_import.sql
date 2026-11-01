-- Atomic, owner-scoped round-trip import for SpendWise's unified CSV schema.
-- The route validates the complete file before this function is called. PostgreSQL
-- executes the whole function in one transaction, so any failed insert rolls back
-- categories and records together.

create or replace function public.import_spendwise_data(p_import jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_category_id uuid;
  v_expense_category_ids jsonb := '{}'::jsonb;
  v_income_category_ids jsonb := '{}'::jsonb;
  v_expense_categories integer := 0;
  v_income_categories integer := 0;
  v_expenses integer := 0;
  v_income_sources integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Serialize imports for one owner so simultaneous imports cannot create the
  -- same normalized category twice.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 812739)
  );

  for v_item in
    select value from pg_catalog.jsonb_array_elements(
      coalesce(p_import -> 'expenseCategories', '[]'::jsonb)
    )
  loop
    v_category_id := null;
    select category.id
      into v_category_id
      from public.categories as category
     where category.user_id = v_user_id
       and pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(category.name), '\s+', ' ', 'g')) =
           pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(v_item ->> 'name'), '\s+', ' ', 'g'))
     order by category.id
     limit 1;

    if v_category_id is null then
      insert into public.categories (user_id, name, created_at)
      values (
        v_user_id,
        v_item ->> 'name',
        (v_item ->> 'createdAt')::timestamptz
      )
      returning id into v_category_id;
      v_expense_categories := v_expense_categories + 1;
    end if;

    v_expense_category_ids := v_expense_category_ids ||
      pg_catalog.jsonb_build_object(v_item ->> 'externalId', v_category_id::text);
  end loop;

  for v_item in
    select value from pg_catalog.jsonb_array_elements(
      coalesce(p_import -> 'incomeCategories', '[]'::jsonb)
    )
  loop
    v_category_id := null;
    select category.id
      into v_category_id
      from public.income_categories as category
     where category.user_id = v_user_id
       and pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(category.name), '\s+', ' ', 'g')) =
           pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(v_item ->> 'name'), '\s+', ' ', 'g'))
     order by category.id
     limit 1;

    if v_category_id is null then
      insert into public.income_categories (user_id, name, created_at)
      values (
        v_user_id,
        v_item ->> 'name',
        (v_item ->> 'createdAt')::timestamptz
      )
      returning id into v_category_id;
      v_income_categories := v_income_categories + 1;
    end if;

    v_income_category_ids := v_income_category_ids ||
      pg_catalog.jsonb_build_object(v_item ->> 'externalId', v_category_id::text);
  end loop;

  for v_item in
    select value from pg_catalog.jsonb_array_elements(
      coalesce(p_import -> 'expenses', '[]'::jsonb)
    )
  loop
    insert into public.expenses (
      user_id,
      category_id,
      amount,
      expense_date,
      description,
      created_at
    )
    values (
      v_user_id,
      case
        when v_item ->> 'categoryExternalId' is null then null
        else (v_expense_category_ids ->> (v_item ->> 'categoryExternalId'))::uuid
      end,
      (v_item ->> 'amount')::numeric,
      (v_item ->> 'expenseDate')::date,
      v_item ->> 'description',
      (v_item ->> 'createdAt')::timestamptz
    );
    v_expenses := v_expenses + 1;
  end loop;

  for v_item in
    select value from pg_catalog.jsonb_array_elements(
      coalesce(p_import -> 'incomeSources', '[]'::jsonb)
    )
  loop
    insert into public.income_series (
      user_id,
      category_id,
      name,
      amount,
      frequency,
      interval_count,
      days_of_month,
      start_date,
      end_date,
      created_at
    )
    values (
      v_user_id,
      case
        when v_item ->> 'categoryExternalId' is null then null
        else (v_income_category_ids ->> (v_item ->> 'categoryExternalId'))::uuid
      end,
      v_item ->> 'name',
      (v_item ->> 'amount')::numeric,
      v_item ->> 'frequency',
      (v_item ->> 'intervalCount')::integer,
      array(
        select value::integer
          from pg_catalog.jsonb_array_elements_text(v_item -> 'daysOfMonth')
      ),
      (v_item ->> 'startDate')::date,
      (v_item ->> 'endDate')::date,
      (v_item ->> 'createdAt')::timestamptz
    );
    v_income_sources := v_income_sources + 1;
  end loop;

  return pg_catalog.jsonb_build_object(
    'expenses', v_expenses,
    'income_sources', v_income_sources,
    'expense_categories', v_expense_categories,
    'income_categories', v_income_categories
  );
end;
$$;

revoke all on function public.import_spendwise_data(jsonb) from public;
revoke all on function public.import_spendwise_data(jsonb) from anon;
grant execute on function public.import_spendwise_data(jsonb) to authenticated;
