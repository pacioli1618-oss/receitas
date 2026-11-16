// The only door between the app and the database.
//
// - Calls the public.rc_* RPCs with typed arguments (database.types.ts).
// - Converts snake_case responses into camelCase view types (api-mappers.ts).
// - Throws RpcError with the fixed error code; translate it with useRpcErrorMessage().

import type {Locale} from '@/i18n/locales';
import {
  toBookView,
  toFullBookView,
  toRecipeView,
  toTrashedRecipes,
  type CategoryCode,
  type RawBook,
  type RawCreatedBook,
  type RawRecipe,
  type RawRecipeSummary,
} from './api-mappers';
import type {Database} from './database.types';
import {supabase} from './supabase';

export type * from './api-mappers';
export {categoryCodes} from './api-mappers';

type Functions = Database['public']['Functions'];

/** message = the fixed error code (e.g. "book_not_found"); details = DETAIL, when set. */
export class RpcError extends Error {
  constructor(
    message: string,
    public readonly details: string | null = null,
  ) {
    super(message);
    this.name = 'RpcError';
  }
}

async function call<F extends keyof Functions>(fn: F, args: Functions[F]['Args']): Promise<Functions[F]['Returns']> {
  const {data, error} = await supabase.rpc(fn, args as never);
  if (error) throw new RpcError(error.message, error.details || null);
  return data as Functions[F]['Returns'];
}

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

export async function createBook(title: string, locale: Locale, deviceId: string) {
  const raw = (await call('rc_create_book', {p_title: title, p_locale: locale, p_device_id: deviceId})) as unknown as RawCreatedBook;
  return {slug: raw.slug};
}

/** The book with a summary of each recipe (title, who it's from, category). */
export async function getBook(slug: string) {
  return toBookView((await call('rc_get_book', {p_slug: slug})) as unknown as RawBook);
}

/** The book with every recipe in full, for printing the whole book. */
export async function getFullBook(slug: string) {
  return toFullBookView((await call('rc_get_book', {p_slug: slug, p_with_details: true})) as unknown as RawBook);
}

export async function renameBook(slug: string, title: string) {
  await call('rc_update_book', {p_slug: slug, p_title: title});
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export type RecipeInput = {
  title: string;
  author: string;
  category: CategoryCode;
  ingredients: string;
  steps: string;
  tip: string;
};

export async function getRecipe(slug: string, recipeId: string) {
  return toRecipeView((await call('rc_get_recipe', {p_slug: slug, p_recipe_id: recipeId})) as unknown as RawRecipe);
}

/** Returns the new recipe's id. */
export async function createRecipe(slug: string, input: RecipeInput, deviceId: string) {
  return call('rc_create_recipe', {
    p_slug: slug,
    p_title: input.title,
    p_author: input.author,
    p_category: input.category,
    p_ingredients: input.ingredients,
    p_steps: input.steps,
    p_tip: input.tip,
    p_device_id: deviceId,
  });
}

export async function updateRecipe(slug: string, recipeId: string, input: RecipeInput) {
  await call('rc_update_recipe', {
    p_slug: slug,
    p_recipe_id: recipeId,
    p_title: input.title,
    p_author: input.author,
    p_category: input.category,
    p_ingredients: input.ingredients,
    p_steps: input.steps,
    p_tip: input.tip,
  });
}

/** Moves the recipe to the trash (restorable for 30 days). */
export async function deleteRecipe(slug: string, recipeId: string) {
  await call('rc_delete_recipe', {p_slug: slug, p_recipe_id: recipeId});
}

export async function restoreRecipe(slug: string, recipeId: string) {
  await call('rc_restore_recipe', {p_slug: slug, p_recipe_id: recipeId});
}

export async function getTrash(slug: string) {
  return toTrashedRecipes((await call('rc_get_trash', {p_slug: slug})) as unknown as RawRecipeSummary[]);
}
