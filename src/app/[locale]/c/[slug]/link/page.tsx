import {Suspense} from 'react';
import {LinkScreen} from './LinkScreen';

// /c/[slug]/link · The book link: copy it, send it to the family group or to your own e-mail.
export default function Page({params}: PageProps<'/[locale]/c/[slug]/link'>) {
  return (
    <Suspense>
      <Route params={params} />
    </Suspense>
  );
}

async function Route({params}: {params: PageProps<'/[locale]/c/[slug]/link'>['params']}) {
  const {slug} = await params;
  return <LinkScreen slug={slug} />;
}
