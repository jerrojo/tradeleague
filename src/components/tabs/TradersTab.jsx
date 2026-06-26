import { TraderLink } from "../../contexts";
import { Avatar, BotTag, InfoTip, MiniSparkline, StatCard, Tag } from "../common";
import { ArrowDown, BellRing, CheckCircle, ChevronDown, ChevronUp, Circle, Copy, Eye, Flame, Pause, Play, ToggleLeft, ToggleRight } from "lucide-react";
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
  const [sort, setSort] = useState({ key: "alpha", dir: "desc" });
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [favTraders, setFavTraders] = useState(() => { try { return JSON.parse(localStorage.getItem("tl_fav_traders") || "{}"); } catch { return {}; } });
  const toggleFav = (name) => setFavTraders((prev) => { const n = { ...prev, [name]: !prev[name] }; try { localStorage.setItem("tl_fav_traders", JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const setSortKey = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
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
        {/* Quick views — All · Favorites (column headers handle sorting) */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {[
            { id: "all", label: "All", icon: Users, on: !onlyFavs },
            { id: "favorites", label: "Favorites", icon: Star, on: onlyFavs },
          ].map(cat => (
            <button key={cat.id} onClick={() => setOnlyFavs(cat.id === "favorites")} style={{
              display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
              border: `1px solid ${cat.on ? C.purple : C.border}`,
              backgroundColor: cat.on ? C.purpleBg : "transparent",
              color: cat.on ? C.purple : C.textMuted
            }}>
              <cat.icon size={11} fill={cat.id === "favorites" && cat.on ? C.purple : "none"} /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {view === "leaderboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* min-height keeps the page from shrinking (and jumping the scroll up) when Favorites filters to a few rows */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden", minHeight: 44 + mockTraders.length * 56 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {/* [label, tip, sortKey] — numeric columns sort on click */}
                {[["Rank",null,null],["Trader",null,null],["Alpha","alpha","alpha"],["Trend",null,null],["Streak","streak","streak"],["WR / PF / DD",null,"winRate"],["PnL",null,"pnl"],["Expect.","expectancy","expectancy"],["Robotín approval",null,"approval"]]
                  .filter(([h]) => proMode || (h !== "Trend" && h !== "Expect."))
                  .map(([h,tip,key]) => {
                    const active = key && sort.key === key;
                    return (
                      <th key={h} onClick={key ? () => setSortKey(key) : undefined}
                        style={{ ...thStyle, cursor: key ? "pointer" : "default", userSelect: "none", color: active ? C.text : undefined }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          {tip ? <InfoTip k={tip}><span>{h}</span></InfoTip> : h}
                          {active && (sort.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                        </span>
                      </th>
                    );
                  })}
              </tr></thead>
              <tbody>
                {(() => {
                  let filtered = [...mockTraders];
                  if (onlyFavs) filtered = filtered.filter(t => favTraders[t.name]);
                  if (search.trim()) filtered = filtered.filter(t => t.name.toLowerCase().includes(search.trim().toLowerCase()));
                  const acc = {
                    alpha: (t) => calcAlphaScore(t), streak: (t) => t.streak, winRate: (t) => t.winRate,
                    pnl: (t) => t.pnl, expectancy: (t) => Number(calcExpectancy(t)),
                    approval: (t) => (robotinByTrader[t.name]?.rate || 0),
                  };
                  const f = acc[sort.key] || acc.alpha; const d = sort.dir === "asc" ? 1 : -1;
                  filtered.sort((a, b) => (f(a) - f(b)) * d);
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
                        <button onClick={(e) => { e.stopPropagation(); toggleFav(t.name); }} title={favTraders[t.name] ? "Remove from favorites" : "Add to favorites"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: favTraders[t.name] ? C.amber : C.textFaint }}>
                          <Star size={14} fill={favTraders[t.name] ? C.amber : "none"} />
                        </button>
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
