// Everything Receitas da Família keeps on the device, in one versioned place. No component
// touches localStorage directly.
//
// The book link is the only key to a book, so the device remembers the books it opened
// ("Meus cadernos") and the reading preferences (letter size, screen always on).
//
// Browser only. Do not import from Server Components.

const STORAGE_KEY = 'receitas';
const STORE_VERSION = 1;

export const textSizes = [0, 1, 2] as const;
export type TextSize = (typeof textSizes)[number];

export type StoredBook = {
  slug: string;
  title: string;
  lastOpenedAt: string;
};

export type DevicePreferences = {
  /** 0 = large (default), 1 = larger, 2 = largest. */
  textSize: TextSize;
  /** Keep the screen on while a recipe is open. */
  isScreenKeptOn: boolean;
  /** "Agora não" on the "Fixar na tela do celular" card in the book. */
  isInstallCardDismissed: boolean;
};

export type DeviceStore = {
  version: typeof STORE_VERSION;
  /** Anonymous identity of this device, sent to the RPCs as p_device_id. */
  deviceId: string;
  /** Books by slug. */
  books: Record<string, StoredBook>;
  preferences: DevicePreferences;
};

const defaultPreferences: DevicePreferences = {textSize: 0, isScreenKeptOn: true, isInstallCardDismissed: false};

function createEmptyStore(): DeviceStore {
  return {version: STORE_VERSION, deviceId: crypto.randomUUID(), books: {}, preferences: defaultPreferences};
}

// When the format changes, bump STORE_VERSION and convert the previous version here.
function migrateStore(raw: unknown): DeviceStore | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<DeviceStore>;
  if (data.version === STORE_VERSION && typeof data.deviceId === 'string' && data.books) {
    return {...data, preferences: {...defaultPreferences, ...data.preferences}} as DeviceStore;
  }
  return null;
}

// localStorage may be missing or throw (private mode, WhatsApp's in-app browser):
// then the app keeps working in this tab's memory only.
let memoryStore: DeviceStore | null = null;

export function readStore(): DeviceStore {
  if (memoryStore) return memoryStore;
  try {
    const parsed = migrateStore(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null'));
    memoryStore = parsed ?? createEmptyStore();
    if (!parsed) writeStore(memoryStore);
  } catch {
    memoryStore = createEmptyStore();
  }
  return memoryStore;
}

function writeStore(store: DeviceStore) {
  memoryStore = store;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // No persistence available: keep going in memory.
  }
  listeners.forEach((listener) => listener());
}

const listeners = new Set<() => void>();

/** Calls back when this tab or another tab changes the store. Returns the unsubscribe function. */
export function subscribeToStore(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    memoryStore = null; // another tab wrote: read again
    listener();
  };
  listeners.add(listener);
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getDeviceId(): string {
  return readStore().deviceId;
}

/** Saves or refreshes a book in "My books". */
export function rememberBook(slug: string, title: string) {
  const store = readStore();
  const previous = store.books[slug];
  if (previous && previous.title === title && Date.now() - Date.parse(previous.lastOpenedAt) < 60_000) return;
  writeStore({...store, books: {...store.books, [slug]: {slug, title, lastOpenedAt: new Date().toISOString()}}});
}

export function forgetBook(slug: string) {
  const store = readStore();
  const books = {...store.books};
  delete books[slug];
  writeStore({...store, books});
}

export function setPreferences(patch: Partial<DevicePreferences>) {
  const store = readStore();
  writeStore({...store, preferences: {...store.preferences, ...patch}});
}
