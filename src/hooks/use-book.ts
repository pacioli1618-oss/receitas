'use client';

import {useEffect} from 'react';
import {useLoader} from '@/hooks/use-loader';
import {getBook, getRecipe} from '@/lib/api';
import {rememberBook} from '@/lib/device-store';

/** The book (recipe summaries), kept in "My books" on this device once it opens. */
export function useBook(slug: string) {
  const result = useLoader(`book:${slug}`, () => getBook(slug));
  const title = result.data?.title;
  useEffect(() => {
    if (title) rememberBook(slug, title);
  }, [slug, title]);
  return result;
}

/** One recipe in full. */
export function useRecipe(slug: string, recipeId: string) {
  const result = useLoader(`recipe:${slug}:${recipeId}`, () => getRecipe(slug, recipeId));
  const bookTitle = result.data?.bookTitle;
  useEffect(() => {
    if (bookTitle) rememberBook(slug, bookTitle);
  }, [slug, bookTitle]);
  return result;
}
