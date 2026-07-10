import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import { fetchFearGreed, simFearGreed, classifyFng } from "../lib/fearGreed";
import { C, cardStyle, mono } from "../theme";

/* ═══════════════════════ FEAR & GREED GAUGE ═══════════════════════
   A semicircular gauge of the crypto Fear & Greed Index. Real value from
   alternative.me when reachable (LIVE chip), a deterministic SIM value otherwise —
   never a stale live badge. Pure-SVG arc drawn as sampled polylines so the geometry
   is exact regardless of arc-sweep quirks. */

const BANDS = [
  { from: 0, to: 25, color: "#f6465d" },   // extreme fear — red
  { from: 25, to: 45, color: "#f0883e" },  // fear — orange
  { from: 45, to: 55, color: "#f3d42f" },  // neutral — yellow
  { from: 55, to: 75, color: "#9fd356" },  // greed — light green
  { from: 75, to: 100, color: "#2ebd85" }, // extreme greed — green
];

const labelColor = (v) => (v < 25 ? "#f6465d" : v < 45 ? "#f0883e" : v < 55 ? "#f3d42f" : v < 75 ? "#9fd356" : "#2ebd85");

const CX = 130, CY = 138, R = 96, SW = 13, GAP = 3; // gauge geometry (deg gap between bands)
const polar = (deg) => { const a = (deg * Math.PI) / 180; return { x: CX + R * Math.cos(a), y: CY - R * Math.sin(a) }; };
const angleOf = (v) => 180 * (1 - Math.max(0, Math.min(100, v)) / 100); // v:0→180°(left) … v:100→0°(right)
const arcPts = (aStart, aEnd, n = 18) => {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = aStart + (aEnd - aStart) * (i / n); const p = polar(a); pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`); }
  return pts.join(" ");
};

const FearGreedGauge = ({ compact = false, vertical = false }) => {
  const [fg, setFg] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const real = await fetchFearGreed();
      if (!alive) return;
      setFg(real || simFearGreed());
    };
    load();
    const id = setInterval(load, 10 * 60 * 1000); // refresh every 10 min
    return () => { alive = false; clearInterval(id); };
  }, []);

  const value = fg?.value ?? 50;
  const label = fg?.label ?? classifyFng(value);
  const lc = labelColor(value);
  const dot = polar(angleOf(value));

  return (
    <div style={{ ...cardStyle, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, minWidth: vertical ? 220 : 260, height: vertical ? "100%" : undefined, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: C.text }}>
        <Gauge size={14} color={C.cyan} /> Crypto Fear &amp; Greed <span style={{ fontSize: 9.5, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.4px" }}>· market-wide</span>
        {fg && (fg.live ? (
          <span title={`Live from ${fg.source} · as of ${new Date(fg.ts).toLocaleString()}`} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, letterSpacing: "0.4px", color: C.green, backgroundColor: C.greenBg, border: `1px solid ${C.green}40`, padding: "2px 6px", borderRadius: 4, ...mono }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: C.green, animation: "livePulse 2s ease-in-out infinite" }} /> LIVE
          </span>
        ) : (
          <span title="Sentiment source unreachable — showing a deterministic placeholder, not a real reading" style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, letterSpacing: "0.4px", color: C.amber, backgroundColor: `${C.amber}1c`, border: `1px solid ${C.amber}40`, padding: "2px 6px", borderRadius: 4, ...mono }}>SIM</span>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", alignItems: "center", justifyContent: "center", gap: vertical ? 8 : 14, flexWrap: "wrap", flex: vertical ? 1 : undefined }}>
        <svg viewBox="0 0 260 160" width={vertical ? 210 : compact ? 168 : 200} style={{ display: "block", flexShrink: 0 }}>
          {/* colored bands */}
          {BANDS.map((b) => {
            const aS = angleOf(b.from) - (b.from > 0 ? GAP / 2 : 0);
            const aE = angleOf(b.to) + (b.to < 100 ? GAP / 2 : 0);
            return <polyline key={b.from} points={arcPts(aS, aE)} fill="none" stroke={b.color} strokeWidth={SW} strokeLinecap="round" />;
          })}
          {/* needle dot */}
          <circle cx={dot.x} cy={dot.y} r={9} fill={C.card} stroke={lc} strokeWidth={3} />
          <circle cx={dot.x} cy={dot.y} r={3.5} fill={lc} />
          {/* value + classification */}
          <text x={CX} y={CY - 22} textAnchor="middle" fill={C.text} fontSize={38} fontWeight="900" style={{ fontFamily: "monospace" }}>{value}</text>
          <text x={CX} y={CY + 2} textAnchor="middle" fill={lc} fontSize={13} fontWeight="800" style={{ fontFamily: "monospace" }}>{label}</text>
        </svg>

        <div style={{ minWidth: 0, flex: vertical ? "0 0 auto" : "1 1 120px", textAlign: vertical ? "center" : "left", maxWidth: vertical ? 280 : undefined }}>
          <div style={{ fontSize: 10.5, color: C.textMuted, lineHeight: 1.5 }}>
            {compact
              ? "The whole market's mood as you weigh this coin — 0 (extreme fear) to 100 (extreme greed)."
              : "Market-wide sentiment, 0 (extreme fear) to 100 (extreme greed). Contrarians read deep fear as opportunity and extreme greed as caution."}
          </div>
          <div style={{ marginTop: 6, fontSize: 9.5, color: C.textFaint, ...mono }}>
            {fg ? (fg.live ? `${fg.source} · updated ${new Date(fg.ts).toLocaleDateString()}` : "placeholder — source offline") : "loading…"}
          </div>
        </div>
      </div>
    </div>
  );
};

export { FearGreedGauge };
