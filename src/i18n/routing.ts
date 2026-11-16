import {defineRouting} from 'next-intl/routing';
import {defaultLocale, locales} from './locales';

// localePrefix 'never': URLs never carry the locale.
// The book link (/c/<slug>) is the same for the whole family, and each person sees the UI
// in their own language. The proxy rewrites internally to /<locale>/c/<slug>, picking the
// locale from the cookie, then from Accept-Language.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'never',
  localeCookie: {
    name: 'RC_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
  },
});
