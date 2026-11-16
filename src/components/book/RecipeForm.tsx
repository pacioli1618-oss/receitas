'use client';

import {useState, type FormEvent} from 'react';
import {useTranslations} from 'next-intl';
import screen from '@/components/layout/Screen.module.css';
import {Button} from '@/components/ui/Button';
import {Icon} from '@/components/ui/Icon';
import {TextAreaField} from '@/components/ui/TextAreaField';
import {TextField} from '@/components/ui/TextField';
import {useRpcErrorMessage} from '@/i18n/errors';
import {categoryCodes, type RecipeInput} from '@/lib/api';
import {PhotoField, type PhotoChange} from './PhotoField';
import styles from './RecipeForm.module.css';

type RecipeFormProps = {
  initial?: RecipeInput;
  /** Edit: the photo the recipe already has. */
  initialPhotoPath?: string | null;
  /** Throws on failure; the form shows the translated error. */
  onSubmit: (input: RecipeInput, photo: PhotoChange) => Promise<void>;
  /** Edit only: send the recipe to the trash. */
  onDelete?: () => Promise<void>;
};

const emptyRecipe: RecipeInput = {title: '', author: '', category: 'other', ingredients: '', steps: '', tip: ''};

/** New recipe and edit recipe: same fields, written the way the person who taught it would. */
export function RecipeForm({initial = emptyRecipe, initialPhotoPath = null, onSubmit, onDelete}: RecipeFormProps) {
  const t = useTranslations('RecipeForm');
  const common = useTranslations('Common');
  const categories = useTranslations('Categories');
  const rpcErrorMessage = useRpcErrorMessage();

  const [values, setValues] = useState<RecipeInput>(initial);
  const [photo, setPhoto] = useState<PhotoChange>({kind: 'keep'});
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const set = <K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) => setValues((previous) => ({...previous, [key]: value}));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.title.trim()) {
      setTitleError(t('titleRequired'));
      document.getElementById('recipe-title')?.focus();
      return;
    }
    setFormError(null);
    setIsSaving(true);
    try {
      await onSubmit({...values, title: values.title.trim(), author: values.author.trim(), tip: values.tip.trim()}, photo);
    } catch (error) {
      setFormError(rpcErrorMessage(error));
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !window.confirm(t('deleteConfirm'))) return;
    setFormError(null);
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      setFormError(rpcErrorMessage(error));
      setIsDeleting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {!onDelete && (
        <div className={screen.notice}>
          <Icon name="clipboard" className={screen.noticeIcon} />
          <p>{t('pasteHint')}</p>
        </div>
      )}

      <TextField
        id="recipe-title"
        label={t('title')}
        placeholder={t('titlePlaceholder')}
        value={values.title}
        onChange={(event) => {
          set('title', event.target.value);
          if (titleError) setTitleError(null);
        }}
        error={titleError}
        maxLength={120}
        required
      />

      <TextField
        label={t('author')}
        placeholder={t('authorPlaceholder')}
        value={values.author}
        onChange={(event) => set('author', event.target.value)}
        maxLength={60}
      />

      <PhotoField currentPath={initialPhotoPath} value={photo} onChange={setPhoto} />

      <fieldset className={styles.categories}>
        <legend className={styles.legend}>{t('category')}</legend>
        <div className={styles.chips}>
          {categoryCodes.map((code) => (
            <label key={code} className={styles.chip}>
              <input type="radio" name="category" value={code} checked={values.category === code} onChange={() => set('category', code)} />
              <span>{categories(code)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextAreaField
        label={t('ingredients')}
        hint={t('ingredientsHint')}
        placeholder={t('ingredientsPlaceholder')}
        value={values.ingredients}
        onChange={(event) => set('ingredients', event.target.value)}
        rows={6}
        maxLength={5000}
      />

      <TextAreaField
        label={t('steps')}
        hint={t('stepsHint')}
        placeholder={t('stepsPlaceholder')}
        value={values.steps}
        onChange={(event) => set('steps', event.target.value)}
        rows={6}
        maxLength={10000}
      />

      <TextAreaField
        label={`${t('tip')} (${common('optional')})`}
        placeholder={t('tipPlaceholder')}
        value={values.tip}
        onChange={(event) => set('tip', event.target.value)}
        rows={2}
        maxLength={1000}
      />

      {onDelete && (
        <Button variant="ghost" onClick={() => void handleDelete()} isLoading={isDeleting} className={styles.delete}>
          <Icon name="trash" size={20} />
          {t('delete')}
        </Button>
      )}

      <div className={screen.bottomBar}>
        <div className={screen.bottomBarInner}>
          {formError && (
            <p className={screen.formError} role="alert">
              {formError}
            </p>
          )}
          <Button type="submit" size="cta" isFullWidth isLoading={isSaving}>
            <Icon name="check" strokeWidth={2.5} />
            {t('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
