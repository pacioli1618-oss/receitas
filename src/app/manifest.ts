import type {MetadataRoute} from 'next';

// /manifest.webmanifest · Lets people add Receitas da Família to the home screen (PWA).
// No service worker yet: recipes live on the server (docs/improvements.md lists offline reading).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Receitas da Família',
    short_name: 'Receitas',
    description: 'O caderno de receitas da família, no celular de todo mundo. Sem cadastro.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fbf6ec',
    theme_color: '#b5432b',
    icons: [
      {src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
      {src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
      {src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
    ],
  };
}
