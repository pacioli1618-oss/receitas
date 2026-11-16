'use client';

import {useSyncExternalStore} from 'react';
import {getInstallMode, subscribeToInstall, type InstallMode} from '@/lib/install';

/** How this phone can put the app on its home screen. `null` on the server and before hydration. */
export function useInstallMode(): InstallMode | null {
  return useSyncExternalStore(subscribeToInstall, getInstallMode, () => null);
}
