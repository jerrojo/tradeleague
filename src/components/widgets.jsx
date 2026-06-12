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
        const level = !hasTrade ? 0 : pnl > 2000 ? 4 : pnl > 500 ? 3 : pnl > 0 ? 2 : pnl > -500 ? -1 : -2;
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
          {[C.border, `${C.red}77`, `${C.green}77`, `${C.green}bb`, C.green].map((clr, i) => (
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

/* ═══════════════════════ TRADE STRUCTURE DIAGRAM (SL ← Entry → TP) ═══════════════════════ */
const TradeStructureDiagram = ({ entry, sl, tp, type = "LONG" }) => {
  const isLong = type === "LONG";
  const slDist = Math.abs(entry - sl);
  const tpDist = Math.abs(tp - entry);
  const totalRange = slDist + tpDist;
  if (totalRange === 0) return null;
  const slPct = (slDist / totalRange) * 100;
  const tpPct = (tpDist / totalRange) * 100;
  const rr = (tpDist / Math.max(slDist, 0.01)).toFixed(1);

  return (
    <div style={{ padding: "6px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0px", height: "18px", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
        {/* SL zone (red) */}
        <div style={{ width: `${slPct}%`, height: "100%", backgroundColor: C.redBg, border: `1px solid ${C.red}40`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderRadius: "3px 0 0 3px" }}>
          <span style={{ fontSize: "8px", fontWeight: "700", color: C.red, ...mono, whiteSpace: "nowrap" }}>SL ${sl.toLocaleString()}</span>
        </div>
        {/* Entry marker */}
        <div style={{ width: "2px", height: "22px", backgroundColor: C.text, flexShrink: 0, zIndex: 2, position: "relative" }}>
          <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", fontSize: "7px", fontWeight: "700", color: C.text, whiteSpace: "nowrap", ...mono }}>ENTRY</div>
        </div>
        {/* TP zone (green) */}
        <div style={{ width: `${tpPct}%`, height: "100%", backgroundColor: C.greenBg, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderRadius: "0 3px 3px 0" }}>
          <span style={{ fontSize: "8px", fontWeight: "700", color: C.green, ...mono, whiteSpace: "nowrap" }}>TP ${tp.toLocaleString()}</span>
        </div>
      </div>
      {/* R:R label */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", fontSize: "8px", color: C.textFaint }}>
        <span>-{slDist.toFixed(slDist < 1 ? 4 : 0)} ({isLong ? "below" : "above"})</span>
        <span style={{ color: C.blue, fontWeight: "700" }}>R:R 1:{rr}</span>
        <span>+{tpDist.toFixed(tpDist < 1 ? 4 : 0)} ({isLong ? "above" : "below"})</span>
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
    { text: "Phoenix Rise won 6th prediction in a row", type: "achievement" },
    { text: "Rocket Launch +$745 (BTC SHORT)", type: "trade" },
    { text: "Scalp King hit Alpha Score 87 — new season high", type: "achievement" },
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
        display: "flex", whiteSpace: "nowrap", animation: "tickerScroll 60s linear infinite",
        fontSize: "12px", fontWeight: "600", color: C.text, gap: "24px", ...mono
      }}>
        {repeatedItems.map((item, i) => {
          const TIcon = tickerTypeIcon[item.type];
          const tColor = tickerTypeColor[item.type] || C.text;
          return (
            <span key={i} style={{ color: tColor, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <TIcon size={10} /> {item.text}
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
