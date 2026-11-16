# Receitas da Família

The family recipe book on everyone's phone. One link for the whole family: anyone who has it
can read, add and edit recipes. Built for parents and grandparents: large legible text, a kitchen
mode that keeps the screen on, a photo of the dish, a printable A4 version (one recipe, or the whole book with
cover and contents) and a "pin to home screen" card that installs it like an app.

An experiment by [GR1618 Labs](https://gr1618.io), in the same family as QuemLeva, O Que Falta and
AmigoSecreto. Free, no sign-up, open source (AGPL-3.0).

- **Stack:** Next.js 16 (App Router, `cacheComponents`), next-intl 4, Supabase (Postgres RPCs only), Vercel.
- **Languages:** pt-BR (default), es, en. See `docs/i18n.md`.
- **Database:** schema `receitas` in the SideKick Supabase project, reached only through the
  `public.rc_*` functions (`supabase/migrations/`). Dish photos: public Storage bucket `receitas`,
  shrunk in the browser before upload (`src/lib/photo.ts`).

## Screens

| Route | Screen |
| --- | --- |
| `/` | Create a book; "My books" on this device. Opened from the home-screen icon, it jumps to the book used last. |
| `/c/[slug]` | The book: search, categories, every recipe, "New recipe" |
| `/c/[slug]/link` | The book link: copy, send to the family group, e-mail to yourself |
| `/c/[slug]/new` | New recipe |
| `/c/[slug]/r/[recipeId]` | Kitchen mode: A−/A+, tick off ingredients, screen kept on, WhatsApp, print |
| `/c/[slug]/r/[recipeId]/edit` | Edit a recipe or send it to the trash |
| `/c/[slug]/print?recipe=<id>` | Printable A4 pages (print or save as PDF) |
| `/c/[slug]/trash` | Recipes deleted in the last 30 days, ready to restore |

## Development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Before pushing: `npm run lint`, `npm run typecheck`, `npm run i18n:check`, `npm test`, `npm run build`.

Icons are generated from the logo geometry: `node scripts/make-icons.mjs`.

## Docs

- `docs/conventions.md` — naming, glossary, folders
- `docs/i18n.md` — languages and copy rules
- `docs/deploy.md` — database, Vercel and domain
- `docs/improvements.md` — what is deliberately not built yet
