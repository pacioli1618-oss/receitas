// Server only: what a link preview (WhatsApp, Telegram, iMessage) shows for /c/<slug>.
// Used by the book layout's metadata and by the image at /api/og/<slug>.
// Only the book's title and how many recipes it has: never the recipes themselves.

import {cacheLife} from 'next/cache';
import type {Locale} from '@/i18n/locales';
import {getBook, RpcError} from './api';

export type BookPreview = {
  title: string;
  recipeCount: number;
  /** The creator's language: the preview is the same for the whole family. */
  locale: Locale;
};

// Slugs are 12 random [a-z0-9] characters; anything else is not worth a database call.
const SLUG_PATTERN = /^[a-z0-9]{8,32}$/;

async function loadBookPreview(slug: string): Promise<BookPreview | null> {
  'use cache';
  // Previews are cached by the apps for days anyway; a few minutes here spares the database.
  cacheLife('minutes');
  try {
    const book = await getBook(slug);
    return {title: book.title, recipeCount: book.recipes.length, locale: book.locale};
  } catch (error) {
    if (error instanceof RpcError && error.message === 'book_not_found') return null;
    throw error; // not cached: the next request tries again
  }
}

/** null when the book does not exist or the database can't be reached: callers fall back to the app's preview. */
export async function getBookPreview(slug: string): Promise<BookPreview | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  try {
    return await loadBookPreview(slug);
  } catch {
    return null;
  }
}
