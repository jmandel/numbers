import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CardStat, CardStyle, ReviewEvent, Settings } from "./types";
import { GAPS, MAX_BOX, deckGlyphs, freshCard, pickNext, randomStyle } from "./glyphs";

export type Screen = "intro" | "card" | "contrast" | "stats";

const LOG_CAP = 10000;

interface Persisted {
  settings: Settings;
  cards: Record<string, CardStat>;
  reviewCount: number;
  confusions: Record<string, number>;
  log: ReviewEvent[];
}

interface AppState {
  settings: Settings;
  // Stats are keyed by glyph and survive deck changes, so switching between
  // numbers and letters (or a mix) never loses progress.
  cards: Record<string, CardStat>;
  reviewCount: number;
  confusions: Record<string, number>; // "shown>said" -> count
  log: ReviewEvent[];

  screen: Screen;
  current: string | null;
  style: CardStyle;
  contrast: { shown: string; said: string } | null;
  shownAt: number;

  setSettings: (patch: Partial<Settings>) => void;
  start: () => void;
  grade: (correct: boolean, said?: string | null) => void;
  dismissContrast: () => void;
  show: (screen: Screen) => void;
  backToCard: () => void;
  resetProgress: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: { digits: true, upper: false, lower: false, customGlyphs: "", maxTilt: 15, quickInput: false },
      cards: {},
      reviewCount: 0,
      confusions: {},
      log: [],

      screen: "intro",
      current: null,
      style: randomStyle(null, 15),
      contrast: null,
      shownAt: 0,

      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

      start: () => {
        const s = get();
        const glyphs = deckGlyphs(s.settings);
        if (glyphs.length === 0) return;
        const cards = { ...s.cards };
        for (const g of glyphs) if (!cards[g]) cards[g] = freshCard(g);
        const active = glyphs.map((g) => cards[g]!);
        const current = pickNext(active, s.reviewCount, null);
        // Trap the Back button: practice lives one history entry deep, so
        // Back returns to the landing screen to reconfigure.
        if (window.history.state?.screen !== "play") {
          window.history.pushState({ screen: "play" }, "");
        }
        set({
          cards,
          current,
          style: randomStyle(null, s.settings.maxTilt),
          screen: "card",
          contrast: null,
          shownAt: Date.now(),
        });
      },

      grade: (correct, said = null) => {
        const s = get();
        const shown = s.current;
        if (shown === null || s.screen !== "card") return;

        const prev = s.cards[shown] ?? freshCard(shown);
        const box = correct ? Math.min(prev.box + 1, MAX_BOX) : 1;
        const reviewCount = s.reviewCount + 1;
        const cards: Record<string, CardStat> = {
          ...s.cards,
          [shown]: {
            glyph: shown,
            box,
            nextDue: reviewCount + GAPS[box - 1]!,
            seen: prev.seen + 1,
            right: prev.right + (correct ? 1 : 0),
          },
        };

        const event: ReviewEvent = {
          t: Date.now(),
          glyph: shown,
          correct,
          said: !correct && said && said !== shown ? said : null,
          tilt: s.style.tilt,
          font: s.style.font,
          ms: Math.max(0, Date.now() - s.shownAt),
        };
        const log = [...s.log, event].slice(-LOG_CAP);

        const isConfusion = event.said !== null;
        const confusions = { ...s.confusions };
        if (isConfusion) {
          const key = `${shown}>${event.said}`;
          confusions[key] = (confusions[key] ?? 0) + 1;
          // Pull the confused glyph forward so the pair interleaves while
          // the contrast is fresh.
          const other = cards[event.said!] ?? freshCard(event.said!);
          cards[event.said!] = { ...other, box: 1, nextDue: reviewCount };
        }

        if (isConfusion) {
          set({
            cards, reviewCount, confusions, log,
            screen: "contrast",
            contrast: { shown, said: event.said! },
          });
        } else {
          const glyphs = deckGlyphs(s.settings);
          const active = glyphs.map((g) => cards[g] ?? freshCard(g));
          const next = pickNext(active, reviewCount, shown);
          set({
            cards, reviewCount, confusions, log,
            current: next,
            style: randomStyle(s.style, s.settings.maxTilt),
            shownAt: Date.now(),
          });
        }
      },

      dismissContrast: () => {
        const s = get();
        if (!s.contrast) return;
        const glyphs = deckGlyphs(s.settings);
        const active = glyphs.map((g) => s.cards[g] ?? freshCard(g));
        set({
          current: pickNext(active, s.reviewCount, s.contrast.shown),
          contrast: null,
          style: randomStyle(s.style, s.settings.maxTilt),
          screen: "card",
          shownAt: Date.now(),
        });
      },

      show: (screen) => set({ screen }),

      backToCard: () => {
        const s = get();
        if (s.current === null) {
          s.start();
        } else {
          set({ screen: "card", shownAt: Date.now() });
        }
      },

      resetProgress: () =>
        set({
          cards: {},
          reviewCount: 0,
          confusions: {},
          log: [],
          current: null,
          contrast: null,
          screen: "intro",
        }),
    }),
    {
      name: "glyph-cards-v1",
      version: 2,
      // v0 stored a single deckId; v1 stores independent set toggles;
      // v2 adds quickInput.
      migrate: (persisted: unknown) => {
        const p = persisted as { settings?: Record<string, unknown> };
        const s = p?.settings;
        if (s && typeof s.deckId === "string") {
          const deckId = s.deckId;
          p.settings = {
            digits: deckId === "digits" || deckId === "mixed",
            upper: deckId === "upper" || deckId === "mixed",
            lower: deckId === "lower",
            customGlyphs: deckId === "custom" ? String(s.customGlyphs ?? "") : "",
            maxTilt: typeof s.maxTilt === "number" ? s.maxTilt : 15,
          };
        }
        if (p.settings && typeof p.settings.quickInput !== "boolean") {
          p.settings.quickInput = false;
        }
        return p as unknown as Persisted;
      },
      partialize: (s): Persisted => ({
        settings: s.settings,
        cards: s.cards,
        reviewCount: s.reviewCount,
        confusions: s.confusions,
        log: s.log,
      }),
    },
  ),
);
