import { FONTS, INK, MAX_BOX, deckGlyphs } from "../glyphs";
import { useStore } from "../store";

const SETS: { key: "digits" | "upper" | "lower"; sample: string; label: string }[] = [
  { key: "digits", sample: "123", label: "Numbers" },
  { key: "upper", sample: "ABC", label: "Capitals" },
  { key: "lower", sample: "abc", label: "Small letters" },
];

export function Intro() {
  const settings = useStore((s) => s.settings);
  const cards = useStore((s) => s.cards);
  const reviewCount = useStore((s) => s.reviewCount);
  const setSettings = useStore((s) => s.setSettings);
  const start = useStore((s) => s.start);

  const glyphs = deckGlyphs(settings);
  const mastered = glyphs.filter((g) => (cards[g]?.box ?? 1) === MAX_BOX).length;
  const demo = glyphs.slice(0, 3);

  return (
    <div className="screen center-col intro">
      <div className="intro-digits" aria-hidden="true">
        {(demo.length ? demo : ["1", "2", "3"]).map((g, i) => (
          <span
            key={g}
            style={{
              color: INK[(i * 3 + 1) % INK.length],
              transform: `rotate(${(i - 1) * (settings.maxTilt || 8)}deg)`,
              fontFamily: FONTS[i * 2],
            }}
          >
            {g}
          </span>
        ))}
      </div>
      <h1>Number &amp; Letter Cards</h1>
      <div className="intro-copy">
        <p>
          One big character at a time. Ask your learner to name it, then scroll
          down to grade the answer.
        </p>
        <p>Mix-ups get a side-by-side look, and tricky cards come back sooner.</p>
      </div>

      <div className="setup">
        <div className="setup-label">Deck</div>
        <div className="deck-row">
          {SETS.map(({ key, sample, label }) => {
            const on = settings[key];
            return (
              <button
                key={key}
                className={`toggle ${on ? "toggle-on" : ""}`}
                aria-pressed={on}
                onClick={() => setSettings({ [key]: !on })}
              >
                <span className="toggle-sample">{sample}</span>
                <span className="toggle-label">{label}</span>
                <span className="toggle-check">{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
        <input
          className="custom-input"
          placeholder="Add your own: b d p q"
          value={settings.customGlyphs}
          onChange={(e) => setSettings({ customGlyphs: e.target.value })}
        />
        <div className="deck-summary">
          {glyphs.length > 0 ? `${glyphs.length} cards` : "Pick at least one set to start"}
        </div>
        <div className="setup-row">
          <span className="setup-label">Tilt</span>
          <span className="setup-value">{settings.maxTilt === 0 ? "off" : `±${settings.maxTilt}°`}</span>
        </div>
        <input
          className="tilt-slider"
          type="range"
          min={0}
          max={30}
          step={5}
          value={settings.maxTilt}
          onChange={(e) => setSettings({ maxTilt: Number(e.target.value) })}
        />
        <button
          className={`toggle ${settings.quickInput ? "toggle-on" : ""}`}
          aria-pressed={settings.quickInput}
          onClick={() => setSettings({ quickInput: !settings.quickInput })}
        >
          <span className="toggle-sample">⇄</span>
          <span className="toggle-label">Quick grading</span>
          <span className="toggle-check">{settings.quickInput ? "✓" : ""}</span>
        </button>
        {settings.quickInput && (
          <div className="deck-summary">Tap or flick the card — right: got it, left: practice</div>
        )}
      </div>

      <button className="btn btn-start" onClick={start} disabled={glyphs.length === 0}>
        Start
      </button>
      {reviewCount > 0 && (
        <p className="resume">
          {mastered}/{glyphs.length} mastered · {reviewCount} flips
        </p>
      )}
    </div>
  );
}
