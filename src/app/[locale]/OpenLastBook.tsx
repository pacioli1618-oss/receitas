'use client';

import {useEffect} from 'react';
import {useMyBooks} from '@/hooks/use-device-store';
import {useInstallMode} from '@/hooks/use-install';
import {useRouter} from '@/i18n/navigation';

const SESSION_KEY = 'receitas:opened-last-book';

/**
 * The home-screen icon opens "/" (manifest start_url). Grandma tapped the notebook to see the
 * family's recipes, not the "create a book" page: go straight to the book used last, once per
 * launch, so "Receitas da Família" in the header still leads back here.
 */
export function OpenLastBook() {
  const mode = useInstallMode();
  const books = useMyBooks();
  const router = useRouter();
  const lastSlug = books?.[0]?.slug;

  useEffect(() => {
    if (mode !== 'installed' || !lastSlug) return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // No session storage: still open the book; the header link leads back to the start.
    }
    router.replace(`/c/${lastSlug}`);
  }, [mode, lastSlug, router]);

  return null;
}
