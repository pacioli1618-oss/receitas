import type {ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {Logo} from '@/components/brand/Logo';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import {Link} from '@/i18n/navigation';
import styles from './Screen.module.css';

/** Logo (back to the home page) and the language switcher, or a back link on inner screens. */
export function AppHeader({back}: {back?: ReactNode}) {
  const t = useTranslations('Brand');
  return (
    <header className={styles.header}>
      {back ?? (
        <Link href="/" aria-label={t('name')} className={styles.logoLink}>
          <Logo wordmark={{first: t('wordmarkFirst'), second: t('wordmarkSecond')}} />
        </Link>
      )}
      <LocaleSwitcher />
    </header>
  );
}

/** "← Receitas": the back link at the top of inner screens. */
export function BackLink({href, children}: {href: string; children: ReactNode}) {
  return (
    <Link href={href} className={styles.backLink}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m15 6-6 6 6 6" />
      </svg>
      {children}
    </Link>
  );
}
