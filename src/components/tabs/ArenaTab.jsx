import { TraderLink } from "../../contexts";
import { TraderSelector } from "../TraderSelector";
import { BotTag, InfoTip } from "../common";
import { BellRing, CheckCircle, ChevronRight, Copy, DollarSign, Eye, Radio, Target, TrendingUp, Trophy, Users, Zap } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFeedFilter, useProfile } from "../../contexts";
import { feedItems, mockTraders, traderColors, traderEquity } from "../../data/mockData";
import { alphaColor, calcAlphaScore } from "../../lib/scoring";
import { C, cardStyle, mono } from "../../theme";
import { useToast } from "../common";
import { Activity, ArrowDown, ArrowUp, Lightbulb, Scale } from "lucide-react";
import { useMemo, useState } from "react";
/* ═══════════════════════ TAB: ARENA (Watch traders live) ═══════════════════════ */
const ArenaTab = () => {
  const { openProfile } = useProfile();
  const { feedFilter, setFeedFilter, setActiveTab } = useFeedFilter();
  const [watching, setWatching] = useState(() => {
    const m = {};
    mockTraders.forEach((t, i) => { m[t.name] = i < 4; });
    return m;
  });
  const [votes, setVotes] = useState({});
  const [copied, setCopied] = useState({});
  const [signalCoin, setSignalCoin] = useState("ALL");
  const [signalType, setSignalType] = useState("ALL");
  // Sub-view trader selector: ordered + visibility
  const [subViewOrder, setSubViewOrder] = useState(() => mockTraders.slice(0, 5).map(t => t.name));
  const [subViewVisible, setSubViewVisible] = useState(() => {
    const m = {};
    mockTraders.slice(0, 4).forEach(t => { m[t.name] = true; });
    return m;
  });
  const [dragIdx, setDragIdx] = useState(null);
  const toast = useToast();
  const TOTAL_TRADERS = 300;


  const toggleWatch = (name) => setWatching(prev => ({ ...prev, [name]: !prev[name] }));
  const watchedNames = Object.keys(watching).filter(k => watching[k]);
  const watchedTraders = mockTraders.filter(t => watching[t.name]);

  // Filter feed items to only watched traders (+ whales/liquidations always show)
  const traderFeed = feedItems.filter(f =>
    f.kind === "whale" || f.kind === "liquidation" || watchedNames.includes(f.trader)
  );
  const filteredFeed = (() => {
    let feed = traderFeed;
    if (feedFilter === "all") return feed;
    if (feedFilter === "whale") return feed.filter(f => f.kind === "whale" || f.kind === "liquidation");
    if (feedFilter === "trade") {
      feed = feed.filter(f => f.kind === "trade");
      if (signalCoin !== "ALL") feed = feed.filter(f => f.pair && f.pair.startsWith(signalCoin));
      if (signalType !== "ALL") feed = feed.filter(f => f.type === signalType);
      return feed;
    }
    if (feedFilter === "signal") {
      feed = feed.filter(f => f.kind === "signal");
      if (signalCoin !== "ALL") feed = feed.filter(f => f.pair && f.pair.startsWith(signalCoin));
      if (signalType !== "ALL") feed = feed.filter(f => f.bias === signalType);
      return feed;
    }
    if (feedFilter === "prediction") return feed.filter(f => f.kind === "prediction");
    return feed.filter(f => f.kind === feedFilter);
  })();

  const handleCopy = (item) => {
    setCopied(prev => ({ ...prev, [item.id]: true }));
    toast.addToast(`Copying ${item.type} ${item.pair} from ${item.trader}`, "success");
  };

  const activeCount = traderFeed.filter(f => f.kind === "trade" && f.status === "active").length;
  const watchedPnl = watchedTraders.reduce((a, t) => a + t.pnl, 0);

  const statusColors = { active: C.blue, tp_hit: C.green, sl_hit: C.red };
  const statusLabels = { active: "Active", tp_hit: "TP Hit", sl_hit: "SL Hit" };
  const isNew = (ts) => (Date.now() - ts) < 600000; // < 10 min
  const NewBadge = () => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "8px", fontWeight: "700", color: C.green, backgroundColor: C.greenBg, padding: "1px 5px", borderRadius: "3px", border: `1px solid ${C.green}30`, animation: "livePulse 2s ease-in-out infinite" }}>
      NEW
    </span>
  );

  // Group predictions by question — only show the first predictor's card, embed others inside
  const dedupedFeed = useMemo(() => {
    const seen = new Set();
    return filteredFeed.filter(item => {
      if (item.kind === "prediction") {
        if (seen.has(item.questionId)) return false;
        seen.add(item.questionId);
      }
      return true;
    });
  }, [filteredFeed]);

  // Unified Activity filter — Trades + Signals + Predictions in one stream (LukeW v2: one place, a filter)
  const activityFilters = [
    ["all", "All", Activity, C.purple],
    ["trade", "Trades", Activity, C.green],
    ["signal", "Signals", Lightbulb, C.blue],
    ["prediction", "Predictions", Scale, C.amber],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* ── Unified Activity filter (always visible) ── */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        {activityFilters.map(([f, label, Icon, clr]) => {
          const on = feedFilter === f;
          return (
            <button key={f} onClick={() => setFeedFilter(f)} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px",
              fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.15s",
              border: `1px solid ${on ? clr : C.border}`,
              backgroundColor: on ? `${clr}14` : "transparent",
              color: on ? clr : C.textMuted,
            }}>
              <Icon size={14} /> {label}
            </button>
          );
        })}
      </div>

      {/* ── Header: title + LIVE badge + total traders (only in full Arena view) ── */}
      {feedFilter === "all" && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "18px", fontWeight: "800" }}>Live activity</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "700", color: C.green, backgroundColor: C.greenBg, padding: "3px 10px", borderRadius: "10px", border: `1px solid ${C.green}30` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.green, display: "inline-block" }} /> LIVE
          </span>
          <span style={{ fontSize: "11px", color: C.textMuted }}>300 traders</span>
          <span style={{ fontSize: "11px", color: C.textFaint }}>·</span>
          <span style={{ fontSize: "11px", color: C.purple, fontWeight: "600" }}>Following {watchedNames.length}</span>
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: C.textMuted, ...mono }}>
          <span>{activeCount} active</span>
          <span style={{ color: C.green }}>+${(watchedPnl / 1000).toFixed(0)}K total PnL</span>
        </div>
      </div>
      )}

      {/* ── Trader selector: pick who you're watching (only in full Arena view) ── */}
      {feedFilter === "all" && (
      <div style={{ ...cardStyle, padding: "12px 16px" }}>
        <TraderSelector
          traders={mockTraders}
          selected={watchedNames}
          onToggle={toggleWatch}
          colorOf={(name) => traderColors[mockTraders.findIndex(t => t.name === name)]}
          label="Following"
        />
      </div>
      )}

      {/* ── Live Equity Curves — removed from Activity: the race lives in Arena (Overview), not here ── */}
      {false && watchedTraders.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700" }}>Live Performance</div>
              <div style={{ fontSize: "10px", color: C.textMuted }}>Cumulative Equity — last 30 days</div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {watchedTraders.slice(0, 5).map((t) => {
                const ci = mockTraders.indexOf(t);
                return (
                  <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
                    <div style={{ width: 8, height: 3, borderRadius: "1px", backgroundColor: traderColors[ci] }} />
                    <span style={{ color: traderColors[ci], fontWeight: "600" }}>{t.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={traderEquity}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
              <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} />
              <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px" }} formatter={(value, name) => [value != null ? `$${Number(value).toLocaleString()}` : "—", name]} labelFormatter={l => `Day ${l}`} />
              {mockTraders.map((t, i) => watching[t.name] && <Line key={t.name} type="monotone" dataKey={t.name} stroke={traderColors[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top 10 Leaderboard — removed from Activity: the leaderboard lives in Arena (Overview) ── */}
      {false && (
        <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={14} color={C.amber} />
              <span style={{ fontSize: "12px", fontWeight: "700" }}>Top 10 Leaderboard</span>
              <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>of 300</span>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: "8px 10px", textAlign: "left", color: C.textFaint, fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", width: "30px" }}>#</th>
                {[["Trader",null],["Alpha","alpha"],["Win","winRate"],["PnL",null],["Streak","streak"],["Copiers","copiers"]].map(([h,tip]) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: C.textFaint, fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tip ? <InfoTip k={tip}><span>{h}</span></InfoTip> : h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTraders.map((t) => {
                const ci = mockTraders.indexOf(t);
                const alpha = calcAlphaScore(t);
                const aClr = alphaColor(alpha);
                const isWatched = watching[t.name];
                return (
                  <tr key={t.name} className="hoverable" onClick={() => openProfile(t)} style={{ cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "6px 10px", fontWeight: "700", color: t.rank <= 3 ? C.amber : C.textFaint, ...mono, fontSize: "12px" }}>{t.rank}</td>
                    <td style={{ padding: "6px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: 3, height: 20, borderRadius: "1px", backgroundColor: traderColors[ci] }} />
                        <span style={{ fontWeight: "700", fontSize: "12px" }}>{t.name}</span>
                        <BotTag isBot={t.isBot} />
                        {isWatched && <Eye size={10} color={C.purple} />}
                      </div>
                    </td>
                    <td style={{ padding: "6px 10px", fontWeight: "800", color: aClr, ...mono }}>{alpha}</td>
                    <td style={{ padding: "6px 10px", fontWeight: "700", color: C.green, ...mono }}>{t.winRate}%</td>
                    <td style={{ padding: "6px 10px", fontWeight: "700", color: C.green, ...mono }}>+${(t.pnl/1000).toFixed(0)}K</td>
                    <td style={{ padding: "6px 10px", fontWeight: "700", color: C.amber, ...mono }}>{t.streak}W</td>
                    <td style={{ padding: "6px 10px", fontWeight: "700", ...mono }}>{t.copiers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button onClick={() => { setActiveTab("traders"); setFeedFilter("all"); }} style={{
            width: "100%", padding: "10px", backgroundColor: "transparent", border: "none",
            borderTop: `1px solid ${C.border}`, color: C.purple, fontSize: "12px", fontWeight: "600",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            transition: "background-color 0.15s"
          }}>
            <Users size={14} />
            View all 300 traders
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ═══ SUB-VIEW: Trades / Signals / Predictions ═══ */}
      {feedFilter !== "all" && (() => {
        const tradeCount = traderFeed.filter(f => f.kind === "trade").length;
        const signalCount = traderFeed.filter(f => f.kind === "signal").length;
        const predCount = traderFeed.filter(f => f.kind === "prediction").length;
        const filterMeta = { trade: { label: "Trades", color: C.green, icon: Activity, count: tradeCount }, signal: { label: "Signals", color: C.blue, icon: Lightbulb, count: signalCount }, prediction: { label: "Predictions", color: C.amber, icon: Scale, count: predCount } };
        const current = filterMeta[feedFilter] || filterMeta.trade;
        const CurrentIcon = current.icon;

        // Summary stats per section
        const sectionItems = filteredFeed.filter(f => f.kind === feedFilter);
        const totalPnl = feedFilter === "trade" ? sectionItems.reduce((s, f) => s + (f.pnl || 0), 0) : 0;
        const avgWin = feedFilter === "trade" && sectionItems.length > 0 ? Math.round(sectionItems.filter(f => f.pnl > 0).length / sectionItems.length * 100) : 0;
        const avgConf = feedFilter === "signal" && sectionItems.length > 0 ? Math.round(sectionItems.reduce((s, f) => s + (f.confidence || 0), 0) / sectionItems.length) : 0;
        const totalVol = feedFilter === "prediction" ? sectionItems.reduce((s, f) => s + (f.stake || 0), 0) : 0;

        return (
          <>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CurrentIcon size={16} color={current.color} />
              <span style={{ fontSize: "16px", fontWeight: "800", color: current.color }}>{current.label}</span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: current.color, ...mono, backgroundColor: current.color + "18", padding: "2px 10px", borderRadius: "10px" }}>{current.count}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => { setFeedFilter("all"); setActiveTab("arena"); }} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, display: "flex", alignItems: "center", gap: "4px" }}>
                <Radio size={10} /> Arena
              </button>
            </div>

            {/* Trader comparison selector (shared component: search + editable favorites) */}
            <div style={{ ...cardStyle, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                <span style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Comparar Traders</span>
                <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>· busca y fija favoritos</span>
              </div>
              <TraderSelector
                traders={mockTraders}
                selected={mockTraders.map(t => t.name).filter(n => subViewVisible[n])}
                onToggle={(name) => {
                  setSubViewVisible(prev => ({ ...prev, [name]: !prev[name] }));
                  setSubViewOrder(prev => prev.includes(name) ? prev : [...prev, name]);
                }}
                colorOf={(name) => traderColors[mockTraders.findIndex(t => t.name === name)]}
                label="Comparing"
              />
            </div>

            {/* Filters: coin + direction (all sub-views) */}
            {(feedFilter === "trade" || feedFilter === "signal") && (
              <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                {["ALL","BTC","ETH","SOL","BNB","XRP"].map(coin => (
                  <button key={coin} onClick={() => setSignalCoin(coin)} style={{
                    padding: "3px 9px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${signalCoin === coin ? current.color : C.border}`,
                    backgroundColor: signalCoin === coin ? `${current.color}15` : "transparent",
                    color: signalCoin === coin ? current.color : C.textMuted, ...mono
                  }}>{coin}</button>
                ))}
                <div style={{ width: "1px", height: 14, backgroundColor: C.border }} />
                {["ALL","LONG","SHORT"].map(typ => (
                  <button key={typ} onClick={() => setSignalType(typ)} style={{
                    padding: "3px 9px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${signalType === typ ? (typ === "LONG" ? C.green : typ === "SHORT" ? C.red : current.color) : C.border}`,
                    backgroundColor: signalType === typ ? (typ === "LONG" ? C.greenBg : typ === "SHORT" ? C.redBg : `${current.color}15`) : "transparent",
                    color: signalType === typ ? (typ === "LONG" ? C.green : typ === "SHORT" ? C.red : current.color) : C.textMuted, ...mono
                  }}>{typ}</button>
                ))}
              </div>
            )}

            {/* Comparison chart */}
            {(() => {
              const visibleNames = subViewOrder.filter(n => subViewVisible[n]);
              return visibleNames.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700" }}>Performance comparada</span>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {visibleNames.slice(0, 6).map(name => {
                        const ci = mockTraders.findIndex(t => t.name === name);
                        return (
                          <div key={name} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "9px" }}>
                            <div style={{ width: 6, height: 2, borderRadius: "1px", backgroundColor: traderColors[ci] }} />
                            <span style={{ color: traderColors[ci], fontWeight: "600" }}>{name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={traderEquity}>
                      <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                      <XAxis dataKey="day" stroke={C.textMuted} fontSize={9} />
                      <YAxis stroke={C.textMuted} fontSize={9} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
                      <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "10px" }} formatter={(value, name) => [value != null ? `$${Number(value).toLocaleString()}` : "—", name]} />
                      {visibleNames.map(name => {
                        const ci = mockTraders.findIndex(t => t.name === name);
                        return <Line key={name} type="monotone" dataKey={name} stroke={traderColors[ci]} strokeWidth={1.5} dot={false} connectNulls={false} />;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}

            {/* P&L / Performance summary bar */}
            <div style={{ display: "flex", gap: "8px" }}>
              {feedFilter === "trade" && (
                <>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <DollarSign size={14} color={totalPnl >= 0 ? C.green : C.red} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Total PnL</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: totalPnl >= 0 ? C.green : C.red, ...mono }}>{totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Target size={14} color={C.green} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Win Rate</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: C.green, ...mono }}>{avgWin}%</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Activity size={14} color={current.color} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Trades</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{sectionItems.length}</div>
                    </div>
                  </div>
                </>
              )}
              {feedFilter === "signal" && (
                <>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={14} color={C.blue} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Avg Conviction</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: C.blue, ...mono }}>{avgConf}%</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Lightbulb size={14} color={current.color} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Signals</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{sectionItems.length}</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={14} color={C.green} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Bullish</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: C.green, ...mono }}>{sectionItems.filter(f => f.bias === "LONG").length}</div>
                    </div>
                  </div>
                </>
              )}
              {feedFilter === "prediction" && (
                <>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <DollarSign size={14} color={C.amber} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Vol Total</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: C.amber, ...mono }}>${totalVol.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Scale size={14} color={current.color} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Predictions</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{sectionItems.length}</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users size={14} color={C.purple} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Traders</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{new Set(sectionItems.map(f => f.trader)).size}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Compact Feed — table-like rows for max scanning speed */}
            <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${C.border}`, fontSize: "9px", fontWeight: "600", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {feedFilter === "trade" && (
                  <>
                    <span style={{ width: 24 }} />
                    <span style={{ flex: 2, minWidth: 80 }}>Trader</span>
                    <span style={{ flex: 2, minWidth: 80 }}>Par</span>
                    <span style={{ width: 40, textAlign: "center" }}>Lev</span>
                    <span style={{ width: 55, textAlign: "right" }}>Entry</span>
                    <span style={{ width: 50, textAlign: "right" }}>TP</span>
                    <span style={{ width: 50, textAlign: "right" }}>SL</span>
                    <span style={{ flex: 1, minWidth: 70, textAlign: "right" }}>PnL</span>
                    <span style={{ width: 44, textAlign: "center" }}>Status</span>
                    <span style={{ width: 40, textAlign: "right" }}>Hora</span>
                    <span style={{ width: 36 }} />
                  </>
                )}
                {feedFilter === "signal" && (
                  <>
                    <span style={{ width: 24 }} />
                    <span style={{ flex: 2, minWidth: 80 }}>Trader</span>
                    <span style={{ flex: 2, minWidth: 80 }}>Par</span>
                    <span style={{ width: 46, textAlign: "center" }}>TF</span>
                    <span style={{ flex: 1, textAlign: "center" }}>Confidence</span>
                    <span style={{ width: 40, textAlign: "right" }}>Hora</span>
                    <span style={{ width: 36 }} />
                  </>
                )}
                {feedFilter === "prediction" && (
                  <>
                    <span style={{ flex: 3 }}>Pregunta</span>
                    <span style={{ width: 80, textAlign: "center" }}>Consenso</span>
                    <span style={{ width: 50, textAlign: "right" }}>Odds</span>
                    <span style={{ width: 50, textAlign: "right" }}>Vol</span>
                    <span style={{ width: 40, textAlign: "right" }}>Hora</span>
                  </>
                )}
              </div>

              {/* Rows */}
              {filteredFeed.length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: C.textMuted, fontSize: "12px" }}>No results for the selected filters</div>
              )}
              {dedupedFeed.filter(f => f.kind === feedFilter).map(item => {
                if (feedFilter === "trade") {
                  const tradeAccent = item.type === "LONG" ? C.green : C.red;
                  const DirIcon = item.type === "LONG" ? ArrowUp : ArrowDown;
                  const levNum = parseInt(item.leverage);
                  const levColor = levNum >= 10 ? C.red : levNum >= 5 ? C.amber : C.green;
                  return (
                    <div key={item.id} className="hoverable" onClick={() => openProfile(mockTraders.find(tt => tt.name === item.trader))} style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontSize: "11px", minHeight: "36px" }}>
                      <div style={{ width: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "4px", backgroundColor: tradeAccent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <DirIcon size={12} color={tradeAccent} />
                        </div>
                      </div>
                      <div style={{ flex: 2, minWidth: 80, fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.trader}</div>
                      <div style={{ flex: 2, minWidth: 80, display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontWeight: "700" }}>{item.pair}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: tradeAccent }}>{item.type}</span>
                      </div>
                      <div style={{ width: 40, textAlign: "center" }}>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: levColor, backgroundColor: `${levColor}15`, padding: "1px 4px", borderRadius: "3px", ...mono }}>{item.leverage}</span>
                      </div>
                      <div style={{ width: 55, textAlign: "right", ...mono, color: C.textMuted, fontSize: "10px" }}>${item.entry.toLocaleString()}</div>
                      <div style={{ width: 50, textAlign: "right", ...mono, color: C.green, fontSize: "10px" }}>${item.tp.toLocaleString()}</div>
                      <div style={{ width: 50, textAlign: "right", ...mono, color: C.red, fontSize: "10px" }}>${item.sl.toLocaleString()}</div>
                      <div style={{ flex: 1, minWidth: 70, textAlign: "right", fontWeight: "900", color: item.pnl >= 0 ? C.green : C.red, ...mono }}>
                        {item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}
                      </div>
                      <div style={{ width: 44, textAlign: "center" }}>
                        <span style={{ fontSize: "8px", fontWeight: "700", color: statusColors[item.status], backgroundColor: statusColors[item.status] + "18", padding: "2px 5px", borderRadius: "3px" }}>{statusLabels[item.status]}</span>
                      </div>
                      <div style={{ width: 40, textAlign: "right", fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</div>
                      <div style={{ width: 36, display: "flex", justifyContent: "center" }}>
                        {item.status === "active" && (
                          <button onClick={e => { e.stopPropagation(); handleCopy(item); }} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: copied[item.id] ? C.green : C.textFaint, padding: "2px", display: "flex" }}>
                            {copied[item.id] ? <CheckCircle size={12} /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                if (feedFilter === "signal") {
                  const biasColor = item.bias === "LONG" ? C.green : C.red;
                  const BiasIcon = item.bias === "LONG" ? ArrowUp : ArrowDown;
                  const confColor = item.confidence >= 80 ? C.green : item.confidence >= 65 ? C.amber : C.red;
                  return (
                    <div key={item.id} className="hoverable" style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontSize: "11px", minHeight: "36px" }}>
                      <div style={{ width: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "4px", backgroundColor: biasColor + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <BiasIcon size={12} color={biasColor} />
                        </div>
                      </div>
                      <div style={{ flex: 2, minWidth: 80, fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.trader}</div>
                      <div style={{ flex: 2, minWidth: 80, display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontWeight: "700" }}>{item.pair}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: biasColor }}>{item.bias}</span>
                      </div>
                      <div style={{ width: 46, textAlign: "center", fontSize: "9px", color: C.textMuted, ...mono }}>{item.timeframe}</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        <div style={{ display: "flex", gap: "1px" }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ width: 3, height: 10, borderRadius: "1px", backgroundColor: i <= Math.ceil(item.confidence / 20) ? confColor : C.border }} />
                          ))}
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: confColor, ...mono }}>{item.confidence}%</span>
                      </div>
                      <div style={{ width: 40, textAlign: "right", fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</div>
                      <div style={{ width: 36, display: "flex", justifyContent: "center" }}>
                        <button onClick={e => e.stopPropagation()} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: C.blue, padding: "2px", display: "flex" }}>
                          <BellRing size={12} />
                        </button>
                      </div>
                    </div>
                  );
                }
                if (feedFilter === "prediction") {
                  const allOnQ = traderFeed.filter(f => f.kind === "prediction" && f.questionId === item.questionId);
                  const yesC = allOnQ.filter(p => p.bet === "YES").length;
                  const yesPct = allOnQ.length > 0 ? Math.round((yesC / allOnQ.length) * 100) : 50;
                  const noPct = 100 - yesPct;
                  const tStake = allOnQ.reduce((s, p) => s + p.stake, 0);
                  return (
                    <div key={item.id} className="hoverable" style={{ display: "flex", alignItems: "center", padding: "7px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontSize: "11px", minHeight: "38px" }}>
                      <div style={{ flex: 3, fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>{item.question}</div>
                      <div style={{ width: 80, display: "flex", alignItems: "center", gap: "3px" }}>
                        <div style={{ flex: 1, height: "6px", borderRadius: "3px", overflow: "hidden", display: "flex", backgroundColor: C.border }}>
                          <div style={{ width: `${yesPct}%`, height: "100%", backgroundColor: C.green }} />
                          <div style={{ width: `${noPct}%`, height: "100%", backgroundColor: C.red }} />
                        </div>
                        <span style={{ fontSize: "8px", fontWeight: "700", color: C.green, ...mono, minWidth: 20 }}>{yesPct}%</span>
                      </div>
                      <div style={{ width: 50, textAlign: "right", fontSize: "10px", color: C.textMuted, ...mono }}>{item.odds}%</div>
                      <div style={{ width: 50, textAlign: "right", fontSize: "10px", fontWeight: "700", color: C.amber, ...mono }}>${tStake.toLocaleString()}</div>
                      <div style={{ width: 40, textAlign: "right", fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </>
        );
      })()}

      {/* ═══ ARENA FULL VIEW (feedFilter === "all") — Feed section ═══ */}
      {feedFilter === "all" && (() => {
        return (
          <>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>Activity stream</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
              <span style={{ fontSize: "11px", color: C.textMuted, ...mono }}>{filteredFeed.length} items</span>
            </div>
            {filteredFeed.length === 0 && (
              <div style={{ ...cardStyle, textAlign: "center", padding: "40px", color: C.textMuted }}>
                <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Select traders to follow</div>
                <div style={{ fontSize: "12px" }}>Use the buttons above to choose who you want to watch live</div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dedupedFeed.map(item => {
                if (item.kind === "whale" || item.kind === "liquidation") {
                  return (
                    <div key={item.id} style={{ ...cardStyle, padding: "10px 14px", borderLeft: `3px solid ${item.kind === "whale" ? C.cyan : C.red}`, display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: item.kind === "whale" ? C.cyan : C.red }}>{item.kind === "whale" ? "WHALE" : "LIQUIDATION"}</div>
                      <div style={{ fontSize: "11px", color: C.text, flex: 1 }}>{item.text}</div>
                      <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>{item.time}</span>
                    </div>
                  );
                }
                if (item.kind === "achievement") {
                  return (
                    <div key={item.id} style={{ ...cardStyle, padding: "10px 14px", borderLeft: `3px solid ${item.achievement.color || C.purple}`, display: "flex", alignItems: "center", gap: "10px" }}>
                      {item.achievement.icon && (() => { const AchIcon = item.achievement.icon; return <AchIcon size={16} color={item.achievement.color || C.purple} />; })()}
                      <div style={{ flex: 1, fontSize: "12px" }}>
                        <TraderLink name={item.trader} /> <span style={{ color: item.achievement.color || C.purple, fontWeight: "600" }}>unlocked</span> <span style={{ fontWeight: "700", color: C.text }}>{item.achievement.name}</span>
                      </div>
                      <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>{item.time}</span>
                    </div>
                  );
                }
                if (item.kind === "signal") {
                  const biasColor = item.bias === "LONG" ? C.green : C.red;
                  const BiasIcon = item.bias === "LONG" ? ArrowUp : ArrowDown;
                  const confColor = item.confidence >= 80 ? C.green : item.confidence >= 65 ? C.amber : C.red;
                  return (
                    <div key={item.id} style={{ ...cardStyle, padding: "8px 14px", borderLeft: `3px solid ${C.blue}`, display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "4px", backgroundColor: biasColor + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BiasIcon size={12} color={biasColor} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <TraderLink name={item.trader} />
                          <span style={{ fontWeight: "700", fontSize: "12px" }}>{item.pair}</span>
                          <span style={{ fontSize: "9px", fontWeight: "800", color: biasColor }}>{item.bias}</span>
                          <div style={{ display: "flex", gap: "1px", marginLeft: "4px" }}>
                            {[1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 8, borderRadius: "1px", backgroundColor: i <= Math.ceil(item.confidence / 20) ? confColor : C.border }} />)}
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "700", color: confColor, ...mono }}>{item.confidence}%</span>
                        </div>
                        <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.idea}</div>
                      </div>
                      <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</span>
                    </div>
                  );
                }
                if (item.kind === "prediction") {
                  const allOnQ = traderFeed.filter(f => f.kind === "prediction" && f.questionId === item.questionId);
                  const yesC = allOnQ.filter(p => p.bet === "YES").length;
                  const yesPct = allOnQ.length > 0 ? Math.round((yesC / allOnQ.length) * 100) : 50;
                  const noPct = 100 - yesPct;
                  return (
                    <div key={item.id} style={{ ...cardStyle, padding: "8px 14px", borderLeft: `3px solid ${C.amber}`, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Scale size={14} color={C.amber} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: "600" }}>{item.question}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          <div style={{ width: 60, height: "5px", borderRadius: "3px", overflow: "hidden", display: "flex", backgroundColor: C.border }}>
                            <div style={{ width: `${yesPct}%`, height: "100%", backgroundColor: C.green }} />
                            <div style={{ width: `${noPct}%`, height: "100%", backgroundColor: C.red }} />
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "700", color: C.green, ...mono }}>YES {yesPct}%</span>
                          <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{allOnQ.length} traders</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</span>
                    </div>
                  );
                }
                /* Trade card (compact for arena feed) */
                const tradeAccent = item.type === "LONG" ? C.green : C.red;
                const DirIcon = item.type === "LONG" ? ArrowUp : ArrowDown;
                const levNum = parseInt(item.leverage);
                const levColor = levNum >= 10 ? C.red : levNum >= 5 ? C.amber : C.green;
                return (
                  <div key={item.id} style={{ ...cardStyle, padding: "8px 14px", borderLeft: `3px solid ${tradeAccent}`, display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "4px", backgroundColor: tradeAccent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DirIcon size={12} color={tradeAccent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <TraderLink name={item.trader} />
                        <span style={{ fontWeight: "700", fontSize: "12px" }}>{item.pair}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: tradeAccent }}>{item.type}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: levColor, ...mono }}>{item.leverage}</span>
                        <span style={{ fontSize: "8px", fontWeight: "700", color: statusColors[item.status], backgroundColor: statusColors[item.status] + "18", padding: "1px 4px", borderRadius: "2px" }}>{statusLabels[item.status]}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", fontSize: "9px", color: C.textMuted, marginTop: "2px", ...mono }}>
                        <span>E ${item.entry.toLocaleString()}</span>
                        <span style={{ color: C.green }}>TP ${item.tp.toLocaleString()}</span>
                        <span style={{ color: C.red }}>SL ${item.sl.toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: "900", color: item.pnl >= 0 ? C.green : C.red, ...mono }}>{item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}</div>
                    </div>
                    <span style={{ fontSize: "9px", color: C.textFaint, ...mono, minWidth: 30, textAlign: "right" }}>{item.time}</span>
                    {item.status === "active" && (
                      <button onClick={e => { e.stopPropagation(); handleCopy(item); }} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: copied[item.id] ? C.green : C.textFaint, padding: "2px", display: "flex" }}>
                        {copied[item.id] ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  );
};


export {
  ArenaTab
};
