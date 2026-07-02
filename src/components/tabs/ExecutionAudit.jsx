import { useMemo, useState } from "react";
import {
  Activity, Award, ChevronDown, Coins, DollarSign, Percent, RefreshCw,
  Scale, Shield, Target, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import { StatCard, CollapsibleSection, SectionHeader, InfoTip } from "../common";
import { SignalTable } from "../SignalTable";
import { useTimeframe } from "../../contexts";
import { ALL_SIGNALS, CANDLES_BY_COIN, lastCloseByCoin as LAST_CLOSE, feeOf, arrivalSlipBps } from "../../data/robotin";
import { bps, signColor } from "../../lib/format";
import { START_CAPITAL } from "../../data/fund";
import { C, cardStyle, mono, thStyle, tdStyle } from "../../theme";

/* ═══════════════════════ TAB: EXECUTION AUDIT ═══════════════════════
   Audit-grade view of every Robotín-executed (approved) signal: order fills,
   fees, and the spread between the THEORETICAL outcome (gross, what the signal
   claimed) and the REAL net P&L after fees. Numbers mirror RobotinWallet's
   conventions so the two tabs never disagree:
     realized (gross of accounting) = pnl + fees   →   net pnl = pnl
     per-trade fee ~ $0.1–0.4, derived deterministically from the trade id. */

const STARTING_BALANCE = START_CAPITAL;

/* ── formatting (mirrors TradeDetail) ── */
const fmtPx = (p) => {
  if (p == null) return "—";
  const a = Math.abs(p);
  if (a >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (a >= 0.01) return p.toFixed(4);
  if (a >= 0.0001) return p.toFixed(6);
  return p.toPrecision(3);
};
const usd = (v) => (v == null ? "—" : `${v >= 0 ? "+" : "−"}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const usdPlain = (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const pct = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const fmtTime = (t) =>
  t == null ? "—" : new Date(t * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/* Arrival slippage (TCA): REAL realized fill (entry) vs. price at AI approval
   (signalPx) — computed in robotin.js so audit & detail agree. Convention:
   positive bps = paid up to enter (adverse), negative = filled better than arrival. */
const slipBps = (s) => arrivalSlipBps(s);

/* ── derived audit fields for a single signal (mirrors TradeDetail's logic) ── */
const deriveAudit = (s) => {
  const isClosed = s.status === "closed";
  const isOpen = s.status === "active" || s.status === "pending";
  const fees = feeOf(s);
  // net pnl = s.pnl (after fees, per RobotinWallet); realized (gross) = pnl + fees
  const netPnl = isClosed ? s.pnl : null;

  // signal claim: a published signal always claims it will hit TP
  const signalStatus = { label: "Take Profit", color: C.green };

  // audit status: what actually happened
  let auditLabel, auditColor;
  if (isClosed) {
    auditLabel = s.hit === "TP" ? "Take Profit" : "Stop Loss";
    auditColor = s.hit === "TP" ? C.green : C.red;
  } else if (s.status === "active") {
    auditLabel = "Active"; auditColor = C.blue;
  } else if (s.status === "pending") {
    auditLabel = "Pending"; auditColor = C.amber;
  } else {
    auditLabel = "Did Not Reach Entry Price"; auditColor = C.textFaint;
  }

  // match: gross vs net outcome agree?
  let matchLabel, matchColor, matchClass;
  if (isClosed) {
    const exactMatch = s.signalOutcome === "TP" && s.hit === "TP";
    matchLabel = exactMatch ? "Exact Match" : "Outcome Mismatch";
    matchColor = exactMatch ? C.green : C.amber;
    matchClass = exactMatch ? "match" : "mismatch";
  } else if (isOpen) {
    matchLabel = "Open"; matchColor = C.blue; matchClass = "open";
  } else {
    matchLabel = "Did Not Reach Entry Price"; matchColor = C.textFaint; matchClass = "none";
  }

  // realized R: sign*(exit-entry)/|entry-sl|
  let rMultiple = null;
  if (isClosed && s.entry !== s.sl && s.exit != null) {
    const sign = s.dir === "LONG" ? 1 : -1;
    rMultiple = (sign * (s.exit - s.entry)) / Math.abs(s.entry - s.sl);
  }

  // notional behind the trade (re-derived only for fee ratio context)
  const notional = isClosed && s.pnlPct ? Math.abs((s.pnl / s.pnlPct) * 100) : null;

  return {
    isClosed, isOpen, fees, netPnl, signalStatus,
    auditLabel, auditColor, matchLabel, matchColor, matchClass, rMultiple, notional,
  };
};

const DIRS = ["All", "LONG", "SHORT"];
const AUDIT_STATUSES = ["All", "Take Profit", "Stop Loss", "Active", "Pending"];
const MATCHES = ["All", "Exact Match", "Outcome Mismatch"];
const SORTS = ["Newest", "Oldest", "Net PNL"];

/* ── compact dark select ── */
const Select = ({ label, value, onChange, options }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        backgroundColor: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 6,
        color: C.text, fontSize: 12, fontWeight: 600, padding: "7px 9px", cursor: "pointer",
        outline: "none", appearance: "none", minWidth: 110,
      }}
    >
      {options.map((o) => <option key={o} value={o} style={{ backgroundColor: C.card }}>{o}</option>)}
    </select>
  </label>
);

/* ── small advanced-stat card ── */
const MiniStat = ({ label, value, color, sub, tip }) => (
  <div className="tl-card" style={{ ...cardStyle, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>{tip ? <InfoTip k={tip} inline><span>{label}</span></InfoTip> : label}</span>
    <span style={{ fontSize: 16, fontWeight: 800, color: color || C.text, ...mono, letterSpacing: "-0.3px" }}>{value}</span>
    {sub && <span style={{ fontSize: 10, color: C.textMuted, ...mono }}>{sub}</span>}
  </div>
);

/* ── right-side stacked stat in an operation row header ── */
const RowStat = ({ label, value, color }) => (
  <div style={{ minWidth: 92, textAlign: "right" }}>
    <div style={{ fontSize: 8, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    <div style={{ fontSize: 12, fontWeight: 800, color: color || C.text, ...mono }}>{value}</div>
  </div>
);

const pfFmt = (v) => (v === Infinity ? "∞" : v.toFixed(2));

const ExecutionAudit = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [opsOpen, setOpsOpen] = useState(true);

  // latest close per coin → lets the table read unrealized P&L on active executions
  const lastCloseByCoin = LAST_CLOSE;

  // filters
  const [asset, setAsset] = useState("All");
  const [dir, setDir] = useState("All");
  const [auditStatus, setAuditStatus] = useState("All");
  const [match, setMatch] = useState("All");
  const [sort, setSort] = useState("Newest");

  /* ── DATA UNIVERSE: all approved signals across all coins = executed trades ── */
  const { within } = useTimeframe();
  const executed = useMemo(() => {
    void refreshKey; // re-key forces recompute on Refresh
    return ALL_SIGNALS
      .filter((s) => s.approved === true && within(s.time))
      .map((s) => {
        const candles = CANDLES_BY_COIN[s.coin];
        return {
          ...s,
          audit: deriveAudit(s),
          exitTime: s.exitIdx != null && candles && candles[s.exitIdx] ? candles[s.exitIdx].time : null,
        };
      })
      .sort((a, b) => a.time - b.time);
  }, [refreshKey, within]);

  const assetOptions = useMemo(
    () => ["All", ...Array.from(new Set(executed.map((s) => s.coin)))],
    [executed]
  );

  /* ── KPIs over executed trades (and their closed outcomes) ── */
  const kpi = useMemo(() => {
    const closed = executed.filter((s) => s.status === "closed");
    const active = executed.filter((s) => s.status === "active");
    const pending = executed.filter((s) => s.status === "pending");

    // theoretical (gross): the signal claimed TP, so a "theoretical win" = gross TP hit
    const theoWins = closed.filter((s) => s.hit === "TP");
    const theoWinRate = closed.length ? (theoWins.length / closed.length) * 100 : 0;

    // executed (after fees): a real win = net pnl (s.pnl, already net) > 0
    const realWins = closed.filter((s) => s.pnl > 0);
    const realWinRate = closed.length ? (realWins.length / closed.length) * 100 : 0;

    const netPnl = closed.reduce((a, s) => a + s.pnl, 0);
    const totalFees = closed.reduce((a, s) => a + s.audit.fees, 0);

    // match rate: gross outcome (TP=win/SL=loss) agrees with net outcome (pnl>0 / pnl<=0)
    const matches = closed.filter((s) => {
      const grossWin = s.hit === "TP";
      const netWin = s.pnl > 0;
      return grossWin === netWin;
    });
    const matchRate = closed.length ? (matches.length / closed.length) * 100 : 0;

    const grossWinSum = closed.filter((s) => s.pnl > 0).reduce((a, s) => a + s.pnl, 0);
    const grossLossSum = Math.abs(closed.filter((s) => s.pnl < 0).reduce((a, s) => a + s.pnl, 0));
    const profitFactor = grossLossSum > 0 ? grossWinSum / grossLossSum : (grossWinSum > 0 ? Infinity : 0);

    const balance = STARTING_BALANCE + netPnl;

    /* ── advanced statistics ── */
    const winners = closed.filter((s) => s.pnl > 0);
    const losers = closed.filter((s) => s.pnl < 0);
    const best = closed.length ? Math.max(...closed.map((s) => s.pnl)) : 0;
    const worst = closed.length ? Math.min(...closed.map((s) => s.pnl)) : 0;
    const avgWin = winners.length ? winners.reduce((a, s) => a + s.pnl, 0) / winners.length : 0;
    const avgLoss = losers.length ? Math.abs(losers.reduce((a, s) => a + s.pnl, 0) / losers.length) : 0;

    const rVals = closed.map((s) => s.audit.rMultiple).filter((r) => r != null);
    const avgR = rVals.length ? rVals.reduce((a, r) => a + r, 0) / rVals.length : 0;

    // avg fees / notional (%)
    const notClosed = closed.filter((s) => s.audit.notional);
    const feeNotionalPct = notClosed.length
      ? (notClosed.reduce((a, s) => a + s.audit.fees / s.audit.notional, 0) / notClosed.length) * 100
      : 0;

    const longClosed = closed.filter((s) => s.dir === "LONG");
    const shortClosed = closed.filter((s) => s.dir === "SHORT");
    const longWins = longClosed.filter((s) => s.pnl > 0);
    const shortWins = shortClosed.filter((s) => s.pnl > 0);
    const longWinRate = longClosed.length ? (longWins.length / longClosed.length) * 100 : 0;
    const shortWinRate = shortClosed.length ? (shortWins.length / shortClosed.length) * 100 : 0;

    return {
      closed, active, pending,
      theoWins, theoWinRate, realWins, realWinRate,
      netPnl, totalFees, matches, matchRate, profitFactor, balance,
      best, worst, avgWin, avgLoss, avgR, feeNotionalPct,
      longClosed, shortClosed, longWins, shortWins, longWinRate, shortWinRate,
    };
  }, [executed]);

  /* ── TCA: arrival slippage over executed closed trades ── */
  const tca = useMemo(() => {
    const closed = executed.filter((s) => s.status === "closed");
    const rows = closed.map((s) => ({ bps: slipBps(s), cost: (s.audit.notional || 0) * (slipBps(s) / 1e4) }));
    const nn = rows.length;
    const avg = nn ? rows.reduce((a, r) => a + r.bps, 0) / nn : 0;
    const beat = nn ? (rows.filter((r) => r.bps < 0).length / nn) * 100 : 0;
    const best = nn ? Math.min(...rows.map((r) => r.bps)) : 0;
    const worst = nn ? Math.max(...rows.map((r) => r.bps)) : 0;
    const cost = rows.reduce((a, r) => a + r.cost, 0);
    return { nn, avg, beat, best, worst, cost };
  }, [executed]);

  /* ── Confidence calibration: does R1's stated confidence predict the outcome? ──
     Bucket closed trades by approval confidence and show realized TP-hit rate per
     band. A well-calibrated filter should win MORE often as confidence rises. */
  const calibration = useMemo(() => {
    const closed = executed.filter((s) => s.status === "closed");
    const buckets = [[60, 70], [70, 80], [80, 90], [90, 101]].map(([lo, hi]) => ({ lo, hi, label: hi > 100 ? `${lo}+` : `${lo}–${hi - 1}`, n: 0, wins: 0 }));
    closed.forEach((s) => { const b = buckets.find((x) => s.confidence >= x.lo && s.confidence < x.hi); if (b) { b.n++; if (s.hit === "TP") b.wins++; } });
    const rows = buckets.map((b) => ({ ...b, wr: b.n ? (b.wins / b.n) * 100 : 0 }));
    const used = rows.filter((b) => b.n > 0);
    const monotonic = used.length > 1 && used.every((b, i) => i === 0 || b.wr >= used[i - 1].wr - 8); // allows small noise
    return { rows, monotonic, any: used.length > 0 };
  }, [executed]);

  /* ── breakdown by asset ── */
  const byAsset = useMemo(() => {
    const map = new Map();
    executed.forEach((s) => {
      if (!map.has(s.coin)) map.set(s.coin, []);
      map.get(s.coin).push(s);
    });
    const rows = [];
    map.forEach((sigs, coin) => {
      const closed = sigs.filter((s) => s.status === "closed");
      const wins = closed.filter((s) => s.pnl > 0);
      const losses = closed.filter((s) => s.pnl < 0);
      const netPnl = closed.reduce((a, s) => a + s.pnl, 0);
      const fees = closed.reduce((a, s) => a + s.audit.fees, 0);
      const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
      const avgPnl = closed.length ? netPnl / closed.length : 0;
      const gw = wins.reduce((a, s) => a + s.pnl, 0);
      const gl = Math.abs(losses.reduce((a, s) => a + s.pnl, 0));
      const pf = gl > 0 ? gw / gl : (gw > 0 ? Infinity : 0);
      rows.push({ coin, signals: sigs.length, wins: wins.length, losses: losses.length, winRate, netPnl, avgPnl, pf, fees });
    });
    return rows.sort((a, b) => b.netPnl - a.netPnl);
  }, [executed]);

  /* ── filtered + sorted operation list ── */
  const filtered = useMemo(() => {
    let list = executed.filter((s) => {
      if (asset !== "All" && s.coin !== asset) return false;
      if (dir !== "All" && s.dir !== dir) return false;
      if (auditStatus !== "All" && s.audit.auditLabel !== auditStatus) return false;
      if (match !== "All" && s.audit.matchLabel !== match) return false;
      return true;
    });
    if (sort === "Newest") list = [...list].sort((a, b) => b.time - a.time);
    else if (sort === "Oldest") list = [...list].sort((a, b) => a.time - b.time);
    else if (sort === "Net PNL") list = [...list].sort((a, b) => (b.pnl ?? -Infinity) - (a.pnl ?? -Infinity));
    return list;
  }, [executed, asset, dir, auditStatus, match, sort]);

  const btnStyle = {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7,
    border: `1px solid ${C.border}`, backgroundColor: C.cardElev, color: C.textMuted,
    fontSize: 11, fontWeight: 700, cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ─────────── 1) HEADER ─────────── */}
      <SectionHeader
        icon={Shield}
        title="Execution audit"
        subtitle="The executed-trade journal — order fills, fees, slippage and real vs. theoretical net P&L"
        right={(
          <button onClick={() => { setRefreshKey((k) => k + 1); }} style={{ ...btnStyle, color: C.purple, borderColor: `${C.purple}40`, backgroundColor: C.purpleBg }}>
            <RefreshCw size={13} /> Refresh
          </button>
        )}
      />

      {/* ─────────── 2) FILTERS ─────────── */}
      <div style={{ ...cardStyle, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <Select label="Asset" value={asset} onChange={setAsset} options={assetOptions} />
        <Select label="Direction" value={dir} onChange={setDir} options={DIRS} />
        <Select label="Audit Status" value={auditStatus} onChange={setAuditStatus} options={AUDIT_STATUSES} />
        <Select label="Audit Match" value={match} onChange={setMatch} options={MATCHES} />
        <Select label="Sort By" value={sort} onChange={setSort} options={SORTS} />
        <span style={{ marginLeft: "auto", alignSelf: "center", fontSize: 10, color: C.textFaint }}>Date range follows the global timeframe filter ↑</span>
      </div>

      {/* ─────────── 3) KPI GRID — audit-specific only (performance/PF/Net PnL live on Overview) ─────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <StatCard
          label="Total Signals" tip="totalSignalsAudit" value={executed.length.toLocaleString()} icon={Target} color={C.purple}
          sub={`${kpi.closed.length} closed · ${kpi.active.length} active · ${kpi.pending.length} pending`}
        />
        <StatCard
          label="Theoretical Win Rate" tip="theoWinRate" value={`${kpi.theoWinRate.toFixed(1)}%`} icon={TrendingUp}
          color={kpi.theoWinRate >= 50 ? C.green : C.red}
          sub={`${kpi.theoWins.length}/${kpi.closed.length} signals (gross)`}
        />
        <StatCard
          label="Executed Win Rate" tip="execWinRate" value={`${kpi.realWinRate.toFixed(1)}%`} icon={Activity}
          color={kpi.realWinRate >= 50 ? C.green : C.red}
          sub={`${kpi.realWins.length}/${kpi.closed.length} trades (net)`}
        />
        <StatCard
          label="Total Fees" tip="totalFees" value={`−$${kpi.totalFees.toFixed(2)}`} icon={Percent} color={C.amber}
          sub="sum of per-trade fees"
        />
        <StatCard
          label="Match Rate" tip="matchRate" value={`${kpi.matchRate.toFixed(1)}%`} icon={Scale}
          color={kpi.matchRate >= 80 ? C.green : C.amber}
          sub={`${kpi.matches.length}/${kpi.closed.length} eligible`}
        />
      </div>

      {/* ─────────── 4) ADVANCED STATISTICS ─────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          Advanced Statistics
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
          <MiniStat tip="bestTrade" label="Best Trade" value={usd(kpi.best)} color={C.green} />
          <MiniStat tip="worstTrade" label="Worst Trade" value={usd(kpi.worst)} color={C.red} />
          <MiniStat tip="avgWinTrade" label="Avg Win" value={`+$${kpi.avgWin.toFixed(2)}`} color={C.green} />
          <MiniStat tip="avgLossTrade" label="Avg Loss" value={`−$${kpi.avgLoss.toFixed(2)}`} color={C.red} />
          <MiniStat tip="expectancyR" label="R-Multiple" value={`${kpi.avgR >= 0 ? "+" : ""}${kpi.avgR.toFixed(2)}R`} color={kpi.avgR >= 0 ? C.green : C.red} sub="avg realized R" />
          <MiniStat tip="feeNotional" label="Avg Fees / Notional" value={`${kpi.feeNotionalPct.toFixed(3)}%`} color={C.amber} />
          <MiniStat tip="longWinRate" label="LONG Win Rate" value={`${kpi.longWinRate.toFixed(1)}%`} color={kpi.longWinRate >= 50 ? C.green : C.red} sub={`${kpi.longWins.length}/${kpi.longClosed.length}`} />
          <MiniStat tip="shortWinRate" label="SHORT Win Rate" value={`${kpi.shortWinRate.toFixed(1)}%`} color={kpi.shortWinRate >= 50 ? C.green : C.red} sub={`${kpi.shortWins.length}/${kpi.shortClosed.length}`} />
        </div>
      </div>

      {/* ─────────── 4b) EXECUTION QUALITY — TCA ─────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
          Execution Quality — TCA
        </div>
        <div style={{ fontSize: 10, color: C.textFaint, marginBottom: 8 }}>
          Realized fill vs. the signal's approval price (arrival). Negative = beat arrival · {tca.nn} closed fills
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
          <MiniStat tip="avgSlippage" label="Avg Arrival Slippage" value={`${tca.avg > 0 ? "+" : tca.avg < 0 ? "−" : ""}${Math.abs(tca.avg).toFixed(1)} bps`} color={tca.avg <= 0 ? C.green : C.red} sub={`est. cost ${usd(-Math.abs(tca.cost))}`} />
          <MiniStat tip="beatArrival" label="Beat Arrival" value={`${tca.beat.toFixed(0)}%`} color={tca.beat >= 50 ? C.green : C.amber} sub="fills better than approval px" />
          <MiniStat tip="bestFill" label="Best Fill" value={tca.nn ? bps(tca.best) : "—"} color={signColor(-tca.best, C)} />
          <MiniStat tip="worstFill" label="Worst Fill" value={tca.nn ? bps(tca.worst) : "—"} color={signColor(-tca.worst, C)} />
        </div>
      </div>

      {/* ─────────── CONFIDENCE CALIBRATION ─────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
          Confidence Calibration
        </div>
        <div style={{ fontSize: 10, color: C.textFaint, marginBottom: 10 }}>
          Realized win rate by Robotín's approval confidence — a calibrated filter wins more as confidence rises.
          {calibration.any && <> Current read: <span style={{ color: calibration.monotonic ? C.green : C.amber, fontWeight: 700 }}>{calibration.monotonic ? "well-calibrated" : "weakly calibrated"}</span>.</>}
        </div>
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 10 }}>
          {calibration.rows.map((b) => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 56, fontSize: 11, fontWeight: 700, color: C.textMuted, ...mono }}>{b.label}%</span>
              <div style={{ flex: 1, height: 16, backgroundColor: C.bg, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${b.n ? b.wr : 0}%`, height: "100%", backgroundColor: b.wr >= 50 ? C.green : C.amber, borderRadius: 4, transition: "width .3s" }} />
              </div>
              <span style={{ width: 44, textAlign: "right", fontSize: 12, fontWeight: 800, color: b.n ? (b.wr >= 50 ? C.green : C.amber) : C.textFaint, ...mono }}>{b.n ? `${Math.round(b.wr)}%` : "—"}</span>
              <span style={{ width: 64, textAlign: "right", fontSize: 11, color: C.textFaint, ...mono }}>{b.n} trade{b.n === 1 ? "" : "s"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────── 5) BREAKDOWN BY ASSET ─────────── */}
      <CollapsibleSection icon={Coins} title="Breakdown by Asset" summary={`${byAsset.length} assets · sorted by net PNL`} persistKey="audit-breakdown">
        {/* one scroll container for BOTH axes so the sticky header actually sticks */}
        <div style={{ overflow: "auto", maxHeight: 480 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={stickyTh}>Asset</th>
                <th style={{ ...stickyTh, textAlign: "right" }}>Signals</th>
                <th style={{ ...stickyTh, textAlign: "right" }}>W/L</th>
                <th style={{ ...stickyTh, textAlign: "right" }}>Win Rate</th>
                <th style={{ ...stickyTh, textAlign: "right" }}>Net PNL</th>
                <th style={{ ...stickyTh, textAlign: "right" }}>Avg PNL</th>
                <th style={{ ...stickyTh, textAlign: "right" }}>PF</th>
                <th style={{ ...stickyTh, textAlign: "right" }}>Fees</th>
              </tr>
            </thead>
            <tbody>
              {byAsset.map((r) => (
                <tr key={r.coin} className="card-hover">
                  <td style={{ ...tdStyle, fontWeight: 800 }}>{r.coin}</td>
                  <td style={{ ...tdStyle, textAlign: "right", ...mono }}>{r.signals}</td>
                  <td style={{ ...tdStyle, textAlign: "right", ...mono }}>
                    <span style={{ color: C.green }}>{r.wins}</span>
                    <span style={{ color: C.textFaint }}> / </span>
                    <span style={{ color: C.red }}>{r.losses}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", ...mono, color: r.winRate >= 50 ? C.green : C.red }}>{r.winRate.toFixed(0)}%</td>
                  <td style={{ ...tdStyle, textAlign: "right", ...mono, fontWeight: 800, color: r.netPnl >= 0 ? C.green : C.red }}>{usd(r.netPnl)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", ...mono, color: r.avgPnl >= 0 ? C.green : C.red }}>{usd(r.avgPnl)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", ...mono, color: C.amber }}>{pfFmt(r.pf)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", ...mono, color: C.textMuted }}>−${r.fees.toFixed(2)}</td>
                </tr>
              ))}
              {byAsset.length === 0 && (
                <tr><td style={{ ...tdStyle, color: C.textMuted }} colSpan={8}>No executed trades.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* ─────────── 6) OPERATION DETAILS — dense executions journal (collapsible + internal scroll) ─────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div onClick={() => setOpsOpen((o) => !o)} role="button" tabIndex={0} aria-expanded={opsOpen}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpsOpen((o) => !o); } }}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <ChevronDown size={15} color={C.textMuted} style={{ transform: opsOpen ? "none" : "rotate(-90deg)", transition: "transform 0.15s" }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Operation Details</span>
          <span style={{ fontSize: 11, color: C.textMuted }}>{filtered.length} signals · click a row for the full audit</span>
        </div>
        {opsOpen && (
          <SignalTable
            signals={filtered}
            openId={openId}
            onToggle={(id) => setOpenId(openId === id ? null : id)}
            lastCloseFor={(s) => lastCloseByCoin[s.coin] ?? null}
            audit
            viewId="executions"
            exportName="tradethlon-executions"
            maxHeight={560}
          />
        )}
      </div>
    </div>
  );
};

const stickyTh = { ...thStyle, position: "sticky", top: 0, backgroundColor: C.card, zIndex: 1 };

export { ExecutionAudit };
