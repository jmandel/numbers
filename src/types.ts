export interface CardStat {
  glyph: string;
  box: number; // Leitner box 1..5
  nextDue: number; // due when reviewCount reaches this
  seen: number;
  right: number;
}

export interface ReviewEvent {
  t: number; // epoch ms
  glyph: string;
  correct: boolean;
  said: string | null; // what the learner said instead, if a mix-up was recorded
  tilt: number; // degrees, signed
  font: number; // index into FONTS
  ms: number; // time from card shown to grade
}

export interface CardStyle {
  font: number;
  ink: string;
  bg: string;
  scale: number;
  tilt: number;
}

export interface Settings {
  digits: boolean;
  upper: boolean;
  lower: boolean;
  customGlyphs: string; // extra characters appended to the deck
  maxTilt: number; // degrees, 0..30
}
