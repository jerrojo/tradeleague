import { C, cardStyle, mono } from "../theme";
import { AlertTriangle, Award, Eye, Lightbulb, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import { useMemo } from "react";
/* ═══════════════════════ ACTIVITY HEATMAP (GitHub-style) ═══════════════════════ */
const ActivityHeatmap = ({ traderData }) => {
  // Generate 26 weeks (6 months) of daily activity data
  const weeks = useMemo(() => {
    const result = [];
    const baseWR = traderData ? (traderData.history || []).filter(h => h.status === "tp_hit").length / Math.max(1, (traderData.history || []).length) : 0.6;
    for (let w = 0; w < 26; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const seed = Math.sin((w * 7 + d) * 127.1 + 43758.5453) * 10000;
        const rand = seed - Math.floor(seed);
        const hasTrade = rand > 0.35;
        if (!hasTrade) { days.push({ level: 0, trades: 0, pnl: 0 }); continue; }
        const tradeCount = Math.ceil(rand * 6);
        const isWin = rand < baseWR + 0.1;
        const pnl = isWin ? Math.round(rand * 3000 + 200) : -Math.round((1 - rand) * 1500 + 100);
        const isBE = Math.abs(pnl) <= 150; // breakeven day (VARIV A.3: light green)
        const level = !hasTrade ? 0 : isBE ? 1 : pnl > 2000 ? 4 : pnl > 500 ? 3 : pnl > 0 ? 2 : pnl > -500 ? -1 : -2;
        days.push({ level, trades: tradeCount, pnl });
      }
      result.push(days);
    }
    return result;
  }, [traderData]);

  const cellSize = 11;
  const cellGap = 2;
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const monthLabels = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  const levelColor = (level) => {
    if (level === 0) return C.border;
    if (level === 1) return `${C.green}33`; // breakeven
    if (level >= 4) return C.green;
    if (level >= 3) return `${C.green}bb`;
    if (level >= 2) return `${C.green}77`;
    if (level === -1) return `${C.red}77`;
    return `${C.red}bb`;
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600" }}>Trading Activity — Last 6 Months</div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "9px", color: C.textMuted }}>
          <span>Less</span>
          {[C.border, `${C.red}77`, `${C.green}33`, `${C.green}77`, `${C.green}bb`, C.green].map((clr, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: clr }} />
          ))}
          <span>More</span>
        </div>
      </div>
      {/* Month labels */}
      <div style={{ display: "flex", paddingLeft: "28px", marginBottom: "4px" }}>
        {monthLabels.map((m, i) => (
          <div key={m} style={{ width: `${100 / 6}%`, fontSize: "9px", color: C.textFaint, fontWeight: "600" }}>{m}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0px" }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: `${cellGap}px`, marginRight: "4px", justifyContent: "flex-start" }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{ height: cellSize, fontSize: "8px", color: C.textFaint, display: "flex", alignItems: "center", justifyContent: "flex-end", width: "22px" }}>{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display: "flex", gap: `${cellGap}px`, flex: 1 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: `${cellGap}px`, flex: 1 }}>
              {week.map((day, di) => (
                <div key={di} title={day.trades > 0 ? `${day.trades} trades · ${day.pnl >= 0 ? "+" : ""}$${day.pnl}` : "No trades"} style={{
                  width: "100%", aspectRatio: "1", maxWidth: cellSize + 4, borderRadius: "2px",
                  backgroundColor: levelColor(day.level), cursor: day.trades > 0 ? "pointer" : "default",
                  transition: "transform 0.1s", minHeight: cellSize
                }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Summary stats row */}
      <div style={{ display: "flex", gap: "20px", marginTop: "10px", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
        {(() => {
          const allDays = weeks.flat();
          const tradeDays = allDays.filter(d => d.trades > 0);
          const winDays = allDays.filter(d => d.pnl > 0);
          const totalTrades = tradeDays.reduce((a, d) => a + d.trades, 0);
          const currentStreak = (() => { let s = 0; for (let i = allDays.length - 1; i >= 0; i--) { if (allDays[i].pnl > 0) s++; else break; } return s; })();
          return [
            ["Active Days", `${tradeDays.length}/182`, C.blue],
            ["Win Days", `${winDays.length}`, C.green],
            ["Total Trades", totalTrades, C.purple],
            ["Current Streak", `${currentStreak}d`, C.amber],
          ].map(([l, v, clr]) => (
            <div key={l}>
              <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>{l}</div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: clr, ...mono }}>{v}</div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

/* ═══════════════════════ TRADE STRUCTURE DIAGRAM v2 (VARIV B.2 + B.3) ═══════════════════════
   Horizontal geometry of the position: SL ← Entry → TP1 → TP2 → TP3, proportional to price.
   Optional: close marker (actual exit) and MAE/MFE bars (the path the trade took). */
const TradeStructureDiagram = ({ entry, sl, tp, tps, close, maePct, mfePct, type = "LONG" }) => {
  const isLong = type === "LONG";
  const targets = (tps && tps.length ? tps : [tp]).filter(p => p != null);
  const slDist = Math.abs(entry - sl);
  if (!slDist || !targets.length) return null;
  // everything in R-multiples: SL = -1R, favor = positive
  const toR = (price) => ((isLong ? price - entry : entry - price) / slDist);
  const maeR = maePct != null ? Math.max(-1.15, -Math.abs(maePct / 100) * (entry / slDist)) : null;
  const mfeR = mfePct != null ? Math.abs(mfePct / 100) * (entry / slDist) : null;
  const closeR = close != null ? toR(close) : null;
  const maxR = Math.max(...targets.map(toR), closeR ?? 0, mfeR ?? 0, 0.5) * 1.06;
  const minR = -1.15;
  const x = (r) => ((r - minR) / (maxR - minR)) * 100;
  const rr = toR(targets[0]).toFixed(2);
  const fmt = (p) => p < 1 ? p.toFixed(4) : p.toLocaleString();
  const hasPath = maeR != null || mfeR != null;
  return (
    <div style={{ padding: "10px 0 2px" }}>
      <div style={{ position: "relative", height: hasPath ? 52 : 34 }}>
        {/* zones */}
        <div style={{ position: "absolute", top: 12, left: `${x(-1)}%`, width: `${x(0) - x(-1)}%`, height: 16, backgroundColor: C.redBg, border: `1px solid ${C.red}40`, borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", top: 12, left: `${x(0)}%`, width: `${x(toR(targets[targets.length - 1])) - x(0)}%`, height: 16, backgroundColor: C.greenBg, border: `1px solid ${C.green}30`, borderRadius: "0 3px 3px 0" }} />
        {/* SL marker */}
        <div style={{ position: "absolute", top: 8, left: `${x(-1)}%`, width: 2, height: 24, backgroundColor: C.red }} />
        <div style={{ position: "absolute", top: 30, left: `${x(-1)}%`, transform: "translateX(-30%)", fontSize: 8, fontWeight: 700, color: C.red, ...mono, whiteSpace: "nowrap" }}>SL ${fmt(sl)}</div>
        {/* Entry marker */}
        <div style={{ position: "absolute", top: 6, left: `${x(0)}%`, width: 2, height: 28, backgroundColor: C.text, zIndex: 2 }} />
        <div style={{ position: "absolute", top: -2, left: `${x(0)}%`, transform: "translateX(-50%)", fontSize: 7, fontWeight: 700, color: C.text, ...mono }}>ENTRY ${fmt(entry)}</div>
        {/* TP markers */}
        {targets.map((p, i) => (
          <span key={i}>
            <span style={{ position: "absolute", top: 8, left: `${x(toR(p))}%`, width: 2, height: 24, backgroundColor: C.green, opacity: 0.5 + i * 0.25, display: "block" }} />
            <span style={{ position: "absolute", top: -2, left: `${x(toR(p))}%`, transform: "translateX(-50%)", fontSize: 7, fontWeight: 700, color: C.green, ...mono, whiteSpace: "nowrap", display: "block" }}>{targets.length > 1 ? `TP${i + 1}` : "TP"} ${fmt(p)}</span>
          </span>
        ))}
        {/* Close marker (actual exit) */}
        {closeR != null && (
          <div title={`Closed at $${fmt(close)}`} style={{ position: "absolute", top: 9, left: `${x(closeR)}%`, transform: "translateX(-50%)", zIndex: 3, width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `8px solid ${closeR >= 0 ? C.green : C.red}`, filter: "drop-shadow(0 0 3px rgba(0,0,0,0.6))" }} />
        )}
        {/* MAE / MFE path bars (VARIV B.3) */}
        {maeR != null && maeR < 0 && (
          <div title={`MAE ${maePct}% — worst point against the position`} style={{ position: "absolute", top: 40, left: `${x(maeR)}%`, width: `${x(0) - x(maeR)}%`, height: 4, backgroundColor: C.red, opacity: 0.85, borderRadius: 2 }} />
        )}
        {mfeR != null && mfeR > 0 && (
          <div title={`MFE +${mfePct}% — best point in favor`} style={{ position: "absolute", top: 40, left: `${x(0)}%`, width: `${Math.min(x(mfeR), 100) - x(0)}%`, height: 4, backgroundColor: C.green, opacity: 0.85, borderRadius: 2 }} />
        )}
        {hasPath && <div style={{ position: "absolute", top: 37, left: `${x(0)}%`, width: 1, height: 10, backgroundColor: C.textFaint }} />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 8, color: C.textFaint }}>
        <span>{hasPath ? `MAE ${maePct ?? "—"}%` : `-1R (${isLong ? "below" : "above"})`}</span>
        <span style={{ color: C.blue, fontWeight: 700 }}>R:R 1:{rr}{targets.length > 1 ? ` → TP3 1:${toR(targets[targets.length - 1]).toFixed(2)}` : ""}</span>
        <span>{hasPath ? `MFE +${mfePct ?? "—"}%` : `+${rr}R (${isLong ? "above" : "below"})`}</span>
      </div>
    </div>
  );
};


/* ═══════════════════════ LIVE PnL TICKER ═══════════════════════ */
const LivePnLTicker = () => {
  const tickerItems = [
    { text: "Scalp King +$2,340 (BTC LONG)", type: "trade" },
    { text: "WHALE ALERT: $3.2M BTC LONG opened", type: "whale" },
    { text: "Crypto Ninja +$890 (ETH SHORT)", type: "trade" },
    { text: "$1.2M LIQUIDATED — shorts rekt in 15min", type: "liquidation" },
    { text: "Smart Money +$1,560 (AVAX LONG)", type: "trade" },
    { text: "Robotín approved 6 of Phoenix Rise's last 8 signals", type: "achievement" },
    { text: "Rocket Launch +$745 (BTC SHORT)", type: "trade" },
    { text: "Scalp King hit Alpha Score 87 — best on the board", type: "achievement" },
    { text: "Bull Master -$420 (SOL LONG)", type: "loss" },
    { text: "DOGE +12.4% in 2h — meme szn is back", type: "moon" },
    { text: "Phoenix Rise +$2,100 (DOGE LONG)", type: "trade" },
    { text: "Diamond Hands: Smart Money held through -5.8% DD", type: "achievement" },
    { text: "Wave Rider +$320 (BTC LONG)", type: "trade" },
    { text: "3 traders entered PEPE before the pump", type: "signal" },
    { text: "Iron Fist -$180 (ETH LONG)", type: "loss" },
    { text: "567 copiers on Scalp King — WAGMI", type: "social" },
  ];
  const tickerTypeIcon = { trade: Zap, whale: Eye, liquidation: AlertTriangle, achievement: Award, loss: TrendingDown, moon: TrendingUp, signal: Lightbulb, social: Users };
  const tickerTypeColor = { trade: C.green, whale: C.cyan, liquidation: C.red, achievement: C.purple, loss: C.red, moon: C.amber, signal: C.blue, social: C.amber };

  const repeatedItems = [...tickerItems, ...tickerItems];

  return (
    <div style={{
      height: 32, backgroundColor: C.bg, borderBottom: `1px solid ${C.border}`,
      overflow: "hidden", display: "flex", alignItems: "center", position: "fixed", top: 0, left: 0, right: 0, zIndex: 400
    }}>
      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{
        display: "flex", whiteSpace: "nowrap", animation: "tickerScroll 75s linear infinite",
        fontSize: "11px", fontWeight: "500", color: C.textMuted, gap: "28px", ...mono
      }}>
        {repeatedItems.map((item, i) => {
          const TIcon = tickerTypeIcon[item.type];
          const tColor = tickerTypeColor[item.type] || C.textMuted;
          return (
            <span key={i} style={{ color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <TIcon size={10} color={tColor} /> {item.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};


export {
  ActivityHeatmap,
  TradeStructureDiagram,
  LivePnLTicker
};
