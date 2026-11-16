'use client';

import {useState} from 'react';
import {useFormatter, useTranslations} from 'next-intl';
import {BookError} from '@/components/book/BookError';
import {StatusScreen} from '@/components/book/StatusScreen';
import {AppHeader, BackLink} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {Button} from '@/components/ui/Button';
import {Icon} from '@/components/ui/Icon';
import {useLoader} from '@/hooks/use-loader';
import {useRpcErrorMessage} from '@/i18n/errors';
import {getTrash, restoreRecipe} from '@/lib/api';
import styles from './TrashScreen.module.css';

/** Recipes sent to the trash: anyone in the family can bring one back within 30 days. */
export function TrashScreen({slug}: {slug: string}) {
  const t = useTranslations('Trash');
  const common = useTranslations('Common');
  const format = useFormatter();
  const rpcErrorMessage = useRpcErrorMessage();
  const {data: recipes, error, refresh} = useLoader(`trash:${slug}`, () => getTrash(slug));
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error && !recipes) return <BookError error={error} onRetry={() => void refresh()} />;
  if (!recipes) return <StatusScreen message={common('loading')} />;

  async function handleRestore(recipeId: string) {
    setActionError(null);
    setRestoringId(recipeId);
    try {
      await restoreRecipe(slug, recipeId);
      await refresh();
    } catch (failure) {
      setActionError(rpcErrorMessage(failure));
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <main className={screen.screen}>
      <AppHeader back={<BackLink href={`/c/${slug}`}>{common('backToBook')}</BackLink>} />
      <h1 className={screen.title}>{t('title')}</h1>
      <p className={screen.lead}>{t('lead')}</p>
      {actionError && (
        <p className={screen.formError} role="alert">
          {actionError}
        </p>
      )}
      {recipes.length === 0 ? (
        <p className={screen.hint}>{t('empty')}</p>
      ) : (
        <ul className={styles.list}>
          {recipes.map((recipe) => (
            <li key={recipe.id} className={styles.row}>
              <span className={styles.text}>
                <span className={styles.title}>{recipe.title}</span>
                <span className={styles.meta}>{t('deletedOn', {date: format.dateTime(new Date(recipe.deletedAt), {day: 'numeric', month: 'long'})})}</span>
              </span>
              <Button variant="secondary" onClick={() => void handleRestore(recipe.id)} isLoading={restoringId === recipe.id}>
                <Icon name="undo" size={20} />
                {t('restore')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
