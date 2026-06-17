import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { mockTraders, traderDeepData } from "../data/mockData";
import { C, cardStyle, mono } from "../theme";

/* ═══════════════════════ POSITIONING MAP ═══════════════════════
   The old "football field" idea, done right. One horizontal price axis with the
   CURRENT PRICE at the centre. Every open trade and live signal on the coin is a
   dot placed at its target relative to now — LONGs (bullish) to the right, SHORTs
   (bearish) to the left. At a glance you see which way the crowd is leaning and
   where conviction clusters. Beginner-obvious, yet it's real positioning data. */

const coinOf = (pair) => String(pair || "").split("/")[0].toUpperCase();
const levNum = (l) => { const n = parseInt(String(l), 10); return Number.isFinite(n) && n > 0 ? n : 1; };

const RANGE = 6; // ± % of price shown across the axis

const PositioningMap = ({ coin, currentPrice }) => {
  const data = useMemo(() => {
    const positions = [];
    mockTraders.forEach((t) => {
      const deep = traderDeepData[t.name];
      if (!deep) return;
      (deep.history || []).forEach((h) => {
        if (coinOf(h.pair) !== coin) return;
        positions.push({ kind: "trade", trader: t.name, type: h.type, target: h.tp1 ?? h.tp ?? h.entry, lev: levNum(h.leverage) });
      });
      (deep.signals || []).forEach((s) => {
        if (coinOf(s.pair) !== coin) return;
        positions.push({ kind: "signal", trader: t.name, type: s.type, target: s.tp ?? s.entry, lev: levNum(s.leverage) });
      });
    });
    const longs = positions.filter((p) => p.type === "LONG").length;
    const shorts = positions.filter((p) => p.type === "SHORT").length;
    const wsum = positions.reduce((a, p) => a + p.lev, 0) || 1;
    const netPct = positions.reduce((a, p) => a + ((p.target - currentPrice) / currentPrice * 100) * p.lev, 0) / wsum;
    return { positions, longs, shorts, netPct };
  }, [coin, currentPrice]);

  if (!currentPrice || !data.positions.length) return null;

  const { positions, longs, shorts, netPct, related } = data;
  const total = positions.length;
  const longPct = Math.round((longs / total) * 100);
  const xOf = (pct) => 50 + Math.max(-RANGE, Math.min(RANGE, pct)) / RANGE * 46;
  const leaning = netPct > 0.4 ? "Bullish" : netPct < -0.4 ? "Bearish" : "Balanced";
  const leanColor = netPct > 0.4 ? C.green : netPct < -0.4 ? C.red : C.textMuted;
  const LeanIcon = netPct > 0.4 ? TrendingUp : netPct < -0.4 ? TrendingDown : Minus;
  const fmtPrice = (p) => (p < 1 ? `$${p.toFixed(4)}` : `$${Math.round(p).toLocaleString()}`);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "700" }}>Active Positions — System Overview · {coin}</div>
          <div style={{ fontSize: "10px", color: C.textFaint }}>Every open trade and live signal vs the current price. {total} open positions.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "800", color: leanColor, padding: "4px 12px", borderRadius: "8px", backgroundColor: `${leanColor}14`, border: `1px solid ${leanColor}30` }}>
            <LeanIcon size={14} /> {leaning}
          </span>
          <span style={{ fontSize: "11px", ...mono }}><span style={{ color: C.green, fontWeight: 700 }}>{longPct}% long</span> <span style={{ color: C.textFaint }}>·</span> <span style={{ color: C.red, fontWeight: 700 }}>{100 - longPct}% short</span></span>
        </div>
      </div>

      {/* The map */}
      <div style={{ position: "relative", height: 132, marginTop: "12px" }}>
        {/* gradient track */}
        <div style={{ position: "absolute", inset: "0 0 22px 0", borderRadius: 8, background: `linear-gradient(90deg, ${C.red}14, ${C.card} 46%, ${C.card} 54%, ${C.green}14)`, border: `1px solid ${C.border}` }} />
        {/* side labels */}
        <div style={{ position: "absolute", left: 8, top: 6, fontSize: 9, fontWeight: 700, color: C.red, letterSpacing: "0.5px" }}>◄ BEARISH · below price</div>
        <div style={{ position: "absolute", right: 8, top: 6, fontSize: 9, fontWeight: 700, color: C.green, letterSpacing: "0.5px", textAlign: "right" }}>above price · BULLISH ►</div>
        {/* gridlines */}
        {[-3, 3].map((g) => (
          <div key={g} style={{ position: "absolute", left: `${xOf(g)}%`, top: 20, bottom: 22, width: 1, backgroundColor: `${C.border}` }} />
        ))}
        {/* current price center line */}
        <div style={{ position: "absolute", left: "50%", top: 16, bottom: 22, width: 2, backgroundColor: C.text, opacity: 0.5 }} />
        <div style={{ position: "absolute", left: "50%", bottom: 2, transform: "translateX(-50%)", fontSize: 9, fontWeight: 800, color: C.text, ...mono, whiteSpace: "nowrap" }}>NOW {fmtPrice(currentPrice)}</div>
        {/* center of gravity */}
        <div title={`Crowd center of gravity: ${netPct >= 0 ? "+" : ""}${netPct.toFixed(1)}% vs price`} style={{ position: "absolute", left: `${xOf(netPct)}%`, top: 18, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `9px solid ${leanColor}`, zIndex: 4 }} />
        {/* dots */}
        {positions.map((p, i) => {
          const pct = (p.target - currentPrice) / currentPrice * 100;
          const clr = p.type === "LONG" ? C.green : C.red;
          const r = 4 + Math.min(4, p.lev / 2);
          const top = 30 + ((i * 53) % 70); // deterministic vertical spread
          return (
            <div key={i} title={`${p.trader} — ${p.type} ${p.kind} · target ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
              style={{
                position: "absolute", left: `${xOf(pct)}%`, top, transform: "translate(-50%,-50%)",
                width: r * 2, height: r * 2, borderRadius: "50%",
                backgroundColor: p.kind === "trade" ? `${clr}cc` : "transparent",
                border: `1.5px solid ${clr}`, boxShadow: `0 0 6px ${clr}40`,
              }} />
          );
        })}
      </div>

      {/* legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px", flexWrap: "wrap", fontSize: 10, color: C.textMuted }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: `${C.green}cc`, border: `1.5px solid ${C.green}` }} /> trade</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "transparent", border: `1.5px solid ${C.blue}` }} /> signal</span>
        <span style={{ color: C.textFaint }}>larger dot = more leverage</span>
      </div>
    </div>
  );
};

export { PositioningMap };
