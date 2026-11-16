'use client';

import {useEffect, useSyncExternalStore} from 'react';

type WakeLockSentinelLike = {release: () => Promise<void>; released: boolean};
type WakeLockLike = {request: (type: 'screen') => Promise<WakeLockSentinelLike>};

function getWakeLock(): WakeLockLike | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as Navigator & {wakeLock?: WakeLockLike}).wakeLock ?? null;
}

const subscribe = () => () => {};

/** True when the browser can keep the screen on (Chrome on Android, Safari 16.4+). */
export function useIsWakeLockSupported() {
  return useSyncExternalStore(
    subscribe,
    () => getWakeLock() !== null,
    () => false,
  );
}

/**
 * Keeps the screen on while `isActive` (the cook has floury hands). The browser drops the lock
 * when the tab is hidden, so it is asked for again when the page comes back.
 */
export function useWakeLock(isActive: boolean) {
  useEffect(() => {
    const wakeLock = getWakeLock();
    if (!isActive || !wakeLock) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let isCancelled = false;

    const request = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const next = await wakeLock.request('screen');
        if (isCancelled) void next.release();
        else sentinel = next;
      } catch {
        // Refused (battery saver, iframe): the recipe still works, the screen just may dim.
      }
    };
    const handleVisible = () => {
      if (!sentinel || sentinel.released) void request();
    };

    void request();
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [isActive]);
}
