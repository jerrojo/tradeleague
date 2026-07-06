import { Avatar, BotTag, InfoTip, SectionHeader, StatCard, Tag } from "./common";
import { ActivityHeatmap, TradeStructureDiagram } from "./widgets";
import { TradeLab } from "./TradeLab";
import { SignalTable } from "./SignalTable";
import { Bell, BellRing, ChevronRight, Circle, Copy, Crosshair, Eye, Scale } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { traderDeepData } from "../data/mockData";
import { ALL_SIGNALS, lastCloseByCoin as LAST_CLOSE } from "../data/robotin";
import { useProMode } from "../contexts";
import { computeMetrics } from "../lib/tradeSim";
import { alphaColor, alphaLabel, calcAlphaScore, calcExpectancy, expectancyColor } from "../lib/scoring";
import { C, cardStyle, mono, tdStyle, thStyle } from "../theme";
import { ToastContext } from "./common";
import { Activity, BarChart3, Clock, DollarSign, Flame, Lightbulb, Star, Target, TrendingDown, TrendingUp, Trophy, Users, Zap } from "lucide-react";
import { Fragment, useContext, useMemo, useState } from "react";
/* Skill Radar axes — quant-leaning labels per the VARIV brief
   ("Precision" → "Signal Accuracy", "Attack" → "Return Aggression", …). */
const RADAR_LABELS = {
  Attack: "Return Aggression",
  "Risk Ctrl": "Risk Control",
  Precision: "Signal Accuracy",
  Speed: "Execution Speed",
  Consistency: "Consistency",
  Discipline: "Discipline",
};

/* ═══════════════════════ TRADER PROFILE (standalone) ═══════════════════════ */
const TraderProfile = ({ trader, onClose }) => {
  const [profileTab, setProfileTab] = useState("overview");
  const [openSig, setOpenSig] = useState(null); // expanded signal row in the Signal Log
  const [isFollowing, setIsFollowing] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [eqPeriod, setEqPeriod] = useState(90); // 7 / 30 / 90 days — VARIV A.2: toggles, not dropdown
  const [expandedTrade, setExpandedTrade] = useState(null);
  const { addToast } = useContext(ToastContext);
  const proMode = useProMode(); // Simple shows the essentials; Pro reveals the quant depth
  const t = trader;
  const deep = traderDeepData[t.name];
  const histMetrics = computeMetrics(deep.history); // Calmar / compound from the real trade list

  // Robotín filtering stats for this trader — how many of their signals R1 approved
  const robotinStats = useMemo(() => {
    let total = 0, approved = 0;
    ALL_SIGNALS.forEach((s) => { if (s.trader === t.name) { total++; if (s.approved) approved++; } });
    return { total, approved, rate: total ? Math.round((approved / total) * 100) : 0 };
  }, [t.name]);

  // This trader's signals across all assets + their post-Robotín lifecycle — the Signal Log.
  const traderSignals = useMemo(() => ALL_SIGNALS
    .filter((s) => s.trader === t.name)
    .sort((a, b) => b.time - a.time), [t.name]);
  const lastCloseByCoin = LAST_CLOSE;

  // ── Fund attribution: what VARIV actually executed from THIS provider (approved
  // signals only), the executed-PnL curve, and where the edge comes from (setup/coin). ──
  const fundAttr = useMemo(() => {
    const approved = traderSignals.filter((s) => s.approved);
    const closed = approved.filter((s) => s.status === "closed").sort((a, b) => a.time - b.time);
    let cum = 0;
    const curve = [{ i: 0, pnl: 0 }, ...closed.map((s, i) => { cum += s.pnl; return { i: i + 1, pnl: Math.round(cum) }; })];
    const wins = closed.filter((s) => s.hit === "TP").length;
    const bySetup = {}, byCoin = {};
    closed.forEach((s) => {
      (bySetup[s.setup] ||= { n: 0, pnl: 0, w: 0 }); bySetup[s.setup].n++; bySetup[s.setup].pnl += s.pnl; if (s.hit === "TP") bySetup[s.setup].w++;
      (byCoin[s.coin] ||= { n: 0, pnl: 0, w: 0 }); byCoin[s.coin].n++; byCoin[s.coin].pnl += s.pnl; if (s.hit === "TP") byCoin[s.coin].w++;
    });
    const rows = (o) => Object.entries(o).map(([k, v]) => ({ k, ...v, wr: v.n ? Math.round((v.w / v.n) * 100) : 0 })).sort((a, b) => b.pnl - a.pnl);
    return {
      execPnl: Math.round(cum), curve, closedN: closed.length,
      activeN: approved.filter((s) => s.status === "active").length,
      winRate: closed.length ? Math.round((wins / closed.length) * 100) : 0,
      setupRows: rows(bySetup), coinRows: rows(byCoin).slice(0, 6),
    };
  }, [traderSignals]);

  // Trading Journal — crypto-journal KPIs derived from the trader's own trade history.
  // Reuses computeMetrics for the heavy lifting (winRate / profitFactor / maxDD / expectancyR)
  // and layers the per-trade P&L cuts (avg win/loss, best/worst, best win streak) on top.
  const journal = useMemo(() => {
    const hist = deep.history || [];
    if (!hist.length) return null;
    const winsArr = hist.filter(h => h.outcome === "WIN");
    const lossArr = hist.filter(h => h.outcome === "LOSS");
    const mean = (arr, pick) => arr.length ? arr.reduce((a, x) => a + pick(x), 0) / arr.length : 0;
    // Longest consecutive WIN run, scanning the list in order.
    let bestStreak = 0, run = 0;
    for (const h of hist) { if (h.outcome === "WIN") { run++; bestStreak = Math.max(bestStreak, run); } else run = 0; }
    return {
      totalNetPnl: histMetrics.totalPnl,
      totalTrades: hist.length,
      wins: winsArr.length,
      losses: lossArr.length,
      winRate: histMetrics.winRate,
      profitFactor: histMetrics.profitFactor,
      avgWin: mean(winsArr, h => h.pnl),
      avgLoss: mean(lossArr, h => h.pnl), // negative
      expectancyR: histMetrics.expectancyR, // mean rMultiple (R)
      bestTrade: Math.max(...hist.map(h => h.pnl)),
      worstTrade: Math.min(...hist.map(h => h.pnl)),
      maxDrawdownPct: Math.abs(histMetrics.maxDrawdownPct),
      bestStreak,
      avgHold: mean(hist, h => h.durationHours ?? 0),
    };
  }, [deep.history, histMetrics]);

  // Simple hides the Pro-only sub-tabs (Trade Lab, Risk DNA, Journal)
  const allProfileTabs = ["overview","trade_lab","signals","trades","signal_log","pnl","risk_dna","journal"];
  const proOnlyTabs = ["trade_lab", "risk_dna", "journal"];
  const profileTabs = proMode ? allProfileTabs : allProfileTabs.filter(pt => !proOnlyTabs.includes(pt));
  const tabLabels = { overview: "Overview", trade_lab: "Trade Lab", signals: "Signals", trades: "Trades", signal_log: "Signal Log", pnl: "P&L", risk_dna: "Risk DNA", journal: "Journal" };

  const moodColors = { Confident: C.green, Frustrated: C.red, Focused: C.blue, Excited: C.amber, Neutral: C.textMuted };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Back button + Quick Actions bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={onClose} style={{ padding: "6px 14px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
        </button>

        <div style={{ flex: 1 }} />

        {/* Institutional actions — under-review queue + allocation flag (no retail copy/follow) */}
        <button onClick={() => { setIsFollowing(!isFollowing); addToast(isFollowing ? `Removed ${t.name} from review` : `Added ${t.name} to review`, isFollowing ? "info" : "success"); }} style={{
          display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "6px",
          border: `1px solid ${isFollowing ? C.cyan : C.border}`,
          backgroundColor: isFollowing ? `${C.cyan}14` : "transparent",
          color: isFollowing ? C.cyan : C.textMuted, fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s"
        }}>
          <Eye size={13} /> {isFollowing ? "Under Review" : "Add to Review"}
        </button>

        <button onClick={() => addToast(`Flagged ${t.name} for allocation`, "success")} style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "7px 16px", borderRadius: "6px",
          border: "none", backgroundColor: C.green, color: C.bg, fontSize: "12px", fontWeight: "800", cursor: "pointer"
        }}>
          <Crosshair size={14} /> Flag for Allocation
        </button>
      </div>

      {/* Profile Header Card — redesigned */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {/* ── LEFT: Avatar + Identity + Alpha ── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "140px" }}>
            <Avatar name={t.name} size={88} />
            <div style={{ fontSize: "18px", fontWeight: "900", marginTop: "10px", letterSpacing: "-0.3px" }}>{t.name}</div>
            <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "4px", flexWrap: "wrap", justifyContent: "center" }}>
              <BotTag isBot={t.isBot} />
            </div>

            {/* Alpha Score — prominent badge */}
            {(() => { const alpha = calcAlphaScore(t); const aClr = alphaColor(alpha); return (
              <div style={{ marginTop: "12px", padding: "10px 20px", borderRadius: "10px", backgroundColor: `${aClr}10`, border: `1.5px solid ${aClr}35`, textAlign: "center", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "4px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "900", color: aClr, ...mono, lineHeight: 1 }}>{alpha}</span>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: aClr, opacity: 0.7 }}>/100</span>
                </div>
                <div style={{ fontSize: "9px", fontWeight: "700", color: aClr, marginTop: "3px", letterSpacing: "1px" }}>ALPHA {alphaLabel(alpha)}</div>
              </div>
            ); })()}
          </div>

          {/* ── CENTER: Bio + Info Grid + Stats + Badges ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: "1.6", marginBottom: "12px" }}>{t.bio}</div>

            {/* Info grid — 2 rows of 4 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              {[["Rank", `#${t.rank}`, null], ["Location", t.location, null], ["Since", t.joined, null], ["Style", t.style, null],
                ["Exchange", t.exchange, null], ["Favorite Pairs", t.favPairs.slice(0, 2).join(", "), null], ["Avg Duration", t.avgHold, null], ["Risk:Reward", t.avgRR, "rr"],
              ].map(([l, v, tip]) => (
                <div key={l}>
                  <div style={{ fontSize: "9px", color: C.textFaint, textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.3px" }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", marginTop: "2px" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Institutional stats row — Robotín filtering, not social vanity metrics */}
            <div style={{ display: "flex", gap: "20px", paddingTop: "10px", borderTop: `1px solid ${C.border}`, marginBottom: "12px" }}>
              {[
                ["Trades", t.trades.toLocaleString()],
                ["Signals approved", `${robotinStats.approved}/${robotinStats.total}`],
                ["Robotín approval", `${robotinStats.rate}%`],
              ].map(([l, v]) => (
                <div key={l}>
                  <span style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{v}</span>
                  <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "5px" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: KPI Stats column with colored accents ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
            {[
              ["Total PnL", `+$${(t.pnl / 1000).toFixed(1)}K`, C.green, null, DollarSign],
              ["Win Rate", `${t.winRate}%`, C.green, "winRate", Target],
              ["Sharpe", t.sharpe.toFixed(1), C.blue, "sharpe", Activity],
              ["Max Drawdown", `${t.maxDD}%`, C.red, "maxDD", TrendingDown],
              ["Profit Factor", t.profitFactor?.toFixed(1) || "—", C.amber, "profitFactor", BarChart3],
              ["Calmar", histMetrics.calmar === Infinity ? "∞" : histMetrics.calmar.toFixed(2), histMetrics.calmar >= 3 ? C.green : histMetrics.calmar >= 1 ? C.amber : C.red, "calmarRatio", Scale],
              ["Expectancy", `$${calcExpectancy(t)}`, expectancyColor(calcExpectancy(t)), "expectancy", Lightbulb],
              ["Streak", `${t.streak}W`, C.purple, "streak", Flame],
            ].filter(row => proMode || ["Total PnL", "Win Rate", "Profit Factor", "Max Drawdown"].includes(row[0])).map(([l, v, clr, tip, Icon]) => (
              <div key={l} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px",
                borderRadius: "6px", backgroundColor: `${clr}06`, borderLeft: `2px solid ${clr}50`
              }}>
                <Icon size={12} color={clr} style={{ opacity: 0.6, flexShrink: 0 }} />
                <span style={{ fontSize: "10px", color: C.textMuted, flex: 1 }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</span>
                <span style={{ fontSize: "13px", fontWeight: "800", color: clr, ...mono }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Trading Journal — compact KPI dashboard (crypto journal) ═══ */}
      {journal && (
        <div style={{ ...cardStyle, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={15} color={C.purple} />
              <span style={{ fontSize: "13px", fontWeight: "700" }}>Trading Journal</span>
            </div>
            <span style={{ fontSize: "10px", color: C.textFaint }}>
              {journal.wins}W · {journal.losses}L over {journal.totalTrades} logged trades · avg hold {journal.avgHold.toFixed(1)}h
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Net P&L" value={`${journal.totalNetPnl >= 0 ? "+" : "-"}$${Math.abs(journal.totalNetPnl).toLocaleString()}`} icon={DollarSign} color={journal.totalNetPnl >= 0 ? C.green : C.red} />
            <StatCard label="Win Rate" value={`${journal.winRate}%`} sub={`${journal.wins}W / ${journal.losses}L`} icon={Target} color={C.green} tip="winRate" />
            <StatCard label="Profit Factor" value={journal.profitFactor === Infinity ? "∞" : journal.profitFactor.toFixed(2)} icon={Scale} color={C.amber} tip="profitFactor" />
            <StatCard label="Expectancy" value={`${journal.expectancyR >= 0 ? "+" : ""}${journal.expectancyR.toFixed(2)}R`} icon={Lightbulb} color={journal.expectancyR >= 0 ? C.green : C.red} tip="expectancyR" />
            <StatCard label="Max Drawdown" value={`${journal.maxDrawdownPct}%`} icon={TrendingDown} color={C.red} tip="maxDD" />
            <StatCard label="Avg Win / Loss" value={`+$${Math.round(journal.avgWin).toLocaleString()}`} sub={`-$${Math.abs(Math.round(journal.avgLoss)).toLocaleString()}`} icon={TrendingUp} color={C.green} />
            <StatCard label="Best / Worst" value={`+$${journal.bestTrade.toLocaleString()}`} sub={`-$${Math.abs(journal.worstTrade).toLocaleString()}`} icon={Trophy} color={C.blue} />
            <StatCard label="Best Streak" value={`${journal.bestStreak}W`} icon={Flame} color={C.purple} tip="streak" />
          </div>
        </div>
      )}

      {/* Sub-Tabs */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {profileTabs.map(pt => (
          <button key={pt} onClick={() => setProfileTab(pt)} style={{
            padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
            border: `1px solid ${profileTab === pt ? C.purple : C.border}`,
            backgroundColor: profileTab === pt ? C.purpleBg : "transparent",
            color: profileTab === pt ? C.purple : C.textMuted
          }}>{tabLabels[pt]}</button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {profileTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600" }}>Equity Curve</div>
                <div style={{ display: "flex", gap: "3px" }}>
                  {[[7, "7D"], [30, "30D"], [90, "90D"], [9999, "All"]].map(([days, label]) => (
                    <button key={days} onClick={() => setEqPeriod(days)} style={{
                      padding: "3px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer", ...mono,
                      border: `1px solid ${eqPeriod === days ? C.purple : C.border}`,
                      backgroundColor: eqPeriod === days ? C.purpleBg : "transparent",
                      color: eqPeriod === days ? C.purple : C.textMuted,
                    }}>{label}</button>
                  ))}
                </div>
              </div>
              {/* Win Rate Trinity — VARIV anti-pattern rule: never show WR alone */}
              <div style={{ display: "flex", gap: "12px", fontSize: "10px", alignItems: "center" }}>
                <span style={{ color: C.green, fontWeight: "700", ...mono }}><InfoTip k="winRate" inline><span>WR</span></InfoTip> {t.winRate}%</span>
                <span style={{ color: C.amber, fontWeight: "700", ...mono }}><InfoTip k="profitFactor" inline><span>PF</span></InfoTip> {t.profitFactor?.toFixed(1)}</span>
                <span style={{ color: C.red, fontWeight: "700", ...mono }}><InfoTip k="maxDD" inline><span>DD</span></InfoTip> {t.maxDD}%</span>
                <span style={{ color: C.blue, fontWeight: "700", ...mono }}><InfoTip k="calmarRatio" inline><span>Calmar</span></InfoTip> {histMetrics.calmar === Infinity ? "∞" : histMetrics.calmar.toFixed(2)}</span>
              </div>
            </div>
            {/* VARIV A.2: cumulative % return (primary) + gross account balance (secondary) + red drawdown */}
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={(() => {
                const slice = deep.dailyEquity.slice(-eqPeriod);
                const initial = slice.length ? slice[0].equity : 1;
                let peak = -Infinity;
                return slice.map(d => {
                  peak = Math.max(peak, d.equity);
                  const retPct = Math.round(((d.equity - initial) / initial) * 1000) / 10;
                  const peakPct = ((peak - initial) / initial) * 100;
                  return { day: d.day, gross: d.equity, retPct, ddPct: retPct < peakPct ? Math.round((retPct - peakPct) * 10) / 10 : null };
                });
              })()}>
                <defs>
                  <linearGradient id="profEq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                  <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={0.25} /><stop offset="95%" stopColor={C.red} stopOpacity={0.04} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} />
                <YAxis yAxisId="pct" stroke={C.textMuted} fontSize={10} tickFormatter={v => `${v}%`} />
                <YAxis yAxisId="usd" orientation="right" stroke={C.textFaint} fontSize={9} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }}
                  formatter={(v, name) => name === "gross" ? [`$${Number(v).toLocaleString()}`, "Account balance"] : name === "ddPct" ? [`${v}%`, "Drawdown"] : [`${v >= 0 ? "+" : ""}${v}%`, "Cumulative return"]} />
                <Area isAnimationActive={false} yAxisId="pct" type="monotone" dataKey="retPct" stroke={C.green} fill="url(#profEq)" strokeWidth={2} dot={false} name="retPct" />
                <Area isAnimationActive={false} yAxisId="pct" type="monotone" dataKey="ddPct" stroke={C.red} fill="url(#ddFill)" strokeWidth={1} dot={false} connectNulls={false} name="ddPct" />
                <Line isAnimationActive={false} yAxisId="usd" type="monotone" dataKey="gross" stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="gross" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: "16px", fontSize: "9px", color: C.textMuted, marginTop: "4px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 3, backgroundColor: C.green, borderRadius: 1 }} /> Cumulative return (% on initial capital)</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 0, borderTop: `2px dashed ${C.blue}` }} /> Account balance</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 8, backgroundColor: `${C.red}40`, borderRadius: 1 }} /> Drawdown</span>
            </div>
          </div>
          {/* Activity Heatmap — GitHub-style (VARIV View A.3) */}
          <ActivityHeatmap traderData={deep} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Skill Radar</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={t.radarData.map(r => ({ subject: RADAR_LABELS[r.s] || r.s, value: r.v }))}><PolarGrid stroke={C.border} /><PolarAngleAxis dataKey="subject" stroke={C.textMuted} fontSize={10} /><PolarRadiusAxis stroke={C.border} fontSize={9} domain={[0, 100]} /><Radar isAnimationActive={false} dataKey="value" stroke={C.purple} fill={C.purpleBg} fillOpacity={0.6} /></RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Monthly P&L</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deep.monthlyPnl}><CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="month" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "PnL"]} />
                <Bar isAnimationActive={false} dataKey="pnl" radius={[4, 4, 0, 0]}>{deep.monthlyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* ── Fund attribution — what VARIV executed from this provider ── */}
          <SectionHeader
            icon={DollarSign}
            title="Fund attribution"
            subtitle={`Executed P&L VARIV realized from ${t.name}'s approved signals — and where the edge comes from`}
            color={C.green}
          />
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: "16px" }}>
            <div style={cardStyle}>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 10 }}>
                {[
                  ["Executed P&L", `${fundAttr.execPnl >= 0 ? "+" : "−"}$${Math.abs(fundAttr.execPnl).toLocaleString()}`, fundAttr.execPnl >= 0 ? C.green : C.red],
                  ["Approved & closed", `${fundAttr.closedN}`, C.text],
                  ["Win rate", `${fundAttr.winRate}%`, fundAttr.winRate >= 50 ? C.green : C.amber],
                  ["Active now", `${fundAttr.activeN}`, C.blue],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9.5, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: 700 }}>{l}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c, ...mono }}>{v}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={fundAttr.curve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`fa-${t.name.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={fundAttr.execPnl >= 0 ? C.green : C.red} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={fundAttr.execPnl >= 0 ? C.green : C.red} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} vertical={false} />
                  <XAxis dataKey="i" stroke={C.textMuted} fontSize={9} tickFormatter={(v) => `#${v}`} />
                  <YAxis stroke={C.textMuted} fontSize={9} width={44} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} labelFormatter={(v) => `Trade #${v}`} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Cumulative executed P&L"]} />
                  <Area isAnimationActive={false} type="monotone" dataKey="pnl" stroke={fundAttr.execPnl >= 0 ? C.green : C.red} strokeWidth={2} fill={`url(#fa-${t.name.replace(/\s/g, "")})`} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 9, color: C.textFaint, marginTop: 2 }}>Cumulative executed P&L from this provider's approved, closed signals</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Edge by setup</div>
              {fundAttr.setupRows.length === 0 ? (
                <div style={{ fontSize: 11, color: C.textMuted, padding: "8px 0" }}>No closed approved signals yet.</div>
              ) : fundAttr.setupRows.map((r) => (
                <div key={r.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11.5 }}>
                  <span style={{ color: C.text, fontWeight: 600 }}>{r.k} <span style={{ color: C.textFaint, fontWeight: 400 }}>· {r.n} · {r.wr}% WR</span></span>
                  <span style={{ ...mono, fontWeight: 800, color: r.pnl >= 0 ? C.green : C.red }}>{r.pnl >= 0 ? "+" : "−"}${Math.abs(Math.round(r.pnl)).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, fontWeight: 700, margin: "12px 0 8px" }}>Top coins</div>
              {fundAttr.coinRows.map((r) => (
                <div key={r.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11.5 }}>
                  <span style={{ color: C.text, fontWeight: 600 }}>{r.k} <span style={{ color: C.textFaint, fontWeight: 400 }}>· {r.n} · {r.wr}% WR</span></span>
                  <span style={{ ...mono, fontWeight: 800, color: r.pnl >= 0 ? C.green : C.red }}>{r.pnl >= 0 ? "+" : "−"}${Math.abs(Math.round(r.pnl)).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest signals — this trader's most recent calls and what Robotín did with them */}
          <SectionHeader
            icon={Activity}
            title="Latest signals"
            subtitle={`${t.name}'s most recent calls and Robotín's verdict on each`}
          />
          <SignalTable
            signals={traderSignals.slice(0, 6)}
            openId={openSig}
            onToggle={(id) => setOpenSig(openSig === id ? null : id)}
            lastCloseFor={(s) => lastCloseByCoin[s.coin] ?? null}
            showTrader={false}
            viewId="profile-latest"
            exportName={`${t.name}-latest`}
          />
        </div>
      )}

      {/* ═══ TRADE LAB ═══ */}
      {profileTab === "trade_lab" && <TradeLab trader={t} history={deep.history} />}

      {/* ═══ SEÑALES ═══ */}
      {profileTab === "signals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Total Signals" value={deep.signalStats.total} icon={Zap} color={C.purple} />
            <StatCard label="Accuracy" value={`${deep.signalStats.accuracy}%`} icon={Target} color={C.green} tip="winRate" />
            <StatCard label="Active Now" value={deep.signalStats.active} icon={Activity} color={C.amber} tip="signalActive" />
            <StatCard label="Subscribers" value={deep.signalStats.subscribers} icon={Users} color={C.blue} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Avg Profit / Signal" value={`$${deep.signalStats.avgPnlPerSignal.toLocaleString()}`} icon={TrendingUp} color={deep.signalStats.avgPnlPerSignal >= 0 ? C.green : C.red} />
            <StatCard label="Best Signal" value={`+$${deep.signalStats.bestSignal.toLocaleString()}`} icon={Trophy} color={C.green} />
            <StatCard label="Actionability" value={`${deep.signalStats.actionability}%`} icon={Crosshair} color={C.blue} tip="actionability" />
            <StatCard label="Avg TP Time" value={deep.signalStats.avgTpTime} icon={Clock} color={C.purple} tip="avgTpTime" />
          </div>
          {/* Active Signals */}
          {deep.signals.filter(s => s.status === "active").length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.green, animation: "none" }} /> Active Signals
              </div>
              {deep.signals.filter(s => s.status === "active").map(s => (
                <div key={s.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700" }}>{s.pair}</span>
                      <Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} />
                      <span style={{ fontSize: "11px", color: C.amber, fontWeight: "600", ...mono }}>{s.leverage}</span>
                      <span style={{ fontSize: "10px", color: C.textMuted }}>{s.group}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: C.textMuted }}>
                      <span><InfoTip k="entryZone" inline><span>Entry:</span></InfoTip> <span style={{ color: C.text, ...mono }}>${s.entry.toLocaleString()}</span></span>
                      <span><InfoTip k="tp" inline><span>TP:</span></InfoTip> <span style={{ color: C.green, ...mono }}>${s.tp.toLocaleString()}</span></span>
                      <span><InfoTip k="sl" inline><span>SL:</span></InfoTip> <span style={{ color: C.red, ...mono }}>${s.sl.toLocaleString()}</span></span>
                      <span><InfoTip k="rr" inline><span>R:R</span></InfoTip> <span style={{ color: C.blue, ...mono }}>{s.rr}</span></span>
                    </div>
                    <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px", fontStyle: "italic" }}>{s.analysis}</div>
                    {/* Trade Structure Diagram — VARIV View B.2 */}
                    <TradeStructureDiagram entry={s.entry} sl={s.sl} tp={s.tp} type={s.type} />
                  </div>
                  <div style={{ textAlign: "right", minWidth: "100px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: s.pnl >= 0 ? C.green : C.red, ...mono }}>{s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}</div>
                    <div style={{ fontSize: "10px", color: C.textMuted }}>{s.subscribers} subs</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Signal History Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Signal History — Last 12</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead><tr>{["Pair","Type","Entry","Target","Stop Loss","Leverage","R:R","Group","PnL","Status","Subscribers","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {deep.signals.map(s => (
                    <tr key={s.id} style={{ borderLeft: `3px solid ${s.type === "LONG" ? C.green : C.red}` }}>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{s.pair}</td>
                      <td style={tdStyle}><Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${s.entry.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px", color: C.green }}>${s.tp.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px", color: C.red }}>${s.sl.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, color: C.amber }}>{s.leverage}</td>
                      <td style={{ ...tdStyle, ...mono }}>{s.rr}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{s.group}</td>
                      <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: s.pnl >= 0 ? C.green : C.red }}>{s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}</td>
                      <td style={tdStyle}><Tag text={s.status === "active" ? "Active" : s.status === "tp_hit" ? "TP Hit" : "SL Hit"} color={s.status === "active" ? C.blue : s.status === "tp_hit" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>{s.subscribers}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRADES ═══ */}
      {profileTab === "trades" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
            <StatCard label="Total Trades" value={t.trades} icon={Activity} color={C.blue} />
            <StatCard label="Win Rate" value={`${t.winRate}%`} icon={Trophy} color={C.green} tip="winRate" />
            <StatCard label="Profit Factor" value={t.profitFactor?.toFixed(1)} icon={Scale} color={C.amber} tip="profitFactor" />
            <StatCard label="Max Drawdown" value={`${t.maxDD}%`} icon={TrendingDown} color={C.red} tip="maxDD" />
            <StatCard label="Avg R:R" value={t.avgRR} icon={Target} color={C.purple} tip="rr" />
            <StatCard label="Avg Hold" value={t.avgHold} icon={Clock} color={C.cyan} />
          </div>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>Trade History — Last 20 Trades</span>
              <span style={{ fontSize: "10px", color: C.textFaint }}>Click a row for full trade anatomy (geometry + MAE/MFE)</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead><tr>{["Pair","Type","Style","Entry","Exit","PnL","R","Duration","Outcome","Setup","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {deep.history.map(tr => {
                    const isOpen = expandedTrade === tr.id;
                    const outcomeColor = tr.outcome === "WIN" ? C.green : tr.outcome === "LOSS" ? C.red : C.amber;
                    return (
                      <Fragment key={tr.id}>
                        <tr className="hoverable" onClick={() => setExpandedTrade(isOpen ? null : tr.id)} style={{ borderLeft: `3px solid ${tr.type === "LONG" ? C.green : C.red}`, cursor: "pointer", backgroundColor: isOpen ? C.cardHover : "transparent" }}>
                          <td style={{ ...tdStyle, fontWeight: "600" }}>{tr.pair}</td>
                          <td style={tdStyle}><Tag text={tr.type} color={tr.type === "LONG" ? C.green : C.red} /></td>
                          <td style={tdStyle}><span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "3px", backgroundColor: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}30`, ...mono }}>{tr.style}</span></td>
                          <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${tr.entry.toLocaleString()}</td>
                          <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${tr.exit.toLocaleString()}</td>
                          <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: tr.pnl >= 0 ? C.green : C.red }}>
                            {tr.pnl >= 0 ? "+" : ""}${tr.pnl.toLocaleString()}
                            <div style={{ fontSize: "9px", fontWeight: "600", color: tr.pnlPct >= 0 ? `${C.green}cc` : `${C.red}cc` }}>{tr.pnlPct >= 0 ? "+" : ""}{tr.pnlPct}% · {tr.leverage}</div>
                          </td>
                          <td style={{ ...tdStyle, ...mono, color: tr.rMultiple >= 0 ? C.green : C.red, fontWeight: "600" }}>{tr.rMultiple >= 0 ? "+" : ""}{tr.rMultiple}R</td>
                          <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{tr.duration}</td>
                          <td style={tdStyle}><Tag text={tr.outcome === "WIN" ? `WIN · ${tr.tpReached}` : tr.outcome === "BREAKEVEN" ? "BE" : "LOSS"} color={outcomeColor} /></td>
                          <td style={tdStyle}>
                            {tr.setupTag
                              ? <span title={tr.setupTag} style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "3px", backgroundColor: `${C.purple}12`, color: C.purple, border: `1px solid ${C.purple}25`, ...mono, whiteSpace: "nowrap" }}>{tr.setupTag.split("_").slice(0, 3).join("·")}</span>
                              : <span title="This trade has no setup tag — it is invisible to the ML pipeline until labeled" style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "3px", backgroundColor: C.amberBg, color: C.amber, border: `1px dashed ${C.amber}60`, ...mono, whiteSpace: "nowrap" }}>LABEL PENDING</span>}
                          </td>
                          <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted, whiteSpace: "nowrap" }}>{tr.date}</td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={11} style={{ padding: "4px 16px 16px", borderBottom: `1px solid ${C.border}`, backgroundColor: `${C.bg}80` }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "20px", alignItems: "start", paddingTop: "8px" }}>
                                <div>
                                  <div style={{ fontSize: "10px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                                    Trade Anatomy <InfoTip k="mae" inline><span style={{ fontWeight: 400, textTransform: "none" }}>(geometry + path)</span></InfoTip>
                                  </div>
                                  <TradeStructureDiagram entry={tr.entry} sl={tr.sl} tps={[tr.tp1, tr.tp2, tr.tp3]} close={tr.exit} maePct={tr.maePct} mfePct={tr.mfePct} type={tr.type} />
                                  <div style={{ fontSize: "10px", color: C.textMuted, fontStyle: "italic", marginTop: "8px" }}>"{tr.notes}"</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                  {[
                                    ["Signal → exec", tr.signalTs && tr.execTs ? `${tr.signalTs.split(", ")[1]} → ${tr.execTs.split(", ")[1]} (+${tr.latencyMin ?? "—"}m)` : "—", C.text, "latency"],
                                    ["Session", tr.session, C.text, "session"],
                                    ["Market regime", tr.marketRegime || "—", tr.marketRegime === "trending" ? C.green : tr.marketRegime === "volatile" ? C.amber : C.textMuted, "marketRegime"],
                                    ["Timeframe", tr.tfDominant || "—", C.text, "tfDominant"],
                                    ["Asset class", tr.assetClass || "—", C.textMuted, "assetClass"],
                                    ["Source", tr.source || "—", C.blue, "source"],
                                    ["Setup tag", tr.setupTag || "— pending —", tr.setupTag ? C.purple : C.amber, "setupTag"],
                                    ["Style conf.", tr.styleConfidence != null ? `${Math.round(tr.styleConfidence * 100)}%` : "—", tr.styleConfidence >= 0.75 ? C.green : C.amber, "styleConfidence"],
                                    ["Position size", `$${tr.sizeUsd.toLocaleString()}${tr.positionSizePct != null ? ` · ${tr.positionSizePct}%` : ""}`, C.text, "positionSizePct"],
                                    ["R:R gross / net", `${tr.rrGross ?? "—"} / ${tr.rrNet ?? "—"}`, C.blue, "rrNet"],
                                    ["Fees paid", `$${tr.fees}`, C.textMuted, null],
                                    ["Exit reason", tr.exitReason.replace("_", " "), tr.exitReason === "TP_HIT" ? C.green : tr.exitReason === "SL_HIT" ? C.red : C.amber, null],
                                    ["MAE", `${tr.maePct}%`, C.red, "mae"],
                                    ["MFE", `+${tr.mfePct}%`, C.green, "mfe"],
                                  ].map(([l, v, clr, tip]) => (
                                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", borderBottom: `1px solid ${C.border}`, paddingBottom: "4px" }}>
                                      <span style={{ color: C.textMuted }}>{tip ? <InfoTip k={tip} inline><span>{l}</span></InfoTip> : l}</span>
                                      <span style={{ color: clr, fontWeight: "700", ...mono, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SIGNAL LOG ═══ (replaces the retail "Social" tab per the VARIV brief) */}
      {profileTab === "signal_log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Signals Emitted" value={robotinStats.total} icon={Zap} color={C.purple} />
            <StatCard label="Approved by Robotín" value={robotinStats.approved} icon={Activity} color={C.green} />
            <StatCard label="Approval Rate" value={`${robotinStats.rate}%`} icon={Target} color={robotinStats.rate >= 70 ? C.green : robotinStats.rate >= 50 ? C.amber : C.red} />
            <StatCard label="Rejected" value={robotinStats.total - robotinStats.approved} icon={TrendingDown} color={C.textMuted} />
          </div>
          <SectionHeader
            icon={Activity}
            title="Signal log"
            subtitle="Every signal this trader emitted and its lifecycle after the Robotín filter — newest first"
          />
          <SignalTable
            signals={traderSignals}
            openId={openSig}
            onToggle={(id) => setOpenSig(openSig === id ? null : id)}
            lastCloseFor={(s) => lastCloseByCoin[s.coin] ?? null}
            showTrader={false}
            viewId="profile-log"
            exportName={`${t.name}-signal-log`}
          />
        </div>
      )}

      {/* ═══ P&L ═══ */}
      {profileTab === "pnl" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Total PnL" value={`+$${(t.pnl / 1000).toFixed(1)}K`} icon={TrendingUp} color={C.green} />
            <StatCard label="Best Month" value={t.bestMonth} icon={Trophy} color={C.green} />
            <StatCard label="Worst Month" value={t.worstMonth} icon={TrendingDown} color={C.red} />
            <StatCard label="Profit Factor" value={t.profitFactor?.toFixed(1) || "—"} icon={Target} color={C.amber} />
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Monthly P&L Breakdown</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deep.monthlyPnl}><CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="month" stroke={C.textMuted} fontSize={11} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "PnL"]} />
              <Bar isAnimationActive={false} dataKey="pnl" radius={[4, 4, 0, 0]}>{deep.monthlyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Month","PnL","Trades","Win Rate","Result"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>{deep.monthlyPnl.map(m => (
                <tr key={m.month}><td style={{ ...tdStyle, fontWeight: "600" }}>{m.month} 2026</td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: m.pnl >= 0 ? C.green : C.red }}>{m.pnl >= 0 ? "+" : ""}${m.pnl.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono }}>{m.trades}</td><td style={{ ...tdStyle, ...mono }}>{m.winRate}%</td>
                <td style={tdStyle}><Tag text={m.pnl >= 0 ? "Profitable" : "Loss"} color={m.pnl >= 0 ? C.green : C.red} /></td></tr>
              ))}</tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Equity Curve — 30 Days</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={deep.dailyEquity}>
                <defs><linearGradient id="pnlEq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="day" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                <Area isAnimationActive={false} type="monotone" dataKey="equity" stroke={C.blue} fill="url(#pnlEq)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ RISK DNA ═══ */}
      {profileTab === "risk_dna" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Sharpe Ratio" value={t.sharpe.toFixed(1)} icon={BarChart3} color={C.blue} />
            <StatCard label="Max Drawdown" value={`${t.maxDD}%`} icon={TrendingDown} color={C.red} />
            <StatCard label="Profit Factor" value={t.profitFactor?.toFixed(1) || "—"} icon={DollarSign} color={C.green} />
            <StatCard label="Win Streak" value={`${t.streak} trades`} icon={Flame} color={C.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Session Performance */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Session</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deep.riskDna.sessionPerf}><CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="session" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                <Bar isAnimationActive={false} dataKey="winRate" name="Win %" fill={C.green} radius={[3, 3, 0, 0]} /></BarChart>
              </ResponsiveContainer>
              {deep.riskDna.sessionPerf.map(s => (
                <div key={s.session} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "11px" }}>
                  <span style={{ color: C.textMuted }}>{s.session}</span>
                  <span style={{ ...mono }}>{s.trades} trades — {s.winRate}% WR — avg ${s.avgPnl}</span>
                </div>
              ))}
            </div>
            {/* Day of Week */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Day</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deep.riskDna.dayOfWeek}><CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="day" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                <Bar isAnimationActive={false} dataKey="pnl" name="PnL" radius={[3, 3, 0, 0]}>{deep.riskDna.dayOfWeek.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Pair Breakdown */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Pair</div>
              {deep.riskDna.pairBreakdown.map(p => (
                <div key={p.pair} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700" }}>{p.pair}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: C.green, ...mono }}>+${(p.pnl / 1000).toFixed(1)}K</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: C.textMuted }}>
                    <span>{p.trades} trades</span><span>{p.winRate}% WR</span><span>R:R {p.avgRR}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Behavioral Analysis */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Behavioral Analysis</div>
              {Object.entries({
                "Avg Position Size": deep.riskDna.behavioral.avgPositionSize,
                "Max Leverage Used": deep.riskDna.behavioral.maxLevUsed,
                "Revenge Trade Rate": deep.riskDna.behavioral.revengeTradeRate,
                "Tilt After Loss": deep.riskDna.behavioral.tiltAfterLoss,
                "Hold Time Bias": deep.riskDna.behavioral.holdTimeBias,
                "Streak Behavior": deep.riskDna.behavioral.streakBehavior,
                "Recovery Time": deep.riskDna.behavioral.recoveryTime,
                "Best Time of Day": deep.riskDna.behavioral.bestTimeOfDay,
              }).map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                  <span style={{ color: C.textMuted }}>{l}</span>
                  <span style={{ fontWeight: "600", color: v === "Low" ? C.green : v === "Medium" ? C.amber : v === "High" ? C.red : C.text, ...mono }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Drawdown History */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Drawdown History</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              {deep.riskDna.drawdownPeriods.map((dd, i) => (
                <div key={i} style={{ padding: "12px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px" }}>{dd.start} → {dd.end}</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: C.red, ...mono }}>-{dd.depth}</div>
                  <div style={{ fontSize: "11px", color: C.green, marginTop: "4px" }}>Recovery: {dd.recovery}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Radar */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>Skill Radar</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={t.radarData.map(r => ({ subject: RADAR_LABELS[r.s] || r.s, value: r.v }))}><PolarGrid stroke={C.border} /><PolarAngleAxis dataKey="subject" stroke={C.textMuted} fontSize={10} /><PolarRadiusAxis stroke={C.border} fontSize={9} domain={[0, 100]} /><Radar isAnimationActive={false} dataKey="value" stroke={C.purple} fill={C.purpleBg} fillOpacity={0.6} /></RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ JOURNAL ═══ */}
      {profileTab === "journal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Journal Entries" value={deep.journal.length} icon={Activity} color={C.blue} />
            <StatCard label="Net PnL (Journaled)" value={`$${deep.journal.reduce((a, j) => a + j.pnl, 0).toLocaleString()}`} icon={TrendingUp} color={C.green} />
            <StatCard label="Most Common Mood" value="Focused" icon={Target} color={C.blue} />
            <StatCard label="Avg Tags/Entry" value={(deep.journal.reduce((a, j) => a + j.tags.length, 0) / deep.journal.length).toFixed(1)} icon={Star} color={C.purple} />
          </div>
          {deep.journal.map(entry => (
            <div key={entry.id} style={{ ...cardStyle, borderLeft: `3px solid ${moodColors[entry.mood] || C.textMuted}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: `${moodColors[entry.mood] || C.textMuted}20`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Circle size={10} color={moodColors[entry.mood] || C.textMuted} /></span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>{entry.date}, 2026</div>
                    <div style={{ fontSize: "11px", color: moodColors[entry.mood], fontWeight: "600" }}>{entry.mood}</div>
                  </div>
                </div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: entry.pnl >= 0 ? C.green : entry.pnl < 0 ? C.red : C.textMuted, ...mono }}>
                  {entry.pnl > 0 ? "+" : ""}{entry.pnl === 0 ? "No trades" : `$${entry.pnl.toLocaleString()}`}
                </div>
              </div>
              <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.7", marginBottom: "10px" }}>{entry.text}</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {entry.tags.map(tag => (
                  <span key={tag} style={{ fontSize: "10px", color: C.purple, backgroundColor: C.purpleBg, padding: "3px 8px", borderRadius: "4px", fontWeight: "600" }}>#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export {
  TraderProfile
};
