import { mockTraders, smcCoins } from "./mockData";

/* ═══════════════════════ ROBOTÍN DATA (v1, simulated) ═══════════════════════
   The model: traders publish SIGNALS → Robotín (the AI) approves/rejects each one
   with a confidence and reasoning → approved signals become TRADES that live as
   pending → active → closed (TP/SL) or expire. Outcomes are simulated against the
   same candle series the chart draws, so the audit is internally consistent. */

const srand = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
/* Per-coin seed from the FULL ticker (not its length) so same-length coins
   (BTC/ETH/SOL/BNB…) get genuinely different candles and signals, not clones. */
const coinSeed = (coin) => { let h = 0; for (let i = 0; i < coin.length; i++) h = (h * 131 + coin.charCodeAt(i) * 17) % 100000; return h + 7; };

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
/* Adaptive precision: keep enough decimals for sub-cent meme coins so entry/TP/SL
   don't collapse onto the same number (which made TP trades read as +$0.00). */
const round = (x) => {
  const a = Math.abs(x);
  if (a >= 1) return Math.round(x * 100) / 100;
  if (a >= 0.01) return Math.round(x * 1e5) / 1e5;
  if (a >= 0.0001) return Math.round(x * 1e7) / 1e7;
  return Math.round(x * 1e10) / 1e10;
};

const STEP = 3600; // 1h candles
const N = 160;

/* ── Perp funding, per 8h settlement. Positive = longs pay shorts (the usual state of a
   market that is structurally long). Majors are cheap to hold; high-beta alts and memes
   are expensive, which is exactly where a naive backtest overstates its returns. ── */
const FUNDING_8H = {
  BTC: 0.00005, ETH: 0.00006, BNB: 0.00006, XRP: 0.00008, SOL: 0.00010, ADA: 0.00008,
  AVAX: 0.00010, LINK: 0.00009, DOT: 0.00009, MATIC: 0.00010, LTC: 0.00007, TON: 0.00009,
  NEAR: 0.00011, ARB: 0.00012, OP: 0.00012, SUI: 0.00013, APT: 0.00012, INJ: 0.00013,
  DOGE: 0.00014, SHIB: 0.00016, PEPE: 0.00018, WIF: 0.00019, BONK: 0.00019, FLOKI: 0.00018,
  UNI: 0.00009, AAVE: 0.00009, LDO: 0.00011, RNDR: 0.00012, FET: 0.00013, WLD: 0.00014,
  FTM: 0.00011, STX: 0.00011, IMX: 0.00011, GRT: 0.00011, SEI: 0.00013, TIA: 0.00013,
};
export const fundingRateOf = (coin) => FUNDING_8H[coin] ?? 0.0001;

/* ── MODEL REGISTRY ─────────────────────────────────────────────────────────────
   A track record produced by two different filters is two track records. Without a
   version stamped on each decision, an allocator cannot answer the first governance
   question they will ask — "which model produced these numbers?" — and a silent
   retrain would quietly rewrite history. Every signal now carries the version of
   Robotín that judged it. ── */
export const MODEL_VERSIONS = [
  { id: "R1.1", from: 0,   note: "Baseline: structure + R:R gate." },
  { id: "R1.2", from: 120, note: "Added higher-timeframe bias conflict check." },
  { id: "R1.3", from: 45,  note: "Current: liquidity-sweep confirmation required." },
];
/* Which model judged a signal, by how many days ago it was published. */
export const modelVersionFor = (ageDays) => {
  if (ageDays > 120) return "R1.1";
  if (ageDays > 45) return "R1.2";
  return "R1.3";
};

/* ── Single source of truth for per-trade execution costs (used by SignalTable +
   Execution Audit so the same trade never shows two different fee numbers) ──
   feeOf: deterministic taker fee per round-trip, $0.10–0.40 from the trade id.
   arrivalSlipBps: REAL arrival slippage from signal price vs limit fill —
   (entry − signalPx)/signalPx in bps, signed by trade direction. */
export const feeOf = (s) => {
  const id = String(s.id ?? s.coin ?? "");
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1e9;
  const x = Math.sin(h) * 10000; const r = x - Math.floor(x);
  return Math.round((0.1 + r * 0.3) * 100) / 100;
};
export const arrivalSlipBps = (s) => {
  if (!s.signalPx || !s.entry) return 0;
  const sign = s.dir === "LONG" ? 1 : -1; // paying up to enter = adverse slippage
  return Math.round(sign * ((s.entry - s.signalPx) / s.signalPx) * 10000 * 10) / 10;
};

/* ── OHLC candle series for a coin (deterministic random walk around its price) ── */
export function coinCandles(coin) {
  const base = COIN_PX[coin] || 100;
  const cs = coinSeed(coin);
  const now = Math.floor(Date.now() / 1000 / STEP) * STEP;
  const start = now - N * STEP;
  const vol = base * 0.006;
  let price = base * 0.97;
  const out = [];
  for (let i = 0; i < N; i++) {
    const r = srand(cs * 131 + i * 17);
    const drift = (base - price) * 0.015;
    const open = price;
    const close = open + (r - 0.5) * 2 * vol + drift;
    const high = Math.max(open, close) + srand(cs + i * 7) * vol * 0.8;
    const low = Math.min(open, close) - srand(cs + i * 11) * vol * 0.8;
    out.push({ time: start + i * STEP, open: round(open), high: round(high), low: round(low), close: round(close) });
    price = close;
  }
  // Anchor the series so its last close equals the quoted price — keeps the chart's
  // right-edge price identical to the header/selector (single source of truth).
  const delta = base - out[out.length - 1].close;
  if (delta) out.forEach((c) => { c.open = round(c.open + delta); c.high = round(c.high + delta); c.low = round(c.low + delta); c.close = round(c.close + delta); });
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
  const cs = coinSeed(coin);
  const count = 5 + Math.floor(srand(cs * 3) * 4); // 5–8 per coin
  for (let k = 0; k < count; k++) {
    const r = (n) => srand(cs * 1000 + k * 53 + n);
    const trader = mockTraders[Math.floor(r(1) * mockTraders.length)];
    // ~1 in 4 signals is "fresh" — its entry sits near the present so it is still
    // pending (waiting for price) or active (filled, not yet closed). The rest are
    // older entries that have already resolved. This keeps the full lifecycle visible.
    const recent = r(14) < 0.26;
    const ei = recent ? (N - 14 + Math.floor(r(2) * 12)) : (20 + Math.floor(r(2) * (N - 80))); // entry candle index
    const px = candles[ei].close;
    // Where price actually went after entry — lets Robotín's approved calls look smart
    const horizon = Math.min(candles.length - 1, ei + 30 + Math.floor(r(13) * 20));
    const realizedDir = candles[horizon].close >= px ? "LONG" : "SHORT";

    // Robotín decision first: confidence drives whether the call aligns with the real move
    const conf = Math.round(55 + r(9) * 44); // 55–99
    const approved = conf >= 62;
    const alignProb = 0.52 + ((conf - 62) / 37) * 0.42; // higher confidence → better aligned (≈52%→94%)
    // Approved calls align with the real move; REJECTED calls are deliberately
    // anti-aligned (~33% right) so they carry negative expectancy — i.e. Robotín's
    // filter genuinely screens out losers, and "executed" beats "all signals".
    const dir = approved
      ? (r(3) < alignProb ? realizedDir : (realizedDir === "LONG" ? "SHORT" : "LONG"))
      : (r(3) < 0.33 ? realizedDir : (realizedDir === "LONG" ? "SHORT" : "LONG"));
    const sign = dir === "LONG" ? 1 : -1;
    // Robotín places a LIMIT entry back in the zone (below price for longs, above for
    // shorts), so a fresh signal can sit PENDING until price returns to fill it.
    const entryOffset = px * (0.0015 + r(15) * 0.0035); // 0.15%–0.5% into the zone
    const entry = round(px - sign * entryOffset);
    const slDist = entry * (0.008 + r(4) * 0.008);   // 0.8%–1.6% stop
    const tp1Dist = slDist * (1.3 + r(5) * 0.9);     // reward:risk 1.3–2.2
    const sl = round(entry - sign * slDist);
    const tp1 = round(entry + sign * tp1Dist);
    const tp2 = round(entry + sign * tp1Dist * 1.8);
    const tp3 = round(entry + sign * tp1Dist * 2.8);
    const setup = SETUPS[Math.floor(r(6) * SETUPS.length)];
    const tf = TFS[Math.floor(r(7) * TFS.length)];
    const src = SOURCES[Math.floor(r(8) * SOURCES.length)];
    const tag = `${src}_SCALP_${setup}_${tf}_CRYPTO`;

    const rejectReason = !approved ? ["Risk:Reward below threshold", "Conflicts with higher-timeframe bias", "Entry already invalidated by price", "Liquidity sweep not confirmed"][Math.floor(r(10) * 4)] : null;
    const reasoning = `Price tagged the ${tf} ${setup === "OB" ? "order block" : setup === "FVG" ? "fair-value gap" : setup} near ${entryFmt(entry)}. ${dir === "LONG" ? "Bullish" : "Bearish"} rejection with volume confirms the zone; ${tf} is the structural timeframe anchoring the ${round((slDist / entry) * 100)}% stop.`;

    // Deterministic sizing for this signal (used for both real & hypothetical P&L)
    const lev = [3, 4, 5][Math.floor(r(11) * 3)];
    const notional = 2500 + r(12) * 5500; // $2.5k–8k position
    // Hypothetical resolution for EVERY signal — "what if we executed it" — so we can
    // compare the full signal book vs only what Robotín approved.
    const hres = resolve(candles, ei, dir, entry, tp1, sl);
    const hypoClosed = !!(hres && hres.status === "closed");
    const hypoGross = hypoClosed ? round(sign * ((hres.exit - entry) / entry) * lev * notional) : 0;
    // Hypothetical lifecycle for EVERY signal (what the counterfactual is doing right
    // now) — mirror the approved pending rule so a fresh unfilled limit reads PENDING
    // not EXPIRED. Lets the rejected branch show live state, not just closed outcomes.
    let hypoStatus = hres ? hres.status : "expired";
    if (hypoStatus === "expired" && recent) hypoStatus = "pending";

    /* ── FUNDING. These are PERPETUALS: there is no expiry, and the exchange keeps the
       contract tethered to spot by charging a funding payment every 8 hours. In a market
       that is structurally long (crypto usually is), longs PAY and shorts RECEIVE. A book
       that holds a levered long for three days pays funding three days running.

       This cost was simply missing from the P&L, which made every long look better than
       it was and made hold time look free. It is charged on NOTIONAL (the levered size),
       not on margin, because that is what the exchange charges on. ── */
    const fundingCost = (r_, idxIn, idxOut) => {
      if (idxIn == null || idxOut == null || idxOut <= idxIn) return 0;
      const hours = idxOut - idxIn;                    // candles are 1h
      const periods = hours / 8;                       // funding settles every 8h
      const rate8h = FUNDING_8H[coin] ?? 0.0001;       // ~0.01% per 8h → ~0.03%/day
      const payer = dir === "LONG" ? 1 : -1;           // longs pay, shorts collect
      return round(notional * rate8h * periods * payer);
    };

    // the counterfactual must pay funding too, or the rejected book gets a free ride and
    // the filter's edge is measured against an opponent who trades for free
    const hypoFunding = hypoClosed ? fundingCost(r, hres.activeIdx, hres.exitIdx) : 0;
    const hypoPnl = round(hypoGross - hypoFunding);

    // Actual execution path (only if approved)
    let res = approved ? hres : null;
    // a fresh, still-unfilled limit order is PENDING (order live); an old one EXPIRED
    if (res && res.status === "expired" && recent) res = { ...res, status: "pending", activeIdx: null };
    let pnlPct = 0, pnl = 0, funding = 0;
    if (res && res.status === "closed") {
      funding = fundingCost(r, res.activeIdx, res.exitIdx);
      const gross = round(sign * ((res.exit - entry) / entry) * lev * notional);
      pnl = round(gross - funding);                    // net of funding
      // identical to the old priceReturn% × leverage, but now net of the funding charge
      pnlPct = round((pnl / notional) * 100);
    }

    // Provider source — most signals arrive via the Telegram channel; a minority
    // come from X (Twitter). Deterministic (a stable hash, not the RNG stream, so
    // it never flickers and never shifts other seeded draws).
    const srcHash = (coin.charCodeAt(0) + coin.charCodeAt(coin.length - 1) + k * 7 + trader.name.length * 13) % 4;
    const source = srcHash === 0 ? "x" : "telegram";

    // Which Robotín judged this signal. Stamped at decision time and never rewritten —
    // that is the whole point: a retrain must not silently relabel history.
    const ageDays = (Date.now() / 1000 - candles[ei].time) / 86400;
    const modelVersion = modelVersionFor(ageDays);

    out.push({
      id: `${coin}-${k}`, coin, pair: `${coin}/USDT`, trader: trader.name, isBot: trader.isBot, source,
      time: candles[ei].time, entryIdx: ei,
      dir, entry, signalPx: px, sl, tp1, tp2, tp3, tf, setup, tag,
      lev, notional: round(notional), // position sizing (used by Positioning map / detail)
      // Robotín
      approved, confidence: conf, reasoning, rejectReason, modelVersion,
      // execution (only if approved)
      status: approved ? res.status : "rejected",
      activeIdx: res?.activeIdx ?? null, exitIdx: res?.exitIdx ?? null, exit: res?.exit ?? null, hit: res?.hit ?? "NONE",
      pnlPct, pnl, funding, // pnl is NET of funding; `funding` is disclosed separately
      // hypothetical "if executed" outcome for EVERY signal (full-book vs executed comparison)
      hypoClosed, hypoPnl, hypoFunding, hypoExitIdx: hres?.exitIdx ?? null, hypoStatus, hypoActiveIdx: hres?.activeIdx ?? null,
      // audit: what the signal implied vs what happened
      signalOutcome: "TP", // a published signal always claims it will hit TP
      auditOutcome: res ? (res.status === "closed" ? (res.hit === "TP" ? "TP" : "SL") : res.status === "active" ? "OPEN" : res.status === "pending" ? "PENDING" : "NO ENTRY") : null,
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

/* ── Deterministic market meta per coin (simulated) — market cap, 24h volume and
   the 1h / 1w change columns the Markets board needs. Majors carry a large cap that
   decays down the priority list; the tail coins get a small deterministic cap. Fully
   stable across reloads (seeded by the coin) so bubbles and the table never disagree. */
export function coinMarketMeta(coin) {
  const cs = coinSeed(coin);
  const rank = PREFERRED.indexOf(coin);
  const r1 = srand(cs * 7 + 3), r2 = srand(cs * 11 + 5), r3 = srand(cs * 13 + 9), r4 = srand(cs * 17 + 1);
  const base = rank >= 0 ? 1.25e12 * Math.pow(0.63, rank) : 6e8 * (0.25 + r1);
  const marketCap = Math.round(base * (0.7 + r1 * 0.6));
  const volume = Math.round(marketCap * (0.03 + r2 * 0.14));
  const chg1h = Math.round((r3 - 0.5) * 4 * 100) / 100;   // ±2%
  const chg1w = Math.round((r4 - 0.48) * 26 * 100) / 100; // ~±13%, slight upward tilt
  return { marketCap, volume, chg1h, chg1w };
}
export const MARKET_META = Object.fromEntries(ROBOTIN_COINS.map((c) => [c, coinMarketMeta(c)]));

/* ═══════════════════════ MEMOIZED SIGNAL STORE (single source of truth) ═══════════════════════
   coinCandles / coinSignals are fully deterministic, so the entire signal book is
   identical on every call. Compute it ONCE here and let every section import these
   instead of re-running the engine over all coins on each render — one computation,
   and a guarantee that no two sections can ever disagree on the numbers. Components
   still apply their own timeframe (`within`) filtering on top of ALL_SIGNALS. */
export const CANDLES_BY_COIN = Object.fromEntries(ROBOTIN_COINS.map((c) => [c, coinCandles(c)]));
export const ALL_SIGNALS = ROBOTIN_COINS.flatMap((c) => coinSignals(c, CANDLES_BY_COIN[c]));
export const lastCloseByCoin = Object.fromEntries(
  ROBOTIN_COINS.map((c) => { const cs = CANDLES_BY_COIN[c]; return [c, cs.length ? cs[cs.length - 1].close : null]; })
);
