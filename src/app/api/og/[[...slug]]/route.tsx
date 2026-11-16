// Link-preview image (1200×630).
//   /api/og/<slug>        the book's card, in the book's language
//   /api/og?locale=es     the app's card (home page, or a book that no longer exists)
// Lives under /api so the locale proxy leaves it alone (see src/proxy.ts).

import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ImageResponse} from 'next/og';
import {getTranslations} from 'next-intl/server';
import {LOGO, LOGO_COLORS} from '@/components/brand/Logo';
import {defaultLocale, locales, type Locale} from '@/i18n/locales';
import {getBookPreview} from '@/lib/book-preview';

// Design tokens (light theme).
const color = {
  brand: '#B5432B',
  brandStrong: '#8F3220',
  brandTint: '#F6E3DA',
  surface: '#FBF6EC',
  ink: '#2B211A',
  inkMuted: '#6B5D50',
  onBrand: '#FFFFFF',
};

function NotebookSymbol({size}: {size: number}) {
  const mark = LOGO.full;
  const c = LOGO_COLORS;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" rx="22" fill={c.tile} />
      <rect {...mark.cover} fill={c.paper} />
      {mark.rings.map((ring) => (
        <rect key={ring.y} {...ring} fill={c.ink} />
      ))}
      <path d={mark.heart} fill={c.tile} />
      <rect {...mark.label} fill={c.label} />
    </svg>
  );
}

type FontSpec = {name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' | 'italic'};

let fontsPromise: Promise<FontSpec[]> | undefined;
function loadFonts() {
  const read = (file: string) => readFile(join(process.cwd(), `assets/fonts/${file}`));
  fontsPromise ??= Promise.all([
    read('Fraunces-Bold.woff').then((data): FontSpec => ({name: 'Fraunces', data, weight: 700, style: 'normal'})),
    read('Fraunces-SemiBoldItalic.woff').then((data): FontSpec => ({name: 'Fraunces', data, weight: 600, style: 'italic'})),
    read('AtkinsonHyperlegible-Regular.woff').then((data): FontSpec => ({name: 'Atkinson', data, weight: 400, style: 'normal'})),
  ]);
  return fontsPromise;
}

function titleSize(title: string) {
  if (title.length <= 22) return 88;
  if (title.length <= 40) return 72;
  return 58;
}

type Card = {chip?: string; title: string; lines: string[]; cta: string; wordmark: {first: string; second: string}};

function render(card: Card) {
  return (
    <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: color.surface, fontFamily: 'Atkinson'}}>
      <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '56px 72px 0'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <NotebookSymbol size={72} />
          <div style={{display: 'flex', flexDirection: 'column', fontFamily: 'Fraunces', lineHeight: 1}}>
            <span style={{color: color.ink, fontSize: 40, fontWeight: 700}}>{card.wordmark.first}</span>
            <span style={{color: color.brand, fontSize: 32, fontWeight: 600, fontStyle: 'italic'}}>{card.wordmark.second}</span>
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, paddingBottom: 24}}>
          {card.chip ? (
            <div style={{display: 'flex', marginBottom: 20}}>
              <div style={{background: color.brandTint, color: color.brandStrong, fontSize: 28, padding: '8px 24px', borderRadius: 999}}>{card.chip}</div>
            </div>
          ) : null}
          <div style={{fontFamily: 'Fraunces', fontSize: titleSize(card.title), fontWeight: 700, color: color.ink, letterSpacing: -1.5, lineHeight: 1.06, display: 'block', lineClamp: 2}}>
            {card.title}
          </div>
          {card.lines.map((line) => (
            <div key={line} style={{display: 'block', lineClamp: 2, lineHeight: 1.3, fontSize: 34, color: color.inkMuted, marginTop: 18}}>
              {line}
            </div>
          ))}
        </div>
      </div>

      <div style={{display: 'flex', alignItems: 'center', background: color.brand, color: color.onBrand, padding: '0 72px', height: 104, fontSize: 34}}>{card.cta}</div>
    </div>
  );
}

function pickLocale(value: string | null): Locale {
  return (locales as readonly string[]).includes(value ?? '') ? (value as Locale) : defaultLocale;
}

export async function GET(request: Request, {params}: RouteContext<'/api/og/[[...slug]]'>) {
  const {slug: segments} = await params;
  const slug = segments?.[0];
  const preview = slug ? await getBookPreview(slug) : null;

  let card: Card;
  if (preview) {
    const locale = preview.locale;
    const t = await getTranslations({locale, namespace: 'Preview'});
    const brand = await getTranslations({locale, namespace: 'Brand'});
    card = {
      chip: t('chip'),
      title: preview.title,
      lines: [t('recipes', {count: preview.recipeCount})],
      cta: t('cta'),
      wordmark: {first: brand('wordmarkFirst'), second: brand('wordmarkSecond')},
    };
  } else {
    const locale = pickLocale(new URL(request.url).searchParams.get('locale'));
    const t = await getTranslations({locale, namespace: 'Home'});
    const common = await getTranslations({locale, namespace: 'Common'});
    const brand = await getTranslations({locale, namespace: 'Brand'});
    card = {title: t('headline'), lines: [t('intro')], cta: common('tagline'), wordmark: {first: brand('wordmarkFirst'), second: brand('wordmarkSecond')}};
  }

  return new ImageResponse(render(card), {
    width: 1200,
    height: 630,
    fonts: await loadFonts(),
    headers: {
      'Cache-Control': preview ? 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' : 'public, max-age=86400',
    },
  });
}
