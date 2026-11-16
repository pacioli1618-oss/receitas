import {Suspense} from 'react';
import {RecipeScreen} from './RecipeScreen';

// /c/[slug]/r/[recipeId] · Kitchen mode: large text, tick off ingredients, screen kept on.
export default function Page({params}: PageProps<'/[locale]/c/[slug]/r/[recipeId]'>) {
  return (
    <Suspense>
      <Route params={params} />
    </Suspense>
  );
}

async function Route({params}: {params: PageProps<'/[locale]/c/[slug]/r/[recipeId]'>['params']}) {
  const {slug, recipeId} = await params;
  return <RecipeScreen slug={slug} recipeId={recipeId} />;
}
