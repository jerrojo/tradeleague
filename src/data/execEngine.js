import { coinCandles, coinSignals, ROBOTIN_COINS } from "./robotin";

/* ═══════════════════════ EXECUTION ENGINE (re-simulation) ═══════════════════════
   Re-runs every historical signal through a configurable execution model — scaled
   take-profits (L1·L2·L3 + a trailing Runner), position sizing, fees and a fixed-
   or-compounding account — and returns per-signal legs plus portfolio aggregates.
   Pure + deterministic: same inputs → same output. Built on the same signal engine
   as the rest of the platform, so it stays consistent. */

const round = (x) => Math.round(x * 1e6) / 1e6;

/* Resolve one leg against the candles from the fill index: which comes first,
   the target or the stop? Returns the exit price, bar index and which was hit. */
function resolveLeg(candles, fromIdx, dir, target, sl) {
  for (let i = fromIdx; i < candles.length; i++) {
    const c = candles[i];
    const hitT = dir === "LONG" ? c.high >= target : c.low <= target;
    const hitS = dir === "LONG" ? c.low <= sl : c.high >= sl;
    if (hitS) return { exit: sl, idx: i, hit: "SL" };        // stop is conservative — checked first
    if (hitT) return { exit: target, idx: i, hit: "TP" };
  }
  return { exit: candles[candles.length - 1].close, idx: candles.length - 1, hit: "OPEN" };
}

const DEFAULT_CONFIG = {
  startDate: null, endDate: null, asset: "All", direction: "All", outcome: "All", sort: "Newest First",
  legsPct: { L1: 25, L2: 25, L3: 25, RUN: 25 }, trailing: true,
  sizing: "margin", margin: 1000, leverage: 1, fee: 0.04,
  capital: 10000, capitalMode: "fixed", maxConcurrent: 5,
};

export function simulate(userConfig = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...userConfig, legsPct: { ...DEFAULT_CONFIG.legsPct, ...(userConfig.legsPct || {}) } };
  const startTs = cfg.startDate ? new Date(cfg.startDate + "T00:00:00").getTime() / 1000 : -Infinity;
  const endTs = cfg.endDate ? new Date(cfg.endDate + "T23:59:59").getTime() / 1000 : Infinity;

  // gather all signals (carry their coin's candles for resolution)
  let universe = ROBOTIN_COINS.flatMap((coin) => {
    const candles = coinCandles(coin);
    return coinSignals(coin, candles).map((s) => ({ s, candles }));
  }).filter(({ s }) => s.time >= startTs && s.time <= endTs
    && (cfg.asset === "All" || s.coin === cfg.asset)
    && (cfg.direction === "All" || s.dir === cfg.direction));

  const rejected = universe.filter(({ s }) => !s.approved).length;
  const approved = universe.filter(({ s }) => s.approved);

  const legPctArr = [cfg.legsPct.L1, cfg.legsPct.L2, cfg.legsPct.L3, cfg.legsPct.RUN].map((p) => p / 100);
  const rows = [];

  approved.forEach(({ s, candles }) => {
    const sign = s.dir === "LONG" ? 1 : -1;
    const entry = s.entry;
    const sl = s.sl;
    const tpFinal = s.tp3; // furthest target = Runner (L4)
    // 4 evenly-spaced levels between entry and the final TP
    const levels = [1, 2, 3, 4].map((k) => round(entry + sign * (tpFinal - entry) * (k / 4)));
    const filled = s.status === "active" || s.status === "closed";
    const noEntry = s.status === "pending" || s.status === "expired" || !filled;
    const fromIdx = s.activeIdx ?? s.entryIdx;

    // Margin sizing: fixed notional = margin × leverage. Risk sizing: size so the
    // stop-out loses ~1% of capital (notional = 1% capital / stop-distance%).
    const stopDistPct = Math.abs(entry - sl) / entry;
    const notional = cfg.sizing === "risk"
      ? (stopDistPct > 0 ? (cfg.capital * 0.01) / stopDistPct : cfg.margin * cfg.leverage)
      : cfg.margin * cfg.leverage;
    const legs = ["L1", "L2", "L3", "Runner"].map((name, i) => {
      const target = levels[i];
      const pct = legPctArr[i];
      const legNotional = notional * pct;
      if (noEntry) return { name, pct, target, exit: null, hit: "NO ENTRY", idx: null, pnl: 0, pnlPct: 0 };
      // Runner uses trailing → if trailing on, the runner rides to the final TP/last close instead of a fixed mid level
      const r = resolveLeg(candles, fromIdx, s.dir, name === "Runner" && cfg.trailing ? tpFinal : target, sl);
      const priceRet = sign * (r.exit - entry) / entry;
      const gross = legNotional * priceRet;
      const fee$ = legNotional * (cfg.fee / 100) * 2; // entry + exit
      const pnl = round(gross - fee$);
      return { name, pct, target, exit: r.exit, hit: r.hit, idx: r.idx, pnl, pnlPct: round(priceRet * 100), legNotional };
    });

    const netPnl = noEntry ? 0 : round(legs.reduce((a, l) => a + l.pnl, 0));
    const grossPct = noEntry || notional <= 0 ? 0 : round((netPnl / notional) * 100);
    const reachedL = [false, false, false]; // L1, L2, L3 reached (price hit target)
    if (!noEntry) {
      legs.forEach((l, i) => { if (i < 3 && (l.hit === "TP")) reachedL[i] = true; });
      // a higher level reached implies lower ones reached
      if (reachedL[2]) { reachedL[1] = true; reachedL[0] = true; }
      else if (reachedL[1]) reachedL[0] = true;
    }
    const runnerTrailed = !noEntry && cfg.trailing && legs[3].hit === "TP";
    const exitIdx = noEntry ? null : Math.max(...legs.map((l) => l.idx ?? 0));
    // duration from real candle timestamps (not bar-index delta)
    const durationH = noEntry || !candles[exitIdx] || !candles[fromIdx] ? null : (candles[exitIdx].time - candles[fromIdx].time) / 3600;

    rows.push({
      id: s.id, coin: s.coin, pair: s.pair, dir: s.dir, time: s.time, trader: s.trader, isBot: s.isBot,
      confidence: s.confidence, setup: s.setup, tf: s.tf, tag: s.tag, reasoning: s.reasoning,
      entry, sl, tpFinal, levels, signalPx: s.signalPx,
      entryIdx: s.entryIdx, fromIdx, exitIdx, exitTime: exitIdx != null && candles[exitIdx] ? candles[exitIdx].time : null,
      noEntry, filled, legs, netPnl, grossPct, reachedL, runnerTrailed, durationH,
      outcome: noEntry ? "NO ENTRY" : netPnl >= 0 ? "WIN" : "LOSS",
      notional,
    });
  });

  // ── filter by outcome + sort ──
  let out = rows;
  if (cfg.outcome === "Wins") out = out.filter((r) => r.outcome === "WIN");
  else if (cfg.outcome === "Losses") out = out.filter((r) => r.outcome === "LOSS");
  else if (cfg.outcome === "No entry") out = out.filter((r) => r.noEntry);
  if (cfg.sort === "Newest First") out = [...out].sort((a, b) => b.time - a.time);
  else if (cfg.sort === "Oldest First") out = [...out].sort((a, b) => a.time - b.time);
  else if (cfg.sort === "Best PnL") out = [...out].sort((a, b) => b.netPnl - a.netPnl);
  else if (cfg.sort === "Worst PnL") out = [...out].sort((a, b) => a.netPnl - b.netPnl);

  // ── aggregates (over filled+closed signals) ──
  const closed = rows.filter((r) => !r.noEntry);
  const wins = closed.filter((r) => r.netPnl > 0);
  const losses = closed.filter((r) => r.netPnl < 0);
  const be = closed.filter((r) => r.netPnl === 0);
  const netPnl = round(closed.reduce((a, r) => a + r.netPnl, 0));
  const grossWin = closed.filter((r) => r.netPnl > 0).reduce((a, r) => a + r.netPnl, 0);
  const grossLoss = Math.abs(closed.filter((r) => r.netPnl < 0).reduce((a, r) => a + r.netPnl, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? Infinity : 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const expectancy = closed.length ? netPnl / closed.length : 0;

  // capital curve (chronological) + max drawdown + consecutive losses
  const chrono = [...closed].sort((a, b) => a.time - b.time);
  let bal = cfg.capital, peak = cfg.capital, maxDD = 0, maxDDpct = 0, lossRun = 0, maxLossRun = 0;
  const curve = [{ i: 0, t: null, balance: round(bal) }];
  const retSeries = [];
  chrono.forEach((r, i) => {
    const pnl = cfg.capitalMode === "compound" ? r.netPnl * (bal / cfg.capital) : r.netPnl;
    if (bal > 0) retSeries.push(pnl / bal);
    bal += pnl;
    peak = Math.max(peak, bal);
    maxDD = Math.min(maxDD, bal - peak);
    maxDDpct = Math.min(maxDDpct, peak > 0 ? ((bal - peak) / peak) * 100 : 0);
    if (r.netPnl < 0) { lossRun++; maxLossRun = Math.max(maxLossRun, lossRun); } else lossRun = 0;
    curve.push({ i: i + 1, t: r.time, balance: round(bal) });
  });
  const finalBal = round(bal);
  const totalReturn = ((finalBal - cfg.capital) / cfg.capital) * 100;

  // reach rates / runner / duration / R / exposure / concurrency
  const reach = (k) => (closed.length ? (closed.filter((r) => r.reachedL[k]).length / closed.length) * 100 : 0);
  const runnerRate = closed.length ? (closed.filter((r) => r.runnerTrailed).length / closed.length) * 100 : 0;
  const avgDur = closed.length ? closed.reduce((a, r) => a + (r.durationH || 0), 0) / closed.length : 0;
  const rVals = closed.map((r) => { const risk = Math.abs(r.entry - r.sl); return risk > 0 && r.notional > 0 ? (r.netPnl / r.notional) / (risk / r.entry) : 0; });
  const avgR = rVals.length ? rVals.reduce((a, v) => a + v, 0) / rVals.length : 0;
  const mean = retSeries.length ? retSeries.reduce((a, r) => a + r, 0) / retSeries.length : 0;
  const sd = retSeries.length ? Math.sqrt(retSeries.reduce((a, r) => a + (r - mean) ** 2, 0) / retSeries.length) : 0;
  const sharpe = sd > 0 ? Math.max(0, Math.min(4, (mean / sd) * Math.sqrt(retSeries.length))) : 0;
  // peak concurrency: how many trades overlapped in time at once
  const intervals = closed.filter((r) => r.exitTime).map((r) => [r.time, r.exitTime]);
  let peakConc = intervals.length ? 1 : 0;
  intervals.forEach(([s0]) => { const c = intervals.filter(([a, b]) => s0 >= a && s0 <= b).length; peakConc = Math.max(peakConc, c); });
  const avgConc = intervals.length ? intervals.reduce((acc, [s0]) => acc + intervals.filter(([a, b]) => s0 >= a && s0 <= b).length, 0) / intervals.length : 0;
  // exposure: union of in-market time / total span
  const span = chrono.length ? (Math.max(...chrono.map((r) => r.exitTime || r.time)) - Math.min(...chrono.map((r) => r.time))) : 1;
  const inMarket = intervals.reduce((a, [s0, e]) => a + (e - s0), 0);
  const exposure = span > 0 ? Math.min(100, (inMarket / (span * Math.max(1, avgConc || 1))) * 100) : 0;
  const days = span / 86400 || 1;
  const cagr = (Math.pow(Math.max(0.0001, finalBal / cfg.capital), 365 / Math.max(1, days)) - 1) * 100;

  const kpi = {
    netPnl, totalReturnPct: round(totalReturn), perTrade: round(expectancy), finalBal,
    winRate: round(winRate), wins: wins.length, losses: losses.length, be: be.length,
    profitFactor, avgWinPct: round(wins.length ? wins.reduce((a, r) => a + r.grossPct, 0) / wins.length : 0),
    avgLossPct: round(losses.length ? losses.reduce((a, r) => a + r.grossPct, 0) / losses.length : 0),
    signals: approved.length, entries: closed.length, noEntry: approved.length - closed.length, rejected,
    reachL1: round(reach(0)), reachL2: round(reach(1)), reachL3: round(reach(2)), runnerRate: round(runnerRate),
    expectancyPct: round(closed.length ? closed.reduce((a, r) => a + r.grossPct, 0) / closed.length : 0),
    sharpe: round(sharpe), maxDD: round(maxDD), maxDDpct: round(maxDDpct), cagr: round(cagr),
    maxLossRun, avgR: round(avgR), peakConc, avgConc: round(avgConc * 10) / 10,
    exposure: round(exposure), avgDur: round(avgDur * 10) / 10, invalid: 0, open: closed.filter((r) => r.legs.some((l) => l.hit === "OPEN")).length,
    capital: cfg.capital,
  };

  return { rows: out, all: rows, kpi, curve };
}

export { DEFAULT_CONFIG };
