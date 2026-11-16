import {Suspense} from 'react';
import {BookScreen} from './BookScreen';

// /c/[slug] · The book: search, categories, every recipe, and "Nova receita".
export default function Page({params}: PageProps<'/[locale]/c/[slug]'>) {
  return (
    <Suspense>
      <Route params={params} />
    </Suspense>
  );
}

async function Route({params}: {params: PageProps<'/[locale]/c/[slug]'>['params']}) {
  const {slug} = await params;
  return <BookScreen slug={slug} />;
}
