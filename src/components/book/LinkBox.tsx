'use client';

import {CopyButton} from '@/components/ui/CopyButton';
import {displayUrl} from '@/lib/share-links';
import styles from './Book.module.css';

/** A link shown in full (so people can check it) with a copy button. */
export function LinkBox({url, label}: {url: string; label: string}) {
  return (
    <div className={styles.linkBox}>
      <span className={styles.linkLabel}>{label}</span>
      <span className={styles.linkText}>{displayUrl(url)}</span>
      <CopyButton text={url} variant="secondary" />
    </div>
  );
}
