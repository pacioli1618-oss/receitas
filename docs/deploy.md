# Deploy

Production runs on **Vercel** (Next.js, no Vercel-specific code) with the **SideKick Supabase
project** (sa-east-1), shared with QuemLeva, O Que Falta and AmigoSecreto, in its own `receitas` schema.

## 1. Database

`supabase/migrations/20261116000100_receitas_schema.sql` creates the `receitas` schema and the
`public.rc_*` functions. It does not touch the other apps' schemas. It was applied on 2026-11-16.

## 2. Vercel project

1. Import the GitHub repository in Vercel (framework preset: Next.js, default build and output).
2. Environment variables (Production and Preview):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://uqkyhzvdwynpkqdiuvyn.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable key (`.env.example`) |
   | `NEXT_PUBLIC_SITE_URL` | optional: `https://receitas.gr1618.io` (base of the link-preview image URL) |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | optional: contact on About, Privacy and Terms; without it, GitHub issues |

   Both Supabase values are public by design: the browser calls the `rc_*` RPCs directly and the
   tables are not exposed.
3. Function region: **São Paulo (gru1)**, next to the database (`vercel.json`).

## 3. Domain

`receitas.gr1618.io` (DNS for `gr1618.io` is managed at Hover).

1. Vercel → Project → Settings → Domains → add `receitas.gr1618.io`.
2. At Hover, add the `CNAME` record Vercel shows (name `receitas`).
3. Wait for Vercel to mark the domain valid; HTTPS is automatic.

## 4. Smoke test after each deploy

1. Phone A: create a book, send the link to phone B on WhatsApp. The preview card shows the book name.
2. Phone B: open the link, add a recipe by pasting text from a WhatsApp chat.
3. Phone A: open the recipe. A+ makes the text bigger; ticking an ingredient strikes it through;
   the screen stays on (Chrome on Android, Safari 16.4+).
4. Send the recipe on WhatsApp: the message has the title, ingredients, steps and the link.
5. Print → "O caderno inteiro" → Save as PDF: cover, contents, one recipe per page, QR codes open the recipe.
6. Edit → "Mandar para a lixeira", then restore it from the trash.
