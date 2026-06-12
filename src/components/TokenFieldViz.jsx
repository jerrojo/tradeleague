import { Tag } from "./common";
import { Gamepad2 } from "lucide-react";
import { mockTraders } from "../data/mockData";
import { C, cardStyle, mono } from "../theme";
/* ═══════════════════════ TOKEN FIELD VISUALIZATION ═══════════════════════ */
const TokenFieldViz = ({ pair, currentPrice, priceRange, players }) => {
  const range = priceRange.high - priceRange.low;
  const redZoneWidth = 8;
  const priceToX = (price) => {
    const pct = ((price - priceRange.low) / range) * 100;
    return Math.max(2, Math.min(98, pct));
  };
  const ballX = priceToX(currentPrice);
  const longs = players.filter(p => p.team === "LONG");
  const shorts = players.filter(p => p.team === "SHORT");
  const total = players.length || 1;
  const longPct = Math.round((longs.length / total) * 100);
  const shortPct = 100 - longPct;
  const longHumans = longs.filter(p => { const t = mockTraders.find(tr => tr.name === p.name); return t && !t.isBot; }).length;
  const longBots = longs.length - longHumans;
  const shortHumans = shorts.filter(p => { const t = mockTraders.find(tr => tr.name === p.name); return t && !t.isBot; }).length;
  const shortBots = shorts.length - shortHumans;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Gamepad2 size={14} color={C.purple} />
          <span style={{ fontSize: "13px", fontWeight: "700" }}>Trading Field — {pair}</span>
          <Tag text={`${players.length} active`} color={C.green} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", color: C.textMuted }}>Current Price</span>
          <span style={{ fontSize: "16px", fontWeight: "800", color: C.green, ...mono }}>${currentPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* The Field */}
      <div style={{ position: "relative", width: "100%", height: "240px", backgroundColor: C.bg, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {/* Red zones */}
        <div style={{ position: "absolute", top: 0, left: 0, width: `${redZoneWidth}%`, height: "100%", backgroundColor: "rgba(248,81,73,0.12)", borderRight: "2px dashed rgba(248,81,73,0.4)" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-90deg)", fontSize: "9px", fontWeight: "700", color: C.red, textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>RED ZONE</div>
        </div>
        <div style={{ position: "absolute", top: 0, right: 0, width: `${redZoneWidth}%`, height: "100%", backgroundColor: "rgba(248,81,73,0.12)", borderLeft: "2px dashed rgba(248,81,73,0.4)" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(90deg)", fontSize: "9px", fontWeight: "700", color: C.red, textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>RED ZONE</div>
        </div>
        {/* Goal labels */}
        <div style={{ position: "absolute", bottom: "10px", left: "10px", fontSize: "10px", fontWeight: "700", color: C.red }}>SHORT<div style={{ fontSize: "8px", fontWeight: "400", color: C.textMuted }}>Goal Line</div></div>
        <div style={{ position: "absolute", bottom: "10px", right: "10px", fontSize: "10px", fontWeight: "700", color: C.green, textAlign: "right" }}>LONG<div style={{ fontSize: "8px", fontWeight: "400", color: C.textMuted }}>Goal Line</div></div>
        {/* Yard lines */}
        {[20, 35, 50, 65, 80].map(pct => {
          const price = priceRange.low + (pct / 100) * range;
          return (
            <div key={pct} style={{ position: "absolute", top: 0, left: `${pct}%`, height: "100%", borderLeft: `1px solid ${C.border}` }}>
              <div style={{ position: "absolute", bottom: "2px", left: "4px", fontSize: "8px", color: C.textFaint, ...mono }}>${price.toFixed(0)}</div>
            </div>
          );
        })}
        {/* Center line */}
        <div style={{ position: "absolute", top: 0, left: "50%", height: "100%", borderLeft: `1px solid ${C.borderLight}` }} />
        {/* Ball */}
        <div style={{ position: "absolute", top: "50%", left: `${ballX}%`, transform: "translate(-50%,-50%)", zIndex: 10, textAlign: "center" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#ffd700", border: "2px solid #fff", margin: "0 auto 3px", boxShadow: "0 0 12px rgba(255,215,0,0.6)" }} />
          <div style={{ fontSize: "8px", fontWeight: "700", color: "#ffd700" }}>BALL</div>
        </div>
        {/* Players */}
        {players.map((p, i) => {
          const x = priceToX(p.entry);
          const isLong = p.team === "LONG";
          const isWin = p.status === "Win";
          const dotColor = isLong ? (isWin ? C.green : "rgba(63,185,80,0.5)") : (isWin ? C.red : "rgba(248,81,73,0.5)");
          const yOff = 15 + (i % 5) * 16;
          return (
            <div key={p.name} title={`${p.name} — ${p.team} — ${p.roi >= 0 ? "+" : ""}${p.roi.toFixed(2)}%`} style={{ position: "absolute", left: `${x}%`, top: `${yOff}%`, transform: "translate(-50%,-50%)", textAlign: "center", cursor: "pointer", zIndex: 5 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: dotColor, border: `2px solid ${isWin ? "white" : "rgba(255,255,255,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", boxShadow: isWin ? `0 0 8px ${dotColor}` : "none" }}>
                {isLong ? (isWin ? "↗" : "↘") : (isWin ? "↙" : "↗")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
        {[[C.green, "LONG (Winning)"], ["rgba(63,185,80,0.5)", "LONG (Losing)"], [C.red, "SHORT (Winning)"], ["rgba(248,81,73,0.5)", "SHORT (Losing)"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: C.textMuted }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color }} />{label}
          </div>
        ))}
      </div>

      {/* Sentiment cards + bar */}
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: 1, ...cardStyle, padding: "10px", textAlign: "center", border: `1px solid ${C.green}40` }}>
          <div style={{ fontSize: "9px", fontWeight: "700", color: C.green }}>LONG</div>
          <div style={{ fontSize: "22px", fontWeight: "900", color: C.green, ...mono }}>{longPct}%</div>
          <div style={{ fontSize: "8px", color: C.textMuted, marginTop: "2px" }}>👤 {longHumans} humans · 🤖 {longBots} bots</div>
        </div>
        <div style={{ flex: 1, ...cardStyle, padding: "10px", textAlign: "center", border: `1px solid ${C.red}40` }}>
          <div style={{ fontSize: "9px", fontWeight: "700", color: C.red }}>SHORT</div>
          <div style={{ fontSize: "22px", fontWeight: "900", color: C.red, ...mono }}>{shortPct}%</div>
          <div style={{ fontSize: "8px", color: C.textMuted, marginTop: "2px" }}>👤 {shortHumans} humans · 🤖 {shortBots} bots</div>
        </div>
      </div>
      <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", gap: "2px" }}>
        <div style={{ flex: longPct, backgroundColor: C.green, borderRadius: "4px 0 0 4px" }} />
        <div style={{ flex: shortPct, backgroundColor: C.red, borderRadius: "0 4px 4px 0" }} />
      </div>
    </div>
  );
};

export {
  TokenFieldViz
};
