'use client';

import {useTranslations} from 'next-intl';
import {BookError} from '@/components/book/BookError';
import {RecipeForm} from '@/components/book/RecipeForm';
import {StatusScreen} from '@/components/book/StatusScreen';
import {AppHeader, BackLink} from '@/components/layout/AppHeader';
import screen from '@/components/layout/Screen.module.css';
import {useRecipe} from '@/hooks/use-book';
import {useRouter} from '@/i18n/navigation';
import {deleteRecipe, updateRecipe} from '@/lib/api';

export function EditRecipeScreen({slug, recipeId}: {slug: string; recipeId: string}) {
  const t = useTranslations('RecipeForm');
  const common = useTranslations('Common');
  const router = useRouter();
  const {data: recipe, error, refresh} = useRecipe(slug, recipeId);
  const recipeHref = `/c/${slug}/r/${recipeId}`;

  if (error && !recipe) return <BookError error={error} onRetry={() => void refresh()} bookHref={`/c/${slug}`} />;
  if (!recipe) return <StatusScreen message={common('loading')} />;

  return (
    <main className={`${screen.screen} ${screen.withBottomBar}`}>
      <AppHeader back={<BackLink href={recipeHref}>{common('cancel')}</BackLink>} />
      <h1 className={screen.title}>{t('editTitle')}</h1>
      <RecipeForm
        initial={{
          title: recipe.title,
          author: recipe.author ?? '',
          category: recipe.category,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          tip: recipe.tip ?? '',
        }}
        onSubmit={async (input) => {
          await updateRecipe(slug, recipeId, input);
          router.replace(recipeHref);
        }}
        onDelete={async () => {
          await deleteRecipe(slug, recipeId);
          router.replace(`/c/${slug}`);
        }}
      />
    </main>
  );
}
