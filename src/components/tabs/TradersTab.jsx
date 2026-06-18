import { TraderLink } from "../../contexts";
import { Avatar, BotTag, InfoTip, MiniSparkline, StatCard, Tag } from "../common";
import { ArrowDown, BellRing, CheckCircle, Circle, Copy, Eye, Flame, Pause, Play, ToggleLeft, ToggleRight } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useProfile, useWatchlist, useProMode } from "../../contexts";
import { copyPortfolios, heatAssets, mockGroups, mockHeatmap, mockTraders, traderColors, traderDeepData, traderEquity } from "../../data/mockData";
import { alphaColor, alphaLabel, calcAlphaScore, calcDegenScore, calcExpectancy, degenLabel, expectancyColor, srand, titleByLevel } from "../../lib/scoring";
import { C, cardStyle, mono, pillStyle, tdStyle, thStyle, tierColor } from "../../theme";
import { Activity, AlertTriangle, Bot, Search, Star, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react";
import { coinCandles, coinSignals, ROBOTIN_COINS } from "../../data/robotin";
import { useMemo, useState } from "react";
/* ── Deterministic bot metadata (version · active config · backtest vs live) ──
   Per the VARIV brief, the Bots view must expose what a human trader row can't:
   which build is running, its active configuration, and how live performance
   compares to the backtest (the overfit/degradation check an allocator makes). */
const BOT_SETUPS = ["FVG", "LIQ", "OB", "BOS", "CHOCH"];
const BOT_TFS = ["M5", "M15", "H1", "H4"];
const botMeta = (name) => {
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (k) => srand(seed * k + k);
  const major = 1 + Math.floor(r(7) * 3);
  const minor = Math.floor(r(11) * 10);
  const lev = [3, 5, 10][Math.floor(r(13) * 3)];
  const config = `${BOT_SETUPS[Math.floor(r(17) * BOT_SETUPS.length)]}·${BOT_TFS[Math.floor(r(19) * BOT_TFS.length)]}·${lev}x`;
  const btPF = 1.9 + r(23) * 1.5;                 // backtest profit factor 1.9–3.4
  const livePF = btPF * (0.62 + r(29) * 0.3);     // live always degrades vs backtest
  return { version: `v${major}.${minor}`, config, btPF: btPF.toFixed(1), livePF: livePF.toFixed(1) };
};

/* ═══════════════════════ TAB 3: TRADERS ═══════════════════════ */
const TradersTab = () => {
  const [view, setView] = useState("leaderboard");
  const [compareMetric, setCompareMetric] = useState("equity");
  const [traderFilter, setTraderFilter] = useState("all");
  const [sortField, setSortField] = useState("pnl");
  const [search, setSearch] = useState("");
  const { openProfile } = useProfile();

  // Robotín approval per trader (how many of their signals R1 passed) — replaces "Copiers"
  const robotinByTrader = useMemo(() => {
    const m = {};
    ROBOTIN_COINS.forEach((c) => coinSignals(c, coinCandles(c)).forEach((s) => {
      const r = m[s.trader] || (m[s.trader] = { total: 0, approved: 0 });
      r.total++; if (s.approved) r.approved++;
    }));
    Object.values(m).forEach((r) => { r.rate = r.total ? Math.round((r.approved / r.total) * 100) : 0; });
    return m;
  }, []);
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
        <span style={{ fontSize: "13px", fontWeight: "800" }}>Directory</span>
        <span style={{ fontSize: "11px", color: C.textMuted }}>{mockTraders.length} traders</span>
        <div style={{ flex: 1 }} />
        {/* Filter by type + sort */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {[
            { id: "all", label: "All", icon: Users },
            { id: "human", label: "Traders", icon: Activity },
            { id: "bot", label: "Bots", icon: Bot },
            { id: "followed", label: "Watchlist", icon: Eye },
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
                {[["Rank",null],["Trader",null],["Alpha","alpha"],["Trend",null],["Streak","streak"],["WR / PF / DD",null],["PnL",null],["Expect.","expectancy"],["Robotín approval",null],...(traderFilter === "bot" ? [["Version",null],["Config",null],["Backtest → Live",null]] : []),["Action",null]].filter(([h]) => proMode || (h !== "Trend" && h !== "Expect.")).map(([h,tip]) => <th key={h} style={thStyle}>{tip ? <InfoTip k={tip}><span>{h}</span></InfoTip> : h}</th>)}
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
                      {(() => { const r = robotinByTrader[t.name] || { rate: 0, approved: 0, total: 0 }; return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px", ...mono }}>
                          <span style={{ fontWeight: "800", fontSize: "12px", color: r.rate >= 70 ? C.green : r.rate >= 50 ? C.amber : C.red }}>{r.rate}%</span>
                          <span style={{ fontSize: "9px", color: C.textFaint }}>{r.approved}/{r.total} signals</span>
                        </div>
                      ); })()}
                    </td>
                    {traderFilter === "bot" && (() => { const b = botMeta(t.name); const degraded = Number(b.livePF) < Number(b.btPF) * 0.8; return (
                      <>
                        <td style={{ ...tdStyle, ...mono, color: C.textMuted, fontSize: "11px" }}>{b.version}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.text, fontSize: "11px" }}>{b.config}</td>
                        <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>
                          <span style={{ color: C.textMuted }}>BT {b.btPF}</span>
                          <span style={{ color: C.textFaint }}> → </span>
                          <span style={{ color: degraded ? C.red : C.green, fontWeight: 700 }}>Live {b.livePF}</span>
                        </td>
                      </>
                    ); })()}
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <button title={followedTraders[t.name] ? "In review" : "Add to review"} onClick={e => { e.stopPropagation(); setFollowedTraders(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: followedTraders[t.name] ? C.cyan + "20" : "transparent", color: followedTraders[t.name] ? C.cyan : C.textFaint }}>
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openProfile(t)} style={{
                          padding: "4px 12px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                          backgroundColor: "transparent", color: C.purple, border: `1px solid ${C.purple}`, display: "flex", alignItems: "center", gap: "3px"
                        }}>Open</button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};



export {
  TradersTab
};
