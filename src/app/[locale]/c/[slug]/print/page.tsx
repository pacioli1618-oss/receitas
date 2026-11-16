import {Suspense} from 'react';
import {PrintScreen} from './PrintScreen';

// /c/[slug]/print?recipe=<id> · Printable A4 pages: one recipe, or the whole book with cover and contents.
export default function Page({params}: PageProps<'/[locale]/c/[slug]/print'>) {
  return (
    <Suspense>
      <Route params={params} />
    </Suspense>
  );
}

async function Route({params}: {params: PageProps<'/[locale]/c/[slug]/print'>['params']}) {
  const {slug} = await params;
  return <PrintScreen slug={slug} />;
}
