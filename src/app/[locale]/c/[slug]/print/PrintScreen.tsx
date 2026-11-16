'use client';

import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {useSearchParams} from 'next/navigation';
import QRCode from 'qrcode';
import {useFormatter, useTranslations} from 'next-intl';
import {BookError} from '@/components/book/BookError';
import {StatusScreen} from '@/components/book/StatusScreen';
import {LogoSymbol} from '@/components/brand/Logo';
import {AppHeader, BackLink} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {Button} from '@/components/ui/Button';
import {Icon} from '@/components/ui/Icon';
import {useLoader} from '@/hooks/use-loader';
import {useOrigin} from '@/hooks/use-origin';
import {categoryCodes, getFullBook, getRecipe, type Recipe} from '@/lib/api';
import {buildPhotoUrl} from '@/lib/photo';
import {splitIngredients, splitSteps} from '@/lib/recipe-text';
import {buildBookUrl, buildRecipeUrl, displayUrl} from '@/lib/share-links';
import styles from './PrintScreen.module.css';

type Scope = 'recipe' | 'book';

type Printable = {bookTitle: string; recipes: Recipe[]};

/** A4 pages for people who would rather cook from paper: one recipe, or the whole book. */
export function PrintScreen({slug}: {slug: string}) {
  const t = useTranslations('Print');
  const common = useTranslations('Common');
  const recipeId = useSearchParams().get('recipe');
  const [scope, setScope] = useState<Scope>(recipeId ? 'recipe' : 'book');
  const [hasTips, setHasTips] = useState(true);
  const [hasPhotos, setHasPhotos] = useState(true);
  const origin = useOrigin();

  const isSingle = scope === 'recipe' && Boolean(recipeId);
  const {data, error, refresh} = useLoader<Printable>(isSingle ? `print:${slug}:${recipeId}` : `print:${slug}`, async () => {
    if (isSingle && recipeId) {
      const recipe = await getRecipe(slug, recipeId);
      return {bookTitle: recipe.bookTitle, recipes: [recipe]};
    }
    const book = await getFullBook(slug);
    // Printed in the order of the contents page: by category, then by title.
    const recipes = [...book.recipes].sort((a, b) => categoryCodes.indexOf(a.category) - categoryCodes.indexOf(b.category));
    return {bookTitle: book.title, recipes};
  });

  const backHref = recipeId ? `/c/${slug}/r/${recipeId}` : `/c/${slug}`;

  if (error && !data) return <BookError error={error} onRetry={() => void refresh()} bookHref={`/c/${slug}`} />;
  if (!data || !origin) return <StatusScreen message={common('loading')} />;

  return (
    <main className={`${screen.screen} ${styles.printScreen}`}>
      <div className={styles.controls}>
        <AppHeader back={<BackLink href={backHref}>{common('back')}</BackLink>} />
        <h1 className={screen.title}>{t('title')}</h1>
        <p className={screen.lead}>{t('lead')}</p>

        {recipeId && (
          <fieldset className={styles.options}>
            <legend className={styles.legend}>{t('whatToPrint')}</legend>
            <label className={styles.option}>
              <input type="radio" name="scope" checked={scope === 'recipe'} onChange={() => setScope('recipe')} />
              <span>
                <strong>{t('onlyThisRecipe')}</strong>
                {isSingle && <span>{data.recipes[0]?.title}</span>}
              </span>
            </label>
            <label className={styles.option}>
              <input type="radio" name="scope" checked={scope === 'book'} onChange={() => setScope('book')} />
              <span>
                <strong>{t('wholeBook')}</strong>
                <span>{t('wholeBookHint')}</span>
              </span>
            </label>
          </fieldset>
        )}

        <label className={styles.checkbox}>
          <input type="checkbox" checked={hasTips} onChange={(event) => setHasTips(event.target.checked)} />
          <span>{t('includeTips')}</span>
        </label>

        <label className={styles.checkbox}>
          <input type="checkbox" checked={hasPhotos} onChange={(event) => setHasPhotos(event.target.checked)} />
          <span>{t('includePhotos')}</span>
        </label>

        <div className={screen.stack}>
          <Button size="cta" isFullWidth onClick={() => window.print()} disabled={data.recipes.length === 0}>
            <Icon name="print" />
            {t('print')}
          </Button>
          <p className={screen.hint}>{t('pdfHint')}</p>
        </div>

        <h2 className={screen.sectionTitle}>{t('preview')}</h2>
      </div>

      {data.recipes.length === 0 ? (
        <p className={screen.hint}>{t('emptyBook')}</p>
      ) : (
        <PrintPages slug={slug} origin={origin} printable={data} isWholeBook={!isSingle} hasTips={hasTips} hasPhotos={hasPhotos} />
      )}
    </main>
  );
}

function PrintPages({slug, origin, printable, isWholeBook, hasTips, hasPhotos}: {slug: string; origin: string; printable: Printable; isWholeBook: boolean; hasTips: boolean; hasPhotos: boolean}) {
  const t = useTranslations('Print');
  const recipeT = useTranslations('Recipe');
  const categories = useTranslations('Categories');
  const brand = useTranslations('Brand');
  const common = useTranslations('Common');
  const format = useFormatter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  // The preview shows real A4 pages (794px wide) shrunk to fit the phone.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setZoom(Math.min(1, entry.contentRect.width / 794)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isActive = true;
    void Promise.all(
      printable.recipes.map(async (recipe) => {
        const svg = await QRCode.toString(buildRecipeUrl(origin, slug, recipe.id), {type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: {dark: '#2b211a', light: '#ffffff'}});
        return [recipe.id, svg] as const;
      }),
    ).then((entries) => {
      if (isActive) setQrCodes(Object.fromEntries(entries));
    });
    return () => {
      isActive = false;
    };
  }, [origin, slug, printable]);

  const bookUrl = displayUrl(buildBookUrl(origin, slug));
  const pageOffset = isWholeBook ? 3 : 1;
  const groups = categoryCodes
    .map((code) => ({code, recipes: printable.recipes.map((recipe, index) => ({recipe, page: index + pageOffset})).filter(({recipe}) => recipe.category === code)}))
    .filter((group) => group.recipes.length > 0);

  return (
    <div ref={containerRef} className={styles.preview} style={{'--zoom': zoom} as CSSProperties}>
      {isWholeBook && (
        <>
          <section className={`${styles.page} ${styles.cover}`}>
            <div className={styles.coverFrame}>
              <LogoSymbol size={112} />
              <span className={styles.coverKicker}>{brand('name')}</span>
              <h2 className={styles.coverTitle}>{printable.bookTitle}</h2>
              <p className={styles.coverSubtitle}>{t('coverSubtitle')}</p>
              <p className={styles.coverMeta}>
                {t('coverMeta', {count: printable.recipes.length, date: format.dateTime(new Date(), {month: 'long', year: 'numeric'})})}
              </p>
              <p className={styles.coverFooter}>
                {bookUrl}
                <br />
                {common('endorsement')}
              </p>
            </div>
          </section>

          <section className={styles.page}>
            <RunningHead left={printable.bookTitle} right={bookUrl} />
            <h2 className={styles.pageTitle}>{t('contents')}</h2>
            <div className={styles.contents}>
              {groups.map((group) => (
                <div key={group.code} className={styles.contentsGroup}>
                  <h3 className={styles.label}>{categories(group.code)}</h3>
                  {group.recipes.map(({recipe, page}) => (
                    <div key={recipe.id} className={styles.contentsRow}>
                      <span className={styles.contentsTitle}>{recipe.title}</span>
                      {recipe.author && <span className={styles.contentsAuthor}>{recipe.author}</span>}
                      <span className={styles.leader} aria-hidden="true" />
                      <span className={styles.contentsPage}>{page}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <PageNumber value={2} />
          </section>
        </>
      )}

      {printable.recipes.map((recipe, index) => {
        const ingredients = splitIngredients(recipe.ingredients);
        const steps = splitSteps(recipe.steps);
        return (
          <section key={recipe.id} className={styles.page}>
            <RunningHead left={printable.bookTitle} right={categories(recipe.category)} />
            <h2 className={styles.recipeTitle}>{recipe.title}</h2>
            {recipe.author && <p className={styles.byline}>{recipeT.rich('bylineRich', {author: recipe.author, strong: (chunks) => <strong>{chunks}</strong>})}</p>}

            {hasPhotos && recipe.photoPath && (
              // eslint-disable-next-line @next/next/no-img-element -- printed as is; already resized on upload
              <img src={buildPhotoUrl(recipe.photoPath)} alt={recipeT('photoAlt', {title: recipe.title})} className={styles.photo} />
            )}

            <div className={styles.columns}>
              {ingredients.length > 0 && (
                <div className={styles.ingredients}>
                  <h3 className={styles.label}>{recipeT('ingredients')}</h3>
                  {ingredients.map((item, itemIndex) => (
                    <div key={`${itemIndex}-${item}`} className={styles.ingredient}>
                      <span className={styles.box} aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {steps.length > 0 && (
                <div className={styles.steps}>
                  <h3 className={styles.label}>{recipeT('steps')}</h3>
                  {steps.map((step, stepIndex) => (
                    <div key={`${stepIndex}-${step}`} className={styles.step}>
                      <span className={styles.stepNumber}>{stepIndex + 1}</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasTips && recipe.tip && (
              <div className={styles.tip}>
                <strong>{recipe.author ? recipeT('tipBy', {author: recipe.author}) : recipeT('tip')}</strong>
                <p>{recipe.tip}</p>
              </div>
            )}

            <div className={styles.recipeFooter}>
              {qrCodes[recipe.id] ? <span className={styles.qr} dangerouslySetInnerHTML={{__html: qrCodes[recipe.id]}} /> : <span className={styles.qr} />}
              <span className={styles.qrText}>
                {t('qrHint')}
                <strong>{bookUrl}</strong>
              </span>
              <span className={styles.pageNumber}>{index + pageOffset}</span>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function RunningHead({left, right}: {left: string; right: string}) {
  return (
    <div className={styles.runningHead}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

function PageNumber({value}: {value: number}) {
  return <div className={styles.pageNumberCentered}>{value}</div>;
}
