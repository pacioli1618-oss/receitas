'use client';

import {useTranslations} from 'next-intl';
import {RecipeForm} from '@/components/book/RecipeForm';
import {AppHeader, BackLink} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {useRouter} from '@/i18n/navigation';
import {createRecipe, saveRecipePhoto} from '@/lib/api';
import {getDeviceId} from '@/lib/device-store';

export function NewRecipeScreen({slug}: {slug: string}) {
  const t = useTranslations('RecipeForm');
  const common = useTranslations('Common');
  const router = useRouter();

  return (
    <main className={`${screen.screen} ${screen.withBottomBar}`}>
      <AppHeader back={<BackLink href={`/c/${slug}`}>{common('cancel')}</BackLink>} />
      <h1 className={screen.title}>{t('newTitle')}</h1>
      <RecipeForm
        onSubmit={async (input, photo) => {
          const recipeId = await createRecipe(slug, input, getDeviceId());
          if (photo.kind === 'new') {
            try {
              await saveRecipePhoto(slug, recipeId, photo.photo);
            } catch {
              // The recipe is saved; only the photo is missing. Edit lets them try again.
              router.replace(`/c/${slug}/r/${recipeId}/edit?photo=failed`);
              return;
            }
          }
          router.replace(`/c/${slug}/r/${recipeId}`);
        }}
      />
    </main>
  );
}
