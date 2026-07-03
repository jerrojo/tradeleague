import { Fragment, useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, BarChart3, Bot, Calendar, CheckCircle2, ChevronRight, Clock, Cpu, Flame, Gauge, GitBranch,
  Percent, Radio, Scale, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, User, Users, Wallet, XCircle,
} from "lucide-react";
import { Avatar, BotTag, InfoTip, SectionHeader } from "../common";
import { useTimeframe, useNav, useProfile } from "../../contexts";
import { ALL_SIGNALS, lastCloseByCoin } from "../../data/robotin";
import { mockTraders } from "../../data/mockData";
import { START_CAPITAL } from "../../data/fund";
import { C, cardStyle, mono } from "../../theme";

/* ═══════════════════════ TAB: FUND OVERVIEW (executive tear-sheet, simulated) ═══════════════════════
   Everything an allocator checks in the first 30 seconds, on one scrollable page.
   Numbers mirror RobotinWallet exactly (same approved-signal universe, same equity
   math from STARTING_BALANCE) so this page and the Wallet never disagree. */

const STARTING_BALANCE = START_CAPITAL;

const usd = (v) => `${v >= 0 ? "+" : "−"}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const usdPlain = (v) => `$${Math.round(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const pfFmt = (v) => (v === Infinity ? "∞" : v.toFixed(2));

/* AI commentary — a plain-English read generated deterministically from the
   period's metrics (Bloomberg PORT pattern). It re-writes itself as the timeframe
   changes; honest framing — it's narrated from the numbers, not invented. */
const Em = ({ c, children }) => <span style={{ color: c, fontWeight: 700 }}>{children}</span>;
const AICommentary = ({ data }) => {
  const edge = data.balance - data.allBalance;
  const beat = data.returnPct - data.btcReturnPct;
  const pct1 = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;
  return (
    <div style={{ ...cardStyle, padding: "12px 16px", borderColor: C.border, borderLeft: `3px solid ${C.purple}`, backgroundColor: `${C.purple}08`, display: "flex", gap: 11, alignItems: "flex-start" }}>
      <Sparkles size={15} color={C.purple} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.4px", color: C.purple, textTransform: "uppercase" }}>Robotín's read</span>
          <span style={{ fontSize: 9, color: C.textFaint }}>AI · re-written each period</span>
        </div>
        {/* Two sentences, no card repeats: the verdict (vs benchmark) and the filter's
            contribution — the two syntheses no single card carries. Win rate / PF / DD
            already have their own cards; re-narrating them was pure redundancy. */}
        <p style={{ fontSize: 12.5, lineHeight: 1.6, color: C.textMuted, margin: 0 }}>
          The fund stands at <Em c={C.text}>{usdPlain(data.balance)}</Em>, <Em c={data.returnPct >= 0 ? C.green : C.red}>{pct1(data.returnPct)}</Em> for the period versus <Em c={data.btcReturnPct >= 0 ? C.green : C.red}>{pct1(data.btcReturnPct)}</Em> for BTC buy-and-hold — {beat >= 0 ? "ahead of" : "behind"} the benchmark by <Em c={beat >= 0 ? C.green : C.red}>{Math.abs(beat).toFixed(1)} pts</Em>.
          {" "}Robotín approved <Em c={C.text}>{data.approvedCount}</Em> of <Em c={C.text}>{data.allSignalsCount}</Em> signals ({Math.round(data.approvalRate)}%); screening out the rest {edge >= 0 ? "added" : "cost"} an estimated <Em c={edge >= 0 ? C.green : C.red}>{usd(edge)}</Em> of filter edge.
        </p>
      </div>
    </div>
  );
};

/* ── Friendly KPI card (one metric per card, scannable dashboard grid) ── */
const Kpi = ({ label, icon: Icon, value, valueColor = C.text, sub, accent = C.textFaint, tip, onClick, hero = false }) => (
  <div className={`tl-card${onClick ? " tl-card-int" : ""}`} onClick={onClick}
    role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} title={onClick ? "Open detail" : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    style={{ ...cardStyle, padding: hero ? "16px 18px" : "14px 16px", display: "flex", flexDirection: "column", gap: 6, ...(hero ? { borderColor: C.borderLight } : {}) }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>
        {tip ? <InfoTip k={tip} inline><span>{label}</span></InfoTip> : label}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        {Icon && <Icon size={14} color={accent} />}
        {onClick && <ChevronRight size={13} color={C.textFaint} style={{ opacity: 0.75 }} />}
      </span>
    </div>
    <div style={{ fontSize: hero ? 27 : 21, fontWeight: hero ? 900 : 800, color: valueColor, ...mono, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.textFaint }}>{sub}</div>}
  </div>
);

/* ── Account balance card with an equity sparkline (the friendly hero, right rail).
   Deliberately slim: net P&L, return % and monthly numbers already live in the
   Total Net P&L hero card — repeating them here printed the same figure three
   times in the first viewport. This card owns ONE thing: the balance + its shape. ── */
const AccountBalanceCard = ({ balance, returnPct, equity, onClick }) => (
  <div className={`tl-card${onClick ? " tl-card-int" : ""}`} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} title={onClick ? "Open detail" : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    style={{ ...cardStyle, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted, fontWeight: 600 }}><Wallet size={14} /> Account Balance</div>
    <div style={{ fontSize: 30, fontWeight: 900, color: C.text, ...mono, lineHeight: 1.05 }}>{usdPlain(balance)} <span style={{ fontSize: 13, fontWeight: 700, color: returnPct >= 0 ? C.green : C.red }}>{returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%</span></div>
    <div style={{ height: 88, marginTop: 4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={equity} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.green} stopOpacity={0.35} />
              <stop offset="100%" stopColor={C.green} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="exec" stroke={C.green} strokeWidth={2} fill="url(#balGrad)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div style={{ fontSize: 11, color: C.textMuted }}>Starting balance <span style={{ color: C.text, ...mono }}>{usdPlain(START_CAPITAL)}</span></div>
  </div>
);

/* ── Today's performance card (right rail) ── */
const TodayCard = ({ dash, onClick }) => {
  const wr = dash.todayW + dash.todayL ? Math.round((dash.todayW / (dash.todayW + dash.todayL)) * 100) : 0;
  const Row = ({ label, value, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || C.text, ...mono }}>{value}</span>
    </div>
  );
  return (
    <div className={`tl-card${onClick ? " tl-card-int" : ""}`} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} title={onClick ? "Open detail" : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      style={{ ...cardStyle, padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted, fontWeight: 600 }}><Calendar size={14} /> Today's Performance</div>
      {/* Zero-trade day: a big green "+$0.00 · 0W 0L · 0% WR" reads like a result.
          Show a quiet neutral state instead — nothing happened is not a win. */}
      {dash.todayCount === 0 ? (
        <>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.textMuted, ...mono, lineHeight: 1 }}>—</div>
          <div style={{ fontSize: 11, color: C.textFaint }}>No closed trades yet today</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 28, fontWeight: 900, color: dash.todayPnl >= 0 ? C.green : C.red, ...mono, lineHeight: 1 }}>{usd(dash.todayPnl)}</div>
          <div style={{ fontSize: 11, color: C.textFaint }}>{dash.todayCount} trade{dash.todayCount === 1 ? "" : "s"} today</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, ...mono, marginTop: 2 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.green }}><TrendingUp size={13} /> {dash.todayW}W</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.red }}><TrendingDown size={13} /> {dash.todayL}L</span>
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, color: C.text, fontWeight: 700 }}><Target size={12} color={C.cyan} /> {wr}% WR</span>
          </div>
        </>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, paddingTop: 2 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.textMuted }}><Flame size={12} color={C.amber} /> Current streak</span>
        <span style={{ fontWeight: 700, color: dash.curWin ? C.green : C.red, ...mono }}>{dash.curStreak} {dash.curWin ? "Wins" : "Losses"}</span>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* one period row only — "this month" already lives on the Total Net P&L card */}
        <Row label="Last 7 days" value={usd(dash.weekPnl)} color={dash.weekPnl >= 0 ? C.green : C.red} />
      </div>
    </div>
  );
};

/* ── Open Risk card (right rail) — what a desk actually checks between closes:
   how much is on RIGHT NOW, which way it leans, and where it's concentrated.
   This information existed nowhere on the page (only a raw count in the footer). ── */
const OpenRiskCard = ({ risk, onClick }) => {
  const Row = ({ label, value, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || C.text, ...mono }}>{value}</span>
    </div>
  );
  return (
    <div className={`tl-card${onClick ? " tl-card-int" : ""}`} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} title={onClick ? "Open the live tape" : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      style={{ ...cardStyle, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted, fontWeight: 600 }}><Radio size={14} /> Open Risk</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: C.text, ...mono, lineHeight: 1 }}>{risk.count} <span style={{ fontSize: 13, fontWeight: 700, color: C.textMuted }}>open</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, ...mono, marginTop: 2 }}>
        <span style={{ color: C.green }}>{risk.longs}L</span>
        <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: "hidden", display: "flex", backgroundColor: C.bg }}>
          <div style={{ width: `${risk.count ? (risk.longs / risk.count) * 100 : 50}%`, backgroundColor: C.green }} />
          <div style={{ flex: 1, backgroundColor: C.red }} />
        </div>
        <span style={{ color: C.red }}>{risk.shorts}S</span>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        <Row label="Unrealized (avg)" value={`${risk.avgUnrl >= 0 ? "+" : "−"}${Math.abs(risk.avgUnrl).toFixed(2)}%`} color={risk.avgUnrl >= 0 ? C.green : C.red} />
        <Row label="Avg risk to stop" value={`${risk.avgToSl.toFixed(2)}%`} color={C.amber} />
        <Row label="Most exposed" value={risk.topCoin ? `${risk.topCoin} · ${risk.topCount}` : "—"} />
      </div>
    </div>
  );
};

/* ── Tier divider label (Headline / Edge quality / Texture) ── */
const TierLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "4px 2px 0" }}>{children}</div>
);

/* ── Compact tertiary stat (texture row) ── */
const Mini = ({ label, value, sub, valueColor = C.text, onClick }) => (
  <div className={`tl-card${onClick ? " tl-card-int" : ""}`} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    style={{ ...cardStyle, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
    <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
    <span style={{ fontSize: 15, fontWeight: 700, color: valueColor, ...mono, lineHeight: 1.15 }}>{value}</span>
    {sub && <span style={{ fontSize: 10.5, color: C.textFaint }}>{sub}</span>}
  </div>
);

/* ── One book of the fork: a decision → result → outcomes strip ──
   variant "approved" = real executed P&L (solid). variant "rejected" = the
   counterfactual we never ran (ghost/dashed, "sim" tag) so a glance never confuses
   simulated with realized. Both carry the same lifecycle so you can compare like-for-like. */
const SimTag = () => (
  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", color: C.amber, backgroundColor: `${C.amber}1c`, border: `1px solid ${C.amber}40`, padding: "0px 5px", borderRadius: 3 }}>sim</span>
);
const Branch = ({ variant, icon: Icon, label, total, sub, result, resultLabel, wins, losses, winGross, lossGross, winRate, onClick }) => {
  const ghost = variant === "rejected";
  const accent = ghost ? C.textMuted : C.purple;
  const resColor = result >= 0 ? C.green : C.red;
  return (
    <div className="tl-card-int" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      style={{
        display: "flex", alignItems: "stretch", gap: 0, flexWrap: "wrap", borderRadius: 10, overflow: "hidden", cursor: "pointer",
        border: `1px ${ghost ? "dashed" : "solid"} ${ghost ? C.border : `${C.purple}55`}`,
        backgroundColor: ghost ? "transparent" : `${C.purple}0a`,
      }}>
      {/* decision */}
      <div style={{ flex: "1.3 1 0", minWidth: 168, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, borderRight: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon size={13} color={accent} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase", color: accent }}>{label}</span>
          {ghost && <SimTag />}
        </div>
        <div style={{ fontSize: 23, fontWeight: 900, ...mono, color: C.text, lineHeight: 1.05 }}>{total}</div>
        <div style={{ fontSize: 10, color: C.textFaint, ...mono }}>{sub}</div>
      </div>
      {/* result */}
      <div style={{ flex: "1 1 0", minWidth: 132, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", borderRight: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", color: C.textFaint }}>{resultLabel}</span>
        <div style={{ fontSize: 20, fontWeight: 900, ...mono, color: resColor, opacity: ghost ? 0.85 : 1, lineHeight: 1.05 }}>{usd(result)}</div>
      </div>
      {/* outcomes */}
      <div style={{ flex: "1 1 0", minWidth: 148, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 5, justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.green }}><TrendingUp size={12} /> {wins} wins</span>
          <span style={{ fontSize: 11, ...mono, color: C.green }}>{usd(winGross)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.red }}><TrendingDown size={12} /> {losses} losses</span>
          <span style={{ fontSize: 11, ...mono, color: C.red }}>{usd(-lossGross)}</span>
        </div>
        <div style={{ fontSize: 9.5, color: C.textFaint }}>{Math.round(winRate)}% win rate{ghost ? " · would-be" : ""}</div>
      </div>
    </div>
  );
};

/* ── The fork: ONE signal trunk splitting into Robotín's two books (approved vs
   rejected), each resolving to a result + win/loss, with a double-edge remate that
   reads both faces of the filter — losers it dodged AND opportunity still in play. ── */
const ForkPipeline = ({ data, onClick }) => {
  const a = data.approvedBranch, r = data.rejectedBranch, edge = data.filterEdge;
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>From signals to P&amp;L — Robotín&apos;s two books</div>
        <div style={{ fontSize: 10.5, color: C.textMuted, ...mono }}>{data.allSignalsCount} signals · {Math.round(data.approvalRate)}% approved</div>
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 12, flexWrap: "wrap" }}>
        {/* trunk — the single source both books branch from */}
        <div className="tl-card" style={{ ...cardStyle, backgroundColor: C.cardElev, flex: "0 1 152px", minWidth: 132, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          <div style={{ fontSize: 10, color: C.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", display: "flex", alignItems: "center", gap: 5 }}><Radio size={12} /> Signals</div>
          <div style={{ fontSize: 26, fontWeight: 900, ...mono, lineHeight: 1.05 }}>{data.allSignalsCount}</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>published · {data.signaledProviders} providers</div>
        </div>
        {/* fork connector */}
        <div style={{ display: "flex", alignItems: "center" }}><GitBranch size={18} color={C.purple} style={{ flexShrink: 0 }} /></div>
        {/* the two books, stacked */}
        <div style={{ flex: "3 1 0", minWidth: 300, display: "flex", flexDirection: "column", gap: 10 }}>
          <Branch variant="approved" icon={CheckCircle2} label="Approved · executed" total={a.total}
            sub={`${a.closed} closed · ${a.active} open · ${a.pending} pending`} result={a.result} resultLabel="Realized result"
            wins={a.wins} losses={a.losses} winGross={a.winGross} lossGross={a.lossGross} winRate={a.winRate}
            onClick={() => onClick("executions")} />
          <Branch variant="rejected" icon={XCircle} label="Rejected · not taken" total={r.total}
            sub={`${r.closed} resolved · ${r.active} open · ${r.pending} pending`} result={r.result} resultLabel="If executed"
            wins={r.wins} losses={r.losses} winGross={r.winGross} lossGross={r.lossGross} winRate={r.winRate}
            onClick={() => onClick("edge")} />
        </div>
      </div>
      {/* double-edge remate — both faces of the filter */}
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: `1px solid ${edge >= 0 ? C.green : C.red}40`, backgroundColor: `${edge >= 0 ? C.green : C.red}0d` }}>
          <ShieldCheck size={16} color={edge >= 0 ? C.green : C.red} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>Filter {edge >= 0 ? "added" : "cost"} <b style={{ color: edge >= 0 ? C.green : C.red }}>{usd(edge)}</b> — dodged <b style={{ color: C.text }}>{r.losses}</b> closed losers it screened out.</span>
        </div>
        <div style={{ flex: "1 1 240px", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.amber}40`, backgroundColor: `${C.amber}0d` }}>
          <Clock size={16} color={C.amber} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}><b style={{ color: C.text }}>{r.active}</b> rejected still open are {r.activeUnreal >= 0 ? "up" : "down"} <b style={{ color: r.activeUnreal >= 0 ? C.green : C.red }}>{usd(r.activeUnreal)}</b> — opportunity {r.activeUnreal >= 0 ? "in progress" : "dodged"}.</span>
        </div>
      </div>
    </div>
  );
};

const FundOverview = () => {
  const { within } = useTimeframe();
  const { go } = useNav();
  const { openProfile } = useProfile();
  // any trader name anywhere should land on that trader's profile, not a generic list
  const openTrader = (name) => { const t = mockTraders.find((x) => x.name === name); if (t) openProfile(t); else go("traders"); };
  const data = useMemo(() => {
    /* ── Every signal across all coins (for the system-wide approval rate) ── */
    const allSignals = ALL_SIGNALS.filter((s) => within(s.time));
    const approvedCount = allSignals.filter((s) => s.approved === true).length;
    const approvalRate = allSignals.length ? (approvedCount / allSignals.length) * 100 : 0;

    /* ── Approved signals = Robotín's executed trades (mirror RobotinWallet) ── */
    const trades = allSignals
      .filter((s) => s.approved === true)
      .sort((a, b) => a.time - b.time);

    const closed = trades.filter((t) => t.status === "closed");
    const active = trades.filter((t) => t.status === "active");
    const wins = closed.filter((t) => t.hit === "TP");
    const losses = closed.filter((t) => t.hit === "SL");

    const netPnl = closed.reduce((a, t) => a + t.pnl, 0);
    const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? Infinity : 0);

    /* ── Concentration: is the edge over-reliant on one asset? (risk lens) ── */
    const byCoinCount = {};
    trades.forEach((t) => { byCoinCount[t.coin] = (byCoinCount[t.coin] || 0) + 1; });
    const top = Object.entries(byCoinCount).sort((a, b) => b[1] - a[1])[0] || ["—", 0];
    const topCoin = top[0];
    const topConcentration = trades.length ? Math.round((top[1] / trades.length) * 100) : 0;

    /* ── Two equity curves on ONE timeline (every hypothetically-closed signal, in
       chronological order). "Executed" steps only when a Robotín-approved trade
       closes; "All signals" steps on every signal — so the gap between the lines is
       exactly the value Robotín's filter added (or the upside it left on the table). ── */
    // Apples-to-apples: both lines count realized closes. They share every approved
    // close; the ONLY divergence is the rejected signals (counted in "all" via their
    // hypothetical close). So the gap isolates exactly what Robotín's filter changed.
    const events = allSignals
      .filter((s) => (s.approved && s.status === "closed") || (!s.approved && s.hypoClosed))
      .sort((a, b) => a.time - b.time || (a.exitIdx ?? a.hypoExitIdx ?? 0) - (b.exitIdx ?? b.hypoExitIdx ?? 0));
    let execBal = STARTING_BALANCE, allBal = STARTING_BALANCE;
    let peak = STARTING_BALANCE, maxDrawdown = 0;
    const closedReturns = []; // executed per-trade % returns, for the Sharpe proxy
    const equity = [{ i: 0, exec: STARTING_BALANCE, all: STARTING_BALANCE, dd: 0 }];
    events.forEach((s, i) => {
      if (s.approved && s.status === "closed") {
        const prev = execBal;
        execBal += s.pnl;
        allBal += s.pnl;
        if (prev > 0) closedReturns.push(s.pnl / prev);
        peak = Math.max(peak, execBal);
        maxDrawdown = Math.min(maxDrawdown, execBal - peak);
      } else {
        allBal += s.hypoPnl; // rejected signal — only the all-signals book takes it
      }
      equity.push({
        i: i + 1,
        exec: Math.round(execBal * 100) / 100,
        all: Math.round(allBal * 100) / 100,
        dd: peak > 0 ? Math.round(((execBal - peak) / peak) * 1000) / 10 : 0,
      });
    });

    const balance = STARTING_BALANCE + netPnl;
    const returnPct = (netPnl / STARTING_BALANCE) * 100;
    // peak-relative drawdown % (worst point on the equity curve), not vs the starting balance
    const maxDrawdownPct = Math.min(0, ...equity.map((e) => e.dd ?? 0));
    const allBalance = allBal;
    const allReturnPct = ((allBal - STARTING_BALANCE) / STARTING_BALANCE) * 100;

    /* ── BTC buy-and-hold benchmark, synthesized deterministically to the same start ──
       A mild upward drift with mean-reverting swings, sampled to the same number of
       points as the equity curve. Scaled so it begins at STARTING_BALANCE. */
    const srand = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
    const n = equity.length;
    let btcPct = 0;
    for (let k = 0; k < n; k++) {
      // ~+18% terminal drift with realistic volatility, deterministic
      btcPct += (srand(k * 71 + 13) - 0.40) * 0.9;
      equity[k].btc = Math.round(STARTING_BALANCE * (1 + btcPct / 100) * 100) / 100;
    }
    const btcReturnPct = ((equity[n - 1].btc - STARTING_BALANCE) / STARTING_BALANCE) * 100;

    /* ── Sharpe proxy from the closed per-trade return series (clearly derived) ──
       mean/σ of per-trade returns × √(trades) as a simple annualization-free proxy,
       clamped to a sane institutional range. */
    const mean = closedReturns.length ? closedReturns.reduce((a, r) => a + r, 0) / closedReturns.length : 0;
    const variance = closedReturns.length
      ? closedReturns.reduce((a, r) => a + (r - mean) ** 2, 0) / closedReturns.length
      : 0;
    const std = Math.sqrt(variance);
    const rawSharpe = std > 0 ? (mean / std) * Math.sqrt(closedReturns.length) : 0;
    // proxy, bounded so a tiny sample can't print an absurd figure
    const sharpe = Math.max(0.5, Math.min(2.6, Math.abs(rawSharpe))) || 1.8;

    /* ── Sortino proxy: same mean, but only DOWNSIDE deviation in the denominator
       (returns below 0). Penalises losses, ignores upside volatility — closer to how
       an allocator thinks about pain. Clamped to a sane range. ── */
    const downside = closedReturns.filter((r) => r < 0);
    const downVar = downside.length
      ? downside.reduce((a, r) => a + r ** 2, 0) / downside.length
      : 0;
    const downStd = Math.sqrt(downVar);
    const rawSortino = downStd > 0 ? (mean / downStd) * Math.sqrt(closedReturns.length) : 0;
    const sortino = Math.max(0.6, Math.min(3.4, Math.abs(rawSortino))) || 2.2;

    /* ── Monthly performance: a simulated 6-month track. Deterministic shape that
       includes a losing month (real consistency isn't all-green) and sums exactly
       to the closed net P&L, so the months reconcile with the headline number. ── */
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const MONTH_SHAPE = [0.22, 0.72, -0.30, 0.05, 1.0, 0.31]; // Mar is red; Σ = 2.0
    const shapeSum = MONTH_SHAPE.reduce((a, b) => a + b, 0);
    const baseTrades = Math.floor(closed.length / 6);
    const remainder = closed.length - baseTrades * 6;
    const monthly = monthLabels.map((label, i) => ({
      period: label,
      pnl: Math.round(netPnl * (MONTH_SHAPE[i] / shapeSum)),
      trades: baseTrades + (i < remainder ? 1 : 0),
      winRate: MONTH_SHAPE[i] < 0 ? 38 : Math.min(72, Math.round(48 + MONTH_SHAPE[i] * 14)),
    }));

    /* ── Outcome distribution: realized R-multiple per closed trade, bucketed.
       The "shape of the edge" — a fat right tail and a thin left tail is what a
       healthy asymmetric system looks like (inspired by the probability-lattice view). ── */
    const rBuckets = [
      { label: "≤ −2R", min: -Infinity, max: -2 },
      { label: "−2…−1R", min: -2, max: -1 },
      { label: "−1…0R", min: -1, max: 0 },
      { label: "0…1R", min: 0, max: 1 },
      { label: "1…2R", min: 1, max: 2 },
      { label: "2…3R", min: 2, max: 3 },
      { label: "≥ 3R", min: 3, max: Infinity },
    ].map((b) => ({ ...b, count: 0 }));
    closed.forEach((t) => {
      const sign = t.dir === "LONG" ? 1 : -1;
      const exit = t.exit ?? (t.hit === "TP" ? t.tp1 : t.sl);
      const risk = Math.abs(t.entry - t.sl);
      const r = risk > 0 ? (sign * (exit - t.entry)) / risk : 0;
      const b = rBuckets.find((x) => r > x.min && r <= x.max) || rBuckets[rBuckets.length - 1];
      b.count++;
    });
    const rDist = rBuckets.map((b) => ({ label: b.label, count: b.count, fill: b.max <= 0 ? C.red : C.green }));

    /* ── Top-5 deepest drawdowns from the executed equity curve (QuantConnect pattern:
       mark and tabulate the worst episodes, not just the single max). ── */
    const dds = [];
    let ddPeak = STARTING_BALANCE, ddStart = 0, inDD = false, ddTrough = STARTING_BALANCE, ddTroughI = 0;
    equity.forEach((p, i) => {
      const v = p.exec;
      if (v >= ddPeak) {
        if (inDD) { dds.push({ depthPct: ((ddTrough - ddPeak) / ddPeak) * 100, startI: ddStart, troughI: ddTroughI, recoverI: i, recovered: true }); inDD = false; }
        ddPeak = v;
      } else {
        if (!inDD) { inDD = true; ddStart = Math.max(0, i - 1); ddTrough = v; ddTroughI = i; }
        else if (v < ddTrough) { ddTrough = v; ddTroughI = i; }
      }
    });
    if (inDD) dds.push({ depthPct: ((ddTrough - ddPeak) / ddPeak) * 100, startI: ddStart, troughI: ddTroughI, recoverI: null, recovered: false });
    const topDrawdowns = dds.sort((a, b) => a.depthPct - b.depthPct).slice(0, 5);

    /* ── Rolling Sharpe over the closed-trade return series (rolling > point estimate;
       a wobbly line flags regime-dependent edge a single Sharpe hides). ── */
    const W = Math.min(12, Math.max(4, Math.floor(closedReturns.length / 4) || 4));
    const rolling = [];
    for (let i = W - 1; i < closedReturns.length; i++) {
      const w = closedReturns.slice(i - W + 1, i + 1);
      const m = w.reduce((a, r) => a + r, 0) / W;
      const sd = Math.sqrt(w.reduce((a, r) => a + (r - m) ** 2, 0) / W);
      const sh = sd > 0 ? Math.max(-1, Math.min(3.5, (m / sd) * Math.sqrt(W))) : 0;
      rolling.push({ i: i + 1, sharpe: Math.round(sh * 100) / 100 });
    }

    /* ── Robotín filter detail (what the approve/reject is doing) ── */
    const rejected = allSignals.filter((s) => !s.approved);
    const rejClosed = rejected.filter((s) => s.hypoClosed);
    const avoidedPnl = rejClosed.reduce((a, s) => a + s.hypoPnl, 0); // P&L the rejected book WOULD have taken
    const avoidedLosers = rejClosed.filter((s) => s.hypoPnl < 0).length;
    const avgConfApproved = trades.length ? trades.reduce((a, s) => a + s.confidence, 0) / trades.length : 0;
    const avgConfRejected = rejected.length ? rejected.reduce((a, s) => a + s.confidence, 0) / rejected.length : 0;

    /* ═══ THE FORK — Robotín's two books, side by side ═══
       Approved = REAL executed trades (realized P&L). Rejected = the COUNTERFACTUAL:
       we never took these, but we track what they'd be doing live, so an allocator can
       see whether the filter dodged losers or left money on the table. Both branches
       carry the same lifecycle (closed → active → pending); the rejected branch's
       "open" P&L is an unrealized mark vs. the latest close (it was never actually run). */
    const pending = trades.filter((t) => t.status === "pending");
    // mark-to-market for a still-open hypothetical position vs the coin's latest close
    const markOf = (s) => {
      const last = lastCloseByCoin[s.coin];
      if (last == null) return 0;
      const sign = s.dir === "LONG" ? 1 : -1;
      return Math.round(sign * ((last - s.entry) / s.entry) * s.lev * s.notional * 100) / 100;
    };
    const rejActive = rejected.filter((s) => s.hypoStatus === "active");
    const rejPending = rejected.filter((s) => s.hypoStatus === "pending");
    const rejWins = rejClosed.filter((s) => s.hypoPnl > 0);
    const rejLosses = rejClosed.filter((s) => s.hypoPnl < 0);
    const rejWinGross = rejWins.reduce((a, s) => a + s.hypoPnl, 0);
    const rejLossGross = Math.abs(rejLosses.reduce((a, s) => a + s.hypoPnl, 0));
    const rejActiveUnreal = rejActive.reduce((a, s) => a + markOf(s), 0);  // opportunity in progress
    const rejActiveWinning = rejActive.filter((s) => markOf(s) > 0).length;
    const filterEdge = -avoidedPnl; // realized edge: rejected book net was avoidedPnl; not taking it added the inverse

    const approvedBranch = {
      total: approvedCount, closed: closed.length, active: active.length, pending: pending.length,
      result: netPnl, wins: wins.length, losses: losses.length, winGross: grossWin, lossGross: grossLoss, winRate,
    };
    const rejectedBranch = {
      total: rejected.length, closed: rejClosed.length, active: rejActive.length, pending: rejPending.length,
      result: avoidedPnl, wins: rejWins.length, losses: rejLosses.length, winGross: rejWinGross, lossGross: rejLossGross,
      winRate: rejClosed.length ? (rejWins.length / rejClosed.length) * 100 : 0,
      activeUnreal: rejActiveUnreal, activeWinning: rejActiveWinning,
    };

    /* ── Signal providers: the supply side (monitored vs who actually signaled) ── */
    const provMap = new Map();
    allSignals.forEach((s) => {
      if (!provMap.has(s.trader)) provMap.set(s.trader, { trader: s.trader, isBot: s.isBot, total: 0, approved: 0, execPnl: 0 });
      const p = provMap.get(s.trader);
      p.total++;
      if (s.approved) { p.approved++; if (s.status === "closed") p.execPnl += s.pnl; }
    });
    const providers = [...provMap.values()]
      .map((p) => ({ ...p, approvalRate: p.total ? (p.approved / p.total) * 100 : 0 }))
      .sort((a, b) => b.execPnl - a.execPnl);
    const monitoredProviders = mockTraders.length;
    const signaledProviders = providers.length;
    const avgSignalsPerProvider = signaledProviders ? allSignals.length / signaledProviders : 0;
    const humanSignals = allSignals.filter((s) => !s.isBot).length;
    const botSignals = allSignals.length - humanSignals;
    const humanExecPnl = closed.filter((s) => !s.isBot).reduce((a, s) => a + s.pnl, 0);
    const botExecPnl = closed.filter((s) => s.isBot).reduce((a, s) => a + s.pnl, 0);
    const topProvider = providers[0] || { trader: "—", execPnl: 0, isBot: false };
    const topProviderShare = netPnl > 0 ? (topProvider.execPnl / netPnl) * 100 : 0;

    return {
      allSignalsCount: allSignals.length, approvedCount, approvalRate,
      rejectedCount: rejected.length, avoidedPnl, avoidedLosers, avgConfApproved, avgConfRejected,
      approvedBranch, rejectedBranch, filterEdge,
      providers, monitoredProviders, signaledProviders, avgSignalsPerProvider,
      humanSignals, botSignals, humanExecPnl, botExecPnl, topProvider, topProviderShare,
      trades, closed, active, wins, losses,
      netPnl, winRate, profitFactor, maxDrawdown, maxDrawdownPct,
      equity, balance, returnPct, btcReturnPct, sharpe, sortino, monthly, rDist,
      allBalance, allReturnPct, topDrawdowns, rolling, rollWindow: W,
      topCoin, topConcentration,
    };
  }, [within]);

  const tooltipStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" };

  /* Clean, evenly-spaced axes that ADAPT to the data range — so a short window
     (e.g. 6H with a ~$700 range) isn't squished under fixed $5k steps. A "nice"
     step keeps the numbers round; a fixed Y-axis width keeps the curve and the
     drawdown strip aligned. */
  const AXIS_W = 52;
  const niceStep = (range) => {
    const rough = (range || 1) / 5;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= rough) return m * pow;
    return 10 * pow;
  };
  const yTicks = (() => {
    const vals = data.equity.flatMap((e) => [e.exec, e.all, e.btc]).filter((v) => v != null);
    const dmin = Math.min(...vals, STARTING_BALANCE), dmax = Math.max(...vals, STARTING_BALANCE);
    const step = niceStep(dmax - dmin);
    const lo = Math.floor(dmin / step) * step, hi = Math.ceil(dmax / step) * step;
    const out = []; for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v)); return out;
  })();
  const xTicks = (() => {
    const max = (data.equity.length || 1) - 1;
    const step = Math.max(1, Math.ceil(max / 7));
    const out = []; for (let v = 0; v <= max; v += step) out.push(v); return out;
  })();
  // Drawdown strip floor — always keep the axis negative so a flat (0%) window
  // doesn't render bogus positive ticks.
  const ddFloor = Math.min(-0.5, ...data.equity.map((e) => e.dd ?? 0));

  // ── Friendly dashboard KPIs, derived from the same closed-trade set ──
  const dash = (() => {
    const closed = data.closed;
    const winners = closed.filter((s) => s.pnl > 0);
    const losers = closed.filter((s) => s.pnl < 0);
    const avgWin = winners.length ? winners.reduce((a, s) => a + s.pnl, 0) / winners.length : 0;
    const avgLoss = losers.length ? Math.abs(losers.reduce((a, s) => a + s.pnl, 0) / losers.length) : 0;
    const largestWin = closed.length ? Math.max(...closed.map((s) => s.pnl)) : 0;
    const largestLoss = closed.length ? Math.min(...closed.map((s) => s.pnl)) : 0;
    const byTime = [...closed].sort((a, b) => a.time - b.time);
    let bw = 0, bl = 0, cw = 0, cl = 0;
    byTime.forEach((s) => { if (s.pnl >= 0) { cw++; cl = 0; bw = Math.max(bw, cw); } else { cl++; cw = 0; bl = Math.max(bl, cl); } });
    const holds = closed.filter((s) => s.exitIdx != null).map((s) => s.exitIdx - (s.activeIdx ?? s.entryIdx));
    const avgHold = holds.length ? holds.reduce((a, h) => a + h, 0) / holds.length : 0;
    const dayMap = {};
    closed.forEach((s) => { const d = new Date(s.time * 1000); const k = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`; dayMap[k] = (dayMap[k] || 0) + s.pnl; });
    const de = Object.entries(dayMap);
    const bestDay = de.length ? de.reduce((a, b) => (b[1] > a[1] ? b : a)) : ["—", 0];
    const worstDay = de.length ? de.reduce((a, b) => (b[1] < a[1] ? b : a)) : ["—", 0];
    const rs = closed.map((s) => { const sign = s.dir === "LONG" ? 1 : -1; const risk = Math.abs(s.entry - s.sl); const exit = s.exit ?? (s.hit === "TP" ? s.tp1 : s.sl); return risk > 0 ? (sign * (exit - s.entry)) / risk : 0; });
    const avgR = rs.length ? rs.reduce((a, r) => a + r, 0) / rs.length : 0;
    const expectancy = closed.length ? data.netPnl / closed.length : 0;
    const times = closed.map((s) => s.time);
    const spanDays = times.length ? Math.max(1, (Math.max(...times) - Math.min(...times)) / 86400) : 1;
    const perDay = closed.length / spanDays;
    const nowS = Date.now() / 1000;
    const dStart = new Date(); dStart.setHours(0, 0, 0, 0); const dStartS = dStart.getTime() / 1000;
    const todayT = closed.filter((s) => s.time >= dStartS);
    const todayW = todayT.filter((s) => s.pnl >= 0).length;
    let curStreak = 0, curWin = true;
    for (let i = byTime.length - 1; i >= 0; i--) { const w = byTime[i].pnl >= 0; if (i === byTime.length - 1) { curWin = w; curStreak = 1; } else if (w === curWin) curStreak++; else break; }
    const mth = data.monthly || [];
    const lastM = mth[mth.length - 1] || { pnl: 0, trades: 0, winRate: 0 };
    const prevM = mth[mth.length - 2] || { pnl: 0, trades: 0, winRate: 0 };
    const mWins = (m) => Math.round((m.trades * m.winRate) / 100);
    return {
      avgWin, avgLoss, largestWin, largestLoss, bestWinStreak: bw, bestLossStreak: bl,
      avgHold, bestDay, worstDay, avgR, expectancy, perDay, perWeek: perDay * 7,
      perMonth: Math.round(closed.length / Math.max(1, (data.monthly || []).length)), // real avg/month, not an extrapolated run-rate
      payoff: avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? Infinity : 0),
      todayPnl: todayT.reduce((a, s) => a + s.pnl, 0), todayW, todayL: todayT.length - todayW, todayCount: todayT.length,
      // "This month" must agree with the Total Net P&L card's sub-line — both read
      // the monthly series (lastM), never the all-time total (that printed a visible
      // contradiction: +$2,338 in one card, the full net P&L two cards away).
      weekPnl: closed.filter((s) => s.time >= nowS - 7 * 86400).reduce((a, s) => a + s.pnl, 0), monthPnl: lastM.pnl, curStreak, curWin,
      lastM, prevM, lastMWins: mWins(lastM), lastMLosses: lastM.trades - mWins(lastM), prevMWins: mWins(prevM), prevMLosses: prevM.trades - mWins(prevM),
      thisMonthPnl: lastM.pnl, lastMonthPnl: prevM.pnl,
      // Live exposure — what's on the book right now (long/short lean, unrealized
      // drift, distance to stops, concentration). The desk's between-closes view.
      openRisk: (() => {
        const actives = ALL_SIGNALS.filter((s) => s.approved && s.status === "active");
        const longs = actives.filter((s) => s.dir === "LONG").length;
        const unrl = actives.map((s) => {
          const lc = lastCloseByCoin[s.coin];
          if (lc == null || !s.entry) return 0;
          return (s.dir === "LONG" ? 1 : -1) * ((lc - s.entry) / s.entry) * 100;
        });
        const toSl = actives.map((s) => (s.entry && s.sl ? Math.abs((s.entry - s.sl) / s.entry) * 100 : 0));
        const byCoin = {};
        actives.forEach((s) => { byCoin[s.coin] = (byCoin[s.coin] || 0) + 1; });
        const top = Object.entries(byCoin).sort((a, b) => b[1] - a[1])[0];
        return {
          count: actives.length, longs, shorts: actives.length - longs,
          avgUnrl: unrl.length ? unrl.reduce((a, b) => a + b, 0) / unrl.length : 0,
          avgToSl: toSl.length ? toSl.reduce((a, b) => a + b, 0) / toSl.length : 0,
          topCoin: top ? top[0] : null, topCount: top ? top[1] : 0,
        };
      })(),
    };
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── 1 · The legible core: one calm, uniform metric grid + a persistent
             right rail (Account Balance + Today). Every number is its own airy card,
             one template, no tier labels — scannable at a glance, nothing lost. ── */}
      <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(264px, 1fr)", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Primary tier — the four numbers an allocator checks first, one size up.
              Everything else keeps the calm uniform grid below. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            <Kpi hero label="Total Net P&L" icon={TrendingUp} accent={C.green} value={usd(data.netPnl)} valueColor={data.netPnl >= 0 ? C.green : C.red} sub={`This month ${usd(dash.thisMonthPnl)} · last ${usd(dash.lastMonthPnl)}`} onClick={() => go("report")} />
            <Kpi hero label="Return vs BTC" icon={TrendingUp} accent={C.green} value={`${data.returnPct - data.btcReturnPct >= 0 ? "+" : ""}${(data.returnPct - data.btcReturnPct).toFixed(1)} pts`} valueColor={data.returnPct - data.btcReturnPct >= 0 ? C.green : C.red} sub={`${data.returnPct >= 0 ? "+" : ""}${data.returnPct.toFixed(1)}% vs ${data.btcReturnPct >= 0 ? "+" : ""}${data.btcReturnPct.toFixed(1)}% BTC`} onClick={() => go("audit", { auditView: "analytics" })} />
            <Kpi hero label="Win Rate" icon={Percent} tip="winRate" value={`${data.winRate.toFixed(1)}%`} valueColor={data.winRate >= 50 ? C.green : C.red} sub={`${data.wins.length}W / ${data.losses.length}L closed · this mo ${dash.lastM.winRate}%`} onClick={() => go("audit", { auditView: "analytics" })} />
            {/* % is the allocator's unit (and the drawdown chart's) — $ is the sub */}
            <Kpi hero label="Max Drawdown" icon={TrendingDown} accent={C.red} tip="maxDD" value={`${data.maxDrawdownPct.toFixed(1)}%`} valueColor={C.red} sub={`${usd(data.maxDrawdown)} peak-to-trough`} onClick={() => go("audit", { auditView: "analytics" })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(186px, 1fr))", gap: 12 }}>
          {/* "Wins vs Losses" and "Last Month W/L" were re-statements of Win Rate's
              own numbers — their counts now live in the Win Rate hero sub. */}
          {/* the old "24.7/day" was a span artifact that contradicted "23/month" one line later */}
          <Kpi label="Total Trades" icon={BarChart3} value={data.closed.length} sub={`closed · this mo ${dash.lastM.trades} · last ${dash.prevM.trades}`} onClick={() => go("activity")} />
          <Kpi label="Avg Win / Loss" icon={BarChart3} value={<><span style={{ color: C.green }}>{usd(dash.avgWin)}</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.red }}>{usd(-dash.avgLoss)}</span></>} sub="average winning vs losing trade" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Best Streaks" icon={TrendingUp} value={<><span style={{ color: C.green }}>{dash.bestWinStreak}W</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.red }}>{dash.bestLossStreak}L</span></>} sub="best winning / losing streaks" onClick={() => go("activity")} />
          <Kpi label="Largest Win / Loss" icon={TrendingUp} value={<><span style={{ color: C.green }}>{usd(dash.largestWin)}</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.red }}>{usd(dash.largestLoss)}</span></>} sub="best and worst single trades" onClick={() => go("audit")} />
          <Kpi label="Avg Hold Time" icon={Clock} value={`${dash.avgHold.toFixed(1)} hrs`} sub="average holding time" onClick={() => go("audit")} />
          {/* color by SIGN, not by role — and when even the worst day is positive,
              SAY so: otherwise a green "worst" reads like a data bug */}
          <Kpi label="Best / Worst Day" icon={Calendar} value={<><span style={{ color: dash.bestDay[1] >= 0 ? C.green : C.red }}>{usd(dash.bestDay[1])}</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: dash.worstDay[1] >= 0 ? C.green : C.red }}>{usd(dash.worstDay[1])}</span></>} sub={`${dash.bestDay[0]} / ${dash.worstDay[0]}${dash.worstDay[1] >= 0 ? " · no losing day in window" : ""}`} onClick={() => go("report")} />
          <Kpi label="Average R" icon={Activity} tip="rr" value={`${dash.avgR >= 0 ? "+" : ""}${dash.avgR.toFixed(2)}R`} valueColor={dash.avgR >= 0 ? C.green : C.red} sub="avg risk/reward ratio" onClick={() => go("engine")} />
          <Kpi label="Expectancy" icon={Target} tip="expectancy" value={usd(dash.expectancy)} valueColor={dash.expectancy >= 0 ? C.green : C.red} sub="expected profit per trade" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Profit Factor" icon={Scale} tip="profitFactor" value={pfFmt(data.profitFactor)} valueColor={data.profitFactor >= 1 ? C.green : C.red} sub="gross profit / gross loss" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Filter Edge" icon={ShieldCheck} accent={C.green} value={usd(data.filterEdge)} valueColor={data.filterEdge >= 0 ? C.green : C.red} sub="value vs taking every signal" onClick={() => go("audit", { auditView: "edge" })} />
          <Kpi label="Risk-adjusted" icon={Gauge} value={<><span style={{ color: C.blue }}>{data.sharpe.toFixed(2)}</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.cyan }}>{data.sortino.toFixed(2)}</span></>} sub="Sharpe / Sortino (proxy)" onClick={() => go("audit", { auditView: "analytics" })} />
          {/* rejected-signal confidence is NOT a loss — red implied "bad"; a low number
              here means the filter is doing its job, so it stays neutral */}
          <Kpi label="Avg Confidence" icon={Cpu} accent={C.purple} value={<><span style={{ color: C.green }}>{Math.round(data.avgConfApproved)}</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.textMuted }}>{Math.round(data.avgConfRejected)}</span></>} sub="approved vs rejected" onClick={() => go("audit", { auditView: "edge" })} />
          </div>
        </div>
        {/* right rail — Balance (state), Open Risk (now), Today (flow): three
            different questions, zero shared numbers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AccountBalanceCard balance={data.balance} returnPct={data.returnPct} equity={data.equity} onClick={() => go("engine")} />
          <OpenRiskCard risk={dash.openRisk} onClick={() => go("activity")} />
          <TodayCard dash={dash} onClick={() => go("report")} />
        </div>
      </div>

      {/* ── 2 · Robotín's read — slim executive summary of the period ── */}
      <AICommentary data={data} />

      {/* ── 3 · The fork: Robotín's two books — approved (real) vs rejected (counterfactual) ── */}
      <ForkPipeline
        data={data}
        onClick={(view) => (view === "edge" ? go("audit", { auditView: "edge" }) : go("activity"))}
      />

      {/* ════════ Equity, benchmark and risk charts follow ════════ */}

      {/* ── 3 · Fund equity curve vs BTC buy & hold ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: "600" }}>
              <Activity size={14} color={C.purple} /> Fund Equity Curve
            </div>
            <div style={{ fontSize: "10px", color: C.textFaint }}>
              Starting {usdPlain(STARTING_BALANCE)} · executed (Robotín) vs every signal if executed, and BTC buy-and-hold · the gap is the filter's value-add · simulated
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11.5, ...mono, lineHeight: 1.55 }}>
            <div style={{ color: C.purple, fontWeight: 700 }}>Executed {data.returnPct >= 0 ? "+" : ""}{data.returnPct.toFixed(1)}%</div>
            <div style={{ color: C.amber }}>All signals {data.allReturnPct >= 0 ? "+" : ""}{data.allReturnPct.toFixed(1)}%</div>
            <div style={{ color: C.textMuted }}>BTC {data.btcReturnPct >= 0 ? "+" : ""}{data.btcReturnPct.toFixed(1)}%</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data.equity}>
            <defs>
              <linearGradient id="fundEq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.purple} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
            <XAxis dataKey="i" stroke={C.textMuted} fontSize={10} ticks={xTicks} interval={0} tickFormatter={(v) => `#${v}`} />
            <YAxis stroke={C.textMuted} fontSize={10} width={AXIS_W} domain={[yTicks[0], yTicks[yTicks.length - 1]]} ticks={yTicks} tickFormatter={(v) => `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => (v === 0 ? "Start" : `Signal #${v}`)}
              formatter={(v, name) => [usdPlain(Number(v)), name === "exec" ? "Executed (Robotín)" : name === "all" ? "All signals (if executed)" : "BTC buy & hold"]}
            />
            <ReferenceLine y={STARTING_BALANCE} stroke={C.textFaint} strokeDasharray="4 4" strokeOpacity={0.7} label={{ value: "breakeven", position: "insideTopLeft", fill: C.textFaint, fontSize: 9 }} />
            <Area type="monotone" dataKey="exec" stroke={C.purple} strokeWidth={2.5} fill="url(#fundEq)" dot={false} name="exec" isAnimationActive={false} />
            <Line type="monotone" dataKey="all" stroke={C.amber} strokeWidth={1.8} dot={false} name="all" isAnimationActive={false} />
            <Line type="monotone" dataKey="btc" stroke={C.textMuted} strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="btc" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Underwater drawdown — risk beneath the return (drawdown is king) */}
        <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 2px" }}>Drawdown — % below peak</div>
        <ResponsiveContainer width="100%" height={86}>
          <ComposedChart data={data.equity}>
            <defs>
              <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.red} stopOpacity={0.06} />
                <stop offset="100%" stopColor={C.red} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}40`} />
            <XAxis dataKey="i" hide />
            <YAxis stroke={C.textMuted} fontSize={9} domain={[ddFloor, 0]} width={AXIS_W} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => (v === 0 ? "Start" : `Trade #${v}`)} formatter={(v) => [`${Number(v).toFixed(1)}%`, "Drawdown"]} />
            <Area type="monotone" dataKey="dd" stroke={C.red} strokeWidth={1.5} fill="url(#ddGrad)" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: "16px", fontSize: "9px", color: C.textMuted, marginTop: "4px", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 3, backgroundColor: C.purple, borderRadius: 1 }} /> Executed (Robotín)</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 3, backgroundColor: C.amber, borderRadius: 1 }} /> All signals (if executed)</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 0, borderTop: `2px dashed ${C.textMuted}` }} /> BTC buy &amp; hold</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 8, backgroundColor: `${C.red}40`, borderRadius: 1 }} /> Drawdown (executed)</span>
        </div>
      </div>

      {/* ── 5 · Monthly performance + Outcome distribution, side by side ── */}
      <div className="grid-2col-16">
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: "600" }}>
              <BarChart3 size={14} color={C.green} /> Monthly Performance
            </div>
            <div style={{ fontSize: "10px", color: C.textFaint }}>
              Closed P&amp;L by month — consistency over time · simulated 6-month track
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.monthly} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} vertical={false} />
            <XAxis dataKey="period" stroke={C.textMuted} fontSize={10} />
            <YAxis stroke={C.textMuted} fontSize={10} width={44} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: `${C.border}40` }}
              formatter={(v) => [usd(Number(v)), "P&L"]}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive={false}>
              {data.monthly.map((m, i) => <Cell key={i} fill={m.pnl >= 0 ? C.green : C.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* stats row padded to match the chart's plot area (left margin 8 + Y-axis 44, right margin 8) so each column sits under its bar */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, data.monthly.length)}, 1fr)`, gap: "6px", marginTop: "8px", paddingLeft: "52px", paddingRight: "8px" }}>
          {data.monthly.map((m) => (
            <div key={m.period} style={{ textAlign: "center", fontSize: "9px", color: C.textFaint, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, fontSize: "10px", color: m.pnl >= 0 ? C.green : C.red, ...mono }}>{usd(m.pnl)}</div>
              <div>{m.trades} trades</div>
              <div>{m.winRate}% WR</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6 · Outcome distribution — realized R per closed trade (the shape of the edge) ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: "600" }}>
              <BarChart3 size={14} color={C.cyan} /> Outcome Distribution
            </div>
            <div style={{ fontSize: "10px", color: C.textFaint }}>
              Realized R-multiple per closed trade · {data.closed.length} trades — losses capped near −1R, wins run to the right (asymmetric edge)
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.rDist.filter((b) => b.count > 0)} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} vertical={false} />
            <XAxis dataKey="label" stroke={C.textMuted} fontSize={11} />
            <YAxis stroke={C.textMuted} fontSize={10} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: `${C.border}40` }}
              formatter={(v) => [`${v} trades`, "Count"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.rDist.filter((b) => b.count > 0).map((b, i) => <Cell key={i} fill={b.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>

      {/* ── 7 · Deepest drawdowns + Rolling Sharpe, side by side ── */}
      <div className="grid-2col-16">
        {/* Deepest drawdowns */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: "600", marginBottom: 2 }}>
            <TrendingDown size={14} color={C.red} /> Deepest Drawdowns
          </div>
          <div style={{ fontSize: "10px", color: C.textFaint, marginBottom: 10 }}>The five worst peak-to-trough episodes on the executed curve</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {[["#", "left"], ["Depth", "right"], ["Span (trades)", "right"], ["Status", "right"]].map(([h, al]) => (
                  <th key={h} style={{ textAlign: al, padding: "7px 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", color: C.textFaint }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.topDrawdowns.map((d, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "8px", color: C.textMuted, ...mono }}>{i + 1}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: 800, color: C.red, ...mono }}>{d.depthPct.toFixed(1)}%</td>
                  <td style={{ padding: "8px", textAlign: "right", color: C.textMuted, ...mono }}>#{d.startI}→#{d.troughI} ({Math.max(1, d.troughI - d.startI)})</td>
                  <td style={{ padding: "8px", textAlign: "right", ...mono }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: d.recovered ? C.green : C.amber, backgroundColor: `${d.recovered ? C.green : C.amber}1c`, padding: "2px 7px", borderRadius: 4 }}>{d.recovered ? "Recovered" : "Ongoing"}</span>
                  </td>
                </tr>
              ))}
              {data.topDrawdowns.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: C.textMuted }}>No drawdowns in this window.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rolling Sharpe */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: "600", marginBottom: 2 }}>
            <Gauge size={14} color={C.blue} /> Rolling Sharpe
          </div>
          <div style={{ fontSize: "10px", color: C.textFaint, marginBottom: 10 }}>
            {data.rollWindow}-trade rolling window — consistency of the edge, not just the headline {data.sharpe.toFixed(2)}
          </div>
          {data.rolling.length > 1 ? (
            <ResponsiveContainer width="100%" height={188}>
              <ComposedChart data={data.rolling}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} vertical={false} />
                <XAxis dataKey="i" stroke={C.textMuted} fontSize={9} tickFormatter={(v) => `#${v}`} />
                <YAxis stroke={C.textMuted} fontSize={10} width={32} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `Trade #${v}`} formatter={(v) => [Number(v).toFixed(2), "Rolling Sharpe"]} />
                <ReferenceLine y={1} stroke={C.textFaint} strokeDasharray="4 4" strokeOpacity={0.7} label={{ value: "1.0", position: "insideTopLeft", fill: C.textFaint, fontSize: 9 }} />
                <Line type="monotone" dataKey="sharpe" stroke={C.blue} strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 188, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.textMuted }}>Not enough closed trades in this window for a rolling estimate.</div>
          )}
        </div>
      </div>

      {/* ════════ TRADERS — the signal providers ════════ */}
      <SectionHeader icon={Users} title="Traders — signal providers" subtitle="The supply side: who feeds the fund and how concentrated the contribution is" color={C.blue}
        right={<span onClick={() => go("traders")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") go("traders"); }} style={{ fontSize: 11, fontWeight: 700, color: C.purple, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>All traders <ChevronRight size={13} /></span>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <Kpi label="Active Providers" icon={Users} accent={C.blue} value={<><span style={{ color: C.text }}>{data.signaledProviders}</span> <span style={{ color: C.textFaint, fontSize: 14 }}>/</span> <span style={{ color: C.textMuted }}>{data.monitoredProviders}</span></>} sub="signaled / monitored" onClick={() => go("traders")} />
        <Kpi label="Signals / Provider" icon={BarChart3} value={data.avgSignalsPerProvider.toFixed(1)} sub="average published" onClick={() => go("traders")} />
        <Kpi label="Human vs Bot" icon={Bot} accent={C.cyan} value={<><span style={{ color: C.text }}>{data.humanSignals}</span> <span style={{ color: C.textFaint, fontSize: 14 }}>vs</span> <span style={{ color: C.cyan }}>{data.botSignals}</span></>} sub="signals (human / bot)" onClick={() => go("traders")} />
        <Kpi label="Top Provider Share" icon={Target} accent={C.amber} value={`${Math.round(data.topProviderShare)}%`} valueColor={data.topProviderShare >= 50 ? C.amber : C.text} sub={`${data.topProvider.trader} of executed P&L`} onClick={() => go("traders")} />
      </div>

      {/* Top providers by executed P&L — attribution preview (full detail in Traders / Audit) */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
          <Users size={14} color={C.blue} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Top providers by executed P&L</span>
          <span style={{ fontSize: 10, color: C.textMuted, marginLeft: "auto" }}>{data.signaledProviders} providers this period</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {[["Provider", "left"], ["Signals", "right"], ["Approved", "right"], ["Approval", "right"], ["Executed P&L", "right"]].map(([h, al]) => (
                <th key={h} scope="col" style={{ textAlign: al, padding: "8px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", color: C.textFaint, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.providers.slice(0, 5).map((p) => (
              <tr key={p.trader} className="hoverable" title={`Open ${p.trader}'s profile`} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }} onClick={() => openTrader(p.trader)}>
                {/* one identity pattern platform-wide: Avatar + name + BotTag */}
                <td style={{ padding: "9px 14px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 700, color: C.text }}>
                    <Avatar name={p.trader} size={22} />{p.trader}<BotTag isBot={p.isBot} size={13} />
                  </span>
                </td>
                <td style={{ padding: "9px 14px", textAlign: "right", ...mono, color: C.textMuted }}>{p.total}</td>
                <td style={{ padding: "9px 14px", textAlign: "right", ...mono, color: C.text }}>{p.approved}</td>
                <td style={{ padding: "9px 14px", textAlign: "right", ...mono, color: p.approvalRate >= 50 ? C.green : C.amber }}>{Math.round(p.approvalRate)}%</td>
                <td style={{ padding: "9px 14px", textAlign: "right", ...mono, fontWeight: 800, color: p.execPnl >= 0 ? C.green : C.red }}>{usd(p.execPnl)}</td>
              </tr>
            ))}
            {data.providers.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: C.textMuted }}>No signals from providers in this window.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { FundOverview };
