import { useMemo, useState } from "react";
import { Globe } from "lucide-react";
import { coinCandles, coinSignals, ROBOTIN_COINS, MARKET_META } from "../../data/robotin";
import { smcCoins } from "../../data/mockData";
import { CollapsibleSection } from "../common";
import { useTimeframe, useLivePrices } from "../../contexts";
import { C, mono } from "../../theme";
import { fmtTime } from "../../lib/format";

const a2 = (a) => Math.max(0, Math.min(255, Math.round(a * 255))).toString(16).padStart(2, "0");

/* ═══════════════════════ MARKET PANORAMA — BUBBLES ═══════════════════════
   The cross-coin lead for Markets: every coin as a bubble sized by market cap so
   the whole landscape's magnitude reads at a glance, colored by 24h move (or crowd
   sentiment). Click any bubble to drop into that coin's full detail below.
   Respects the global timeframe. */

const capFmt = (v) => {
  if (v == null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString()}`;
};

/* Deterministic greedy circle-packing (no external lib): place the biggest bubble
   at the centre, then spiral each next one outward to the first non-overlapping
   slot. Finally scale/translate the whole cluster to fill the viewBox. */
const packBubbles = (items, W, H, xStretch = 1) => {
  const sorted = [...items].sort((a, b) => b.r - a.r);
  const placed = [];
  const gap = 2.5;
  for (const it of sorted) {
    if (!placed.length) { placed.push({ ...it, x: 0, y: 0 }); continue; }
    const step = Math.max(1.2, it.r * 0.12);
    let pos = null;
    // elliptical spiral: stretch the search horizontally so the cluster grows
    // wider-than-tall (spreads toward the sides, keeps the container short)
    for (let a = 0; a < 800 && !pos; a += 0.12) {
      const rho = step * a;
      const x = Math.cos(a) * rho * xStretch, y = Math.sin(a) * rho;
      let ok = true;
      for (const p of placed) { if (Math.hypot(x - p.x, y - p.y) < p.r + it.r + gap) { ok = false; break; } }
      if (ok) pos = { x, y };
    }
    placed.push({ ...it, x: pos?.x ?? 0, y: pos?.y ?? 0 });
  }
  const minX = Math.min(...placed.map((p) => p.x - p.r)), maxX = Math.max(...placed.map((p) => p.x + p.r));
  const minY = Math.min(...placed.map((p) => p.y - p.r)), maxY = Math.max(...placed.map((p) => p.y + p.r));
  const bw = (maxX - minX) || 1, bh = (maxY - minY) || 1;
  const scale = Math.min(W / bw, H / bh) * 0.98;
  const offX = (W - bw * scale) / 2 - minX * scale, offY = (H - bh * scale) / 2 - minY * scale;
  return placed.map((p) => ({ ...p, cx: p.x * scale + offX, cy: p.y * scale + offY, rr: p.r * scale }));
};

const BubbleBoard = ({ data, colorBy, selected, onSelect }) => {
  const W = 1300, H = 400; // wide-and-short frame: less vertical height, coins spread to the sides
  const packed = useMemo(() => {
    const items = data.map((d) => ({ ...d, r: Math.pow(Math.max(1, d.size), 0.32) }));
    return packBubbles(items, W, H, 3.0);
  }, [data]);
  const chg = (v) => `${v >= 0 ? "+" : ""}${(v || 0).toFixed(1)}%`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {packed.map((b) => {
        const pos = colorBy === "sentiment" ? (b.longPct == null ? null : b.longPct >= 50) : b.change >= 0;
        const base = pos == null ? C.textMuted : pos ? C.green : C.red;
        const mag = colorBy === "sentiment" ? Math.abs((b.longPct ?? 50) - 50) / 50 : Math.min(1, Math.abs(b.change || 0) / 6);
        const isSel = b.name === selected;
        const showText = b.rr > 18;
        const showChg = b.rr > 30;
        return (
          <g key={b.name} onClick={() => onSelect(b.name)} style={{ cursor: "pointer" }}>
            <title>{`${b.name}/USDT · ${chg(b.change)} 24h · ${capFmt(b.size)} cap${b.longPct == null ? "" : ` · ${b.longPct}% long`}${b.active ? ` · ${b.active} live` : ""}`}</title>
            <circle cx={b.cx} cy={b.cy} r={b.rr} fill={`${base}${a2(0.10 + mag * 0.18)}`} stroke={isSel ? C.purple : `${base}${a2(0.5 + mag * 0.4)}`} strokeWidth={isSel ? 3 : 1.6} />
            {showText && (
              <text x={b.cx} y={b.cy + (showChg ? -3 : 3)} textAnchor="middle" fill="#fff" fontSize={Math.min(18, Math.max(8, b.rr * 0.42))} fontWeight="800" style={{ fontFamily: "monospace", pointerEvents: "none" }}>{b.name}</text>
            )}
            {showChg && (
              <text x={b.cx} y={b.cy + 13} textAnchor="middle" fill={pos == null ? "#a9b2bd" : pos ? "#8ef0a8" : "#ff9b8f"} fontSize={Math.min(12, Math.max(7, b.rr * 0.26))} style={{ fontFamily: "monospace", pointerEvents: "none" }}>
                {colorBy === "sentiment" ? (b.longPct == null ? "—" : `${b.longPct}%L`) : chg(b.change)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const MarketPanorama = ({ selected, onSelect }) => {
  const { within, isFiltered } = useTimeframe();
  // Real exchange tape (when reachable): price + Δ go live per-coin; sizing (market
  // cap), sentiment and signals stay on the SIM book. Provenance via the LIVE chip.
  const tape = useLivePrices();
  const live = tape.status === "live" ? tape.prices : null;
  const [colorBy, setColorBy] = useState("change"); // change | sentiment

  const rows = useMemo(() => ROBOTIN_COINS.map((coin) => {
    const candles = coinCandles(coin);
    const closes = candles.map((c) => c.close);
    const simLast = closes[closes.length - 1], first = closes[0];
    const simChange = ((simLast - first) / first) * 100;
    const lv = live?.[coin];
    const last = lv?.px ?? simLast;
    const change = lv?.chg24h ?? simChange;
    const sigs = coinSignals(coin, candles).filter((s) => within(s.time));
    const appr = sigs.filter((s) => s.approved);
    const longs = appr.filter((s) => s.dir === "LONG").length;
    const shorts = appr.filter((s) => s.dir === "SHORT").length;
    const tot = longs + shorts;
    const longPct = tot ? Math.round((longs / tot) * 100) : null;
    const active = sigs.filter((s) => s.status === "active" || s.status === "pending").length;
    const meta = smcCoins[coin] || {};
    const mm = MARKET_META[coin] || {};
    return { coin, last, change, total: sigs.length, longPct, active, bias: meta.bias || null, marketCap: mm.marketCap };
  }), [within, live]);

  // panorama summary — the one-line read of the whole board
  const bulls = rows.filter((r) => r.bias === "BULLISH").length;
  const liveSigs = rows.filter((r) => r.active > 0).length;
  const up = rows.filter((r) => r.change >= 0).length;

  const bubbleData = rows.map((r) => ({ name: r.coin, size: r.marketCap || 1, change: r.change, longPct: r.longPct, active: r.active }));

  const miniSel = { backgroundColor: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11, fontWeight: 600, padding: "5px 8px", cursor: "pointer", outline: "none", fontFamily: "inherit" };

  const controls = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {live && (
        <span
          title={`Price and Δ (24h) are real ${tape.source} spot quotes, as of ${fmtTime(tape.asOf)} (30s refresh). Bubble size (market cap), sentiment and signals remain the deterministic SIM book.`}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 6, backgroundColor: C.greenBg, border: `1px solid ${C.green}40`, fontSize: 10, fontWeight: 800, letterSpacing: "0.4px", color: C.green, ...mono }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: C.green, display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />
          LIVE · {tape.source}
        </span>
      )}
      <span style={{ fontSize: 10, color: C.textFaint, ...mono }}>size = market cap</span>
      <select value={colorBy} onChange={(e) => setColorBy(e.target.value)} style={miniSel} title="Bubble color by" aria-label="Color bubbles by">
        <option value="change">Color: Δ%</option>
        <option value="sentiment">Color: sentiment</option>
      </select>
    </div>
  );

  return (
    <CollapsibleSection
      icon={Globe}
      title="Market panorama"
      summary={`${rows.length} coins · ${up} up / ${rows.length - up} down · ${bulls} model-bullish · ${liveSigs} with live signals${isFiltered ? " · in range" : ""}${live ? " · real-time prices" : ""} · bubble size = market cap · click a coin for detail`}
      right={controls}
      accent={C.cyan}
      persistKey="markets-panorama"
    >
      <div style={{ padding: 12 }}>
        <BubbleBoard data={bubbleData} colorBy={colorBy} selected={selected} onSelect={onSelect} />
      </div>
    </CollapsibleSection>
  );
};

export { MarketPanorama };
