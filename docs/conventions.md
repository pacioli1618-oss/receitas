# Naming conventions

English is the base language of the codebase. Everything a developer reads or types is in English: identifiers, files, folders, routes, database objects, error codes, commits, code comments and developer docs. Only **user-facing text** is translated, and it lives in `messages/<locale>.json`, never in code.

## 1. Domain glossary

One concept, one word, everywhere: database, TypeScript, i18n keys and docs. When a pt-BR UI word has no listed term, add it here before using it.

| pt-BR (UI) | Code term | Examples |
| --- | --- | --- |
| Caderno (de receitas) | `book` | `receitas.books`, `BookView`, `getBook()`, `/c/[slug]` |
| Link do caderno | `book link` | `buildBookUrl()`; the slug is the only key |
| Receita | `recipe` | `receitas.recipes`, `RecipeView`, `rc_create_recipe` |
| De quem é a receita | `author` | `recipes.author`, `p_author` |
| Categoria | `category` | `sweets`, `savory`, `party`, `drinks`, `other` |
| Ingredientes | `ingredients` | free text, one per line; `splitIngredients()` |
| Modo de preparo | `steps` | free text; `splitSteps()` |
| Dica ou lembrança | `tip` | `recipes.tip` |
| Lixeira | `trash` | `recipes.deleted_at`, `rc_get_trash`, `rc_restore_recipe` |
| Modo cozinha | `kitchen mode` | `RecipeScreen` |
| Tela sempre acesa | `wake lock` / `screen kept on` | `useWakeLock()`, `isScreenKeptOn` |
| Tamanho da letra | `text size` | `textSize`, A− / A+ |
| Versão para imprimir | `print` | `/c/[slug]/print`, `PrintScreen` |
| Meus cadernos | `my books` | `useMyBooks()` |
| Aparelho | `device` | `deviceId`, `device-store.ts` |

## 2. Abbreviations

Write words out in full: `quantity`, not `qty`; `event`, not `evt`; `participant`, not `part`.

These are the only allowed abbreviations: `id`, `url`, `api`, `db`, `i18n`, `ui`, `pwa`, `og` (Open Graph), `pdf`, `qr`, plus the SQL prefixes in section 4.

## 3. TypeScript and React

| Thing | Style | Example |
| --- | --- | --- |
| React component file | `PascalCase.tsx` | `LocaleSwitcher.tsx`, `ItemCard.tsx` |
| Any other module | `kebab-case.ts` | `device-store.ts`, `use-loader.ts` |
| Component, type, interface | `PascalCase`, no `I` prefix | `GroupSummary`, `GroupView`, `StoredGroup` |
| Function, variable | `camelCase`, verb first for functions | `createGroup()`, `parseAmount()` |
| Hook | `useCamelCase`, file `use-kebab.ts` | `useLoader()` in `use-loader.ts` |
| Boolean | `is`, `has`, `can` or `should` prefix | `isHost`, `hasClaims` |
| Event handler | `handleX` inside, `onX` as a prop | `onRemove={handleRemove}` |
| Module-level constant | `SCREAMING_SNAKE_CASE` for fixed scalars | `STORAGE_KEY`, `DEBOUNCE_MS` |
| Readonly list of codes | `camelCase` plural, with a singular type | `categoryCodes` / `CategoryCode` |
| Next.js special files | the framework's names | `page.tsx`, `layout.tsx`, `proxy.ts` |
| Test file | `tests/<module>.test.ts`; fixtures in `tests/fixtures/`, named after the RPC | `tests/api-mappers.test.ts`, `rc_get_book.json` |

**Database ↔ TypeScript boundary:** the database speaks `snake_case` and TypeScript speaks `camelCase`. The conversion happens only in `src/lib/api.ts` and `src/lib/api-mappers.ts`. Components never see `p_` parameters or snake_case fields.

## 4. Database (Postgres / Supabase)

| Thing | Style | Example |
| --- | --- | --- |
| Schema | app name | `receitas` |
| Table | `snake_case`, plural noun | `books`, `recipes`, `create_book_log` |
| Column | `snake_case`, singular | `book_id`, `deleted_at` |
| Primary key | `id uuid` | |
| Foreign key | `<singular table>_id` | `book_id` |
| Timestamp | `<verb>_at` (`timestamptz`) | `created_at`, `updated_at`, `deleted_at` |
| Boolean | `is_` / `has_`, or a past participle | `p_with_details` |
| Code-valued text | `text` + `check (... in (...))`, English codes | `category in ('sweets', ...)` |
| Public RPC | `rc_<verb>_<noun>` in `public` | `rc_create_book`, `rc_update_recipe`, `rc_get_trash` |
| Internal helper | `<verb>_<noun>` in `receitas` | `require_book`, `save_recipe`, `purge_trash` |
| Function parameter | `p_` + `snake_case` | `p_slug`, `p_recipe_id` |
| PL/pgSQL local variable | `v_` + `snake_case` | `v_slug`, `v_title` |
| Index | `<table>_<columns>_idx` | `recipes_book_id_idx` |
| Migration file | `<YYYYMMDDHHMMSS>_<snake_case_summary>.sql` | `20261108000300_naming_conventions.sql` |

Columns repeat the table name only when the bare word is a SQL type or keyword.

**RPC verbs:** use `get`, `create`, `update`, `delete` (to the trash), `restore`.

## 5. Error codes

Errors raised by RPCs carry a fixed English code as the message, in `snake_case`: `<subject>_<problem>` (`book_not_found`, `recipe_title_required`) or a generic state (`rate_limited`). Extra data goes in `DETAIL` (`rate_limited` → `hour` or `day`). The `Errors` namespace in `messages/*.json` uses the **same codes as keys**. This is the one place where i18n keys are `snake_case`.

## 6. Realtime

Not used yet. If added, the channel topic is `<entity>:<key>` (`book:<slug>`) and broadcast event names are past-tense verbs (`changed`).

## 7. Routes and URLs

Paths are short, lowercase, kebab-case English. They never include the locale (see `docs/i18n.md`).

| Route | Screen |
| --- | --- |
| `/` | Create a book; "My books" |
| `/c/[slug]` | The book |
| `/c/[slug]/link` | The book link (`?created=1` right after creating it) |
| `/c/[slug]/new` | New recipe |
| `/c/[slug]/r/[recipeId]` | Kitchen mode |
| `/c/[slug]/r/[recipeId]/edit` | Edit a recipe, send it to the trash |
| `/c/[slug]/print` | Printable pages (`?recipe=<id>` starts with that recipe) |
| `/c/[slug]/trash` | Trash |
| `/about`, `/privacy`, `/terms` | About, privacy policy, terms. Operator and contact in `src/lib/site.ts`. |
| `/api/og/[slug]`, `/api/og?locale=` | Link-preview image (book card, or the app's card). Under `/api` so the locale proxy skips it. |

Link previews: `app/[locale]/c/[slug]/layout.tsx` sets the og/twitter tags for every page of a book,
in the **book's** language (`books.locale`), since crawlers send no cookie. They show the book name and
how many recipes it has, never the recipes. Book pages are `noindex`.

## 8. i18n messages

- **Namespaces** are `PascalCase`, one per screen or shared area: `Home`, `Book`, `Recipe`, `Common`.
- **Keys** are `camelCase`, named for meaning, not wording: `emptyTitle`, not `cadernoVazio`.
- **Code-valued keys** match the stored code exactly: `Errors.book_not_found`.
- `pt-BR` is the source file; `npm run i18n:check` enforces the rest.

## 9. CSS and design tokens

- **Tokens:** custom properties use the Design System token names, in `kebab-case` English: `--surface`, `--brand-strong`, `--herb-tint`, `--radius-md`. They are all declared in `src/app/globals.css`.
- **Styling:** CSS Modules, one `Component.module.css` next to `Component.tsx`. Class names are `camelCase` (`styles.fullWidth`).
- **Colors and sizes** come only from tokens (`var(--…)`). No hex values or magic radii inside components.
- **Borders, not shadows.**

## 10. Folders

| Folder | What goes there |
| --- | --- |
| `src/app/[locale]/` | Routes (pages, layouts). Page-only components sit next to their `page.tsx`. |
| `src/components/brand/` | Logo and other brand marks |
| `src/components/ui/` | Design System primitives with no domain knowledge: `Button`, `TextField`, `TextAreaField`, `Card`, `CopyButton`, `Icon` |
| `src/components/book/` | Components that know the domain: `RecipeForm`, `LinkBox`, `BookError`, `StatusScreen` |
| `src/hooks/` | React hooks shared across screens: `use-loader.ts`, `use-book.ts`, `use-device-store.ts`, `use-wake-lock.ts`, `use-origin.ts` |
| `src/lib/` | Framework-free logic and the database door: `api.ts`, `api-mappers.ts`, `share-links.ts`, `recipe-text.ts`, `clipboard.ts`, `device-store.ts` |
| `src/i18n/` | Locales, routing, formatting helpers |

## 11. Environment variables

`SCREAMING_SNAKE_CASE`. The `NEXT_PUBLIC_` prefix only for values that are safe in the browser: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Server secrets have no prefix: `SUPABASE_SECRET_KEY`.

## 12. Git

- **Branches:** `<type>/<kebab-summary>`, as in `feat/recipe-photo` or `fix/print-order`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org) in English, imperative mood, as in `feat(print): add the contents page`. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `db` (migrations), `i18n`.

## 13. Comments and docs

- **Code comments** are in English and explain *why*, not *what*.
- **Developer docs** (`README.md`, `docs/`) are in English.
- **Product and business documents** for the team, outside the repository, may stay in pt-BR.
