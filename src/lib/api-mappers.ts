// RPC responses (snake_case) → view types (camelCase). Framework-free and unit-tested
// against tests/fixtures/, named after the RPC.

import {isLocale, type Locale} from '@/i18n/locales';

export const categoryCodes = ['sweets', 'savory', 'party', 'drinks', 'other'] as const;
export type CategoryCode = (typeof categoryCodes)[number];

export function toCategory(value: unknown): CategoryCode {
  return (categoryCodes as readonly unknown[]).includes(value) ? (value as CategoryCode) : 'other';
}

// ---------------------------------------------------------------------------
// Raw shapes, as the database returns them
// ---------------------------------------------------------------------------

export type RawRecipeSummary = {
  id: string;
  title: string;
  author: string | null;
  category: string;
  photo_path?: string | null;
  updated_at: string;
  deleted_at?: string;
};

export type RawRecipe = RawRecipeSummary & {
  ingredients: string;
  steps: string;
  tip: string | null;
  created_at: string;
  book_title?: string;
};

export type RawBook = {
  slug: string;
  title: string;
  locale: string;
  recipes: (RawRecipeSummary | RawRecipe)[];
  trash_count: number;
};

export type RawCreatedBook = {slug: string};

// ---------------------------------------------------------------------------
// View types
// ---------------------------------------------------------------------------

export type RecipeSummary = {
  id: string;
  title: string;
  author: string | null;
  category: CategoryCode;
  /** Storage path of the dish photo (lib/photo.ts builds the URL), or null. */
  photoPath: string | null;
  updatedAt: string;
};

export type Recipe = RecipeSummary & {
  ingredients: string;
  steps: string;
  tip: string | null;
  createdAt: string;
};

export type BookView = {
  slug: string;
  title: string;
  locale: Locale;
  recipes: RecipeSummary[];
  trashCount: number;
};

export type FullBookView = Omit<BookView, 'recipes'> & {recipes: Recipe[]};

export type RecipeView = Recipe & {bookTitle: string};

export type TrashedRecipe = RecipeSummary & {deletedAt: string};

export function toRecipeSummary(raw: RawRecipeSummary): RecipeSummary {
  return {
    id: raw.id,
    title: raw.title,
    author: raw.author ?? null,
    category: toCategory(raw.category),
    photoPath: raw.photo_path ?? null,
    updatedAt: raw.updated_at,
  };
}

export function toRecipe(raw: RawRecipe): Recipe {
  return {
    ...toRecipeSummary(raw),
    ingredients: raw.ingredients ?? '',
    steps: raw.steps ?? '',
    tip: raw.tip ?? null,
    createdAt: raw.created_at,
  };
}

export function toBookView(raw: RawBook): BookView {
  return {
    slug: raw.slug,
    title: raw.title,
    locale: isLocale(raw.locale) ? raw.locale : 'pt-BR',
    recipes: (raw.recipes ?? []).map(toRecipeSummary),
    trashCount: Number(raw.trash_count ?? 0),
  };
}

export function toFullBookView(raw: RawBook): FullBookView {
  return {...toBookView(raw), recipes: (raw.recipes ?? []).map((recipe) => toRecipe(recipe as RawRecipe))};
}

export function toRecipeView(raw: RawRecipe): RecipeView {
  return {...toRecipe(raw), bookTitle: raw.book_title ?? ''};
}

export function toTrashedRecipes(raw: RawRecipeSummary[]): TrashedRecipe[] {
  return (raw ?? []).map((recipe) => ({...toRecipeSummary(recipe), deletedAt: recipe.deleted_at ?? recipe.updated_at}));
}
