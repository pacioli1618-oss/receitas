'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Icon} from '@/components/ui/Icon';
import {useRpcErrorMessage} from '@/i18n/errors';
import {buildPhotoUrl, preparePhoto, type PreparedPhoto} from '@/lib/photo';
import styles from './PhotoField.module.css';

/** What the form will do with the photo when it is saved. */
export type PhotoChange = {kind: 'keep'} | {kind: 'new'; photo: PreparedPhoto; previewUrl: string} | {kind: 'remove'};

type PhotoFieldProps = {
  /** The photo the recipe already has (edit), if any. */
  currentPath: string | null;
  value: PhotoChange;
  onChange: (change: PhotoChange) => void;
};

/**
 * "Foto do prato": one button opens the phone's own chooser (camera or gallery). The picture is
 * shrunk right away, so the preview is what will be saved and errors show before "Salvar".
 */
export function PhotoField({currentPath, value, onChange}: PhotoFieldProps) {
  const t = useTranslations('RecipeForm');
  const common = useTranslations('Common');
  const rpcErrorMessage = useRpcErrorMessage();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The picked photo's preview URL is released when it is replaced or the form closes.
  const pickedUrl = value.kind === 'new' ? value.previewUrl : null;
  useEffect(() => {
    if (!pickedUrl) return;
    return () => URL.revokeObjectURL(pickedUrl);
  }, [pickedUrl]);

  const previewUrl = value.kind === 'new' ? value.previewUrl : value.kind === 'keep' && currentPath ? buildPhotoUrl(currentPath) : null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setIsPreparing(true);
    try {
      const photo = await preparePhoto(file);
      onChange({kind: 'new', photo, previewUrl: URL.createObjectURL(photo.full)});
    } catch (failure) {
      setError(rpcErrorMessage(failure));
    } finally {
      setIsPreparing(false);
      if (inputRef.current) inputRef.current.value = ''; // picking the same file again still fires
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label} id={`${inputId}-label`}>
        {t('photo')} <span className={styles.optional}>({common('optional')})</span>
      </span>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob or Storage URL; no optimizer needed
        <img src={previewUrl} alt={t('photoPreview')} className={styles.preview} />
      ) : (
        <p className={styles.hint}>{t('photoHint')}</p>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="visually-hidden"
        aria-labelledby={`${inputId}-label`}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <div className={styles.actions}>
        <label htmlFor={inputId} className={styles.pick} aria-busy={isPreparing}>
          <Icon name="camera" />
          {isPreparing ? t('photoPreparing') : previewUrl ? t('photoChange') : t('photoAdd')}
        </label>
        {previewUrl && (
          <button type="button" className={styles.remove} onClick={() => onChange(currentPath ? {kind: 'remove'} : {kind: 'keep'})}>
            {t('photoRemove')}
          </button>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
