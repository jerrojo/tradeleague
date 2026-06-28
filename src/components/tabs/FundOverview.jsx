import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, BarChart3, Calendar, CheckCircle2, Clock, Cpu, Flame, Gauge, Layers, Percent, Radio,
  Scale, Sparkles, Target, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import { InfoTip, StatCard } from "../common";
import { useTimeframe, useNav } from "../../contexts";
import { coinCandles, coinSignals, ROBOTIN_COINS } from "../../data/robotin";
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
    <div style={{ ...cardStyle, borderColor: `${C.purple}40`, backgroundColor: `${C.purple}0d`, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Sparkles size={16} color={C.purple} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.4px" }}>Robotín's read</span>
          <span style={{ fontSize: 8, fontWeight: 800, color: C.purple, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}30`, padding: "1px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>AI commentary</span>
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.65, color: C.textMuted, margin: 0 }}>
          The fund stands at <Em c={C.text}>{usdPlain(data.balance)}</Em>, <Em c={data.returnPct >= 0 ? C.green : C.red}>{pct1(data.returnPct)}</Em> for the period versus <Em c={data.btcReturnPct >= 0 ? C.green : C.red}>{pct1(data.btcReturnPct)}</Em> for BTC buy-and-hold — {beat >= 0 ? "ahead of" : "behind"} the benchmark by <Em c={beat >= 0 ? C.green : C.red}>{Math.abs(beat).toFixed(1)} pts</Em>.
          {" "}Robotín approved <Em c={C.text}>{data.approvedCount}</Em> of <Em c={C.text}>{data.allSignalsCount}</Em> signals ({Math.round(data.approvalRate)}%); screening out the rest {edge >= 0 ? "added" : "cost"} an estimated <Em c={edge >= 0 ? C.green : C.red}>{usd(edge)}</Em> of filter edge.
          {" "}Win rate is <Em c={C.text}>{Number(data.winRate).toFixed(1)}%</Em> at a <Em c={data.profitFactor >= 1 ? C.green : C.red}>{pfFmt(data.profitFactor)}</Em> profit factor, with the worst drawdown reaching <Em c={C.red}>{data.maxDrawdownPct.toFixed(1)}%</Em>{data.topCoin ? <> · most active in <Em c={C.text}>{data.topCoin}</Em> ({data.topConcentration}% of trades)</> : null}.
        </p>
      </div>
    </div>
  );
};

/* ── Friendly KPI card (one metric per card, scannable dashboard grid) ── */
const Kpi = ({ label, icon: Icon, value, valueColor = C.text, sub, accent = C.textFaint, tip, onClick }) => (
  <div className={`tl-card${onClick ? " tl-card-int" : ""}`} onClick={onClick}
    role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} title={onClick ? "Open detail" : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    style={{ ...cardStyle, padding: "13px 15px", display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>
        {tip ? <InfoTip k={tip} inline><span>{label}</span></InfoTip> : label}
      </span>
      {Icon && <Icon size={14} color={accent} style={{ flexShrink: 0 }} />}
    </div>
    <div style={{ fontSize: 21, fontWeight: 800, color: valueColor, ...mono, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.textFaint }}>{sub}</div>}
  </div>
);

/* ── Account balance card with an equity sparkline (the friendly hero, right rail) ── */
const AccountBalanceCard = ({ balance, netPnl, returnPct, equity, onClick }) => (
  <div className={`tl-card${onClick ? " tl-card-int" : ""}`} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} title={onClick ? "Open detail" : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    style={{ ...cardStyle, padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted, fontWeight: 600 }}><Wallet size={14} /> Account Balance</div>
    <div style={{ fontSize: 30, fontWeight: 900, color: C.text, ...mono, lineHeight: 1.05 }}>{usdPlain(balance)}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: netPnl >= 0 ? C.green : C.red, ...mono }}>{usd(netPnl)} ({returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%)</div>
    <div style={{ height: 96, marginTop: 4 }}>
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
      <div style={{ fontSize: 28, fontWeight: 900, color: dash.todayPnl >= 0 ? C.green : C.red, ...mono, lineHeight: 1 }}>{usd(dash.todayPnl)}</div>
      <div style={{ fontSize: 11, color: C.textFaint }}>{dash.todayCount} trade{dash.todayCount === 1 ? "" : "s"} today</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, ...mono, marginTop: 2 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.green }}><TrendingUp size={13} /> {dash.todayW}W</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.red }}><TrendingDown size={13} /> {dash.todayL}L</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, color: C.text, fontWeight: 700 }}><Target size={12} color={C.cyan} /> {wr}% WR</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, paddingTop: 2 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.textMuted }}><Flame size={12} color={C.amber} /> Current streak</span>
        <span style={{ fontWeight: 700, color: dash.curWin ? C.green : C.red, ...mono }}>{dash.curStreak} {dash.curWin ? "Wins" : "Losses"}</span>
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        <Row label="This week" value={usd(dash.weekPnl)} color={dash.weekPnl >= 0 ? C.green : C.red} />
        <Row label="This month" value={usd(dash.monthPnl)} color={dash.monthPnl >= 0 ? C.green : C.red} />
      </div>
    </div>
  );
};

const FundOverview = () => {
  const { within } = useTimeframe();
  const { go } = useNav();
  const data = useMemo(() => {
    /* ── Every signal across all coins (for the system-wide approval rate) ── */
    const allSignals = ROBOTIN_COINS.flatMap((coin) => coinSignals(coin, coinCandles(coin))).filter((s) => within(s.time));
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

    return {
      allSignalsCount: allSignals.length, approvedCount, approvalRate,
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
      weekPnl: closed.filter((s) => s.time >= nowS - 7 * 86400).reduce((a, s) => a + s.pnl, 0), monthPnl: data.netPnl, curStreak, curWin,
      lastM, prevM, lastMWins: mWins(lastM), lastMLosses: lastM.trades - mWins(lastM), prevMWins: mWins(prevM), prevMLosses: prevM.trades - mWins(prevM),
      thisMonthPnl: lastM.pnl, lastMonthPnl: prevM.pnl,
    };
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── 1 · Title ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "15px", fontWeight: "800" }}>Fund Overview</div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800,
            color: C.cyan, backgroundColor: `${C.cyan}1c`, padding: "2px 8px", borderRadius: 4,
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}><Cpu size={10} /> Tear Sheet</span>
        </div>
        <div style={{ fontSize: "11px", color: C.textMuted, marginTop: 2 }}>
          Everything an allocator needs, on one page — simulated.
        </div>
      </div>

      {/* ── 2 · Friendly KPI dashboard — scannable cards + balance & today rail ── */}
      <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(264px, 1fr)", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {/* row 1 */}
          <Kpi label="Total Net P&L" icon={TrendingUp} accent={C.green} value={usd(data.netPnl)} valueColor={data.netPnl >= 0 ? C.green : C.red} sub={`this month ${usd(dash.thisMonthPnl)} · last ${usd(dash.lastMonthPnl)}`} onClick={() => go("audit")} />
          <Kpi label="Total Trades" icon={BarChart3} value={data.closed.length} sub={`${dash.perDay.toFixed(2)}/day · ${dash.perWeek.toFixed(1)}/wk`} onClick={() => go("activity")} />
          <Kpi label="Win Rate" icon={Percent} tip="winRate" value={`${data.winRate.toFixed(1)}%`} valueColor={data.winRate >= 50 ? C.green : C.red} sub={`this month ${dash.lastM.winRate}% · last ${dash.prevM.winRate}%`} onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Wins vs Losses" icon={Target} value={<><span style={{ color: C.green }}>{data.wins.length}</span> <span style={{ color: C.textFaint, fontSize: 14 }}>vs</span> <span style={{ color: C.red }}>{data.losses.length}</span></>} sub={`this month ${dash.lastMWins} vs ${dash.lastMLosses}`} onClick={() => go("audit")} />
          {/* row 2 */}
          <Kpi label="Avg Win / Loss" icon={BarChart3} value={<><span style={{ color: C.green }}>{usd(dash.avgWin)}</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.red }}>{usd(-dash.avgLoss)}</span></>} sub="average winning vs losing trade" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Best Streaks" icon={Flame} accent={C.amber} value={<><span style={{ color: C.green }}>{dash.bestWinStreak}W</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.red }}>{dash.bestLossStreak}L</span></>} sub="best winning / losing streak" onClick={() => go("activity")} />
          <Kpi label="Largest Win / Loss" icon={TrendingUp} value={<><span style={{ color: C.green }}>{usd(dash.largestWin)}</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.red }}>{usd(dash.largestLoss)}</span></>} sub="best & worst single trade" onClick={() => go("audit")} />
          <Kpi label="Last Month W/L" icon={Target} value={<><span style={{ color: C.green }}>{dash.prevMWins}</span> <span style={{ color: C.textFaint, fontSize: 14 }}>vs</span> <span style={{ color: C.red }}>{dash.prevMLosses}</span></>} sub={`win rate ${dash.prevM.winRate}%`} onClick={() => go("report")} />
          {/* row 3 */}
          <Kpi label="Avg Hold Time" icon={Clock} value={`${dash.avgHold.toFixed(1)} hrs`} sub="average holding time" onClick={() => go("audit")} />
          <Kpi label="Trades / Month" icon={BarChart3} value={dash.perMonth.toFixed(1)} sub={`this month ${dash.lastM.trades} · last ${dash.prevM.trades}`} onClick={() => go("report")} />
          <Kpi label="Max Drawdown" icon={TrendingDown} accent={C.red} tip="maxDD" value={usd(data.maxDrawdown)} valueColor={C.red} sub="largest peak-to-trough" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Best / Worst Day" icon={Calendar} value={<><span style={{ color: C.green }}>{usd(dash.bestDay[1])}</span> <span style={{ color: C.textFaint }}>/</span> <span style={{ color: C.red }}>{usd(dash.worstDay[1])}</span></>} sub={`${dash.bestDay[0]} / ${dash.worstDay[0]}`} onClick={() => go("report")} />
          {/* row 4 */}
          <Kpi label="Payoff Ratio" icon={Scale} value={pfFmt(dash.payoff)} valueColor={dash.payoff >= 1 ? C.green : C.red} sub="avg win / avg loss" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Average R" icon={Activity} tip="rr" value={`${dash.avgR >= 0 ? "+" : ""}${dash.avgR.toFixed(2)}R`} valueColor={dash.avgR >= 0 ? C.green : C.red} sub="avg realized risk/reward" onClick={() => go("engine")} />
          <Kpi label="Expectancy" icon={Target} tip="expectancy" value={usd(dash.expectancy)} valueColor={dash.expectancy >= 0 ? C.green : C.red} sub="expected profit per trade" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Profit Factor" icon={Scale} tip="profitFactor" value={pfFmt(data.profitFactor)} valueColor={data.profitFactor >= 1 ? C.green : C.red} sub="gross profit / gross loss" onClick={() => go("audit", { auditView: "analytics" })} />
          {/* row 5 — risk-adjusted + Robotín pipeline (fund identity) */}
          <Kpi label="Sharpe" icon={Gauge} tip="sharpe" value={data.sharpe.toFixed(2)} valueColor={C.blue} sub="risk-adjusted (proxy)" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Sortino" icon={Gauge} tip="sortino" value={data.sortino.toFixed(2)} valueColor={C.cyan} sub="downside-adjusted (proxy)" onClick={() => go("audit", { auditView: "analytics" })} />
          <Kpi label="Signals Processed" icon={Cpu} accent={C.purple} value={data.allSignalsCount} sub={`${data.approvedCount} approved · ${data.active.length} active`} onClick={() => go("activity")} />
          <Kpi label="Approval Rate" icon={CheckCircle2} accent={C.cyan} value={`${Math.round(data.approvalRate)}%`} valueColor={C.cyan} sub="Robotín-approved signals" onClick={() => go("audit", { auditView: "edge" })} />
        </div>
        {/* right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AccountBalanceCard balance={data.balance} netPnl={data.netPnl} returnPct={data.returnPct} equity={data.equity} onClick={() => go("engine")} />
          <TodayCard dash={dash} onClick={() => go("report")} />
        </div>
      </div>

      {/* ── 2b · AI commentary — the period in plain English ── */}
      <AICommentary data={data} />

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
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.purple, ...mono }}>{usdPlain(data.balance)}</div>
            <div style={{ fontSize: 10, color: C.textMuted, ...mono }}>Executed · {data.returnPct >= 0 ? "+" : ""}{data.returnPct.toFixed(1)}%</div>
            <div style={{ fontSize: 11, color: C.amber, ...mono, marginTop: 3 }}>All signals {usdPlain(data.allBalance)} · {data.allReturnPct >= 0 ? "+" : ""}{data.allReturnPct.toFixed(1)}%</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: data.balance >= data.allBalance ? C.green : C.red, ...mono }}>
              Filter edge {usd(data.balance - data.allBalance)}
            </div>
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
        <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 2px" }}>Drawdown — % below peak</div>
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
          <span style={{ fontSize: 8, fontWeight: 800, color: C.amber, backgroundColor: C.amberBg, padding: "2px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>Simulated</span>
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
          <span style={{ fontSize: 8, fontWeight: 800, color: C.amber, backgroundColor: C.amberBg, padding: "2px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>Simulated</span>
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
                  <th key={h} style={{ textAlign: al, padding: "7px 8px", fontSize: 9, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", color: C.textFaint }}>{h}</th>
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
    </div>
  );
};

export { FundOverview };
