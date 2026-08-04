import { useRef, useState } from "react";

// Chart tokens from the validated reference palette (light mode).
export const CHART = {
  series: "#2a78d6",
  track: "#f0efec",
  grid: "#e1e0d9",
  baseline: "#c3c2b7",
  muted: "#898781",
  inkPrimary: "#0b0b0b",
  inkSecondary: "#52514e",
};

// Sequential blue ramp, steps 100..700.
export const BLUES = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7",
  "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
];

export function seqBlue(value: number, max: number): { bg: string; ink: string } {
  if (max <= 0 || value <= 0) return { bg: "transparent", ink: CHART.inkSecondary };
  const idx = Math.max(1, Math.round((value / max) * (BLUES.length - 1)));
  return { bg: BLUES[idx]!, ink: idx >= 6 ? "#ffffff" : CHART.inkPrimary };
}

export function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="tile">
      <div className="tile-value">{value}</div>
      <div className="tile-label">{label}</div>
      {detail && <div className="tile-detail">{detail}</div>}
    </div>
  );
}

// Horizontal bar: one hue (magnitude comparison), value direct-labeled.
export function BarRow({ label, pct, n }: { label: string; pct: number; n: number }) {
  return (
    <div className="bar-row" title={`${label}: ${Math.round(pct * 100)}% correct over ${n} cards`}>
      <div className="bar-label">{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
      <div className="bar-value">
        {Math.round(pct * 100)}% <span className="bar-n">· {n}</span>
      </div>
    </div>
  );
}

export interface TrendPoint {
  x: number; // review index
  y: number; // 0..1 accuracy
}

// Rolling-accuracy line with a crosshair + tooltip hover layer.
export function TrendLine({ points, window: win }: { points: TrendPoint[]; window: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 640;
  const H = 180;
  const PAD = { l: 34, r: 10, t: 10, b: 22 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;

  if (points.length < 2) {
    return <p className="chart-empty">Grade a few more cards to see the trend.</p>;
  }

  const x0 = points[0]!.x;
  const x1 = points[points.length - 1]!.x;
  const sx = (x: number) => PAD.l + ((x - x0) / Math.max(1, x1 - x0)) * iw;
  const sy = (y: number) => PAD.t + (1 - y) * ih;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");

  const onMove = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(sx(p.x) - mx);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover(best);
  };

  const hp = hover !== null ? points[hover] : undefined;

  return (
    <svg
      ref={svgRef}
      className="trend"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Rolling accuracy over the last ${win} cards, by review number`}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      {[0, 0.5, 1].map((y) => (
        <g key={y}>
          <line x1={PAD.l} x2={W - PAD.r} y1={sy(y)} y2={sy(y)} stroke={y === 0 ? CHART.baseline : CHART.grid} strokeWidth={1} />
          <text x={PAD.l - 6} y={sy(y) + 3.5} textAnchor="end" fontSize={10} fill={CHART.muted}>
            {Math.round(y * 100)}%
          </text>
        </g>
      ))}
      <text x={PAD.l} y={H - 6} fontSize={10} fill={CHART.muted}>
        card {x0}
      </text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize={10} fill={CHART.muted}>
        card {x1}
      </text>
      <path d={path} fill="none" stroke={CHART.series} strokeWidth={2} strokeLinejoin="round" />
      {hp && (
        <g>
          <line x1={sx(hp.x)} x2={sx(hp.x)} y1={PAD.t} y2={H - PAD.b} stroke={CHART.baseline} strokeWidth={1} />
          <circle cx={sx(hp.x)} cy={sy(hp.y)} r={4} fill={CHART.series} stroke="#fff" strokeWidth={2} />
          <g transform={`translate(${Math.min(Math.max(sx(hp.x) + 8, PAD.l), W - 130)}, ${PAD.t + 4})`}>
            <rect width={122} height={34} rx={6} fill="#fff" stroke={CHART.grid} />
            <text x={8} y={14} fontSize={10.5} fill={CHART.inkSecondary}>
              through card {hp.x}
            </text>
            <text x={8} y={27} fontSize={11} fontWeight={700} fill={CHART.inkPrimary}>
              {Math.round(hp.y * 100)}% of last {win}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
