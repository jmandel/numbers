import type { CardStat, CardStyle, Settings } from "./types";

export const FONTS = [
  "'Arial Black', Arial, sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Courier New', Courier, monospace",
  "'Comic Sans MS', 'Chalkboard SE', cursive",
  "'Trebuchet MS', Verdana, sans-serif",
  "Impact, 'Arial Narrow', sans-serif",
  "'Palatino Linotype', Palatino, serif",
  "Verdana, Geneva, sans-serif",
];

export const FONT_NAMES = [
  "Arial Black",
  "Georgia",
  "Courier",
  "Comic Sans",
  "Trebuchet",
  "Impact",
  "Palatino",
  "Verdana",
];

export const INK = [
  "#E63946", "#F77F00", "#FFB703", "#2A9D3F", "#0E9594",
  "#1D7AD9", "#7B2FBE", "#E0218A", "#5C3A21",
];

export const CARD_BG = [
  "#FFF3E2", "#EAF6FF", "#F0FBEA", "#FFF0F5", "#FFFBE0", "#F3EEFF",
];

// Leitner: a card in box b waits GAPS[b-1] flips before it's due again.
export const GAPS = [1, 2, 5, 9, 14];
export const MAX_BOX = 5;

const DIGITS = "0123456789";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";

export function deckGlyphs(settings: Settings): string[] {
  let raw = "";
  if (settings.digits) raw += DIGITS;
  if (settings.upper) raw += UPPER;
  if (settings.lower) raw += LOWER;
  raw += settings.customGlyphs;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of raw) {
    if (!/\s/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      out.push(ch);
    }
  }
  return out;
}

export function freshCard(glyph: string): CardStat {
  return { glyph, box: 1, nextDue: 0, seen: 0, right: 0 };
}

// Weighted pick among due cards (lower boxes more likely), avoiding an
// immediate repeat when there's any alternative.
export function pickNext(cards: CardStat[], reviewCount: number, last: string | null): string {
  if (cards.length === 0) throw new Error("empty deck");
  let due = cards.filter((c) => c.nextDue <= reviewCount);
  if (due.length > 1 && last !== null) {
    const f = due.filter((c) => c.glyph !== last);
    if (f.length) due = f;
  }
  if (due.length === 0) {
    const sorted = cards
      .filter((c) => c.glyph !== last || cards.length === 1)
      .sort((a, b) => a.nextDue - b.nextDue || a.box - b.box);
    return sorted[0]!.glyph;
  }
  const weights = due.map((c) => 1 / c.box);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < due.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return due[i]!.glyph;
  }
  return due[due.length - 1]!.glyph;
}

export function randomStyle(prev: CardStyle | null, maxTilt: number): CardStyle {
  let font: number, ink: string;
  do {
    font = Math.floor(Math.random() * FONTS.length);
  } while (prev !== null && font === prev.font);
  do {
    ink = INK[Math.floor(Math.random() * INK.length)]!;
  } while (prev !== null && ink === prev.ink);
  return {
    font,
    ink,
    bg: CARD_BG[Math.floor(Math.random() * CARD_BG.length)]!,
    scale: 0.72 + Math.random() * 0.28,
    tilt: Math.round((Math.random() * 2 - 1) * maxTilt * 10) / 10,
  };
}
