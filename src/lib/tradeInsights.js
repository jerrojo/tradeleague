/* ═══════════════════════════════════════════════════════════════════════════
   TRADE INTELLIGENCE — why a trade is good or bad, and per-coin sentiment
   ---------------------------------------------------------------------------
   Pure functions over the per-trade Vista D schema. The goal is to turn raw
   trades into *explanations*: which plays were the best, why they worked, what
   the lesson is — and how every trader is positioned across each market.
   ═══════════════════════════════════════════════════════════════════════════ */

const lev = (s) => { const n = parseInt(String(s), 10); return Number.isFinite(n) ? n : 1; };
export const coinOf = (pair) => String(pair || "").split("/")[0].toUpperCase();

/* Realized move (% price, not leveraged) and how much of the favorable swing
   (MFE) the trader actually captured. */
const realizedMovePct = (t) => {
  if (t.entry && t.exit) return Math.abs((t.exit - t.entry) / t.entry) * 100;
  const L = lev(t.leverage);
  return Math.abs((t.pnlPct ?? 0) / (L || 1));
};
const captureRatio = (t) => {
  const mfe = Math.abs(t.mfePct ?? 0);
  if (mfe < 0.01) return 0;
  return Math.min(1.2, realizedMovePct(t) / mfe);
};

/* ── Quality score 0–100: how *well-played* a trade was, independent of size.
   A big win on a sloppy entry scores lower than a clean, disciplined one. ── */
export function scoreTradeQuality(t) {
  const r = t.rMultiple ?? 0;
  const rScore = Math.max(0, Math.min(1, (r + 1) / 5)) * 35;          // 35: R captured (−1R→0, +4R→full)
  const mae = Math.abs(t.maePct ?? 0);
  const entryScore = Math.max(0, 1 - mae / 1.5) * 25;                 // 25: entry timing (low adverse excursion)
  const capScore = captureRatio(t) / 1.2 * 20;                        // 20: efficiency (captured the move)
  const setupScore = t.setupTag ? 12 : 0;                             // 12: repeatable, labeled setup
  const beScore = t.outcome === "BREAKEVEN" ? 4 : 0;                  // small credit for risk-free management
  const winScore = t.outcome === "WIN" ? 8 : 0;                       // 8: actually closed green
  return Math.round(Math.max(0, Math.min(100, rScore + entryScore + capScore + setupScore + beScore + winScore)));
}

export const qualityLabel = (s) => s >= 80 ? "Textbook" : s >= 65 ? "Strong" : s >= 45 ? "Decent" : s >= 30 ? "Sloppy" : "Poor";

/* ── Plain-language reasons a winning trade worked ── */
export function explainWin(t) {
  const reasons = [];
  const r = t.rMultiple ?? 0;
  const mae = Math.abs(t.maePct ?? 0);
  const cap = captureRatio(t);
  if (r >= 3) reasons.push({ tag: "Big R", text: `Captured ${r.toFixed(1)}R — a high reward for the risk taken${t.tpReached && t.tpReached !== "NONE" ? `, ran all the way to ${t.tpReached}` : ""}.` });
  else if (r >= 1.5) reasons.push({ tag: "Solid R", text: `Returned ${r.toFixed(1)}× the risk — a clean, profitable ratio.` });
  if (mae <= 0.4) reasons.push({ tag: "Clean entry", text: `Price barely moved against it (MAE −${mae.toFixed(1)}%) — near-perfect timing into the position.` });
  else if (mae <= 0.8) reasons.push({ tag: "Good entry", text: `Modest heat before it worked (MAE −${mae.toFixed(1)}%) — a patient entry.` });
  if (cap >= 0.85) reasons.push({ tag: "Let it run", text: `Captured ${Math.round(cap * 100)}% of the favorable move — didn't cut the winner early.` });
  if (t.setupTag) reasons.push({ tag: "Repeatable", text: `Labeled ${t.setupTag.split("_").slice(0, 3).join(" · ")} setup — a pattern that can be traded again, not a one-off.` });
  if (lev(t.leverage) >= 8) reasons.push({ tag: "High leverage", text: `Amplified with ${t.leverage} — magnified a clean move (and would have magnified a loss).` });
  if (!reasons.length) reasons.push({ tag: "Win", text: "Closed in profit, though without a standout edge in the metrics." });
  return reasons;
}

export function explainLoss(t) {
  const reasons = [];
  const mae = Math.abs(t.maePct ?? 0);
  if (t.exitReason === "SL_HIT" && mae >= 0.9) reasons.push({ tag: "Late entry", text: `Price ran −${mae.toFixed(1)}% against it almost immediately before stopping out — likely chased the entry.` });
  else if (t.exitReason === "SL_HIT") reasons.push({ tag: "Stopped out", text: "Hit the stop loss — the thesis was invalidated and risk was cut as planned." });
  if (t.exitReason === "MANUAL") reasons.push({ tag: "Manual exit", text: "Closed by hand rather than at a level — discretionary exits are where discipline slips." });
  if (!t.setupTag) reasons.push({ tag: "No setup", text: "Unlabeled setup — not part of a repeatable, auditable edge." });
  if (lev(t.leverage) >= 8) reasons.push({ tag: "Over-leveraged", text: `Taken with ${t.leverage} — leverage turned a small adverse move into a real loss.` });
  if (Math.abs(t.mfePct ?? 0) >= mae * 1.5 && t.mfePct > 0) reasons.push({ tag: "Gave it back", text: `Went +${Math.abs(t.mfePct).toFixed(1)}% in favor first, then reversed into a loss — profit left on the table.` });
  if (!reasons.length) reasons.push({ tag: "Loss", text: "A losing trade without an obvious process error — part of normal variance." });
  return reasons;
}

/* ── A short, actionable takeaway ── */
export function lessonFor(t) {
  const win = t.outcome === "WIN";
  const mae = Math.abs(t.maePct ?? 0);
  const cap = captureRatio(t);
  if (win && mae <= 0.4 && t.setupTag) return "Replicate this: a labeled setup entered with almost no adverse heat is the trader's repeatable A+ play.";
  if (win && cap < 0.6) return "Won, but left most of the move on the table — work on trailing stops to let winners run.";
  if (win && lev(t.leverage) >= 8) return "Profitable, but the size came from leverage. Check whether the edge survives at lower leverage in the Trade Lab.";
  if (!win && mae >= 0.9) return "The entry was late — price never gave room. Wait for a pullback or confirmation before committing.";
  if (!win && !t.setupTag) return "Skip un-tagged, discretionary trades — they aren't part of a measurable edge.";
  if (!win) return "A clean, rule-based loss. The process held; this is the cost of doing business.";
  return "A solid, unremarkable trade — exactly the kind of consistency that compounds.";
}

/* ── Rank best / worst plays across a flat trade list (each carries .trader) ── */
export function topTrades(trades, n = 8) {
  return [...trades].filter(t => t.pnl > 0)
    .sort((a, b) => b.pnl - a.pnl || scoreTradeQuality(b) - scoreTradeQuality(a))
    .slice(0, n)
    .map(t => ({ ...t, quality: scoreTradeQuality(t), reasons: explainWin(t), lesson: lessonFor(t) }));
}
export function worstTrades(trades, n = 6) {
  return [...trades].filter(t => t.pnl < 0)
    .sort((a, b) => a.pnl - b.pnl)
    .slice(0, n)
    .map(t => ({ ...t, quality: scoreTradeQuality(t), reasons: explainLoss(t), lesson: lessonFor(t) }));
}
/* Highest-quality plays regardless of P&L size — "best executed", not "biggest". */
export function bestExecuted(trades, n = 6) {
  return [...trades]
    .map(t => ({ ...t, quality: scoreTradeQuality(t) }))
    .sort((a, b) => b.quality - a.quality)
    .slice(0, n)
    .map(t => ({ ...t, reasons: t.outcome === "LOSS" ? explainLoss(t) : explainWin(t), lesson: lessonFor(t) }));
}

/* ── Per-coin sentiment & positioning across every trader's history ──
   smcMap: { BTC: { bias, confluence, risk, price, change }, ... } (optional). ── */
export function coinSentiment(trades, smcMap = {}) {
  const by = {};
  for (const t of trades) {
    const c = coinOf(t.pair);
    if (!c) continue;
    const m = by[c] || (by[c] = { coin: c, trades: 0, longs: 0, shorts: 0, wins: 0, decided: 0, pnl: 0, traders: {} });
    m.trades++;
    if (t.type === "LONG") m.longs++; else if (t.type === "SHORT") m.shorts++;
    if (t.outcome === "WIN") { m.wins++; m.decided++; } else if (t.outcome === "LOSS") m.decided++;
    m.pnl += t.pnl;
    if (t.trader) m.traders[t.trader] = (m.traders[t.trader] || 0) + t.pnl;
  }
  return Object.values(by).map((m) => {
    const longPct = m.trades ? Math.round((m.longs / m.trades) * 100) : 50;
    const winRate = m.decided ? Math.round((m.wins / m.decided) * 100) : 0;
    const smc = smcMap[m.coin] || {};
    // sentiment −100 (max bearish) … +100 (max bullish): blend positioning, win rate edge, SMC bias
    const posBias = (longPct - 50) * 1.4;
    const wrBias = (winRate - 50) * 0.8;
    const smcBias = smc.bias === "BULLISH" ? 25 : smc.bias === "BEARISH" ? -25 : 0;
    const sentiment = Math.max(-100, Math.min(100, Math.round(posBias + wrBias + smcBias)));
    const topTrader = Object.entries(m.traders).sort((a, b) => b[1] - a[1])[0];
    return {
      coin: m.coin, trades: m.trades, longPct, shortPct: 100 - longPct, winRate,
      pnl: Math.round(m.pnl), sentiment,
      label: sentiment >= 40 ? "Bullish" : sentiment >= 12 ? "Lean Bull" : sentiment <= -40 ? "Bearish" : sentiment <= -12 ? "Lean Bear" : "Neutral",
      bias: smc.bias || null, confluence: smc.confluence ?? null, risk: smc.risk || null,
      price: smc.price || null, change: smc.change || null,
      topTrader: topTrader ? { name: topTrader[0], pnl: Math.round(topTrader[1]) } : null,
    };
  }).sort((a, b) => b.trades - a.trades);
}
