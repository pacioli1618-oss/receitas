'use client';

import {useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {BookError} from '@/components/book/BookError';
import {StatusScreen} from '@/components/book/StatusScreen';
import {AppHeader} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {ButtonLink} from '@/components/ui/Button';
import {Icon} from '@/components/ui/Icon';
import {useBook} from '@/hooks/use-book';
import {Link} from '@/i18n/navigation';
import {categoryCodes, type CategoryCode} from '@/lib/api';
import {matchesSearch} from '@/lib/recipe-text';
import styles from './BookScreen.module.css';

type Filter = CategoryCode | 'all';

export function BookScreen({slug}: {slug: string}) {
  const t = useTranslations('Book');
  const common = useTranslations('Common');
  const categories = useTranslations('Categories');
  const {data: book, error, refresh} = useBook(slug);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const usedCategories = useMemo(() => {
    const used = new Set(book?.recipes.map((recipe) => recipe.category));
    return categoryCodes.filter((code) => used.has(code));
  }, [book]);

  const visible = useMemo(
    () => (book?.recipes ?? []).filter((recipe) => (filter === 'all' || recipe.category === filter) && matchesSearch(recipe, query)),
    [book, filter, query],
  );

  if (error && !book) return <BookError error={error} onRetry={() => void refresh()} />;
  if (!book) return <StatusScreen message={common('loading')} />;

  const isEmpty = book.recipes.length === 0;

  return (
    <main className={`${screen.screen} ${screen.withBottomBar}`}>
      <AppHeader />

      <div className={styles.heading}>
        <h1 className={screen.title}>{book.title}</h1>
        <Link href={`/c/${slug}/link`} className={styles.linkAction}>
          <Icon name="link" size={20} />
          {t('bookLink')}
        </Link>
      </div>

      {isEmpty ? (
        <div className={styles.empty}>
          <p className={screen.lead}>{t('emptyTitle')}</p>
          <p className={screen.hint}>{t('emptyHint')}</p>
        </div>
      ) : (
        <>
          <label className={styles.search}>
            <Icon name="search" />
            <span className="visually-hidden">{t('searchLabel')}</span>
            <input type="search" placeholder={t('searchPlaceholder')} value={query} onChange={(event) => setQuery(event.target.value)} enterKeyHint="search" />
          </label>

          {usedCategories.length > 1 && (
            <div className={styles.chips} role="group" aria-label={t('categoriesLabel')}>
              {(['all', ...usedCategories] as Filter[]).map((code) => (
                <button key={code} type="button" className={styles.chip} aria-pressed={filter === code} onClick={() => setFilter(code)}>
                  {code === 'all' ? t('allCategories') : categories(code)}
                </button>
              ))}
            </div>
          )}

          <div className={styles.countRow}>
            <p className={screen.hint} aria-live="polite">
              {t('recipeCount', {count: visible.length})}
            </p>
            <Link href={`/c/${slug}/print`} className={styles.linkAction}>
              <Icon name="print" size={20} />
              {t('printBook')}
            </Link>
          </div>

          {visible.length === 0 ? (
            <p className={screen.hint}>{t('noMatch')}</p>
          ) : (
            <ul className={styles.list}>
              {visible.map((recipe) => (
                <li key={recipe.id}>
                  <Link href={`/c/${slug}/r/${recipe.id}`} className={styles.card}>
                    <span className={styles.cardText}>
                      <span className={styles.cardTitle}>{recipe.title}</span>
                      <span className={styles.cardMeta}>
                        {recipe.author ? t('fromWithCategory', {author: recipe.author, category: categories(recipe.category)}) : categories(recipe.category)}
                      </span>
                    </span>
                    <Icon name="chevronRight" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {book.trashCount > 0 && (
        <Link href={`/c/${slug}/trash`} className={styles.trashLink}>
          <Icon name="trash" size={20} />
          {t('trash', {count: book.trashCount})}
        </Link>
      )}

      <div className={screen.bottomBar}>
        <div className={screen.bottomBarInner}>
          <ButtonLink href={`/c/${slug}/new`} size="cta" isFullWidth>
            <Icon name="plus" strokeWidth={2.5} />
            {t('newRecipe')}
          </ButtonLink>
          <p className={screen.tagline}>{common('endorsement')}</p>
        </div>
      </div>
    </main>
  );
}
