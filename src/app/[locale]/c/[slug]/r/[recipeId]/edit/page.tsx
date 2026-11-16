import {Suspense} from 'react';
import {EditRecipeScreen} from './EditRecipeScreen';

// /c/[slug]/r/[recipeId]/edit · Edit a recipe, or send it to the trash.
export default function Page({params}: PageProps<'/[locale]/c/[slug]/r/[recipeId]/edit'>) {
  return (
    <Suspense>
      <Route params={params} />
    </Suspense>
  );
}

async function Route({params}: {params: PageProps<'/[locale]/c/[slug]/r/[recipeId]/edit'>['params']}) {
  const {slug, recipeId} = await params;
  return <EditRecipeScreen slug={slug} recipeId={recipeId} />;
}
