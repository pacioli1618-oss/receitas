// Links people pass around. Framework-free and unit-tested: a wrong link here breaks the whole loop.
// The book slug is the only key to a book, so every link to a recipe is also a link to the book.

/** Book link: the one that goes to the family's WhatsApp group. */
export function buildBookUrl(origin: string, slug: string) {
  return `${origin}/c/${encodeURIComponent(slug)}`;
}

/** One recipe, inside its book. */
export function buildRecipeUrl(origin: string, slug: string, recipeId: string) {
  return `${buildBookUrl(origin, slug)}/r/${encodeURIComponent(recipeId)}`;
}

/** "receitas.gr1618.io/c/sh3v2kw2nc2s": what people see, without the protocol. */
export function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, '');
}

/** Opens WhatsApp (app on phones, web elsewhere) with the message ready to send. */
export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Opens the mail app with the message ready to send to yourself. */
export function buildMailUrl(subject: string, body: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
