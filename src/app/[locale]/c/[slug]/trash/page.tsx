import {Suspense} from 'react';
import {TrashScreen} from './TrashScreen';

// /c/[slug]/trash · Recipes sent to the trash in the last 30 days, ready to restore.
export default function Page({params}: PageProps<'/[locale]/c/[slug]/trash'>) {
  return (
    <Suspense>
      <Route params={params} />
    </Suspense>
  );
}

async function Route({params}: {params: PageProps<'/[locale]/c/[slug]/trash'>['params']}) {
  const {slug} = await params;
  return <TrashScreen slug={slug} />;
}
