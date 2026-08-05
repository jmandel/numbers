import { contrastTip } from "../contrastTips";
import { FONTS, INK } from "../glyphs";
import { useStore } from "../store";

// Shown right after a mix-up: both glyphs side by side in the SAME font, so
// the only thing that differs is shape. Tap anywhere to continue; both
// glyphs are due again soon but the next card is drawn normally.
export function Contrast() {
  const contrast = useStore((s) => s.contrast);
  const style = useStore((s) => s.style);
  const dismiss = useStore((s) => s.dismissContrast);

  if (!contrast) return null;
  const saidInk = INK[(INK.indexOf(style.ink) + 4) % INK.length];
  const tip = contrastTip(contrast.shown, contrast.said);

  return (
    <div className="contrast-screen" style={{ background: style.bg }} onClick={dismiss}>
      <div
        className="pair"
        style={{ fontFamily: FONTS[style.font], fontSize: "clamp(110px, 34vmin, 360px)" }}
      >
        <span style={{ color: style.ink }}>{contrast.shown}</span>
        <span style={{ color: saidInk }}>{contrast.said}</span>
      </div>
      {tip && <p className="contrast-tip">{tip}</p>}
      <p className="contrast-hint">
        {tip
          ? "Tap to continue"
          : `They said ${contrast.said}. Point out the difference, then tap to continue.`}
      </p>
    </div>
  );
}
