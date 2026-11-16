'use client';

import {useSyncExternalStore} from 'react';
import {readStore, subscribeToStore, type DevicePreferences, type StoredBook} from '@/lib/device-store';

/** Every book this device opened, most recent first. `null` on the server and before hydration. */
export function useMyBooks(): StoredBook[] | null {
  const books = useSyncExternalStore(
    subscribeToStore,
    () => readStore().books,
    () => null,
  );
  return books ? Object.values(books).sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt)) : null;
}

const serverPreferences: DevicePreferences = {textSize: 0, isScreenKeptOn: true, isInstallCardDismissed: false};

/** Letter size and screen-on choice, shared by every recipe on this device. */
export function usePreferences(): DevicePreferences {
  return useSyncExternalStore(
    subscribeToStore,
    () => readStore().preferences,
    () => serverPreferences,
  );
}
