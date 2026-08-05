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
          One big character fills the screen — ask your learner what it is. No
          sounds, no hints; they do the naming.
        </p>
        <p>
          When they answer, <strong>scroll down</strong> to find the grading
          buttons — they can't be reached by mashing.
        </p>
        <p>
          If they name the <em>wrong</em> one, tap what they said — you get both
          side by side in the same font to point out the difference.
        </p>
        <p>Cards they know return less often; tricky ones come back sooner.</p>
      </div>

      <div className="setup">
        <div className="setup-label">Tap to build the deck — mix and match</div>
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
          placeholder="Extra characters, e.g. b d p q ? ! ½"
          value={settings.customGlyphs}
          onChange={(e) => setSettings({ customGlyphs: e.target.value })}
        />
        <div className="deck-summary">
          {glyphs.length > 0 ? `${glyphs.length} cards in the deck` : "Pick at least one set to start"}
        </div>
        <div className="setup-label">
          Tilt cards up to <strong>{settings.maxTilt}°</strong>
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
        <div className="tilt-hint">
          Rotated cards teach the shape, not the pose. 0° means always upright.
        </div>
      </div>

      <button className="btn btn-start" onClick={start} disabled={glyphs.length === 0}>
        Start
      </button>
      {reviewCount > 0 && (
        <p className="resume">
          Picking up where you left off · {mastered}/{glyphs.length} mastered ·{" "}
          {reviewCount} cards flipped
        </p>
      )}
    </div>
  );
}
