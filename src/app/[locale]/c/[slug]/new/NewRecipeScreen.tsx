'use client';

import {useTranslations} from 'next-intl';
import {RecipeForm} from '@/components/book/RecipeForm';
import {AppHeader, BackLink} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {useRouter} from '@/i18n/navigation';
import {createRecipe} from '@/lib/api';
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
        onSubmit={async (input) => {
          const recipeId = await createRecipe(slug, input, getDeviceId());
          router.replace(`/c/${slug}/r/${recipeId}`);
        }}
      />
    </main>
  );
}
