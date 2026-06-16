import { TraderLink } from "../../contexts";
import { Avatar, BotTag, InfoTip, MiniSparkline, StatCard, Tag } from "../common";
import { ArrowDown, BellRing, CheckCircle, Circle, Copy, Eye, Flame, Pause, Play, ToggleLeft, ToggleRight } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useProfile, useWatchlist, useProMode } from "../../contexts";
import { copyPortfolios, heatAssets, mockGroups, mockHeatmap, mockTraders, traderColors, traderDeepData, traderEquity } from "../../data/mockData";
import { alphaColor, alphaLabel, calcAlphaScore, calcDegenScore, calcExpectancy, degenLabel, expectancyColor, titleByLevel } from "../../lib/scoring";
import { C, cardStyle, mono, pillStyle, tdStyle, thStyle, tierColor } from "../../theme";
import { Activity, AlertTriangle, Bot, Search, Star, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react";
import { useState } from "react";
/* ═══════════════════════ TAB 3: TRADERS ═══════════════════════ */
const TradersTab = () => {
  const [view, setView] = useState("leaderboard");
  const [compareMetric, setCompareMetric] = useState("equity");
  const [traderFilter, setTraderFilter] = useState("all");
  const [sortField, setSortField] = useState("pnl");
  const [search, setSearch] = useState("");
  const { openProfile } = useProfile();
  const proMode = useProMode(); // Simple hides secondary columns (Trend, Expectancy)
  const { followedTraders, setFollowedTraders, traderAlerts, setTraderAlerts } = useWatchlist();
  const [visibleTraders, setVisibleTraders] = useState(() => {
    const m = {};
    mockTraders.forEach((t, i) => { m[t.name] = i < 3; });
    return m;
  });

  const rankColors = [C.amber, C.textMuted, "#cd7f32"]; // gold, silver, bronze
  const toggleTrader = (name) => setVisibleTraders(prev => ({ ...prev, [name]: !prev[name] }));
  const allOn = mockTraders.every(t => visibleTraders[t.name]);
  const toggleAll = () => { const next = {}; mockTraders.forEach(t => { next[t.name] = !allOn; }); setVisibleTraders(next); };

  const seasonEnd = new Date(2026, 3, 1);
  const now = new Date();
  const daysLeft = Math.max(0, Math.floor((seasonEnd - now) / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor(((seasonEnd - now) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  const getFlames = (streak) => {
    if (streak >= 10) return <Flame size={12} color={C.amber} />;
    if (streak >= 5) return <Flame size={10} color={C.textMuted} />;
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Prominent trader search — jump straight to anyone */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: search ? C.purple : C.textMuted, pointerEvents: "none" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search any trader by name…" style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 10, border: `1px solid ${search ? C.purple : C.border}`, backgroundColor: C.card, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {[{id:"leaderboard",label:"Leaderboard"},{id:"compare",label:"Compare"},{id:"profiles",label:"Profiles"},{id:"heatmap",label:"Heatmap"},{id:"copy",label:"Copy Trading"}].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "8px 16px", borderRadius: "6px", border: `1px solid ${view === v.id ? C.purple : C.border}`,
            backgroundColor: view === v.id ? C.purpleBg : "transparent", color: view === v.id ? C.purple : C.textMuted,
            fontSize: "11px", fontWeight: "600", cursor: "pointer"
          }}>{v.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Toolbar: filter by type, sort, add */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {[
            { id: "all", label: "All", icon: Users },
            { id: "human", label: "Traders", icon: Activity },
            { id: "bot", label: "Bots", icon: Bot },
            { id: "followed", label: "Following", icon: Star },
          ].map(cat => (
            <button key={cat.id} onClick={() => setTraderFilter(cat.id)} style={{
              display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
              border: `1px solid ${traderFilter === cat.id ? C.purple : C.border}`,
              backgroundColor: traderFilter === cat.id ? C.purpleBg : "transparent",
              color: traderFilter === cat.id ? C.purple : C.textMuted
            }}>
              <cat.icon size={11} /> {cat.label}
            </button>
          ))}
          <div style={{ width: "1px", height: 20, backgroundColor: C.border, margin: "0 4px" }} />
          <button onClick={() => setSortField(prev => prev === "pnl" ? "winRate" : prev === "winRate" ? "alpha" : "pnl")} title={`Sort by ${sortField}`} style={{ display: "flex", alignItems: "center", gap: "3px", padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted }}>
            <ArrowDown size={11} /> {sortField === "pnl" ? "PnL" : sortField === "winRate" ? "Win%" : "Alpha"}
          </button>
        </div>
      </div>

      {view === "leaderboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {[["Rank",null],["Trader",null],["Alpha","alpha"],["Trend",null],["Streak","streak"],["WR / PF / DD",null],["PnL",null],["Expect.","expectancy"],["Action",null]].filter(([h]) => proMode || (h !== "Trend" && h !== "Expect.")).map(([h,tip]) => <th key={h} style={thStyle}>{tip ? <InfoTip k={tip}><span>{h}</span></InfoTip> : h}</th>)}
              </tr></thead>
              <tbody>
                {(() => {
                  let filtered = [...mockTraders];
                  if (traderFilter === "human") filtered = filtered.filter(t => !t.isBot);
                  else if (traderFilter === "bot") filtered = filtered.filter(t => t.isBot);
                  else if (traderFilter === "followed") filtered = filtered.filter(t => followedTraders[t.name]);
                  if (search.trim()) filtered = filtered.filter(t => t.name.toLowerCase().includes(search.trim().toLowerCase()));
                  filtered.sort((a, b) => {
                    if (sortField === "pnl") return b.pnl - a.pnl;
                    if (sortField === "winRate") return b.winRate - a.winRate;
                    return calcAlphaScore(b) - calcAlphaScore(a);
                  });
                  return filtered;
                })().map((t, i) => {
                  const isTop1 = i === 0;
                  const alpha = calcAlphaScore(t);
                  const aClr = alphaColor(alpha);
                  const isHotStreak = t.streak >= 10;
                  return (
                  <tr key={t.name} style={{ backgroundColor: i % 2 === 0 ? "transparent" : C.cardHover }}>
                    <td style={{ ...tdStyle, fontWeight: "800", fontSize: "14px", borderLeft: isTop1 ? `3px solid ${C.amber}` : "none", color: i < 3 ? rankColors[i] : C.textMuted, ...mono }}>
                      {i + 1}
                    </td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Avatar name={t.name} size={28} />
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <TraderLink name={t.name} />
                          <BotTag isBot={t.isBot} />
                        </div>
                        {t.viewersNow > 20 && <span style={{ fontSize: "9px", color: C.green, fontWeight: "600", marginLeft: "auto" }}><Eye size={9} /> {t.viewersNow}</span>}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "800", color: aClr, ...mono }}>{alpha}</span>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: aClr, padding: "1px 5px", borderRadius: "3px", backgroundColor: `${aClr}18` }}>{alphaLabel(alpha)}</span>
                      </div>
                    </td>
                    {proMode && (
                    <td style={{ ...tdStyle }}>
                      <MiniSparkline data={t.sparkData} width={56} height={18} />
                    </td>
                    )}
                    <td style={{ ...tdStyle, fontSize: "13px", fontWeight: "600" }}>
                      <span style={isHotStreak ? { textShadow: `0 0 8px ${C.amber}60` } : undefined}>
                        {getFlames(t.streak)}<span style={{ marginLeft: "4px", color: isHotStreak ? C.amber : C.text }}>{t.streak}</span>
                      </span>
                    </td>
                    {/* Win Rate Trinity — VARIV rule: never show WR without PF + MaxDD */}
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ ...mono, color: C.green, fontWeight: "700", fontSize: "12px" }}>{t.winRate}%</span>
                          <div style={{ width: "36px", height: "2px", backgroundColor: C.border, borderRadius: "1px", overflow: "hidden" }}>
                            <div style={{ width: `${t.winRate}%`, height: "100%", backgroundColor: C.green }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", fontSize: "9px", color: C.textMuted }}>
                          <span style={{ color: C.amber, ...mono }}>PF {t.profitFactor?.toFixed(1)}</span>
                          <span style={{ color: C.red, ...mono }}>DD {t.maxDD}%</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(t.pnl / 1000).toFixed(1)}K</td>
                    {/* Expectancy — VARIV metrics catalog (Pro only) */}
                    {proMode && (
                    <td style={{ ...tdStyle }}>
                      {(() => { const exp = calcExpectancy(t); return (
                        <span style={{ ...mono, color: expectancyColor(exp), fontWeight: "600", fontSize: "11px" }}>${exp}</span>
                      ); })()}
                    </td>
                    )}
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", ...mono }}>
                        <Users size={12} color={C.textMuted} /> {t.copiers}
                      </div>
                    </td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <button title="Follow" onClick={e => { e.stopPropagation(); setFollowedTraders(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: followedTraders[t.name] ? C.amber + "20" : "transparent", color: followedTraders[t.name] ? C.amber : C.textFaint }}>
                          <Star size={13} fill={followedTraders[t.name] ? C.amber : "none"} />
                        </button>
                        <button title="Alerts" onClick={e => { e.stopPropagation(); setTraderAlerts(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: traderAlerts[t.name] ? C.blue + "20" : "transparent", color: traderAlerts[t.name] ? C.blue : C.textFaint }}>
                          <BellRing size={13} />
                        </button>
                        <button onClick={() => openProfile(t)} style={{
                          padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                          backgroundColor: C.green, color: C.bg, border: "none", display: "flex", alignItems: "center", gap: "3px"
                        }}><Copy size={10} /> Copy</button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>

          <div style={{ ...cardStyle }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Signal Groups</div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  {["Rank","Group","Members","Win Rate","Monthly PnL","Signals","Accuracy","Hot"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {mockGroups.map((g, i) => (
                  <tr key={g.name} style={{ backgroundColor: i % 2 === 0 ? "transparent" : C.cardHover }}>
                    <td style={{ ...tdStyle, fontWeight: "800", fontSize: "13px", color: i < 3 ? rankColors[i] : C.textMuted, ...mono }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{g.name}</td>
                    <td style={{ ...tdStyle, ...mono }}>{g.members}</td>
                    <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{g.winRate}%</td>
                    <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(g.monthlyPnl / 1000).toFixed(1)}K</td>
                    <td style={{ ...tdStyle, ...mono }}>{g.signals}</td>
                    <td style={{ ...tdStyle, ...mono, color: C.amber, fontWeight: "600" }}>{g.accuracy}%</td>
                    <td style={{ ...tdStyle, fontSize: "13px", fontWeight: "600" }}>{getFlames(Math.max(...mockTraders.map(t => t.streak))) || "—"}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === "compare" && (() => {
        const activeTraders = mockTraders.filter(t => visibleTraders[t.name]);
        const compareBarData = activeTraders.map((t, i) => {
          const deep = traderDeepData[t.name];
          return {
            name: t.name, avatar: t.avatar, color: traderColors[mockTraders.indexOf(t)],
            winRate: t.winRate, pnl: t.pnl, trades: t.trades, streak: t.streak,
            signalAccuracy: deep.signalStats.accuracy, signalTotal: deep.signalStats.total, signalAvgPnl: deep.signalStats.avgPnlPerSignal,
            sharpe: t.sharpe, maxDD: Math.abs(t.maxDD), profitFactor: t.profitFactor || 0,
          };
        });
        const compareMetrics = [
          { id: "equity", label: "Equity" },
          { id: "signals", label: "Signals" },
          { id: "trades", label: "Trades" },
        ];
        return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...cardStyle, display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
            <button onClick={toggleAll} style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
              border: `1px solid ${allOn ? C.textMuted : C.border}`,
              backgroundColor: allOn ? C.cardHover : "transparent",
              color: allOn ? C.text : C.textMuted, marginRight: "4px"
            }}>{allOn ? "Deselect All" : "Select All"}</button>
            {mockTraders.map((t, i) => {
              const on = visibleTraders[t.name];
              const color = traderColors[i];
              return (
                <button key={t.name} onClick={() => toggleTrader(t.name)} style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                  border: `1px solid ${on ? color : C.border}`,
                  backgroundColor: on ? color + "18" : "transparent",
                  color: on ? color : C.textFaint, transition: "all 0.15s"
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: on ? color : C.textFaint, transition: "background-color 0.15s" }} />
                  {t.name}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {compareMetrics.map(m => (
              <button key={m.id} onClick={() => setCompareMetric(m.id)} style={{
                padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${compareMetric === m.id ? C.purple : C.border}`,
                backgroundColor: compareMetric === m.id ? C.purpleBg : "transparent",
                color: compareMetric === m.id ? C.purple : C.textMuted,
                display: "flex", alignItems: "center", gap: "6px"
              }}>{m.label}</button>
            ))}
          </div>

          {compareMetric === "equity" && (<>
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Equity Curve Comparison</div>
              <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "16px" }}>Cumulative PnL over 30 days</div>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={traderEquity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                  <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} />
                  <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px" }} formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} labelFormatter={l => `Day ${l}`} />
                  {mockTraders.map((t, i) => visibleTraders[t.name] && <Line key={t.name} type="monotone" dataKey={t.name} stroke={traderColors[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["","Trader","Win Rate","Total PnL","Trades","Day 30 Equity","Streak"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {activeTraders.map(t => {
                    const i = mockTraders.indexOf(t);
                    const lastEquity = traderEquity[traderEquity.length - 1][t.name];
                    return (
                      <tr key={t.name} className="hoverable" style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}><TraderLink name={t.name}>{t.name}</TraderLink></td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{t.winRate}%</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(t.pnl / 1000).toFixed(1)}K</td>
                        <td style={{ ...tdStyle, ...mono }}>{t.trades}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.blue, fontWeight: "600" }}>${(lastEquity / 1000).toFixed(1)}K</td>
                        <td style={{ ...tdStyle, ...mono, color: C.amber }}>{t.streak}W</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}

          {compareMetric === "signals" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Signal Accuracy (%)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                    <XAxis type="number" stroke={C.textMuted} fontSize={10} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke={C.textMuted} fontSize={10} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`${v}%`, "Accuracy"]} />
                    <Bar dataKey="signalAccuracy" radius={[0, 4, 4, 0]}>{compareBarData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Avg PnL per Signal ($)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                    <XAxis type="number" stroke={C.textMuted} fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke={C.textMuted} fontSize={10} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${v}`, "Avg PnL"]} />
                    <Bar dataKey="signalAvgPnl" radius={[0, 4, 4, 0]}>{compareBarData.map((e, i) => <Cell key={i} fill={e.signalAvgPnl >= 0 ? C.green : C.red} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["","Trader","Accuracy","Total Signals","Avg PnL/Signal","Best Signal","Subscribers"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {activeTraders.map(t => {
                    const i = mockTraders.indexOf(t);
                    const deep = traderDeepData[t.name];
                    return (
                      <tr key={t.name} className="hoverable" style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}><TraderLink name={t.name}>{t.name}</TraderLink></td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{deep.signalStats.accuracy}%</td>
                        <td style={{ ...tdStyle, ...mono }}>{deep.signalStats.total}</td>
                        <td style={{ ...tdStyle, ...mono, color: deep.signalStats.avgPnlPerSignal >= 0 ? C.green : C.red, fontWeight: "600" }}>${deep.signalStats.avgPnlPerSignal.toLocaleString()}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green }}>+${deep.signalStats.bestSignal.toLocaleString()}</td>
                        <td style={{ ...tdStyle, ...mono }}>{deep.signalStats.subscribers}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}

          {compareMetric === "trades" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Win Rate (%)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                    <XAxis type="number" stroke={C.textMuted} fontSize={10} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke={C.textMuted} fontSize={10} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`${v}%`, "Win Rate"]} />
                    <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>{compareBarData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Sharpe Ratio vs Max Drawdown</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                    <XAxis dataKey="name" stroke={C.textMuted} fontSize={9} angle={-20} textAnchor="end" height={50} />
                    <YAxis stroke={C.textMuted} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                    <Bar dataKey="sharpe" name="Sharpe" fill={C.blue} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="profitFactor" name="Profit Factor" fill={C.purple} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["","Trader","Win Rate","Total PnL","Trades","Sharpe","Max DD","Profit Factor","Streak"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {activeTraders.map(t => {
                    const i = mockTraders.indexOf(t);
                    return (
                      <tr key={t.name} className="hoverable" style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}><TraderLink name={t.name}>{t.name}</TraderLink></td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{t.winRate}%</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(t.pnl / 1000).toFixed(1)}K</td>
                        <td style={{ ...tdStyle, ...mono }}>{t.trades}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.blue, fontWeight: "600" }}>{t.sharpe.toFixed(1)}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.red }}>{t.maxDD}%</td>
                        <td style={{ ...tdStyle, ...mono, color: C.amber }}>{t.profitFactor?.toFixed(1) || "—"}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.amber }}>{t.streak}W</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}

        </div>
        );
      })()}

      {view === "profiles" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {mockTraders.filter(t => !search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase())).map((t, ti) => {
            const isTopRanked = t.rank === 1;
            const alpha = calcAlphaScore(t);
            const aClr = alphaColor(alpha);
            return (
            <div key={t.name} style={{ ...cardStyle, cursor: "pointer", borderLeft: isTopRanked ? `3px solid ${C.amber}` : `1px solid ${C.border}`, transition: "border-color 0.15s" }} onClick={() => openProfile(t)}>
              {/* Header: avatar + name + Alpha Score */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <Avatar name={t.name} size={48} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700" }}>{t.name}</span>
                    <BotTag isBot={t.isBot} />
                    {t.viewersNow > 15 && <span style={{ fontSize: "9px", color: C.green, fontWeight: "600" }}><Eye size={9} /> {t.viewersNow} watching</span>}
                  </div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>#{t.rank} · {t.style} · {t.exchange}</div>
                </div>
                {/* Alpha Score Badge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "48px" }}>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: aClr, ...mono, lineHeight: 1 }}>{alpha}</div>
                  <div style={{ fontSize: "8px", fontWeight: "700", color: aClr, textTransform: "uppercase" }}>Alpha {alphaLabel(alpha)}</div>
                </div>
              </div>

              {/* Recent equity sparkline */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: "10px" }}>
                <MiniSparkline data={t.sparkData} width={120} height={22} />
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", paddingBottom: "10px", borderBottom: `1px solid ${C.border}`, marginBottom: "10px" }}>
                {[
                  ["Win Rate", t.winRate + "%", C.green],
                  ["PnL", "+$" + (t.pnl / 1000).toFixed(1) + "K", C.green],
                  ["Sharpe", t.sharpe.toFixed(1), C.blue],
                  ["Max DD", t.maxDD + "%", C.red],
                  ["Copiers", t.copiers, C.purple],
                  ["Trades", t.trades, C.textMuted],
                ].map(([l, v, clr]) => (
                  <div key={l}>
                    <div style={{ fontSize: "9px", color: C.textFaint, textTransform: "uppercase" }}>{l}</div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: clr, ...mono }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Streak */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", marginBottom: "10px" }}>
                <span>{getFlames(t.streak)}</span>
                <span style={{ color: C.amber }}>{t.streak}W streak</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openProfile(t)} style={{
                  flex: 1, padding: "7px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                  border: `1px solid ${C.purple}`, backgroundColor: "transparent", color: C.purple
                }}>View Profile</button>
                <button onClick={() => openProfile(t)} style={{
                  flex: 1, padding: "7px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                  backgroundColor: C.green, color: C.bg, border: "none",
                  boxShadow: "0 0 10px rgba(63,185,80,0.25)"
                }}>Copy Trader</button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {view === "heatmap" && <HeatmapView />}

      {view === "copy" && <CopyTradingView />}
    </div>
  );
};

/* ═══════════════════════ TAB 4: HEATMAP ═══════════════════════ */
const HeatmapView = () => {
  const maxVal = 12300;
  const cellColor = (v) => {
    const intensity = Math.min(Math.abs(v) / maxVal, 1);
    return v >= 0
      ? `rgba(63,185,80,${0.15 + intensity * 0.6})`
      : `rgba(248,81,73,${0.15 + intensity * 0.6})`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: "700" }}>Heatmap de Rendimiento</div>
      <div style={{ ...cardStyle, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "120px" }}>Trader</th>
              {heatAssets.map(a => <th key={a} style={{ ...thStyle, textAlign: "center" }}>{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {mockHeatmap.map(row => (
              <tr key={row.t}>
                <td style={{ ...tdStyle, fontWeight: "500" }}><TraderLink name={row.t}>{row.t}</TraderLink></td>
                {row.d.map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: "center", padding: "6px" }}>
                    <div style={{ backgroundColor: cellColor(v), borderRadius: "4px", padding: "8px 4px", ...mono, fontSize: "11px", fontWeight: "600", color: v >= 0 ? C.green : C.red }}>
                      {v >= 0 ? "+" : ""}${(Math.abs(v) / 1000).toFixed(1)}K
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <StatCard label="Best Performer" value="Scalp King" sub="+$46.6K total" icon={Trophy} color={C.green} />
        <StatCard label="Worst Performer" value="Wave Rider" sub="$2.3K total" icon={TrendingDown} color={C.red} />
        <StatCard label="Top Asset" value="BTC" sub="$43.6K combined" icon={Star} color={C.amber} />
      </div>
    </div>
  );
};


/* ═══════════════════════ TAB 6: COPY TRADING ═══════════════════════ */
const CopyTradingView = () => {
  const [selected, setSelected] = useState(0);
  const [riskMult, setRiskMult] = useState(1.0);
  const [copying, setCopying] = useState({});
  const [allocation, setAllocation] = useState(1000);
  const [showConfirm, setShowConfirm] = useState(false);
  const [maxDDStop, setMaxDDStop] = useState(false);
  const port = copyPortfolios[selected];
  const riskColor = { "Low": C.green, "Medium": C.amber, "Medium-High": C.amber, "High": C.red };

  // Find copiers count from mockTraders by matching name
  const traderData = mockTraders.find(t => t.name === port.name);
  const copiers = traderData ? traderData.copiers : 0;
  const isHot = copiers > 300;
  const projectedMonthly = (allocation * port.monthlyReturn / 100 * riskMult).toFixed(0);
  const projectedFee = (projectedMonthly * port.fee / 100).toFixed(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ fontSize: "18px", fontWeight: "700" }}>Copy Trading</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {copyPortfolios.map((p, i) => {
            const td = mockTraders.find(t => t.name === p.name);
            const ret = p.monthlyReturn;
            return (
              <button key={p.name} onClick={() => setSelected(i)} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${selected === i ? C.purple : C.border}`,
                backgroundColor: selected === i ? C.purpleBg : "transparent",
                color: selected === i ? C.purple : C.textMuted
              }}>{p.name} {ret >= 0 ? "+" : ""}{ret}%</button>
            );
          })}
        </div>
      </div>

      {/* Top Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Retorno Mensual" value={`+${port.monthlyReturn}%`} sub={`Sharpe ${port.sharpe}`} icon={TrendingUp} color={C.green} tip="sharpe" />
        <StatCard label="Followers" value={port.followers.toLocaleString()} sub={`$${(port.aum / 1e6).toFixed(1)}M under management`} icon={Users} color={C.blue} tip="aum" />
        <StatCard label="Max Drawdown" value={`${port.maxDD}%`} sub={`Risk: ${port.riskLevel}`} icon={AlertTriangle} color={riskColor[port.riskLevel] || C.amber} tip="maxDD" />
        <StatCard label="Win Rate" value={`${port.winRate}%`} sub={`Avg Duration: ${port.avgTrade}`} icon={Trophy} color={C.amber} tip="winRate" />
      </div>

      <div className="grid-2col-16">
        {/* Left: Equity + Trades */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Equity Curve */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Equity Curve — <TraderLink name={port.name}>{port.name}</TraderLink></div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={port.equity}>
                <defs>
                  <linearGradient id="copyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} />
                <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                <Area type="monotone" dataKey="value" stroke={C.green} fill="url(#copyGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Trades */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Trades Recientes</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["Pair", "Type", "PnL", "Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {port.recentTrades.map((t, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{t.pair}</td>
                    <td style={tdStyle}><Tag text={t.type} color={t.type === "LONG" ? C.green : C.red} /></td>
                    <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: t.pnl >= 0 ? C.green : C.red }}>
                      {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, color: C.textMuted }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Copy Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Copy Action Card */}
          <div style={{ ...cardStyle, border: `1px solid ${C.purple}40` }}>
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Copy size={16} color={C.purple} /> Copy <TraderLink name={port.name}>{port.name}</TraderLink>
            </div>

            {/* Social Proof */}
            <div style={{ marginBottom: "12px", padding: "10px", backgroundColor: C.greenBg, borderRadius: "6px", border: `1px solid ${C.green}40` }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.green, display: "flex", alignItems: "center", gap: "6px" }}>
                <Circle size={8} fill={C.green} color={C.green} /> {copiers} copying now
                {isHot && <span style={{ fontSize: "10px", fontWeight: "700", color: C.amber, display: "inline-flex", alignItems: "center", gap: "3px", backgroundColor: C.amberBg, padding: "2px 6px", borderRadius: "3px", marginLeft: "6px" }}><Flame size={9} /> Hot</span>}
              </div>
            </div>

            {/* Allocation Input */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Capital a invertir</div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                {[500, 1000, 2500, 5000].map(amt => (
                  <button key={amt} onClick={() => setAllocation(amt)} style={{
                    flex: 1, padding: "6px 2px", borderRadius: "5px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${allocation === amt ? C.green : C.border}`,
                    backgroundColor: allocation === amt ? C.greenBg : "transparent",
                    color: allocation === amt ? C.green : C.textMuted, ...mono
                  }}>${amt >= 1000 ? `${amt/1000}K` : amt}</button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: C.textFaint, fontSize: "13px", fontWeight: "700", ...mono }}>$</span>
                <input type="number" value={allocation} onChange={e => setAllocation(Math.max(0, parseInt(e.target.value) || 0))} style={{
                  width: "100%", padding: "10px 10px 10px 22px", borderRadius: "6px", border: `1px solid ${C.border}`,
                  backgroundColor: C.bg, color: C.text, fontSize: "14px", fontWeight: "700", ...mono, outline: "none",
                  boxSizing: "border-box"
                }} />
              </div>
              {allocation < port.minInvest && <div style={{ fontSize: "10px", color: C.red, marginTop: "4px" }}>Minimum: ${port.minInvest}</div>}
            </div>

            {/* Risk Multiplier */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}><InfoTip k="leverage"><span>Multiplicador de riesgo</span></InfoTip></div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0.5, 0.75, 1.0, 1.5, 2.0].map(m => (
                  <button key={m} onClick={() => setRiskMult(m)} style={{
                    flex: 1, padding: "7px 2px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${riskMult === m ? C.purple : C.border}`,
                    backgroundColor: riskMult === m ? C.purpleBg : "transparent",
                    color: riskMult === m ? C.purple : C.textMuted
                  }}>{m}x</button>
                ))}
              </div>
              {riskMult > 1.0 && <div style={{ fontSize: "10px", color: C.amber, marginTop: "4px" }}>Higher risk = higher profits and losses</div>}
            </div>

            {/* Drawdown Stop Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600" }}><InfoTip k="maxDD"><span>Auto-stop por DD</span></InfoTip></div>
                <div style={{ fontSize: "9px", color: C.textFaint }}>Stop if drawdown exceeds {port.maxDD}%</div>
              </div>
              <button onClick={() => setMaxDDStop(!maxDDStop)} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: maxDDStop ? C.green : C.textFaint }}>
                {maxDDStop ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
            </div>

            {/* Projected Returns */}
            <div style={{ marginBottom: "12px", padding: "10px", backgroundColor: `${C.purple}08`, borderRadius: "6px", border: `1px solid ${C.purple}20` }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "6px", fontWeight: "600", textTransform: "uppercase" }}>Monthly Projection</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "20px", fontWeight: "800", color: C.green, ...mono }}>+${projectedMonthly}</span>
                <span style={{ fontSize: "10px", color: C.textFaint }}>- ${projectedFee} fee</span>
              </div>
              <div style={{ fontSize: "9px", color: C.textFaint, marginTop: "4px" }}>Basado en rendimiento pasado. No garantiza resultados futuros.</div>
            </div>

            {/* Info rows */}
            {[
              ["Commission", `${port.fee}%`, "perfFee"],
              ["Min. Investment", `$${port.minInvest}`, null],
              ["Risk Level", port.riskLevel, "riskLevel"],
              ["Avg Duration", port.avgTrade, null],
            ].map(([l, v, tip]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "11px" }}>
                <span style={{ color: C.textMuted }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</span>
                <span style={{ fontWeight: "600", ...mono }}>{v}</span>
              </div>
            ))}

            {/* Copy Button */}
            {copying[port.name] ? (
              <button onClick={() => setCopying(prev => ({ ...prev, [port.name]: false }))} style={{
                width: "100%", marginTop: "14px", padding: "11px", borderRadius: "8px", border: "none", cursor: "pointer",
                backgroundColor: C.red, color: "#fff",
                fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}>
                <Pause size={14} /> Stop Copy
              </button>
            ) : (
              <button onClick={() => setShowConfirm(true)} disabled={allocation < port.minInvest} style={{
                width: "100%", marginTop: "14px", padding: "11px", borderRadius: "8px", border: "none", cursor: allocation < port.minInvest ? "not-allowed" : "pointer",
                backgroundColor: allocation < port.minInvest ? C.textFaint : C.green,
                color: allocation < port.minInvest ? C.textMuted : "#000",
                fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: allocation >= port.minInvest ? "0 0 12px rgba(63,185,80,0.3)" : "none",
                opacity: allocation < port.minInvest ? 0.5 : 1
              }}>
                <Play size={14} /> Start Copying
              </button>
            )}

            {/* Confirmation Dialog */}
            {showConfirm && !copying[port.name] && (
              <div style={{ marginTop: "10px", padding: "12px", backgroundColor: C.bg, borderRadius: "8px", border: `1px solid ${C.amber}40` }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: C.amber, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={14} /> Confirm copy
                </div>
                <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", lineHeight: 1.5 }}>
                  You'll copy <strong style={{ color: C.text }}>{port.name}</strong> with <strong style={{ color: C.text }}>${allocation.toLocaleString()}</strong> at <strong style={{ color: C.purple }}>{riskMult}x</strong> risk.
                  {maxDDStop && <> Auto-stop enabled at <strong style={{ color: C.red }}>{port.maxDD}%</strong> drawdown.</>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setShowConfirm(false)} style={{
                    flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "transparent",
                    color: C.textMuted, fontSize: "11px", fontWeight: "600", cursor: "pointer"
                  }}>Cancel</button>
                  <button onClick={() => { setCopying(prev => ({ ...prev, [port.name]: true })); setShowConfirm(false); }} style={{
                    flex: 1, padding: "8px", borderRadius: "6px", border: "none", backgroundColor: C.green,
                    color: "#000", fontSize: "11px", fontWeight: "800", cursor: "pointer"
                  }}>Confirm</button>
                </div>
              </div>
            )}
          </div>

          {/* Allocation */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Portfolio Allocation</div>
            {port.allocation.map(a => (
              <div key={a.asset} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600" }}>{a.asset}</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", ...mono }}>{a.pct}%</span>
                </div>
                <div style={{ height: "6px", backgroundColor: C.border, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${a.pct}%`, height: "100%", backgroundColor: a.asset === "BTC" ? C.amber : a.asset === "ETH" ? C.blue : a.asset === "SOL" ? C.purple : C.textMuted, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Trader Stats Summary */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px" }}>Trader Metrics</div>
            {[
              ["Ratio Sharpe", port.sharpe.toFixed(1), C.blue, "sharpe"],
              ["Max Drawdown", `${port.maxDD}%`, C.red, "maxDD"],
              ["Win Rate", `${port.winRate}%`, C.green, "winRate"],
              ["Followers", port.followers.toLocaleString(), C.purple, "copiers"],
              ["Under Management", `$${(port.aum / 1e6).toFixed(1)}M`, C.amber, "aum"],
            ].map(([l, v, clr, tip]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                <span style={{ color: C.textMuted }}><InfoTip k={tip}><span>{l}</span></InfoTip></span>
                <span style={{ fontWeight: "700", color: clr, ...mono }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Traders Comparison Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>All Portfolios</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            {[["Trader",null],["Monthly Return",null],["Sharpe","sharpe"],["Win Rate","winRate"],["Max Drawdown","maxDD"],["Followers","copiers"],["Under Management","aum"],["Commission","perfFee"],["Risk","riskLevel"],["Hot",null],["Status",null]].map(([h,tip]) => <th key={h} style={thStyle}>{tip ? <InfoTip k={tip}><span>{h}</span></InfoTip> : h}</th>)}
          </tr></thead>
          <tbody>
            {copyPortfolios.map((p, i) => {
              const td = mockTraders.find(t => t.name === p.name);
              const porCopiers = td ? td.copiers : 0;
              const portIsHot = porCopiers > 300;
              return (
              <tr key={p.name} style={{ backgroundColor: i === selected ? C.purpleBg : i % 2 === 0 ? "transparent" : C.cardHover, cursor: "pointer" }} onClick={() => setSelected(i)}>
                <td style={tdStyle}><TraderLink name={p.name}>{p.name}</TraderLink></td>
                <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "700" }}>+{p.monthlyReturn}%</td>
                <td style={{ ...tdStyle, ...mono, color: C.blue, fontWeight: "600" }}>{p.sharpe}</td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "600" }}>{p.winRate}%</td>
                <td style={{ ...tdStyle, ...mono, color: C.red }}>{p.maxDD}%</td>
                <td style={{ ...tdStyle, ...mono }}>{p.followers.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono }}>${(p.aum / 1e6).toFixed(1)}M</td>
                <td style={{ ...tdStyle, ...mono }}>{p.fee}%</td>
                <td style={tdStyle}><Tag text={p.riskLevel} color={riskColor[p.riskLevel] || C.amber} /></td>
                <td style={tdStyle}>{portIsHot ? <Flame size={14} color={C.amber} /> : <span style={{ color: C.textFaint }}>—</span>}</td>
                <td style={tdStyle}>
                  {copying[p.name]
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: C.green, fontWeight: "600" }}><CheckCircle size={12} /> Copying</span>
                    : <span style={{ fontSize: "11px", color: C.textMuted }}>—</span>
                  }
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export {
  TradersTab,
  HeatmapView,
  CopyTradingView
};
