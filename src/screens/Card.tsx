import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  // "slow" = correct answer: digit fades out over the same beat as the
  // celebration ping. "fast" = wrong answer: quick fade to the next card.
  const [leaving, setLeaving] = useState<null | "fast" | "slow">(null);
  const [wiggle, setWiggle] = useState(false);
  const [burst, setBurst] = useState(0);
  const graded = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const digitRef = useRef<HTMLSpanElement>(null);
  const wiggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wide glyphs (W, M) at full size can overflow a phone screen, especially
  // rotated. Measure the laid-out glyph, compute its rotated bounding box,
  // and scale it down just enough to fit the pane.
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = digitRef.current;
    const pane = el?.parentElement;
    if (!el || !pane) return;
    const rad = (Math.abs(style.tilt) * Math.PI) / 180;
    const bw = el.offsetWidth * Math.cos(rad) + el.offsetHeight * Math.sin(rad);
    const bh = el.offsetWidth * Math.sin(rad) + el.offsetHeight * Math.cos(rad);
    setFit(Math.min(1, (pane.clientWidth - 16) / bw, (pane.clientHeight - 16) / bh));
  }, [current, style]);

  useEffect(() => {
    graded.current = false;
    setLeaving(null);
    setEntered(false);
    setBurst(0);
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
    setLeaving(correct ? "slow" : "fast");
    if (correct) setBurst((b) => b + 1);
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => grade(correct, said), correct ? 700 : 300);
  };

  const s = (f: number) => (fit * f).toFixed(3);
  const transform = !entered
    ? `rotate(${style.tilt}deg) scale(${s(0.85)})`
    : leaving === "slow"
      ? `rotate(${style.tilt}deg) scale(${s(1.12)})`
      : wiggle
        ? `rotate(${-style.tilt}deg) scale(${s(1.06)})`
        : `rotate(${style.tilt}deg) scale(${s(1)})`;

  // While a fresh card positions itself, kill the transition so the incoming
  // glyph never flashes; on a correct answer, fade on the ping's timing.
  const transition = !entered
    ? "none"
    : leaving === "slow"
      ? "transform .65s ease, opacity .65s ease"
      : undefined;

  return (
    <div className="card-screen" ref={scroller}>
      <div className="digit-pane" style={{ background: style.bg }} onClick={doWiggle}>
        <span
          ref={digitRef}
          className="digit"
          style={{
            fontFamily: FONTS[style.font],
            color: style.ink,
            fontSize: fontSize(style.scale),
            opacity: entered && !leaving ? 1 : 0,
            transform,
            transition,
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
            Practice more
          </button>
          <button className="btn btn-grade btn-good" onClick={() => doGrade(true)}>
            Got it
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
          <div className="said-label">Said something else? Tap it</div>
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
      </div>
    </div>
  );
}
