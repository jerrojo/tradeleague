import { mockTraders, smcCoins } from "./mockData";

/* ═══════════════════════ ROBOTÍN DATA (v1, simulated) ═══════════════════════
   The model: traders publish SIGNALS → Robotín (the AI) approves/rejects each one
   with a confidence and reasoning → approved signals become TRADES that live as
   pending → active → closed (TP/SL) or expire. Outcomes are simulated against the
   same candle series the chart draws, so the audit is internally consistent. */

const srand = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };

/* Single price source of truth: derive every coin's anchor price from smcCoins
   (the master coin catalog), so the hub header, the candle chart and the
   structure view never disagree on price. Falls back to a sane default. */
const parsePx = (s) => Number(String(s).replace(/[^0-9.]/g, "")) || 100;
export const COIN_PX = Object.fromEntries(Object.keys(smcCoins).map((k) => [k, parsePx(smcCoins[k].price)]));
/* Curated, ordered shortlist for the asset menu (majors first); the rest stay searchable. */
const PREFERRED = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "AVAX", "LINK", "ADA", "DOT", "MATIC", "TON", "NEAR", "ARB", "OP", "SUI", "INJ", "TIA", "PEPE", "WIF", "BONK"];
export const ROBOTIN_COINS = [...PREFERRED.filter((c) => smcCoins[c]), ...Object.keys(smcCoins).filter((c) => !PREFERRED.includes(c))];

const SETUPS = ["FVG", "OB", "BOS", "LIQ", "CHOCH"];
const TFS = ["M15", "H1", "H4"];
const SOURCES = ["TG", "TV", "AI"];
const round = (x) => (x < 1 ? Math.round(x * 1e5) / 1e5 : Math.round(x * 100) / 100);

const STEP = 3600; // 1h candles
const N = 160;

/* ── OHLC candle series for a coin (deterministic random walk around its price) ── */
export function coinCandles(coin) {
  const base = COIN_PX[coin] || 100;
  const now = Math.floor(Date.now() / 1000 / STEP) * STEP;
  const start = now - N * STEP;
  const vol = base * 0.006;
  let price = base * 0.97;
  const out = [];
  for (let i = 0; i < N; i++) {
    const r = srand(coin.length * 131 + i * 17);
    const drift = (base - price) * 0.015;
    const open = price;
    const close = open + (r - 0.5) * 2 * vol + drift;
    const high = Math.max(open, close) + srand(coin.length + i * 7) * vol * 0.8;
    const low = Math.min(open, close) - srand(coin.length + i * 11) * vol * 0.8;
    out.push({ time: start + i * STEP, open: round(open), high: round(high), low: round(low), close: round(close) });
    price = close;
  }
  return out;
}

/* ── Simulate a signal's life against the candles after its entry index ── */
function resolve(candles, ei, dir, entry, tp, sl) {
  // find activation: price trades through entry after the signal
  let activeIdx = -1;
  for (let i = ei; i < candles.length; i++) {
    if (candles[i].low <= entry && entry <= candles[i].high) { activeIdx = i; break; }
  }
  if (activeIdx === -1) return { status: "expired", exit: null, exitIdx: null, hit: "NONE" };
  for (let i = activeIdx; i < candles.length; i++) {
    const c = candles[i];
    const hitTp = dir === "LONG" ? c.high >= tp : c.low <= tp;
    const hitSl = dir === "LONG" ? c.low <= sl : c.high >= sl;
    if (hitSl && hitTp) return { status: "closed", hit: "TP", exit: tp, exitIdx: i, activeIdx }; // tight scalp management: take the target on a mixed candle
    if (hitTp) return { status: "closed", hit: "TP", exit: tp, exitIdx: i, activeIdx };
    if (hitSl) return { status: "closed", hit: "SL", exit: sl, exitIdx: i, activeIdx };
  }
  return { status: "active", hit: "NONE", exit: null, exitIdx: null, activeIdx };
}

/* ── Signals for a coin, each with Robotín's decision + (if approved) the trade ── */
export function coinSignals(coin, candles) {
  const out = [];
  const count = 5 + Math.floor(srand(coin.length * 3) * 4); // 5–8 per coin
  for (let k = 0; k < count; k++) {
    const r = (n) => srand(coin.length * 1000 + k * 53 + n);
    const trader = mockTraders[Math.floor(r(1) * mockTraders.length)];
    const ei = 20 + Math.floor(r(2) * (N - 70)); // entry candle index
    const px = candles[ei].close;
    // Where price actually went after entry — lets Robotín's approved calls look smart
    const horizon = Math.min(candles.length - 1, ei + 30 + Math.floor(r(13) * 20));
    const realizedDir = candles[horizon].close >= px ? "LONG" : "SHORT";

    // Robotín decision first: confidence drives whether the call aligns with the real move
    const conf = Math.round(55 + r(9) * 44); // 55–99
    const approved = conf >= 62;
    const alignProb = 0.52 + ((conf - 62) / 37) * 0.42; // higher confidence → better aligned (≈52%→94%)
    const dir = approved
      ? (r(3) < alignProb ? realizedDir : (realizedDir === "LONG" ? "SHORT" : "LONG"))
      : (r(3) > 0.5 ? "LONG" : "SHORT");
    const sign = dir === "LONG" ? 1 : -1;
    const slDist = px * (0.008 + r(4) * 0.008);   // 0.8%–1.6% stop
    const tp1Dist = slDist * (1.3 + r(5) * 0.9);  // reward:risk 1.3–2.2
    const sl = round(px - sign * slDist);
    const tp1 = round(px + sign * tp1Dist);
    const tp2 = round(px + sign * tp1Dist * 1.8);
    const tp3 = round(px + sign * tp1Dist * 2.8);
    const setup = SETUPS[Math.floor(r(6) * SETUPS.length)];
    const tf = TFS[Math.floor(r(7) * TFS.length)];
    const src = SOURCES[Math.floor(r(8) * SOURCES.length)];
    const tag = `${src}_SCALP_${setup}_${tf}_CRYPTO`;

    const rejectReason = !approved ? ["Risk:Reward below threshold", "Conflicts with higher-timeframe bias", "Entry already invalidated by price", "Liquidity sweep not confirmed"][Math.floor(r(10) * 4)] : null;
    const reasoning = `Price tagged the ${tf} ${setup === "OB" ? "order block" : setup === "FVG" ? "fair-value gap" : setup} near ${entryFmt(px)}. ${dir === "LONG" ? "Bullish" : "Bearish"} rejection with volume confirms the zone; ${tf} is the structural timeframe anchoring the ${round((slDist / px) * 100)}% stop.`;

    const res = approved ? resolve(candles, ei, dir, px, tp1, sl) : null;
    let pnlPct = 0, pnl = 0;
    if (res && res.status === "closed") {
      const lev = [3, 4, 5][Math.floor(r(11) * 3)];
      const notional = 2500 + r(12) * 5500; // $2.5k–8k position
      pnlPct = round(sign * ((res.exit - px) / px) * 100 * lev);
      pnl = round(sign * ((res.exit - px) / px) * lev * notional);
    }

    out.push({
      id: `${coin}-${k}`, coin, pair: `${coin}/USDT`, trader: trader.name, isBot: trader.isBot,
      time: candles[ei].time, entryIdx: ei,
      dir, entry: px, sl, tp1, tp2, tp3, tf, setup, tag,
      // Robotín
      approved, confidence: conf, reasoning, rejectReason,
      // execution (only if approved)
      status: approved ? res.status : "rejected",
      activeIdx: res?.activeIdx ?? null, exitIdx: res?.exitIdx ?? null, exit: res?.exit ?? null, hit: res?.hit ?? "NONE",
      pnlPct, pnl,
      // audit: what the signal implied vs what happened
      signalOutcome: "TP", // a published signal always claims it will hit TP
      auditOutcome: res ? (res.status === "closed" ? (res.hit === "TP" ? "TP" : "SL") : res.status === "active" ? "OPEN" : "NO ENTRY") : null,
    });
  }
  return out.sort((a, b) => a.time - b.time);
}

function entryFmt(p) { return p < 1 ? `$${p.toFixed(4)}` : `$${Math.round(p).toLocaleString()}`; }

/* ── Build lightweight-charts markers + price lines for a set of signals ── */
export function signalMarkers(signals) {
  return signals.map((s) => ({
    time: s.time,
    position: s.dir === "LONG" ? "belowBar" : "aboveBar",
    color: s.status === "rejected" ? "#6b7482" : s.dir === "LONG" ? "#3fb950" : "#f85149",
    shape: s.dir === "LONG" ? "arrowUp" : "arrowDown",
    text: `${s.trader.split(" ")[0]}`,
  }));
}
