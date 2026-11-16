// Recipes are stored as the family wrote them: ingredients one per line, steps as free text
// (often pasted from WhatsApp). These helpers only shape that text for reading; they never
// change what is stored. Framework-free and unit-tested.

// Bullets and list marks people type or paste: "- ", "• ", "* ", "1. ", "2) ", "✅ ".
// A number only counts as a mark when ". " or ") " follows it, so "1.5 kg" and "2-3 dentes"
// keep their quantities.
const LEADING_MARK = /^\s*(?:[-–—•*·▪●◦✓✔✅]+\s*|\d{1,2}[.)]\s+)/u;

function cleanLine(line: string) {
  return line.replace(LEADING_MARK, '').replace(/\s+/g, ' ').trim();
}

/** "3 ovos\n- 2 xícaras de açúcar\n\n" → ["3 ovos", "2 xícaras de açúcar"]. */
export function splitIngredients(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);
}

/**
 * Steps for a numbered list. One step per line; a single long paragraph stays as one step
 * (people often write the whole method in one go, and guessing sentence breaks gets it wrong).
 */
export function splitSteps(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);
}

type RecipeForText = {
  title: string;
  author: string | null;
  ingredients: string;
  steps: string;
  tip: string | null;
};

type TextLabels = {
  /** "receita da Vó Lurdes" — already translated, with the author in it. */
  byline: string | null;
  ingredients: string;
  steps: string;
  tip: string;
  link: string;
};

/** The recipe as a WhatsApp message (*bold* is WhatsApp's own markup). */
export function buildRecipeMessage(recipe: RecipeForText, labels: TextLabels, url: string) {
  const lines: string[] = [`*${recipe.title}*`];
  if (labels.byline) lines.push(`_${labels.byline}_`);

  const ingredients = splitIngredients(recipe.ingredients);
  if (ingredients.length > 0) {
    lines.push('', `*${labels.ingredients}*`, ...ingredients.map((item) => `• ${item}`));
  }

  const steps = splitSteps(recipe.steps);
  if (steps.length > 0) {
    lines.push('', `*${labels.steps}*`, ...steps.map((step, index) => `${index + 1}. ${step}`));
  }

  if (recipe.tip?.trim()) lines.push('', `*${labels.tip}*`, recipe.tip.trim());
  lines.push('', `${labels.link} ${url}`);
  return lines.join('\n');
}

/** Case- and accent-insensitive search over title and author ("vo" finds "Vó Lurdes"). */
export function normalizeForSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .trim();
}

export function matchesSearch(recipe: {title: string; author: string | null}, query: string) {
  const needle = normalizeForSearch(query);
  if (!needle) return true;
  return normalizeForSearch(`${recipe.title} ${recipe.author ?? ''}`).includes(needle);
}
