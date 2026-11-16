'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {LogoSymbol} from '@/components/brand/Logo';
import {Button} from '@/components/ui/Button';
import {CopyButton} from '@/components/ui/CopyButton';
import {useInstallMode} from '@/hooks/use-install';
import {setPreferences} from '@/lib/device-store';
import {promptInstall} from '@/lib/install';
import styles from './InstallCard.module.css';

type InstallCardProps = {
  /** The book screen lets people say "Agora não"; the link screen always shows it. */
  isDismissible?: boolean;
  /** Shown in "open in the browser" instructions, so the person can copy it. */
  url?: string;
};

/** "Fixar na tela do celular": one tap where the browser allows it, the steps where it doesn't. */
export function InstallCard({isDismissible = false, url}: InstallCardProps) {
  const t = useTranslations('Install');
  const mode = useInstallMode();
  const [isOpen, setIsOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  if (mode === null || mode === 'installed' || mode === 'unsupported') return null;

  async function handleInstall() {
    if (mode !== 'prompt') {
      setIsOpen((open) => !open);
      return;
    }
    setIsWorking(true);
    await promptInstall();
    setIsWorking(false);
  }

  return (
    <section className={styles.card} aria-labelledby="install-title">
      <div className={styles.head}>
        <LogoSymbol size={48} />
        <div className={styles.text}>
          <h2 id="install-title" className={styles.title}>
            {t('title')}
          </h2>
          <p className={styles.body}>{t('body')}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={() => void handleInstall()} isLoading={isWorking} aria-expanded={mode === 'prompt' ? undefined : isOpen} className={styles.primary}>
          {t('button')}
        </Button>
        {isDismissible && (
          <Button variant="ghost" onClick={() => setPreferences({isInstallCardDismissed: true})}>
            {t('notNow')}
          </Button>
        )}
      </div>

      {isOpen && mode === 'ios' && (
        <ol className={styles.steps}>
          <li>
            <span className={styles.number}>1</span>
            <span>
              {t.rich('iosStep1', {
                icon: () => (
                  <svg className={styles.inlineIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={t('shareIconLabel')}>
                    <path d="M12 3v12" />
                    <path d="m7 8 5-5 5 5" />
                    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                  </svg>
                ),
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </li>
          <li>
            <span className={styles.number}>2</span>
            <span>{t.rich('iosStep2', {strong: (chunks) => <strong>{chunks}</strong>})}</span>
          </li>
          <li>
            <span className={styles.number}>3</span>
            <span>{t.rich('iosStep3', {strong: (chunks) => <strong>{chunks}</strong>})}</span>
          </li>
        </ol>
      )}

      {isOpen && mode === 'menu' && (
        <ol className={styles.steps}>
          <li>
            <span className={styles.number}>1</span>
            <span>{t.rich('menuStep1', {strong: (chunks) => <strong>{chunks}</strong>})}</span>
          </li>
          <li>
            <span className={styles.number}>2</span>
            <span>{t.rich('menuStep2', {strong: (chunks) => <strong>{chunks}</strong>})}</span>
          </li>
        </ol>
      )}

      {isOpen && mode === 'in-app' && (
        <div className={styles.steps}>
          <p className={styles.inApp}>{t('inApp')}</p>
          {url && <CopyButton text={url} variant="secondary" />}
        </div>
      )}
    </section>
  );
}
