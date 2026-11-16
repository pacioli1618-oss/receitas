'use client';

import {useEffect} from 'react';
import {listenForInstallPrompt} from '@/lib/install';

/** Mounted once in the root layout: keeps the browser's install prompt for the "Fixar" button. */
export function InstallListener() {
  useEffect(() => listenForInstallPrompt(), []);
  return null;
}
