import { Avatar, SectionHeader } from "../common";
import { SignalTable } from "../SignalTable";
import { TraderSelector } from "../TraderSelector";
import { Cpu, Trophy } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useProfile } from "../../contexts";
import { mockTraders, traderColors, traderEquity } from "../../data/mockData";
import { coinCandles, coinSignals, ROBOTIN_COINS } from "../../data/robotin";
import { C, cardStyle, mono } from "../../theme";
import { useMemo, useState } from "react";

/* ═══════════════════════ RACE CHART TOOLTIP ═══════════════════════ */
const RaceTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  const entries = [...new Map(payload.filter(entry => entry.value != null).map(e => [e.name, e])).values()]
    .sort((a, b) => b.value - a.value);
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.borderLight}`, borderRadius: "10px", padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
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

/* ═══════════════════════ LIVE OVERVIEW — the race + highlights ═══════════════════════ */
const HomeTab = () => {
  const { openProfile } = useProfile();
  const [watching, setWatching] = useState(() => {
    const m = {};
    mockTraders.forEach((t, i) => { m[t.name] = i < 5; });
    return m;
  });
  const watchedNames = Object.keys(watching).filter(k => watching[k]);
  const [open, setOpen] = useState(null); // expanded decision id

  // Latest Robotín decisions — the useful signal feed (approved/rejected), not social bait
  const recentDecisions = useMemo(() => ROBOTIN_COINS
    .flatMap(c => coinSignals(c, coinCandles(c)))
    .sort((a, b) => b.time - a.time)
    .slice(0, 6), []);

  // Latest close per coin — lets SignalRow read unrealized P&L on active decisions
  const lastCloseByCoin = useMemo(() => {
    const m = {};
    ROBOTIN_COINS.forEach((c) => { const cs = coinCandles(c); m[c] = cs.length ? cs[cs.length - 1].close : null; });
    return m;
  }, []);

  const leader = useMemo(() => {
    const last = traderEquity[traderEquity.length - 1];
    if (!last) return null;
    let best = null, bestVal = -Infinity;
    mockTraders.forEach(t => { if (last[t.name] != null && last[t.name] > bestVal) { bestVal = last[t.name]; best = t; } });
    return best;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Who's racing — searchable trader selector with editable favorites */}
      <div style={{ ...cardStyle, padding: "10px 14px" }}>
        <TraderSelector
          traders={mockTraders}
          selected={watchedNames}
          onToggle={(name) => setWatching(prev => ({ ...prev, [name]: !prev[name] }))}
          colorOf={(name) => traderColors[mockTraders.findIndex(t => t.name === name)]}
          label="Racing"
        />
      </div>

      {/* The Race — cumulative P&L equity curves */}
      <div style={{ ...cardStyle, padding: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "800" }}>Performance Track</div>
            <div style={{ fontSize: "10px", color: C.textMuted }}>Cumulative P&L — active period (30 days) — {watchedNames.length} traders compared</div>
          </div>
          {leader && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "8px", backgroundColor: C.amberBg, border: `1px solid ${C.amber}30` }}>
              <Trophy size={12} color={C.amber} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: "700", color: C.amber }}><Avatar name={leader.name} size={16} /> {leader.name} leading</span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
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
            <YAxis stroke={C.textMuted} fontSize={9} tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`} />
            <Tooltip content={<RaceTooltip />} />
            {mockTraders.map((t, i) => watching[t.name] && (
              <Area key={`area-${t.name}`} type="monotone" dataKey={t.name} fill={`url(#grad-${i})`} stroke="none" fillOpacity={0.3} isAnimationActive={false} />
            ))}
            {mockTraders.map((t, i) => watching[t.name] && (
              <Line key={`line-${t.name}`} type="monotone" dataKey={t.name} stroke={traderColors[i]} strokeWidth={leader && leader.name === t.name ? 3 : 2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: traderColors[i] }} connectNulls={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        {/* Standings legend */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
          {mockTraders.filter(t => watching[t.name]).map((t) => {
            const ci = mockTraders.indexOf(t);
            const lastDay = traderEquity[traderEquity.length - 1];
            const val = lastDay ? lastDay[t.name] : 0;
            return (
              <div key={t.name} onClick={() => openProfile(t)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", border: `1px solid ${C.border}` }}>
                <div style={{ width: 8, height: 3, borderRadius: "1px", backgroundColor: traderColors[ci] }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", color: traderColors[ci] }}><Avatar name={t.name} size={14} /> {t.name}</span>
                <span style={{ color: val >= 0 ? C.green : C.red, fontWeight: "700", ...mono }}>
                  {val >= 0 ? "+" : ""}${val != null ? (Math.abs(val) >= 1000 ? (val / 1000).toFixed(1) + "K" : val) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest Robotín decisions — same canonical SignalRow used everywhere */}
      <SectionHeader
        icon={Cpu}
        title="Latest Robotín decisions"
        subtitle="Newest signals across all assets and what Robotín did with each"
        right={<span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 800, color: C.green, backgroundColor: C.greenBg, border: `1px solid ${C.green}40`, padding: "2px 8px", borderRadius: 999, letterSpacing: "0.6px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.green }} /> LIVE</span>}
      />
      <SignalTable
        signals={recentDecisions}
        openId={open}
        onToggle={(id) => setOpen(open === id ? null : id)}
        onTrader={(name) => { const tr = mockTraders.find((x) => x.name === name); if (tr) openProfile(tr); }}
        lastCloseFor={(s) => lastCloseByCoin[s.coin] ?? null}
      />
    </div>
  );
};

export { RaceTooltip, HomeTab };
