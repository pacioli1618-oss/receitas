-- Receitas da Família: schema, tables and RPCs.
--
-- Lives in the SideKick Supabase project (shared with QuemLeva, O Que Falta and AmigoSecreto),
-- in its own schema. The schema is not exposed through the Data API: every read and write goes
-- through the public.rc_* functions below.
--
-- Access without accounts (docs/conventions.md): the book link (/c/<slug>) is the key. Anyone
-- who has it can read, add, edit and move recipes to the trash, like a notebook left on the
-- kitchen table. The trash keeps deleted recipes for 30 days so a mistake can be undone.

create schema if not exists receitas;
revoke all on schema receitas from public, anon, authenticated;

------------------------------------------------------------------------
-- 1. Tables
------------------------------------------------------------------------
create table receitas.books (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null check (length(trim(title)) between 1 and 80),
  locale     text not null default 'pt-BR' check (locale in ('pt-BR', 'es', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table receitas.recipes (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references receitas.books(id) on delete cascade,
  title       text not null check (length(trim(title)) between 1 and 120),
  author      text check (length(author) <= 60),
  category    text not null default 'other'
              check (category in ('sweets', 'savory', 'party', 'drinks', 'other')),
  ingredients text not null default '' check (length(ingredients) <= 5000),
  steps       text not null default '' check (length(steps) <= 10000),
  tip         text check (length(tip) <= 1000),
  device_id   uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index recipes_book_id_idx on receitas.recipes (book_id);

-- Anti-spam for rc_create_book, same rules as AmigoSecreto's as_create_group.
create table receitas.secrets (
  name  text primary key,
  value text not null
);
insert into receitas.secrets (name, value)
values ('ip_salt', encode(extensions.gen_random_bytes(32), 'hex'));

create table receitas.create_book_log (
  id         bigint generated always as identity primary key,
  device_id  uuid,
  ip_hash    text,
  created_at timestamptz not null default now()
);
create index create_book_log_device_id_idx on receitas.create_book_log (device_id, created_at desc) where device_id is not null;
create index create_book_log_ip_hash_idx on receitas.create_book_log (ip_hash, created_at desc) where ip_hash is not null;
create index create_book_log_created_at_idx on receitas.create_book_log (created_at);

-- RLS on and no policies: no direct access for anon/authenticated.
alter table receitas.books           enable row level security;
alter table receitas.recipes         enable row level security;
alter table receitas.secrets         enable row level security;
alter table receitas.create_book_log enable row level security;
revoke all on all tables in schema receitas from public, anon, authenticated;

------------------------------------------------------------------------
-- 2. Internal helpers (schema receitas, not callable by clients)
------------------------------------------------------------------------
create function receitas.random_text(n int)
returns text language sql volatile set search_path = '' as $$
  -- Alphabet without look-alikes (0/o, 1/l/i) so links survive being read aloud.
  select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', (get_byte(b, i) % 31) + 1, 1), '' order by i)
  from (select extensions.gen_random_bytes(n) as b) x, generate_series(0, n - 1) as i
$$;

create function receitas.require_book(p_slug text)
returns receitas.books language plpgsql stable set search_path = '' as $$
declare b receitas.books;
begin
  select * into b from receitas.books where slug = p_slug;
  if not found then
    raise exception 'book_not_found' using errcode = 'P0002';
  end if;
  return b;
end $$;

create function receitas.require_recipe(p_book_id uuid, p_recipe_id uuid, p_is_deleted boolean)
returns receitas.recipes language plpgsql stable set search_path = '' as $$
declare r receitas.recipes;
begin
  select * into r from receitas.recipes
  where id = p_recipe_id and book_id = p_book_id
    and (deleted_at is not null) = p_is_deleted;
  if not found then
    raise exception 'recipe_not_found' using errcode = 'P0002';
  end if;
  return r;
end $$;

-- Recipes in the trash for more than 30 days are gone for good.
create function receitas.purge_trash(p_book_id uuid)
returns void language sql volatile set search_path = '' as $$
  delete from receitas.recipes
  where book_id = p_book_id and deleted_at < now() - interval '30 days'
$$;

create function receitas.clean_text(p_value text)
returns text language sql immutable set search_path = '' as $$
  select nullif(trim(coalesce(p_value, '')), '')
$$;

create function receitas.check_category(p_category text)
returns text language sql immutable set search_path = '' as $$
  select case when p_category in ('sweets', 'savory', 'party', 'drinks', 'other') then p_category else 'other' end
$$;

create function receitas.request_ip_hash()
returns text language sql stable set search_path = '' as $$
  with h as (select nullif(current_setting('request.headers', true), '')::json as headers),
       ip as (
         select nullif(trim(coalesce(
                  headers->>'cf-connecting-ip',
                  split_part(headers->>'x-forwarded-for', ',', 1))), '') as value
         from h)
  select case when ip.value is null then null
              else encode(extensions.digest((select value from receitas.secrets where name = 'ip_salt') || ip.value, 'sha256'), 'hex')
         end
  from ip
$$;

-- Limits (generous: mobile carriers put many people behind one IP):
--   per device 10/hour, 30/day; per IP 30/hour, 100/day. Over → 'rate_limited' (DETAIL hour|day).
create function receitas.check_create_book_rate(p_device_id uuid)
returns void language plpgsql volatile set search_path = '' as $$
declare
  v_ip_hash text := receitas.request_ip_hash();
begin
  if p_device_id is not null then perform pg_advisory_xact_lock(hashtext('rc_create:' || p_device_id::text)); end if;
  if v_ip_hash   is not null then perform pg_advisory_xact_lock(hashtext('rc_create:' || v_ip_hash)); end if;

  delete from receitas.create_book_log where created_at < now() - interval '1 day';

  if p_device_id is not null then
    if (select count(*) from receitas.create_book_log
        where device_id = p_device_id and created_at > now() - interval '1 hour') >= 10 then
      raise exception 'rate_limited' using detail = 'hour';
    end if;
    if (select count(*) from receitas.create_book_log where device_id = p_device_id) >= 30 then
      raise exception 'rate_limited' using detail = 'day';
    end if;
  end if;

  if v_ip_hash is not null then
    if (select count(*) from receitas.create_book_log
        where ip_hash = v_ip_hash and created_at > now() - interval '1 hour') >= 30 then
      raise exception 'rate_limited' using detail = 'hour';
    end if;
    if (select count(*) from receitas.create_book_log where ip_hash = v_ip_hash) >= 100 then
      raise exception 'rate_limited' using detail = 'day';
    end if;
  end if;

  insert into receitas.create_book_log (device_id, ip_hash) values (p_device_id, v_ip_hash);
end $$;

create function receitas.recipe_json(p_recipe receitas.recipes, p_with_details boolean)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', p_recipe.id,
    'title', p_recipe.title,
    'author', p_recipe.author,
    'category', p_recipe.category,
    'updated_at', p_recipe.updated_at)
  || case when p_with_details then jsonb_build_object(
    'ingredients', p_recipe.ingredients,
    'steps', p_recipe.steps,
    'tip', p_recipe.tip,
    'created_at', p_recipe.created_at)
  else '{}'::jsonb end
$$;

-- Validates and writes one recipe (insert when p_recipe_id is null).
create function receitas.save_recipe(
  p_book_id     uuid,
  p_recipe_id   uuid,
  p_title       text,
  p_author      text,
  p_category    text,
  p_ingredients text,
  p_steps       text,
  p_tip         text,
  p_device_id   uuid
) returns uuid language plpgsql volatile set search_path = '' as $$
declare
  v_title text := receitas.clean_text(p_title);
  v_id    uuid := p_recipe_id;
begin
  if v_title is null then
    raise exception 'recipe_title_required' using errcode = '22023';
  end if;
  if length(v_title) > 120 or length(coalesce(p_author, '')) > 60
     or length(coalesce(p_ingredients, '')) > 5000 or length(coalesce(p_steps, '')) > 10000
     or length(coalesce(p_tip, '')) > 1000 then
    raise exception 'recipe_too_long' using errcode = '22001';
  end if;

  if v_id is null then
    if (select count(*) from receitas.recipes where book_id = p_book_id) >= 500 then
      raise exception 'book_full' using errcode = 'P0001';
    end if;
    insert into receitas.recipes (book_id, title, author, category, ingredients, steps, tip, device_id)
    values (p_book_id, v_title, receitas.clean_text(p_author), receitas.check_category(p_category),
            coalesce(trim(p_ingredients), ''), coalesce(trim(p_steps), ''), receitas.clean_text(p_tip), p_device_id)
    returning id into v_id;
  else
    update receitas.recipes
    set title = v_title,
        author = receitas.clean_text(p_author),
        category = receitas.check_category(p_category),
        ingredients = coalesce(trim(p_ingredients), ''),
        steps = coalesce(trim(p_steps), ''),
        tip = receitas.clean_text(p_tip),
        updated_at = now()
    where id = v_id and book_id = p_book_id and deleted_at is null;
    if not found then
      raise exception 'recipe_not_found' using errcode = 'P0002';
    end if;
  end if;

  update receitas.books set updated_at = now() where id = p_book_id;
  return v_id;
end $$;

revoke execute on all functions in schema receitas from public, anon, authenticated;

------------------------------------------------------------------------
-- 3. Public RPCs — anyone with the book link
------------------------------------------------------------------------

create function public.rc_create_book(
  p_title     text,
  p_locale    text default 'pt-BR',
  p_device_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_title text := receitas.clean_text(p_title);
  v_slug  text;
begin
  if v_title is null then
    raise exception 'book_title_required' using errcode = '22023';
  end if;
  perform receitas.check_create_book_rate(p_device_id);

  loop
    v_slug := receitas.random_text(12);
    exit when not exists (select 1 from receitas.books where slug = v_slug);
  end loop;

  insert into receitas.books (slug, title, locale)
  values (v_slug, left(v_title, 80),
          case when p_locale in ('pt-BR', 'es', 'en') then p_locale else 'pt-BR' end);

  return jsonb_build_object('slug', v_slug);
end $$;

-- The book and its recipes. Summaries by default; with p_with_details, every recipe in full
-- (for printing the whole book).
create function public.rc_get_book(p_slug text, p_with_details boolean default false)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
begin
  return jsonb_build_object(
    'slug', b.slug,
    'title', b.title,
    'locale', b.locale,
    'recipes', coalesce((
      select jsonb_agg(receitas.recipe_json(r, coalesce(p_with_details, false))
                       order by lower(r.title), r.created_at)
      from receitas.recipes r
      where r.book_id = b.id and r.deleted_at is null), '[]'::jsonb),
    'trash_count', (
      select count(*) from receitas.recipes r
      where r.book_id = b.id and r.deleted_at > now() - interval '30 days'));
end $$;

create function public.rc_update_book(p_slug text, p_title text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
  v_title text := receitas.clean_text(p_title);
begin
  if v_title is null then
    raise exception 'book_title_required' using errcode = '22023';
  end if;
  update receitas.books set title = left(v_title, 80), updated_at = now() where id = b.id;
end $$;

create function public.rc_get_recipe(p_slug text, p_recipe_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
begin
  return receitas.recipe_json(receitas.require_recipe(b.id, p_recipe_id, false), true)
         || jsonb_build_object('book_title', b.title);
end $$;

create function public.rc_create_recipe(
  p_slug        text,
  p_title       text,
  p_author      text default null,
  p_category    text default 'other',
  p_ingredients text default '',
  p_steps       text default '',
  p_tip         text default null,
  p_device_id   uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
begin
  perform pg_advisory_xact_lock(hashtext('rc_book:' || b.id::text));
  return receitas.save_recipe(b.id, null, p_title, p_author, p_category, p_ingredients, p_steps, p_tip, p_device_id);
end $$;

create function public.rc_update_recipe(
  p_slug        text,
  p_recipe_id   uuid,
  p_title       text,
  p_author      text default null,
  p_category    text default 'other',
  p_ingredients text default '',
  p_steps       text default '',
  p_tip         text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
begin
  perform receitas.save_recipe(b.id, p_recipe_id, p_title, p_author, p_category, p_ingredients, p_steps, p_tip, null);
end $$;

-- Moves a recipe to the trash. It can be restored for 30 days.
create function public.rc_delete_recipe(p_slug text, p_recipe_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
  r receitas.recipes := receitas.require_recipe(b.id, p_recipe_id, false);
begin
  update receitas.recipes set deleted_at = now() where id = r.id;
  perform receitas.purge_trash(b.id);
end $$;

create function public.rc_restore_recipe(p_slug text, p_recipe_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
  r receitas.recipes := receitas.require_recipe(b.id, p_recipe_id, true);
begin
  update receitas.recipes set deleted_at = null, updated_at = now() where id = r.id;
end $$;

create function public.rc_get_trash(p_slug text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
begin
  perform receitas.purge_trash(b.id);
  return coalesce((
    select jsonb_agg(receitas.recipe_json(r, false) || jsonb_build_object('deleted_at', r.deleted_at)
                     order by r.deleted_at desc)
    from receitas.recipes r
    where r.book_id = b.id and r.deleted_at is not null), '[]'::jsonb);
end $$;

------------------------------------------------------------------------
-- 4. Grants: only the public RPCs, for the browser (anon) role
------------------------------------------------------------------------
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname like 'rc\_%'
  loop
    execute format('revoke execute on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end $$;
