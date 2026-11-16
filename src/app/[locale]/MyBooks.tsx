'use client';

import {useTranslations} from 'next-intl';
import screen from '@/components/layout/Screen.module.css';
import {Icon} from '@/components/ui/Icon';
import {useMyBooks} from '@/hooks/use-device-store';
import {Link} from '@/i18n/navigation';
import {forgetBook} from '@/lib/device-store';
import styles from './Home.module.css';

/** "Meus cadernos": books this device has opened. Hidden until there is at least one. */
export function MyBooks() {
  const t = useTranslations('Home');
  const books = useMyBooks();
  if (!books || books.length === 0) return null;

  return (
    <section className={screen.section} aria-labelledby="my-books">
      <h2 id="my-books" className={screen.sectionTitle}>
        {t('myBooks')}
      </h2>
      <ul className={styles.bookList}>
        {books.map((book) => (
          <li key={book.slug} className={styles.bookRow}>
            <Link href={`/c/${book.slug}`} className={styles.bookLink}>
              <Icon name="book" size={26} />
              <span className={styles.bookTitle}>{book.title}</span>
              <Icon name="chevronRight" />
            </Link>
            <button
              type="button"
              className={styles.forget}
              onClick={() => {
                if (window.confirm(t('forgetConfirm', {title: book.title}))) forgetBook(book.slug);
              }}
            >
              {t('forget')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
