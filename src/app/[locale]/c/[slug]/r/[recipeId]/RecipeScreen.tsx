'use client';

import {useState, type CSSProperties} from 'react';
import {useTranslations} from 'next-intl';
import {BookError} from '@/components/book/BookError';
import {StatusScreen} from '@/components/book/StatusScreen';
import bookStyles from '@/components/book/Book.module.css';
import {BackLink} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {buttonClassName, ButtonLink} from '@/components/ui/Button';
import {Icon} from '@/components/ui/Icon';
import {useRecipe} from '@/hooks/use-book';
import {usePreferences} from '@/hooks/use-device-store';
import {useOrigin} from '@/hooks/use-origin';
import {useIsWakeLockSupported, useWakeLock} from '@/hooks/use-wake-lock';
import {setPreferences, textSizes, type TextSize} from '@/lib/device-store';
import {buildPhotoUrl} from '@/lib/photo';
import {buildRecipeMessage, splitIngredients, splitSteps} from '@/lib/recipe-text';
import {buildRecipeUrl, buildWhatsAppUrl} from '@/lib/share-links';
import styles from './RecipeScreen.module.css';

const SCALES: Record<TextSize, number> = {0: 1, 1: 1.2, 2: 1.4};

/** Kitchen mode: large text, tick off what is already on the counter, screen kept on. */
export function RecipeScreen({slug, recipeId}: {slug: string; recipeId: string}) {
  const t = useTranslations('Recipe');
  const common = useTranslations('Common');
  const categories = useTranslations('Categories');
  const origin = useOrigin();
  const {data: recipe, error, refresh} = useRecipe(slug, recipeId);
  const {textSize, isScreenKeptOn} = usePreferences();
  const isWakeLockSupported = useIsWakeLockSupported();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useWakeLock(Boolean(recipe) && isScreenKeptOn);

  if (error && !recipe) return <BookError error={error} onRetry={() => void refresh()} bookHref={`/c/${slug}`} />;
  if (!recipe) return <StatusScreen message={common('loading')} />;

  const ingredients = splitIngredients(recipe.ingredients);
  const steps = splitSteps(recipe.steps);
  const byline = recipe.author ? t('byline', {author: recipe.author}) : null;
  const message = buildRecipeMessage(
    recipe,
    {byline, ingredients: t('ingredients'), steps: t('steps'), tip: t('tip'), link: t('messageLink')},
    buildRecipeUrl(origin, slug, recipeId),
  );

  const toggle = (index: number) =>
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <main className={`${screen.screen} ${screen.withBottomBar} ${styles.recipe}`} style={{'--scale': SCALES[textSize]} as CSSProperties}>
      <header className={styles.topBar}>
        <BackLink href={`/c/${slug}`}>{t('back')}</BackLink>
        <div className={styles.sizeGroup} role="group" aria-label={t('textSize')}>
          <button type="button" className={styles.sizeButton} aria-label={t('smaller')} disabled={textSize === textSizes[0]} onClick={() => setPreferences({textSize: (textSize - 1) as TextSize})}>
            A−
          </button>
          <button type="button" className={`${styles.sizeButton} ${styles.sizeBigger}`} aria-label={t('bigger')} disabled={textSize === textSizes[textSizes.length - 1]} onClick={() => setPreferences({textSize: (textSize + 1) as TextSize})}>
            A+
          </button>
        </div>
      </header>

      {recipe.photoPath && (
        // eslint-disable-next-line @next/next/no-img-element -- public Storage file, already resized on upload
        <img src={buildPhotoUrl(recipe.photoPath)} alt={t('photoAlt', {title: recipe.title})} className={styles.photo} />
      )}

      <div className={styles.heading}>
        <span className={bookStyles.tag}>{categories(recipe.category)}</span>
        <h1 className={styles.title}>{recipe.title}</h1>
        {recipe.author && <p className={styles.byline}>{t.rich('bylineRich', {author: recipe.author, strong: (chunks) => <strong>{chunks}</strong>})}</p>}
      </div>

      {isWakeLockSupported && (
        <button type="button" className={styles.screenToggle} aria-pressed={isScreenKeptOn} onClick={() => setPreferences({isScreenKeptOn: !isScreenKeptOn})}>
          <Icon name="sun" size={26} />
          <span className={styles.screenText}>
            <strong>{t('screenOn')}</strong>
            <span>{isScreenKeptOn ? t('screenOnActive') : t('screenOnInactive')}</span>
          </span>
          <span className={styles.switch} aria-hidden="true">
            <span />
          </span>
        </button>
      )}

      {ingredients.length > 0 && (
        <section className={styles.section} aria-labelledby="ingredients">
          <h2 id="ingredients" className={styles.sectionTitle}>
            {t('ingredients')}
          </h2>
          <p className={screen.hint}>{t('ingredientsHint')}</p>
          <ul className={styles.ingredients}>
            {ingredients.map((item, index) => (
              <li key={`${index}-${item}`}>
                <button type="button" className={styles.ingredient} aria-pressed={checked.has(index)} onClick={() => toggle(index)}>
                  <span className={styles.box} aria-hidden="true">
                    {checked.has(index) && <Icon name="check" size={18} strokeWidth={3} />}
                  </span>
                  <span>{item}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section className={styles.section} aria-labelledby="steps">
          <h2 id="steps" className={styles.sectionTitle}>
            {t('steps')}
          </h2>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={`${index}-${step}`}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {recipe.tip && (
        <aside className={styles.tip}>
          <strong>{recipe.author ? t('tipBy', {author: recipe.author}) : t('tip')}</strong>
          <p>{recipe.tip}</p>
        </aside>
      )}

      <div className={screen.bottomBar}>
        <div className={`${screen.bottomBarInner} ${styles.actions}`}>
          <a href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer" className={buttonClassName({size: 'stacked'})}>
            <Icon name="send" />
            {t('whatsApp')}
          </a>
          <ButtonLink href={`/c/${slug}/print?recipe=${recipeId}`} variant="secondary" size="stacked">
            <Icon name="print" />
            {t('print')}
          </ButtonLink>
          <ButtonLink href={`/c/${slug}/r/${recipeId}/edit`} variant="secondary" size="stacked">
            <Icon name="edit" />
            {t('edit')}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
