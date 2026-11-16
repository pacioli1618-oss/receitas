import {useTranslations} from 'next-intl';
import {AppHeader} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {CreateBookForm} from './CreateBookForm';
import {MyBooks} from './MyBooks';
import {OpenLastBook} from './OpenLastBook';
import styles from './Home.module.css';

// Home · Create a book, or open one this device already knows. Static shell; the form and
// the list run in the browser (device id, device store).
export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <main className={screen.screen}>
      <OpenLastBook />
      <AppHeader />
      <section className={styles.intro}>
        <h1 className={screen.title}>{t('headline')}</h1>
        <p className={screen.lead}>{t('intro')}</p>
      </section>
      <MyBooks />
      <CreateBookForm />
    </main>
  );
}
