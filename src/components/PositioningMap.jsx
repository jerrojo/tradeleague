import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Crosshair } from "lucide-react";
import { coinCandles, coinSignals } from "../data/robotin";
import { SectionHeader } from "./common";
import { C, cardStyle, mono } from "../theme";

/* ═══════════════════════ POSITIONING MAP ═══════════════════════
   The old "football field" idea, done right. One horizontal price axis with the
   CURRENT PRICE at the centre. Every open trade and live signal on the coin is a
   dot placed at its target relative to now — LONGs (bullish) to the right, SHORTs
   (bearish) to the left. At a glance you see which way the crowd is leaning and
   where conviction clusters. Beginner-obvious, yet it's real positioning data. */

const RANGE = 6; // ± % of price shown across the axis

const PositioningMap = ({ coin, currentPrice }) => {
  const [hover, setHover] = useState(null);
  const data = useMemo(() => {
    // Every published signal on this coin is a position: approved → executed trade,
    // the rest → live/pending signals. Plotted at its first target vs the current
    // price. Sourced from the same engine as the rest of Markets, so EVERY coin is
    // populated (not just the few with legacy trader histories).
    const sigs = coinSignals(coin, coinCandles(coin));
    const positions = sigs.map((s) => ({
      kind: s.approved ? "trade" : "signal",
      approved: s.approved, status: s.status,
      trader: s.trader, isBot: s.isBot, type: s.dir,
      entry: s.entry, target: s.tp1 ?? s.entry, lev: s.lev || 3,
      conf: s.confidence, pnlPct: s.pnlPct,
    }));
    const longs = positions.filter((p) => p.type === "LONG").length;
    const shorts = positions.filter((p) => p.type === "SHORT").length;
    const wsum = positions.reduce((a, p) => a + p.lev, 0) || 1;
    const netPct = positions.reduce((a, p) => a + ((p.target - currentPrice) / currentPrice * 100) * p.lev, 0) / wsum;
    return { positions, longs, shorts, netPct };
  }, [coin, currentPrice]);

  if (!currentPrice || !data.positions.length) return null;

  const { positions, longs, shorts, netPct } = data;
  const total = positions.length;
  const longPct = Math.round((longs / total) * 100);
  const xOf = (pct) => 50 + Math.max(-RANGE, Math.min(RANGE, pct)) / RANGE * 46;
  const leanColor = netPct > 0.4 ? C.green : netPct < -0.4 ? C.red : C.textMuted; // weighted center-of-gravity marker
  const shortPct = 100 - longPct;
  const verdict = longPct >= 65 ? "Strongly long" : longPct >= 55 ? "Leaning long" : longPct > 45 ? "Balanced" : longPct > 35 ? "Leaning short" : "Strongly short";
  const vColor = longPct > 55 ? C.green : longPct < 45 ? C.red : C.textMuted;
  const VIcon = longPct > 55 ? TrendingUp : longPct < 45 ? TrendingDown : Minus;
  const fmtPrice = (p) => (p < 1 ? `$${p.toFixed(4)}` : `$${Math.round(p).toLocaleString()}`);

  return (
    <div style={cardStyle}>
      <SectionHeader
        icon={Crosshair}
        title={`Active positions — system overview · ${coin}`}
        subtitle={`Every open trade and live signal vs the current price. ${total} open positions.`}
      />

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
          const left = xOf(pct);
          const on = hover?.i === i;
          return (
            <div key={i}
              onMouseEnter={() => setHover({ i, left, top, p, pct })}
              onMouseLeave={() => setHover((h) => (h?.i === i ? null : h))}
              style={{
                position: "absolute", left: `${left}%`, top, transform: `translate(-50%,-50%) scale(${on ? 1.5 : 1})`,
                width: r * 2, height: r * 2, borderRadius: p.isBot ? "2px" : "50%",
                backgroundColor: p.kind === "trade" ? `${clr}${on ? "ff" : "cc"}` : (on ? `${clr}66` : "transparent"),
                border: `1.5px solid ${clr}`, boxShadow: `0 0 ${on ? 14 : 6}px ${clr}${on ? "aa" : "40"}`,
                cursor: "pointer", zIndex: on ? 7 : 3, transition: "transform 0.12s, box-shadow 0.12s",
              }} />
          );
        })}

        {/* custom tooltip — richer than the native title, styled */}
        {hover && (() => {
          const { p, pct, left, top } = hover;
          const clr = p.type === "LONG" ? C.green : C.red;
          const label = !p.approved ? "Signal — not executed"
            : p.status === "active" ? "Active trade"
            : p.status === "pending" ? "Pending order"
            : p.status === "closed" ? "Closed trade" : "Executed trade";
          const onRight = left > 55;
          return (
            <div style={{
              position: "absolute", left: `${left}%`, top: top - 12, zIndex: 12, pointerEvents: "none",
              transform: `translate(${onRight ? "-100%" : "0"}, -100%)`, marginLeft: onRight ? -8 : 8,
              backgroundColor: C.cardElev, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: "8px 10px",
              boxShadow: C.shadowLg, whiteSpace: "nowrap", minWidth: 168,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{p.trader}</span>
                <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: "0.5px", color: p.isBot ? C.cyan : C.textMuted, backgroundColor: p.isBot ? `${C.cyan}1c` : C.card, border: `1px solid ${C.border}`, padding: "1px 5px", borderRadius: 3 }}>{p.isBot ? "BOT" : "HUMAN"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800, color: clr }}>
                  {p.type === "LONG" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{p.type}
                </span>
                <span style={{ color: C.textMuted }}>· {label} · {p.lev}x</span>
              </div>
              <div style={{ fontSize: 10.5, ...mono, marginTop: 5, color: C.textMuted }}>
                target <span style={{ color: clr, fontWeight: 700 }}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</span>
                {p.approved && p.status === "closed" && p.pnlPct != null && (
                  <> · pnl <span style={{ color: p.pnlPct >= 0 ? C.green : C.red, fontWeight: 700 }}>{p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(1)}%</span></>
                )}
              </div>
              <div style={{ fontSize: 9.5, color: C.textFaint, marginTop: 3 }}>Robotín confidence {p.conf}%</div>
            </div>
          );
        })()}
      </div>

      {/* ── COMPASS — the net read at a glance: a needle on the bearish↔bullish axis + the big numbers ── */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        {/* verdict */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase", color: vColor }}>
            <VIcon size={16} /> {verdict}
          </span>
        </div>
        {/* needle gauge — same axis as the map: short/bearish left, long/bullish right */}
        <div style={{ position: "relative", height: 22, margin: "0 2px" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 10, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${C.red}, ${C.red}66 38%, ${C.textFaint}44 50%, ${C.green}66 62%, ${C.green})` }} />
          <div style={{ position: "absolute", left: "50%", top: 5, height: 16, width: 2, backgroundColor: C.textFaint, transform: "translateX(-50%)" }} />
          <div title={`Crowd lean: ${longPct}% long`} style={{ position: "absolute", left: `${longPct}%`, top: -3, transform: "translateX(-50%)" }}>
            <div style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `11px solid ${vColor}`, filter: `drop-shadow(0 0 6px ${vColor}99)` }} />
          </div>
        </div>
        {/* big numbers */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.red, ...mono, lineHeight: 1, letterSpacing: "-1px" }}>{shortPct}%</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.6px", marginTop: 4 }}>SHORT · {shorts} pos</div>
          </div>
          <div style={{ textAlign: "center", color: C.textFaint, fontSize: 9.5, ...mono, paddingBottom: 4, lineHeight: 1.5 }}>
            weighted target<br /><span style={{ color: leanColor, fontWeight: 800, fontSize: 13 }}>{netPct >= 0 ? "+" : ""}{netPct.toFixed(2)}% vs now</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.green, ...mono, lineHeight: 1, letterSpacing: "-1px" }}>{longPct}%</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "0.6px", marginTop: 4 }}>LONG · {longs} pos</div>
          </div>
        </div>
      </div>

      {/* legend — color = side · fill = executed vs signal · shape = bot vs human */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "14px", flexWrap: "wrap", fontSize: 10, color: C.textMuted }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: `${C.textMuted}cc`, border: `1.5px solid ${C.textMuted}` }} /> executed trade</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "transparent", border: `1.5px solid ${C.textMuted}` }} /> signal (not taken)</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: C.textFaint }} /> human</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: 9, height: 9, borderRadius: "2px", backgroundColor: C.textFaint }} /> bot</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: C.green }} /> long <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: C.red, marginLeft: 4 }} /> short</span>
        <span style={{ color: C.textFaint }}>larger = more leverage</span>
      </div>
    </div>
  );
};

export { PositioningMap };
