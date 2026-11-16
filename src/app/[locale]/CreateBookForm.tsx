'use client';

import {useState, type FormEvent} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {LegalLinks} from '@/components/legal/LegalLinks';
import screen from '@/components/layout/Screen.module.css';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {TextField} from '@/components/ui/TextField';
import {useRpcErrorMessage} from '@/i18n/errors';
import {useRouter} from '@/i18n/navigation';
import {createBook} from '@/lib/api';
import {getDeviceId, rememberBook} from '@/lib/device-store';
import styles from './Home.module.css';

export function CreateBookForm() {
  const t = useTranslations('Home');
  const common = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const rpcErrorMessage = useRpcErrorMessage();

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(t('titleRequired'));
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      const created = await createBook(trimmedTitle, locale, getDeviceId());
      rememberBook(created.slug, trimmedTitle);
      router.push(`/c/${created.slug}/link?created=1`);
    } catch (error) {
      setFormError(rpcErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Card variant="large" className={styles.fields}>
        <h2 className={screen.sectionTitle}>{t('createTitle')}</h2>
        <TextField
          label={t('title')}
          hint={t('titleHint')}
          placeholder={t('titlePlaceholder')}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (titleError) setTitleError(null);
          }}
          error={titleError}
          maxLength={80}
          required
        />
      </Card>

      <div className={screen.footer}>
        {formError && (
          <p className={screen.formError} role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" size="cta" isFullWidth isLoading={isSubmitting}>
          {t('submit')}
        </Button>
        <p className={screen.tagline}>{common('tagline')}</p>
        <p className={screen.tagline}>{common('endorsement')}</p>
        <LegalLinks />
      </div>
    </form>
  );
}
