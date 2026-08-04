import { useEffect, useRef, useState } from "react";
import { FONTS, MAX_BOX, deckGlyphs } from "../glyphs";
import { useStore } from "../store";

function fontSize(scale: number) {
  return `clamp(${200 * scale}px, ${94 * scale}vmin, ${680 * scale}px)`;
}

export function CardScreen() {
  const current = useStore((s) => s.current);
  const style = useStore((s) => s.style);
  const cards = useStore((s) => s.cards);
  const settings = useStore((s) => s.settings);
  const grade = useStore((s) => s.grade);
  const show = useStore((s) => s.show);

  const [entered, setEntered] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [burst, setBurst] = useState(0);
  const graded = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const wiggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    graded.current = false;
    setEntered(false);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, [current, style]);

  if (current === null) return null;

  const glyphs = deckGlyphs(settings);

  const doWiggle = () => {
    if (wiggleTimer.current) clearTimeout(wiggleTimer.current);
    setWiggle(true);
    wiggleTimer.current = setTimeout(() => setWiggle(false), 350);
  };

  const doGrade = (correct: boolean, said: string | null = null) => {
    if (graded.current) return;
    graded.current = true;
    if (correct) setBurst((b) => b + 1);
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => grade(correct, said), correct ? 650 : 150);
  };

  const transform = !entered
    ? `rotate(${style.tilt}deg) scale(0.85)`
    : wiggle
      ? `rotate(${-style.tilt}deg) scale(1.06)`
      : `rotate(${style.tilt}deg) scale(1)`;

  return (
    <div className="card-screen" ref={scroller}>
      <div className="digit-pane" style={{ background: style.bg }} onClick={doWiggle}>
        <span
          className="digit"
          style={{
            fontFamily: FONTS[style.font],
            color: style.ink,
            fontSize: fontSize(style.scale),
            opacity: entered ? 1 : 0,
            transform,
          }}
        >
          {current}
        </span>
        {burst > 0 && (
          <div className="burst" key={burst}>
            <span className="ping">🎉</span>
          </div>
        )}
      </div>

      <div className="controls">
        <div className="grade-row">
          <button className="btn btn-grade btn-again" onClick={() => doGrade(false)}>
            🔁 Practice more
          </button>
          <button className="btn btn-grade btn-good" onClick={() => doGrade(true)}>
            ⭐ Got it!
          </button>
        </div>

        <div className="dots">
          {glyphs.map((g) => {
            const c = cards[g];
            const box = c?.box ?? 1;
            const bg =
              g === current ? "#1D7AD9" : `rgba(42,157,63,${(box - 1) / (MAX_BOX - 1)})`;
            return (
              <div key={g} className="dot" title={`${g}: level ${box}/${MAX_BOX}`} style={{ background: bg }} />
            );
          })}
        </div>

        <div className="said-wrap">
          <div className="said-label">Said something different? Tap what they said:</div>
          <div className="said-row">
            {glyphs
              .filter((g) => g !== current)
              .map((g) => (
                <button key={g} className="chip" onClick={() => doGrade(false, g)}>
                  {g}
                </button>
              ))}
          </div>
        </div>

        <button className="icon-btn" aria-label="Show progress" onClick={() => show("stats")}>
          📊
        </button>
        <p className="hint">Grading jumps to the next card automatically</p>
      </div>
    </div>
  );
}
