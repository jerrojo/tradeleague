/* ═══════════════════════ RISK: LIMITS + TRUE EXPOSURE ═══════════════════════
   Two problems this fixes.

   1) The product DESCRIBED risk but never CONSTRAINED it. "44 open" is a fact, not a
      control. A fund runs on limits — max concentration, max leverage, a drawdown
      circuit breaker — and the dashboard has to say when one is breached, not merely
      report the number and leave the reader to do the arithmetic.

   2) "25L / 19S" implies diversification that does not exist. In crypto almost
      everything is a levered expression of BTC, so a book of 44 positions is nowhere
      near 44 independent bets. Counting longs against shorts makes a directional book
      look balanced. We therefore model risk with a single BTC factor and report:

        · NET BETA — the book's true directional exposure, in BTC-equivalents. Two
          "offsetting" positions in assets with different betas do not offset.
        · EFFECTIVE BETS — how many genuinely independent positions you hold. With
          correlations near 0.9 a 44-name book is worth roughly 2–3 real bets. This is
          the number that tells you whether "diversified" is true or a comfortable story.

   The model is deliberately simple and legible (one factor, published betas) because a
   risk number an allocator cannot reconstruct on paper is a risk number they won't trust. */

/* Beta to BTC. Majors track it closely; small caps and memes are levered versions of it.
   (Simulated book → published constants; with live data these come from a rolling regression.) */
const BETA = {
  BTC: 1.00, ETH: 1.05, BNB: 0.95, XRP: 1.05, SOL: 1.30, ADA: 1.15, AVAX: 1.30,
  LINK: 1.20, DOT: 1.20, MATIC: 1.25, ATOM: 1.20, LTC: 0.95, TON: 1.10, NEAR: 1.30,
  ARB: 1.40, OP: 1.40, SUI: 1.45, APT: 1.40, INJ: 1.45, SEI: 1.45, TIA: 1.45,
  DOGE: 1.50, SHIB: 1.65, PEPE: 1.80, WIF: 1.85, BONK: 1.85, FLOKI: 1.80,
  UNI: 1.20, AAVE: 1.25, MKR: 1.10, LDO: 1.35, RNDR: 1.45, FET: 1.50, WLD: 1.55,
  FTM: 1.35, ALGO: 1.20, STX: 1.35, IMX: 1.35, GRT: 1.35, SAND: 1.40, AXS: 1.40,
};
export const betaOf = (coin) => BETA[coin] ?? 1.35; // unknown alt → assume levered beta

/* Share of a coin's variance that is idiosyncratic (i.e. NOT explained by BTC).
   Low for majors, higher for small caps — but never high enough to make crypto a
   genuinely diversified asset class. */
const IDIO_VAR = 0.18;

/* ── The policy the fund runs under. Breaching one is an event, not a statistic. ── */
export const RISK_POLICY = {
  maxConcurrent:     { limit: 50,   label: "Max concurrent positions", fmt: (v) => `${v}` },
  maxPerCoin:        { limit: 6,    label: "Max positions in one coin", fmt: (v) => `${v}` },
  maxCoinWeightPct:  { limit: 25,   label: "Max weight in one coin",    fmt: (v) => `${v.toFixed(0)}%` },
  maxGrossLeverage:  { limit: 3.0,  label: "Max gross leverage",        fmt: (v) => `${v.toFixed(2)}×` },
  maxNetBeta:        { limit: 1.50, label: "Max net BTC beta",          fmt: (v) => `${v.toFixed(2)}β` },
  minEffectiveBets:  { limit: 3.0,  label: "Min effective bets",        fmt: (v) => v.toFixed(1) },
  maxDrawdownPct:    { limit: 15,   label: "Drawdown circuit breaker",  fmt: (v) => `${Math.abs(v).toFixed(1)}%` },
};

/* ── Exposure under the single-factor model ──────────────────────────────────
   positions: [{ coin, dir, notional }]  ·  equity: account equity  ·  ddPct: current drawdown (≤0) */
export const assessRisk = (positions, equity, ddPct = 0) => {
  const n = positions.length;
  const gross = positions.reduce((a, p) => a + Math.abs(p.notional || 0), 0);

  if (!n || !gross || !equity) {
    return {
      n: 0, gross: 0, grossLeverage: 0, netBeta: 0, effectiveBets: 0,
      topCoin: null, topCoinWeightPct: 0, topCoinCount: 0, breaches: [], ddPct,
    };
  }

  // signed weights as a share of gross exposure
  const w = positions.map((p) => {
    const sign = p.dir === "SHORT" ? -1 : 1;
    return { coin: p.coin, w: (sign * Math.abs(p.notional)) / gross, abs: Math.abs(p.notional) / gross, beta: betaOf(p.coin) };
  });

  // NET BETA — the honest directional number. Longs and shorts only cancel to the
  // extent their betas match, which they usually don't.
  const netBeta = w.reduce((a, x) => a + x.w * x.beta, 0) * (gross / equity);

  /* EFFECTIVE BETS. Portfolio variance under one factor:
       var = (Σ wᵢβᵢ)²·σf²  +  Σ wᵢ²·σidio²
     Set σf² = 1 (everything is in BTC-vol units). The diversification ratio compares the
     weighted-average standalone risk to the actual portfolio risk; squaring it gives the
     number of independent bets the book is really worth. */
  const sysExposure = w.reduce((a, x) => a + x.w * x.beta, 0);
  const idioVar = w.reduce((a, x) => a + x.abs * x.abs * IDIO_VAR, 0);
  const portVar = sysExposure * sysExposure + idioVar;
  const avgStandalone = w.reduce((a, x) => a + x.abs * Math.sqrt(x.beta * x.beta + IDIO_VAR), 0);
  const divRatio = portVar > 0 ? avgStandalone / Math.sqrt(portVar) : 1;
  const effectiveBets = Math.max(1, divRatio * divRatio);

  // concentration
  const byCoin = {};
  positions.forEach((p) => {
    const c = (byCoin[p.coin] = byCoin[p.coin] || { count: 0, notional: 0 });
    c.count++; c.notional += Math.abs(p.notional || 0);
  });
  const top = Object.entries(byCoin).sort((a, b) => b[1].notional - a[1].notional)[0];
  const topCoin = top ? top[0] : null;
  const topCoinWeightPct = top ? (top[1].notional / gross) * 100 : 0;
  const topCoinCount = top ? top[1].count : 0;
  const maxPerCoin = Math.max(0, ...Object.values(byCoin).map((c) => c.count));

  const grossLeverage = gross / equity;

  // ── breach detection ──
  const breaches = [];
  const check = (key, value, over) => {
    const p = RISK_POLICY[key];
    if (over) breaches.push({ key, label: p.label, value, limit: p.limit, display: p.fmt(value), limitDisplay: p.fmt(p.limit) });
  };
  check("maxConcurrent", n, n > RISK_POLICY.maxConcurrent.limit);
  check("maxPerCoin", maxPerCoin, maxPerCoin > RISK_POLICY.maxPerCoin.limit);
  check("maxCoinWeightPct", topCoinWeightPct, topCoinWeightPct > RISK_POLICY.maxCoinWeightPct.limit);
  check("maxGrossLeverage", grossLeverage, grossLeverage > RISK_POLICY.maxGrossLeverage.limit);
  check("maxNetBeta", Math.abs(netBeta), Math.abs(netBeta) > RISK_POLICY.maxNetBeta.limit);
  check("minEffectiveBets", effectiveBets, effectiveBets < RISK_POLICY.minEffectiveBets.limit);
  check("maxDrawdownPct", ddPct, Math.abs(ddPct) > RISK_POLICY.maxDrawdownPct.limit);

  return {
    n, gross, grossLeverage, netBeta, effectiveBets,
    topCoin, topCoinWeightPct, topCoinCount, maxPerCoin, ddPct, breaches,
  };
};
