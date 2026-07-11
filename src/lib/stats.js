/* ═══════════════════════ STATISTICS (error bars for every claim) ═══════════════════════
   The product's central claim is "the filter adds edge". Stated as a point estimate
   ("Filter added +$949") that claim is unfalsifiable — and with a few dozen rejected
   signals it may be indistinguishable from noise. An allocator's first question in
   diligence is not "how much?" but "how sure?".

   So: every headline number that is an ESTIMATE (not a fact) carries an interval.
   Facts (a balance, a count of rows) don't need one. Estimates (a win rate, an edge,
   an expectancy) always do.

   Everything here is DETERMINISTIC — the resampler is seeded from the data itself, so
   a confidence interval never flickers between two renders of the same page. */

/* ── seeded RNG (mulberry32) ── */
const seedFrom = (str) => {
  let h = 1779033703 ^ String(str).length;
  for (let i = 0; i < String(str).length; i++) {
    h = Math.imul(h ^ String(str).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
};
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const quantile = (sorted, q) => {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

/* ── Wilson score interval for a proportion ──────────────────────────────────
   The right interval for a win rate. The naive "p ± 1.96·√(p(1−p)/n)" (Wald)
   is badly wrong at small n and at p near 0 or 1 — it can even produce bounds
   outside [0,1], which is how you end up publishing a "102% upper bound".
   Returns fractions in [0,1]. */
export const wilson = (successes, n, z = 1.96) => {
  if (!n || n <= 0) return { p: 0, lo: 0, hi: 0, n: 0, margin: 0 };
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const margin = (z / denom) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return {
    p,
    lo: Math.max(0, center - margin),
    hi: Math.min(1, center + margin),
    margin,
    n,
  };
};

/* ── Bootstrap a SUM (e.g. the filter's total avoided P&L) ────────────────────
   Resample the observations with replacement, re-total, repeat. The spread of
   those totals is the sampling uncertainty of the real one.

   `pPositive` is the share of resamples above zero — read it as "how confident
   are we the sign is right". Below ~0.95 the number should not be sold as an edge;
   near 0.5 it is a coin flip dressed up as a result. */
export const bootstrapSum = (values, { iters = 2000, seed = "edge", z = 1.96 } = {}) => {
  const n = values.length;
  const sum = values.reduce((a, v) => a + v, 0);
  if (n < 2) return { sum, lo: sum, hi: sum, pPositive: sum > 0 ? 1 : 0, n, significant: false, iters: 0 };

  const rand = mulberry32(seedFrom(`${seed}:${n}:${Math.round(sum)}`));
  const totals = new Array(iters);
  let above = 0;
  for (let b = 0; b < iters; b++) {
    let t = 0;
    for (let i = 0; i < n; i++) t += values[(rand() * n) | 0];
    totals[b] = t;
    if (t > 0) above++;
  }
  totals.sort((a, b) => a - b);
  const alpha = 1 - (z >= 2.576 ? 0.99 : z >= 1.96 ? 0.95 : 0.9);
  const lo = quantile(totals, alpha / 2);
  const hi = quantile(totals, 1 - alpha / 2);
  return {
    sum, lo, hi, n, iters,
    pPositive: above / iters,
    // "significant" = the interval does not straddle zero, i.e. we can name the sign
    significant: (lo > 0 && hi > 0) || (lo < 0 && hi < 0),
  };
};

/* ── Bootstrap a MEAN (e.g. expectancy per trade) ── */
export const bootstrapMean = (values, opts = {}) => {
  const n = values.length;
  const r = bootstrapSum(values, { ...opts, seed: `${opts.seed || "mean"}:m` });
  if (!n) return { mean: 0, lo: 0, hi: 0, n: 0, pPositive: 0, significant: false };
  return { ...r, mean: r.sum / n, lo: r.lo / n, hi: r.hi / n };
};

/* ── Plain-language verdict on an interval. Used verbatim in the UI so we never
   sell noise as a result. ── */
export const verdict = ({ significant, pPositive }) => {
  if (significant) return pPositive > 0.5 ? "significant" : "significant-negative";
  if (pPositive >= 0.9 || pPositive <= 0.1) return "suggestive";
  return "noise";
};

export const VERDICT_COPY = {
  significant: "statistically distinguishable from zero",
  "significant-negative": "statistically distinguishable from zero",
  suggestive: "suggestive, but not yet significant",
  noise: "indistinguishable from noise at this sample size",
};

/* Formatting helper: "51.1% ± 8.3" */
export const pctCI = (w, d = 1) =>
  `${(w.p * 100).toFixed(d)}% ± ${(w.margin * 100).toFixed(d)}`;
