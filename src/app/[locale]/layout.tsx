import type {Metadata, Viewport} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getTranslations} from 'next-intl/server';
import localFont from 'next/font/local';
import {routing} from '@/i18n/routing';
import '../globals.css';

// Fonts served by the app itself (OFL licenses in app/fonts/OFL.txt): opening a book link
// makes no request to Google. Atkinson Hyperlegible was drawn for low-vision readers.
const atkinson = localFont({
  src: [
    {path: '../fonts/AtkinsonHyperlegible-Regular.woff2', weight: '400', style: 'normal'},
    {path: '../fonts/AtkinsonHyperlegible-Bold.woff2', weight: '700', style: 'normal'},
  ],
  variable: '--font-atkinson',
  display: 'swap',
});

const fraunces = localFont({
  src: [
    {path: '../fonts/Fraunces-Variable.woff2', weight: '100 900', style: 'normal'},
    {path: '../fonts/Fraunces-Variable-Italic.woff2', weight: '100 900', style: 'italic'},
  ],
  variable: '--font-fraunces',
  display: 'swap',
});

// With cacheComponents, every root param needs at least one value at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

// Absolute base for preview images (og:image must be absolute). On Vercel, Next falls back to
// the production domain on its own; NEXT_PUBLIC_SITE_URL overrides it (docs/deploy.md).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Metadata');
  const brand = await getTranslations('Brand');
  const image = {url: `/api/og?locale=${locale}`, width: 1200, height: 630, alt: t('title')};
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: t('title'),
    description: t('description'),
    openGraph: {title: t('title'), description: t('description'), siteName: brand('name'), type: 'website', images: [image]},
    twitter: {card: 'summary_large_image', title: t('title'), description: t('description'), images: [image]},
    // Home-screen app on iPhone (Android reads app/manifest.ts).
    appleWebApp: {capable: true, title: brand('shortName'), statusBarStyle: 'default'},
  };
}

// Browser bar color, matching --surface in each theme.
export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#fbf6ec'},
    {media: '(prefers-color-scheme: dark)', color: '#1a1512'},
  ],
};

export default async function LocaleLayout({children}: LayoutProps<'/[locale]'>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${atkinson.variable} ${fraunces.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
