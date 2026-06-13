/* ═══════════════════════════════════════════════════════════════════════════
   TRADE SIMULATION ENGINE — counterfactual attribution
   ---------------------------------------------------------------------------
   Pure, side-effect-free functions. Given a trader's real trade history and a
   "scenario" (a set of rules to turn on/off), it produces the filtered/adjusted
   trade set, recomputes performance metrics, and rebuilds the equity curve.

   Design principle (honest & auditable): a scenario can only do things that are
   derivable from real trades — exclude or isolate trades, cap leverage
   (proportional scaling), or filter by quality. No speculative "what if they
   moved their stop" guesses. Every number a regulator could re-derive.
   ═══════════════════════════════════════════════════════════════════════════ */

export const STARTING_CAPITAL = 10000;

export const SESSIONS = ["ASIA", "LONDON", "NY"];
export const STYLES = ["SCALP", "INTRA", "SWING", "POSITION"];

export const DEFAULT_SCENARIO = {
  sessions: { ASIA: true, LONDON: true, NY: true },
  styles: { SCALP: true, INTRA: true, SWING: true, POSITION: true },
  leverageCap: null,        // cap leverage at N× (scales P&L proportionally). null = off
  minRR: 0,                 // require planned reward:risk ≥ this. 0 = off
  maxAdversePct: null,      // skip "low-quality" entries whose MAE was worse than this %. null = off
  isolateTopPct: 100,       // keep only the best X% of trades by R-multiple. 100 = off
  removeBestN: 0,           // drop the N best trades (fragility / luck test). 0 = off
  excludeUnlabeled: false,  // drop trades with no setup_tag (ML-invisible)
};

const levNum = (lev) => {
  const n = parseInt(String(lev), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

const plannedRR = (t) => {
  const risk = Math.abs(t.entry - t.sl);
  const reward = Math.abs((t.tp1 ?? t.tp ?? t.entry) - t.entry);
  return risk > 0 ? reward / risk : 0;
};

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

/* Chronological sort key from a "Mar 12, 14:30" style date string. */
export const tradeSortKey = (t) => {
  const m = /(\w{3})\s+(\d+),?\s*(\d+)?:?(\d+)?/.exec(t.date || "");
  if (!m) return t.id || 0;
  const [, mon, day, hh = "0", mm = "0"] = m;
  return (MONTHS[mon] ?? 0) * 1e8 + Number(day) * 1e5 + Number(hh) * 1e2 + Number(mm);
};

const sortedChrono = (trades) => [...trades].sort((a, b) => tradeSortKey(a) - tradeSortKey(b));

/* Apply a leverage cap to a single trade, scaling its monetary result.
   R-multiple is price-based and leverage-independent, so it is unchanged. */
const capLeverage = (t, cap) => {
  if (cap == null) return t;
  const cur = levNum(t.leverage);
  if (cur <= cap) return t;
  const factor = cap / cur;
  return {
    ...t,
    leverage: `${cap}x`,
    leverageCapped: true,
    pnl: Math.round(t.pnl * factor),
    pnlPct: Math.round((t.pnlPct ?? 0) * factor * 100) / 100,
    fees: Math.round((t.fees ?? 0) * factor * 100) / 100,
  };
};

/* ── Core: turn a scenario into a concrete trade set ──────────────────────── */
export function applyScenario(history, scenario = DEFAULT_SCENARIO) {
  const s = { ...DEFAULT_SCENARIO, ...scenario,
    sessions: { ...DEFAULT_SCENARIO.sessions, ...(scenario.sessions || {}) },
    styles: { ...DEFAULT_SCENARIO.styles, ...(scenario.styles || {}) } };

  let kept = history.filter((t) => {
    if (t.session && s.sessions[t.session] === false) return false;
    if (t.style && s.styles[t.style] === false) return false;
    if (s.excludeUnlabeled && !t.setupTag) return false;
    if (s.minRR > 0 && plannedRR(t) < s.minRR) return false;
    if (s.maxAdversePct != null && Math.abs(t.maePct ?? 0) > s.maxAdversePct) return false;
    return true;
  });

  // behavioral transform: leverage cap
  kept = kept.map((t) => capLeverage(t, s.leverageCap));

  // isolate the best X% by R-multiple
  if (s.isolateTopPct < 100 && kept.length) {
    const ranked = [...kept].sort((a, b) => (b.rMultiple ?? 0) - (a.rMultiple ?? 0));
    const n = Math.max(1, Math.round((s.isolateTopPct / 100) * ranked.length));
    const keepIds = new Set(ranked.slice(0, n).map((t) => t.id));
    kept = kept.filter((t) => keepIds.has(t.id));
  }

  // drop the N best trades (fragility test)
  if (s.removeBestN > 0 && kept.length) {
    const ranked = [...kept].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
    const dropIds = new Set(ranked.slice(0, s.removeBestN).map((t) => t.id));
    kept = kept.filter((t) => !dropIds.has(t.id));
  }

  return kept;
}

/* ── Metrics over a concrete trade set ────────────────────────────────────── */
export function computeMetrics(trades) {
  const n = trades.length;
  if (!n) {
    return { count: 0, wins: 0, losses: 0, breakeven: 0, winRate: 0, profitFactor: 0,
      totalPnl: 0, expectancyR: 0, avgR: 0, maxDrawdownPct: 0, avgMae: 0, avgMfe: 0,
      rSharpe: 0, grossWin: 0, grossLoss: 0, totalRoiPct: 0, compoundRoiPct: 0, calmar: 0 };
  }
  let wins = 0, losses = 0, breakeven = 0, grossWin = 0, grossLoss = 0, totalPnl = 0, maeSum = 0, mfeSum = 0;
  const rs = [];
  for (const t of trades) {
    const out = t.outcome || (t.pnl > 0 ? "WIN" : t.pnl < 0 ? "LOSS" : "BREAKEVEN");
    if (out === "WIN") wins++; else if (out === "LOSS") losses++; else breakeven++;
    if (t.pnl > 0) grossWin += t.pnl; else grossLoss += Math.abs(t.pnl);
    totalPnl += t.pnl;
    maeSum += t.maePct ?? 0;
    mfeSum += t.mfePct ?? 0;
    rs.push(t.rMultiple ?? 0);
  }
  const decided = wins + losses;
  const avgR = rs.reduce((a, b) => a + b, 0) / n;
  const variance = rs.reduce((a, b) => a + (b - avgR) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  // max drawdown + compound ROI from the chronological equity path
  // (Total ROI = simple sum of per-trade % returns; Compound ROI = chained — interest on interest)
  let equity = STARTING_CAPITAL, peak = STARTING_CAPITAL, maxDD = 0;
  let totalRoiPct = 0, compoundMult = 1;
  for (const t of sortedChrono(trades)) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    const dd = ((equity - peak) / peak) * 100;
    maxDD = Math.min(maxDD, dd);
    totalRoiPct += t.pnlPct ?? 0;
    compoundMult *= 1 + (t.pnlPct ?? 0) / 100;
  }
  const compoundRoiPct = (compoundMult - 1) * 100;
  // Calmar = compound return ÷ worst drawdown (return earned per unit of pain)
  const calmar = maxDD < 0 ? compoundRoiPct / Math.abs(maxDD) : Infinity;

  return {
    count: n, wins, losses, breakeven,
    winRate: decided ? Math.round((wins / decided) * 1000) / 10 : 0,
    profitFactor: grossLoss > 0 ? Math.round((grossWin / grossLoss) * 100) / 100 : Infinity,
    totalPnl: Math.round(totalPnl),
    expectancyR: Math.round(avgR * 100) / 100,
    avgR: Math.round(avgR * 100) / 100,
    maxDrawdownPct: Math.round(maxDD * 10) / 10,
    avgMae: Math.round((maeSum / n) * 100) / 100,
    avgMfe: Math.round((mfeSum / n) * 100) / 100,
    rSharpe: std > 0 ? Math.round((avgR / std) * 100) / 100 : 0,
    grossWin: Math.round(grossWin), grossLoss: Math.round(grossLoss),
    totalRoiPct: Math.round(totalRoiPct * 10) / 10,
    compoundRoiPct: Math.round(compoundRoiPct * 10) / 10,
    calmar: calmar === Infinity ? Infinity : Math.round(calmar * 100) / 100,
  };
}

/* ── Leverage basis: ROI normal (de-levered) vs ROI apalancado ──────────────
   The metrics catalog asks every return metric to have a normal & a leveraged
   variant. `delever` re-expresses each trade as if it were taken at 1× — P&L,
   %, fees scale down; R-multiple is price-based so it is unchanged. */
export const delever = (trades) => trades.map((t) => capLeverage(t, 1));

/* ── Equity curve (cumulative P&L over starting capital), chronological ───── */
export function buildEquity(trades, startingCapital = STARTING_CAPITAL) {
  let equity = startingCapital, peak = startingCapital;
  const out = [{ i: 0, label: "Start", equity, pnl: 0, retPct: 0, drawdown: 0 }];
  sortedChrono(trades).forEach((t, idx) => {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    out.push({
      i: idx + 1,
      label: t.date,
      pair: t.pair,
      equity: Math.round(equity),
      pnl: t.pnl,
      retPct: Math.round(((equity - startingCapital) / startingCapital) * 1000) / 10,
      drawdown: Math.round(((equity - peak) / peak) * 1000) / 10,
    });
  });
  return out;
}

/* ── Merge baseline + scenario equity onto one timeline for overlay charts ── */
export function mergedEquity(baselineTrades, scenarioTrades) {
  const a = buildEquity(baselineTrades);
  const b = buildEquity(scenarioTrades);
  const len = Math.max(a.length, b.length);
  const out = [];
  for (let i = 0; i < len; i++) {
    out.push({
      i,
      baseline: a[i] ? a[i].retPct : (a.length ? a[a.length - 1].retPct : 0),
      scenario: b[i] ? b[i].retPct : (b.length ? b[b.length - 1].retPct : 0),
    });
  }
  return out;
}

/* ── Auto-generated plain-language insight comparing baseline vs scenario ─── */
export function describeScenario(base, sim, scenario) {
  const out = [];
  const pnlDelta = sim.totalPnl - base.totalPnl;
  const pnlPctChange = base.totalPnl !== 0 ? Math.round((pnlDelta / Math.abs(base.totalPnl)) * 100) : 0;

  if (scenario.removeBestN > 0) {
    const erased = base.totalPnl !== 0 ? Math.round((pnlDelta / -Math.abs(base.totalPnl)) * 100) : 0;
    if (erased >= 50) out.push(`Removing the top ${scenario.removeBestN} trade${scenario.removeBestN > 1 ? "s" : ""} erases ${erased}% of total P&L — this edge is concentrated in a few outliers, not systematic. A fragile track record.`);
    else if (erased > 0) out.push(`Removing the top ${scenario.removeBestN} trade${scenario.removeBestN > 1 ? "s" : ""} costs ${erased}% of P&L — the rest of the book still carries weight, a sign of a more robust process.`);
  }
  if (scenario.isolateTopPct < 100) {
    out.push(`Isolating the best ${scenario.isolateTopPct}% of trades shows the ceiling of this trader's edge: ${sim.profitFactor === Infinity ? "∞" : sim.profitFactor} profit factor at ${sim.winRate}% win rate.`);
  }
  const offSessions = SESSIONS.filter((s) => scenario.sessions[s] === false);
  if (offSessions.length) out.push(`Excluding ${offSessions.join(" & ")} session${offSessions.length > 1 ? "s" : ""}: ${pnlPctChange >= 0 ? "+" : ""}${pnlPctChange}% P&L. ${pnlPctChange > 5 ? "Those sessions were bleeding money — a fixable leak." : pnlPctChange < -5 ? "Those sessions were a real source of edge." : "Roughly neutral."}`);
  const offStyles = STYLES.filter((s) => scenario.styles[s] === false);
  if (offStyles.length) out.push(`Without ${offStyles.join(" / ")} trades: win rate ${sim.winRate}% (was ${base.winRate}%), expectancy ${sim.expectancyR >= 0 ? "+" : ""}${sim.expectancyR}R.`);
  if (scenario.leverageCap != null) out.push(`Capping leverage at ${scenario.leverageCap}×: P&L ${pnlPctChange >= 0 ? "+" : ""}${pnlPctChange}%, but max drawdown improves from ${base.maxDrawdownPct}% to ${sim.maxDrawdownPct}%. ${Math.abs(pnlPctChange) > 30 ? "Much of the return was leverage, not edge." : "Edge survives lower leverage — genuine skill."}`);
  if (scenario.maxAdversePct != null) out.push(`Skipping entries that ran worse than −${scenario.maxAdversePct}% before resolving (low-quality fills) keeps ${sim.count}/${base.count} trades and moves expectancy to ${sim.expectancyR >= 0 ? "+" : ""}${sim.expectancyR}R.`);
  if (scenario.excludeUnlabeled) out.push(`Dropping ML-unlabeled trades leaves ${sim.count} of ${base.count} — the share you can actually train and audit on.`);

  if (!out.length) out.push("All rules are at baseline. Toggle a rule to see how this trader's track record would change.");
  return out;
}

/* Is a scenario different from baseline? */
export function isModified(scenario) {
  const s = scenario;
  return SESSIONS.some((k) => s.sessions[k] === false)
    || STYLES.some((k) => s.styles[k] === false)
    || s.leverageCap != null || s.minRR > 0 || s.maxAdversePct != null
    || s.isolateTopPct < 100 || s.removeBestN > 0 || s.excludeUnlabeled;
}
