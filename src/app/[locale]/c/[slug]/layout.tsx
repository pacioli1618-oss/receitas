import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {getBookPreview} from '@/lib/book-preview';

// Link preview for every page under /c/<slug>. Written in the book's language (books.locale),
// not the visitor's: the crawler that builds the preview sends no cookie, and the whole family
// should see the same card. Shows the title and how many recipes, never the recipes.
export async function generateMetadata({params}: LayoutProps<'/[locale]/c/[slug]'>): Promise<Metadata> {
  const {slug} = await params;
  const preview = await getBookPreview(slug);
  // Book links are private by nature: keep them out of search engines.
  const robots = {index: false, follow: false};
  if (!preview) return {robots};

  const {locale} = preview;
  const t = await getTranslations({locale, namespace: 'Preview'});
  const brand = await getTranslations({locale, namespace: 'Brand'});
  const description = `${t('recipes', {count: preview.recipeCount})}. ${t('cta')}.`;
  const image = {url: `/api/og/${slug}`, width: 1200, height: 630, alt: t('alt', {title: preview.title})};

  return {
    title: `${preview.title} · ${brand('name')}`,
    description,
    openGraph: {title: preview.title, description, siteName: brand('name'), type: 'website', locale: locale.replace('-', '_'), images: [image]},
    twitter: {card: 'summary_large_image', title: preview.title, description, images: [image]},
    robots,
  };
}

export default function BookLayout({children}: LayoutProps<'/[locale]/c/[slug]'>) {
  return children;
}
