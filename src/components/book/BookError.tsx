'use client';

import {useTranslations} from 'next-intl';
import {AppHeader} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {ButtonLink} from '@/components/ui/Button';
import {Button} from '@/components/ui/Button';
import {getRpcErrorCode, useRpcErrorMessage} from '@/i18n/errors';

/** Full-screen error for a book or recipe that could not be opened. */
export function BookError({error, onRetry, bookHref}: {error: unknown; onRetry: () => void; bookHref?: string}) {
  const t = useTranslations('Common');
  const rpcErrorMessage = useRpcErrorMessage();
  const code = getRpcErrorCode(error);
  const isMissing = code === 'book_not_found' || code === 'recipe_not_found';

  return (
    <main className={screen.screen}>
      <AppHeader />
      <p role="alert" className={`${screen.centered} ${screen.errorText}`}>
        {rpcErrorMessage(error)}
      </p>
      <div className={screen.stack}>
        {isMissing ? (
          <ButtonLink href={code === 'recipe_not_found' && bookHref ? bookHref : '/'} variant="secondary" size="cta" isFullWidth>
            {code === 'recipe_not_found' ? t('backToBook') : t('home')}
          </ButtonLink>
        ) : (
          <Button variant="secondary" size="cta" isFullWidth onClick={onRetry}>
            {t('retry')}
          </Button>
        )}
      </div>
    </main>
  );
}
