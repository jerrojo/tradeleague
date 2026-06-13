import { BotTag } from "../common";
import { Activity, ChevronRight, Flame, Lightbulb, Scale, Trophy } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TraderLink, useFeedFilter, useProfile } from "../../contexts";
import { feedItems, mockTraders, traderColors, traderEquity } from "../../data/mockData";
import { alphaColor, calcAlphaScore } from "../../lib/scoring";
import { C, cardStyle, mono, tierColor } from "../../theme";
import { useMemo, useState } from "react";
/* ═══════════════════════ RACE CHART TOOLTIP ═══════════════════════ */
const RaceTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  const entries = [...new Map(payload.filter(entry => entry.value != null).map(e => [e.name, e])).values()]
    .sort((a, b) => b.value - a.value);
  return (
    <div style={{
      backgroundColor: C.card,
      border: `1px solid ${C.borderLight}`,
      borderRadius: "10px",
      padding: "12px 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
    }}>
      <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "8px" }}>Day {label}</div>
      {entries.map((entry, idx) => (
        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginBottom: idx < entries.length - 1 ? "4px" : "0" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: entry.color, flexShrink: 0 }} />
          <span style={{ color: C.text, fontWeight: "500" }}>{entry.name}</span>
          <span style={{ color: C.textMuted, marginLeft: "auto", ...mono }}>${Number(entry.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════ TAB: ARENA (The Race) ═══════════════════════ */
const HomeTab = () => {
  const { openProfile } = useProfile();
  const { setFeedFilter, setActiveTab } = useFeedFilter();
  const [watching, setWatching] = useState(() => {
    const m = {};
    mockTraders.forEach((t, i) => { m[t.name] = i < 5; });
    return m;
  });

  const watchedNames = Object.keys(watching).filter(k => watching[k]);

  // Top 10 traders sorted by Alpha Score
  const top10Traders = useMemo(() => {
    return [...mockTraders].map(t => ({ ...t, _alpha: calcAlphaScore(t) })).sort((a, b) => b._alpha - a._alpha).slice(0, 10);
  }, []);

  // Highlight moments — big plays from feed
  const highlights = useMemo(() => {
    return feedItems
      .filter(f => (f.kind === "trade" && Math.abs(f.pnl) > 3000) || f.kind === "achievement" || f.kind === "whale")
      .slice(0, 4);
  }, []);

  // Current leader
  const leader = useMemo(() => {
    const last = traderEquity[traderEquity.length - 1];
    if (!last) return null;
    let best = null, bestVal = -Infinity;
    mockTraders.forEach(t => { if (last[t.name] != null && last[t.name] > bestVal) { bestVal = last[t.name]; best = t; } });
    return best;
  }, []);

  // Top 10 feeds for bottom cards
  const top10Trades = useMemo(() =>
    feedItems.filter(f => f.kind === "trade" && f.status !== "active").sort((a, b) => b.pnl - a.pnl).slice(0, 10), []);
  const top10Signals = useMemo(() =>
    feedItems.filter(f => f.kind === "signal").sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).slice(0, 10), []);
  const top10Predictions = useMemo(() =>
    feedItems.filter(f => f.kind === "prediction").sort((a, b) => b.stake - a.stake).slice(0, 10), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* ═══ TOP SECTION: 2-column layout ═══ */}
      <div className="grid-2col">

        {/* ── LEFT: Race Chart + Highlights ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Trader Toggles — who's racing */}
          <div style={{ ...cardStyle, padding: "10px 14px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "9px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "2px" }}>Racing:</span>
            {mockTraders.map((t, i) => {
              const on = watching[t.name];
              const color = traderColors[i];
              return (
                <button key={t.name} onClick={() => setWatching(prev => ({ ...prev, [t.name]: !prev[t.name] }))} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "4px 10px", borderRadius: "16px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                  border: `1px solid ${on ? color : C.border}`,
                  backgroundColor: on ? color + "15" : "transparent",
                  color: on ? C.text : C.textFaint, transition: "all 0.15s"
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: on ? color : C.textFaint }} />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>

          {/* Race Chart — multi-line equity curves */}
          <div style={{ ...cardStyle, padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "800" }}>The Race</div>
                <div style={{ fontSize: "10px", color: C.textMuted }}>Cumulative P&L — 30 days — {watchedNames.length} traders racing</div>
              </div>
              {leader && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "8px", backgroundColor: C.amberBg, border: `1px solid ${C.amber}30` }}>
                  <Trophy size={12} color={C.amber} />
                  <span style={{ fontSize: "10px", fontWeight: "700", color: C.amber }}>{leader.avatar} {leader.name} leading</span>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={traderEquity}>
                <defs>
                  {traderColors.map((color, i) => (
                    <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} opacity={0.4} />
                <XAxis dataKey="day" stroke={C.textMuted} fontSize={9} tickFormatter={v => `D${v}`} />
                <YAxis stroke={C.textMuted} fontSize={9} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
                <Tooltip content={<RaceTooltip />} />
                {mockTraders.map((t, i) => watching[t.name] && (
                  <Area key={`area-${t.name}`} type="monotone" dataKey={t.name} fill={`url(#grad-${i})`}
                    stroke="none" fillOpacity={0.3} isAnimationActive={false} />
                ))}
                {mockTraders.map((t, i) => watching[t.name] && (
                  <Line key={`line-${t.name}`} type="monotone" dataKey={t.name} stroke={traderColors[i]}
                    strokeWidth={leader && leader.name === t.name ? 3 : 2}
                    dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: traderColors[i] }}
                    connectNulls={false} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
            {/* Legend with current standings */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
              {mockTraders.filter(t => watching[t.name]).map((t, idx) => {
                const ci = mockTraders.indexOf(t);
                const lastDay = traderEquity[traderEquity.length - 1];
                const val = lastDay ? lastDay[t.name] : 0;
                return (
                  <div key={t.name} onClick={() => openProfile(t)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", border: `1px solid ${C.border}` }}>
                    <div style={{ width: 8, height: 3, borderRadius: "1px", backgroundColor: traderColors[ci] }} />
                    <span style={{ fontWeight: "600", color: traderColors[ci] }}>{t.avatar} {t.name}</span>
                    <span style={{ color: val >= 0 ? C.green : C.red, fontWeight: "700", ...mono }}>
                      {val >= 0 ? "+" : ""}${val != null ? (Math.abs(val) >= 1000 ? (val/1000).toFixed(1) + "K" : val) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Highlight Moments — live big plays */}
          <div style={{ ...cardStyle, padding: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Flame size={12} color={C.amber} />
              <span style={{ fontSize: "10px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Highlight Moments</span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.green, display: "inline-block", marginLeft: "4px" }} />
              <span style={{ fontSize: "8px", color: C.green, fontWeight: "600" }}>LIVE</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {highlights.map((h, i) => (
                <div key={h.id || i} style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
                  backgroundColor: i === 0 ? `${C.amber}10` : "transparent",
                  borderRadius: "6px", border: `1px solid ${i === 0 ? C.amber + "30" : C.border}`,
                  fontSize: "11px"
                }}>
                  <span style={{ fontSize: "14px" }}>{h.avatar || (h.kind === "whale" ? "🐋" : "⚡")}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {h.kind === "trade" && (
                      <span>
                        <TraderLink name={h.trader}><span style={{ fontWeight: "700" }}>{h.trader}</span></TraderLink>{" "}
                        <span style={{ color: h.pnl >= 0 ? C.green : C.red, fontWeight: "800", ...mono }}>
                          {h.pnl >= 0 ? "+" : ""}${Math.abs(h.pnl).toLocaleString()}
                        </span>{" "}
                        <span style={{ color: C.textMuted }}>on {h.pair} {h.type}</span>
                      </span>
                    )}
                    {h.kind === "achievement" && (
                      <span>
                        <TraderLink name={h.trader}><span style={{ fontWeight: "700" }}>{h.trader}</span></TraderLink>{" "}
                        <span style={{ color: C.amber }}>unlocked {h.achievement.name}</span>
                      </span>
                    )}
                    {(h.kind === "whale" || h.kind === "liquidation") && (
                      <span style={{ color: C.cyan, fontWeight: "600" }}>{h.text}</span>
                    )}
                  </div>
                  <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Top 10 Overall Traders Leaderboard ── */}
        <div style={{ ...cardStyle, padding: "12px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <Trophy size={14} color={C.amber} />
            <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>Top 10 Overall Traders</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
            {top10Traders.map((t, i) => {
              const score = t._alpha;
              const maxScore = 100;
              const barPct = (score / maxScore) * 100;
              const tc = tierColor[t.tier] || C.textMuted;
              return (
                <button key={t.name} onClick={() => openProfile(t)} style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px",
                  backgroundColor: "transparent", border: "none", borderRadius: "6px",
                  cursor: "pointer", color: C.text, width: "100%", textAlign: "left",
                  transition: "background-color 0.15s"
                }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.cardHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <span style={{ fontSize: "10px", fontWeight: "700", color: i < 3 ? C.amber : C.textFaint, width: 16, textAlign: "right", ...mono }}>{i + 1}</span>
                  <span style={{ fontSize: "16px" }}>{t.avatar}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                      <BotTag isBot={t.isBot} />
                    </div>
                    {/* Score bar */}
                    <div style={{ height: 3, backgroundColor: C.border, borderRadius: 2, marginTop: 3, width: "100%" }}>
                      <div style={{ height: "100%", width: `${barPct}%`, backgroundColor: alphaColor(score), borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "900", color: alphaColor(score), ...mono, minWidth: 48, textAlign: "right" }}>{score}/100</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => { setActiveTab("traders"); }} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
            padding: "8px", marginTop: "8px", backgroundColor: C.purpleBg, border: `1px solid ${C.purple}40`,
            borderRadius: "6px", color: C.purple, fontSize: "10px", fontWeight: "700", cursor: "pointer"
          }}>
            View all traders <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* ═══ BOTTOM: 3 cards — Top 10 Trades, Top 10 Signals, Top 10 Futures ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>

        {/* Top 10 Trades */}
        <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "6px" }}>
            <Activity size={12} color={C.green} />
            <span style={{ fontSize: "11px", fontWeight: "800" }}>Top 10 Trades</span>
          </div>
          {top10Trades.map((item, idx) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px",
              borderBottom: idx < top10Trades.length - 1 ? `1px solid ${C.border}` : "none", fontSize: "10px"
            }}>
              <span style={{ fontSize: "12px" }}>{item.avatar}</span>
              <span style={{ fontWeight: "700", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "10px" }}>{item.pair}</span>
              <span style={{ fontSize: "8px", fontWeight: "800", color: item.type === "LONG" ? C.green : C.red }}>{item.type}</span>
              <span style={{ fontWeight: "900", color: item.pnl >= 0 ? C.green : C.red, ...mono, fontSize: "10px" }}>
                {item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}
              </span>
            </div>
          ))}
          <button onClick={() => { setFeedFilter("trade"); setActiveTab("arena:trade"); }} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
            padding: "6px", backgroundColor: C.greenBg, border: "none", borderTop: `1px solid ${C.border}`,
            color: C.green, fontSize: "9px", fontWeight: "700", cursor: "pointer"
          }}>
            Ver todos <ChevronRight size={10} />
          </button>
        </div>

        {/* Top 10 Signals */}
        <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "6px" }}>
            <Lightbulb size={12} color={C.blue} />
            <span style={{ fontSize: "11px", fontWeight: "800" }}>Top 10 Signals</span>
          </div>
          {top10Signals.map((item, idx) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px",
              borderBottom: idx < top10Signals.length - 1 ? `1px solid ${C.border}` : "none", fontSize: "10px"
            }}>
              <span style={{ fontSize: "12px" }}>{item.avatar}</span>
              <span style={{ fontWeight: "700", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "10px" }}>{item.pair} {item.bias}</span>
              <span style={{ fontWeight: "900", color: item.confidence >= 80 ? C.green : item.confidence >= 60 ? C.amber : C.red, ...mono, fontSize: "10px" }}>
                {item.confidence}%
              </span>
            </div>
          ))}
          <button onClick={() => { setFeedFilter("signal"); setActiveTab("arena:signal"); }} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
            padding: "6px", backgroundColor: C.blueBg, border: "none", borderTop: `1px solid ${C.border}`,
            color: C.blue, fontSize: "9px", fontWeight: "700", cursor: "pointer"
          }}>
            View all <ChevronRight size={10} />
          </button>
        </div>

        {/* Top 10 Futures / Predictions */}
        <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "6px" }}>
            <Scale size={12} color={C.amber} />
            <span style={{ fontSize: "11px", fontWeight: "800" }}>Top 10 Futures</span>
          </div>
          {top10Predictions.map((item, idx) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px",
              borderBottom: idx < top10Predictions.length - 1 ? `1px solid ${C.border}` : "none", fontSize: "10px"
            }}>
              <span style={{ fontSize: "12px" }}>{item.avatar}</span>
              <span style={{ fontWeight: "600", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "9px", color: C.textMuted }}>{item.question}</span>
              <span style={{ fontWeight: "800", color: item.bet === "YES" ? C.green : C.red, fontSize: "10px", ...mono }}>{item.bet}</span>
              <span style={{ fontWeight: "700", color: C.amber, fontSize: "9px", ...mono }}>${item.stake}</span>
            </div>
          ))}
          <button onClick={() => { setFeedFilter("prediction"); setActiveTab("arena:prediction"); }} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", width: "100%",
            padding: "6px", backgroundColor: C.amberBg, border: "none", borderTop: `1px solid ${C.border}`,
            color: C.amber, fontSize: "9px", fontWeight: "700", cursor: "pointer"
          }}>
            View all <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};


export {
  RaceTooltip,
  HomeTab
};
