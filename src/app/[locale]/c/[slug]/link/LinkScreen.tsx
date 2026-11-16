'use client';

import {useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {BookError} from '@/components/book/BookError';
import {LinkBox} from '@/components/book/LinkBox';
import {InstallCard} from '@/components/install/InstallCard';
import {StatusScreen} from '@/components/book/StatusScreen';
import {AppHeader, BackLink} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {buttonClassName, ButtonLink} from '@/components/ui/Button';
import {Icon} from '@/components/ui/Icon';
import {useBook} from '@/hooks/use-book';
import {useOrigin} from '@/hooks/use-origin';
import {buildBookUrl, buildMailUrl, buildWhatsAppUrl} from '@/lib/share-links';
import styles from './LinkScreen.module.css';

/** The book link: right after creating the book, and any time from the book screen. */
export function LinkScreen({slug}: {slug: string}) {
  const t = useTranslations('BookLink');
  const common = useTranslations('Common');
  const isJustCreated = useSearchParams().get('created') === '1';
  const origin = useOrigin();
  const {data: book, error, refresh} = useBook(slug);

  if (error && !book) return <BookError error={error} onRetry={() => void refresh()} />;
  if (!book || !origin) return <StatusScreen message={common('loading')} />;

  const url = buildBookUrl(origin, slug);
  const whatsAppMessage = t('whatsAppMessage', {title: book.title, url});

  return (
    <main className={screen.screen}>
      <AppHeader back={isJustCreated ? undefined : <BackLink href={`/c/${slug}`}>{common('backToBook')}</BackLink>} />

      <div className={styles.heading}>
        {isJustCreated && (
          <span className={styles.check}>
            <Icon name="check" size={30} strokeWidth={2.5} />
          </span>
        )}
        <h1 className={screen.title}>{isJustCreated ? t('createdTitle') : t('title')}</h1>
        <p className={screen.lead}>{t('lead')}</p>
      </div>

      <LinkBox url={url} label={t('linkLabel')} />

      <div className={screen.stack}>
        <a href={buildWhatsAppUrl(whatsAppMessage)} target="_blank" rel="noopener noreferrer" className={buttonClassName({size: 'cta', isFullWidth: true})}>
          <Icon name="send" />
          {t('sendToGroup')}
        </a>
        <a href={buildMailUrl(t('mailSubject', {title: book.title}), whatsAppMessage)} className={buttonClassName({variant: 'secondary', size: 'cta', isFullWidth: true})}>
          <Icon name="mail" />
          {t('sendToMe')}
        </a>
      </div>

      <div className={`${screen.notice} ${screen.noticeHerb}`}>
        <Icon name="cloud" className={screen.noticeIcon} />
        <p>{t('cloudNote')}</p>
      </div>

      <InstallCard url={url} />

      {isJustCreated && (
        <ButtonLink href={`/c/${slug}`} variant="ghost" size="cta" isFullWidth>
          {t('openBook')}
        </ButtonLink>
      )}

      <p className={`${screen.tagline} ${screen.footer}`}>{common('endorsement')}</p>
    </main>
  );
}
