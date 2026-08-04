import { useMemo } from "react";
import { FONT_NAMES, INK, MAX_BOX, deckGlyphs } from "../glyphs";
import { useStore } from "../store";
import type { ReviewEvent } from "../types";
import { BarRow, StatTile, TrendLine, seqBlue, type TrendPoint } from "./charts";

const TREND_WINDOW = 20;
const TILT_BUCKETS = [
  { label: "0–10°", min: 0, max: 10 },
  { label: "10–20°", min: 10, max: 20 },
  { label: "20–30°", min: 20, max: 31 },
];

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function accuracyBy<K extends string>(
  log: ReviewEvent[],
  key: (e: ReviewEvent) => K | null,
): Map<K, { n: number; right: number }> {
  const m = new Map<K, { n: number; right: number }>();
  for (const e of log) {
    const k = key(e);
    if (k === null) continue;
    const cur = m.get(k) ?? { n: 0, right: 0 };
    cur.n += 1;
    cur.right += e.correct ? 1 : 0;
    m.set(k, cur);
  }
  return m;
}

export function Stats() {
  const cards = useStore((s) => s.cards);
  const settings = useStore((s) => s.settings);
  const reviewCount = useStore((s) => s.reviewCount);
  const confusions = useStore((s) => s.confusions);
  const log = useStore((s) => s.log);
  const backToCard = useStore((s) => s.backToCard);
  const show = useStore((s) => s.show);
  const resetProgress = useStore((s) => s.resetProgress);

  const glyphs = deckGlyphs(settings);
  const active = glyphs.map((g) => cards[g] ?? { glyph: g, box: 1, nextDue: 0, seen: 0, right: 0 });
  const mastered = active.filter((c) => c.box === MAX_BOX).length;
  const totalSeen = log.length;
  const totalRight = log.filter((e) => e.correct).length;

  const trend: TrendPoint[] = useMemo(() => {
    const pts: TrendPoint[] = [];
    for (let i = Math.min(TREND_WINDOW, log.length) - 1; i < log.length; i++) {
      const win = log.slice(Math.max(0, i - TREND_WINDOW + 1), i + 1);
      pts.push({ x: i + 1, y: win.filter((e) => e.correct).length / win.length });
    }
    // Thin to at most 120 points so the line stays crisp.
    const step = Math.ceil(pts.length / 120);
    return pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  }, [log]);

  // Bidirectional pair totals: 6>9 and 9>6 count as one pair.
  const pairs = useMemo(() => {
    const totals = new Map<string, number>();
    for (const [key, n] of Object.entries(confusions)) {
      const [a, b] = key.split(">") as [string, string];
      const pk = [a, b].sort().join(" ↔ ");
      totals.set(pk, (totals.get(pk) ?? 0) + n);
    }
    return [...totals.entries()].sort((x, y) => y[1] - x[1]);
  }, [confusions]);

  // Confusion matrix limited to glyphs involved in at least one mix-up.
  const matrix = useMemo(() => {
    const involved = new Set<string>();
    for (const key of Object.keys(confusions)) {
      const [a, b] = key.split(">") as [string, string];
      involved.add(a);
      involved.add(b);
    }
    const order = [...glyphs.filter((g) => involved.has(g)), ...[...involved].filter((g) => !glyphs.includes(g))];
    let max = 0;
    for (const n of Object.values(confusions)) max = Math.max(max, n);
    return { order, max };
  }, [confusions, glyphs]);

  const byTilt = useMemo(
    () =>
      TILT_BUCKETS.map((b) => {
        const hits = log.filter((e) => Math.abs(e.tilt) >= b.min && Math.abs(e.tilt) < b.max);
        return { label: b.label, n: hits.length, right: hits.filter((e) => e.correct).length };
      }).filter((b) => b.n > 0),
    [log],
  );

  const byFont = useMemo(() => {
    const m = accuracyBy(log, (e) => FONT_NAMES[e.font] ?? null);
    return [...m.entries()].sort((a, b) => a[1].right / a[1].n - b[1].right / b[1].n);
  }, [log]);

  const medianMs = useMemo(() => median(log.map((e) => e.ms).filter((ms) => ms > 0 && ms < 120000)), [log]);

  const trickiest = useMemo(
    () =>
      active
        .filter((c) => c.seen > 0 && c.right < c.seen)
        .sort((a, b) => a.right / a.seen - b.right / b.seen || b.seen - a.seen)
        .slice(0, 5),
    [active],
  );

  return (
    <div className="stats-screen">
      <h2>Progress</h2>
      <p className="sub">
        {mastered} of {glyphs.length} at the top level · {reviewCount} cards flipped
      </p>

      <div className="tile-row">
        <StatTile label="Mastered" value={`${mastered}/${glyphs.length}`} />
        <StatTile
          label="Overall accuracy"
          value={totalSeen ? `${Math.round((totalRight / totalSeen) * 100)}%` : "—"}
          detail={totalSeen ? `${totalRight} of ${totalSeen}` : "no cards yet"}
        />
        <StatTile
          label="Median answer time"
          value={medianMs ? `${(medianMs / 1000).toFixed(1)}s` : "—"}
          detail="shown → graded"
        />
      </div>

      <div className="glyph-grid">
        {active.map((c) => (
          <div className="cell" key={c.glyph}>
            <div className="big" style={{ color: INK[(c.glyph.codePointAt(0) ?? 0) % INK.length] }}>
              {c.glyph}
            </div>
            <div>
              <div className="stars">
                {Array.from({ length: MAX_BOX }, (_, i) => (
                  <span key={i} className={i < c.box ? "" : "off"}>
                    ⭐
                  </span>
                ))}
              </div>
              <div className="meta">
                {c.seen === 0 ? "not seen yet" : `seen ${c.seen} · ${c.right} right (${Math.round((c.right / c.seen) * 100)}%)`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {trickiest.length > 0 && (
        <section>
          <h3>Trickiest right now</h3>
          <p className="sub">Lowest accuracy among cards with at least one miss</p>
          <div className="chart-card">
            {trickiest.map((c) => (
              <BarRow key={c.glyph} label={c.glyph} pct={c.right / c.seen} n={c.seen} />
            ))}
          </div>
        </section>
      )}

      {pairs.length > 0 && (
        <section>
          <h3>Mix-ups</h3>
          <p className="sub">Pairs that get confused — each mix-up triggers a side-by-side</p>
          <div className="chart-card">
            {pairs.slice(0, 6).map(([pk, n]) => (
              <div className="pair-row" key={pk}>
                <div className="pair-key">{pk}</div>
                <div className="pair-count">×{n}</div>
              </div>
            ))}
          </div>

          {matrix.order.length >= 2 && (
            <div className="chart-card matrix-card">
              <div className="matrix-title">
                Who gets called what <span className="matrix-sub">(row = shown, column = what they said)</span>
              </div>
              <div className="matrix-scroll">
                <table className="matrix">
                  <thead>
                    <tr>
                      <th />
                      {matrix.order.map((g) => (
                        <th key={g}>{g}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.order.map((row) => (
                      <tr key={row}>
                        <th>{row}</th>
                        {matrix.order.map((col) => {
                          const n = confusions[`${row}>${col}`] ?? 0;
                          const { bg, ink } = seqBlue(n, matrix.max);
                          return (
                            <td
                              key={col}
                              style={{ background: bg, color: ink }}
                              title={n ? `${row} shown, they said ${col}: ${n}×` : undefined}
                            >
                              {n || ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {trend.length >= 2 && (
        <section>
          <h3>Accuracy over time</h3>
          <p className="sub">Rolling share correct over the last {TREND_WINDOW} cards</p>
          <div className="chart-card">
            <TrendLine points={trend} window={TREND_WINDOW} />
          </div>
        </section>
      )}

      {byTilt.length >= 2 && (
        <section>
          <h3>Does rotation matter?</h3>
          <p className="sub">Accuracy by how tilted the card was</p>
          <div className="chart-card">
            {byTilt.map((b) => (
              <BarRow key={b.label} label={b.label} pct={b.right / b.n} n={b.n} />
            ))}
          </div>
        </section>
      )}

      {byFont.length >= 2 && totalSeen >= 20 && (
        <section>
          <h3>Does the font matter?</h3>
          <p className="sub">Accuracy by typeface, hardest first</p>
          <div className="chart-card">
            {byFont.map(([name, { n, right }]) => (
              <BarRow key={name} label={name} pct={right / n} n={n} />
            ))}
          </div>
        </section>
      )}

      <div className="prog-actions">
        <button className="btn btn-back" onClick={backToCard}>
          Back to cards
        </button>
        <button className="btn btn-deck" onClick={() => show("intro")}>
          Change deck
        </button>
        <button
          className="btn btn-reset"
          onClick={() => {
            if (window.confirm("Erase all progress and statistics?")) resetProgress();
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
