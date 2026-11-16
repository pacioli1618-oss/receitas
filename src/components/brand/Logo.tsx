// Receitas da Família mark: a spiral recipe notebook with a heart on the cover.
// Same geometry as app/icon.svg, the PWA icons in public/icons/ (scripts/make-icons.mjs) and the
// link-preview image. Below 32px use the simplified mark: 3 thicker rings, bigger heart, no label.
// The wordmark is live text in the app fonts, so it stays crisp and is read by screen readers.

export const LOGO = {
  full: {
    cover: {x: 28, y: 16, width: 52, height: 68, rx: 6},
    rings: [24, 38, 52, 66].map((y) => ({x: 21, y, width: 14, height: 6, rx: 3})),
    heart: 'M55 58 C43 50 40 42 45 37.5 C48.5 34.5 53 35.5 55 39.5 C57 35.5 61.5 34.5 65 37.5 C70 42 67 50 55 58 Z',
    label: {x: 44, y: 66, width: 22, height: 4, rx: 2},
  },
  small: {
    cover: {x: 30, y: 18, width: 50, height: 64, rx: 6},
    rings: [27, 46, 65].map((y) => ({x: 21, y, width: 16, height: 8, rx: 4})),
    heart: 'M56 66 C40 55 36 44 43 38 C48 34 54 36 56 41 C58 36 64 34 69 38 C76 44 72 55 56 66 Z',
    label: null,
  },
} as const;

/** Fixed colors: the mark keeps its paper-and-tomato look on light and dark screens. */
export const LOGO_COLORS = {tile: '#B5432B', paper: '#FBF6EC', ink: '#2B211A', label: '#8C7B68'};

export function LogoSymbol({size = 32, title}: {size?: number; title?: string}) {
  const mark = size < 32 ? LOGO.small : LOGO.full;
  const c = LOGO_COLORS;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width="100" height="100" rx="22" fill={c.tile} />
      <rect {...mark.cover} fill={c.paper} />
      {mark.rings.map((ring) => (
        <rect key={ring.y} {...ring} fill={c.ink} />
      ))}
      <path d={mark.heart} fill={c.tile} />
      {mark.label && <rect {...mark.label} fill={c.label} />}
    </svg>
  );
}

/** Horizontal logo: symbol + "Receitas" in ink and "da Família" in italic tomato. */
export function Logo({wordmark}: {wordmark: {first: string; second: string}}) {
  return (
    <span style={{display: 'inline-flex', alignItems: 'center', gap: 10}}>
      <LogoSymbol size={36} />
      <span style={{display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-serif)', lineHeight: 1}}>
        <span style={{fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em'}}>{wordmark.first}</span>
        <span style={{fontSize: 16, fontWeight: 600, fontStyle: 'italic', color: 'var(--brand)'}}>{wordmark.second}</span>
      </span>
    </span>
  );
}
