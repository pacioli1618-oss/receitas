-- Photo of the dish, one per recipe.
--
-- Files live in the public Storage bucket "receitas", at <recipe_id>/<random>.jpg plus a small
-- <recipe_id>/<random>-thumb.jpg for the book list. The browser shrinks the photo before sending
-- it (src/lib/photo.ts). The path holds only the recipe id, never the book slug, so a photo URL
-- that travels on its own does not open the book.
--
-- Upload: anon may add files to a folder whose name is the id of a recipe that exists and is not
-- in the trash (at most 20 files per recipe). Attaching a file to the recipe still needs the book
-- slug: rc_set_recipe_photo. Replaced photos stay in Storage (docs/improvements.md: cleanup).

alter table receitas.recipes
  add column photo_path text check (photo_path ~ '^[0-9a-f-]{36}/[a-z0-9]{8,40}\.(jpg|webp)$');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receitas', 'receitas', true, 1572864, array['image/jpeg', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Called by the Storage policy below, as anon: the only thing anon may run in schema receitas.
create function receitas.can_upload_photo(p_name text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  v_recipe_id uuid;
  v_folder text := split_part(p_name, '/', 1);
begin
  if p_name !~ '^[0-9a-f-]{36}/[a-z0-9]{8,40}(-thumb)?\.(jpg|webp)$' then
    return false;
  end if;
  begin
    v_recipe_id := v_folder::uuid;
  exception when others then
    return false;
  end;
  if not exists (select 1 from receitas.recipes where id = v_recipe_id and deleted_at is null) then
    return false;
  end if;
  return (select count(*) from storage.objects
          where bucket_id = 'receitas' and name like v_folder || '/%') < 20;
end $$;

revoke execute on function receitas.can_upload_photo(text) from public;
grant usage on schema receitas to anon, authenticated;
grant execute on function receitas.can_upload_photo(text) to anon, authenticated;

create policy "receitas: upload a dish photo to an existing recipe"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'receitas' and receitas.can_upload_photo(name));

-- Recipes now carry their photo path (summaries too: the book list shows thumbnails).
create or replace function receitas.recipe_json(p_recipe receitas.recipes, p_with_details boolean)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', p_recipe.id,
    'title', p_recipe.title,
    'author', p_recipe.author,
    'category', p_recipe.category,
    'photo_path', p_recipe.photo_path,
    'updated_at', p_recipe.updated_at)
  || case when p_with_details then jsonb_build_object(
    'ingredients', p_recipe.ingredients,
    'steps', p_recipe.steps,
    'tip', p_recipe.tip,
    'created_at', p_recipe.created_at)
  else '{}'::jsonb end
$$;

-- Attaches an uploaded photo (and its -thumb twin) to the recipe, or removes it with null.
create function public.rc_set_recipe_photo(p_slug text, p_recipe_id uuid, p_photo_path text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b receitas.books := receitas.require_book(p_slug);
  r receitas.recipes := receitas.require_recipe(b.id, p_recipe_id, false);
  v_path text := receitas.clean_text(p_photo_path);
begin
  if v_path is not null then
    if v_path !~ ('^' || r.id::text || '/[a-z0-9]{8,40}\.(jpg|webp)$')
       or not exists (select 1 from storage.objects where bucket_id = 'receitas' and name = v_path)
       or not exists (select 1 from storage.objects where bucket_id = 'receitas'
                      and name = regexp_replace(v_path, '\.(jpg|webp)$', '-thumb.\1')) then
      raise exception 'photo_not_found' using errcode = 'P0002';
    end if;
  end if;
  update receitas.recipes set photo_path = v_path, updated_at = now() where id = r.id;
end $$;

revoke execute on function public.rc_set_recipe_photo(text, uuid, text) from public;
grant execute on function public.rc_set_recipe_photo(text, uuid, text) to anon, authenticated;
