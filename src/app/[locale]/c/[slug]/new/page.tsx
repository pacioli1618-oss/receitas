import {Suspense} from 'react';
import {NewRecipeScreen} from './NewRecipeScreen';

// /c/[slug]/new · Add a recipe.
export default function Page({params}: PageProps<'/[locale]/c/[slug]/new'>) {
  return (
    <Suspense>
      <Route params={params} />
    </Suspense>
  );
}

async function Route({params}: {params: PageProps<'/[locale]/c/[slug]/new'>['params']}) {
  const {slug} = await params;
  return <NewRecipeScreen slug={slug} />;
}
