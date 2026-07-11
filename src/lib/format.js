/* ═══════════════════════ NUMBER FORMATTING (single source of truth) ═══════════════════════
   One place for every money / percent / ratio format so the whole platform reads
   consistently. Pair these with the `mono` style (tabular-nums) wherever numbers
   are shown so digits line up column-to-column. Positive/negative always carry a
   sign — never rely on color alone (accessibility: red-green colorblindness). */

const n2 = (x, d = 2) => (Number.isFinite(x) ? x.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");

/* Full dollar amount: $1,234.56. `signed` prefixes +/− for deltas. */
export const usd = (x, { signed = false, decimals = 2 } = {}) => {
  if (!Number.isFinite(x)) return "—";
  const sign = x < 0 ? "−" : signed ? "+" : "";
  return `${sign}$${n2(Math.abs(x), decimals)}`;
};

/* Compact dollar: $1.2K / $3.4M / $1.1B. Good for axes, chips, dense cells. */
export const usdCompact = (x, { signed = false } = {}) => {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x), sign = x < 0 ? "−" : signed ? "+" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}K`;
  return `${sign}$${a.toFixed(0)}`;
};

/* Percent: 12.34%. `signed` for deltas (+1.2% / −3.4%). */
export const pct = (x, { signed = false, decimals = 1 } = {}) => {
  if (!Number.isFinite(x)) return "—";
  const sign = x < 0 ? "−" : signed ? "+" : "";
  return `${sign}${n2(Math.abs(x), decimals)}%`;
};

/* Basis points: 13 bps (for TCA / slippage). */
export const bps = (x, { signed = true } = {}) => {
  if (!Number.isFinite(x)) return "—";
  const sign = x < 0 ? "−" : signed ? "+" : "";
  return `${sign}${Math.round(Math.abs(x))} bps`; // nbsp: the unit never orphans
};

/* Plain number with thousands separators and chosen decimals. */
export const num = (x, d = 2) => n2(x, d);

/* Adaptive price precision: more decimals for sub-cent assets so entry/TP/SL
   never collapse onto the same number. */
export const price = (x) => {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a >= 1000) return n2(x, 0);
  if (a >= 1) return n2(x, 2);
  if (a >= 0.01) return x.toFixed(4);
  if (a >= 0.0001) return x.toFixed(6);
  return x.toPrecision(3);
};

/* Ratio like profit factor / RRR: 1.94, or ∞ when there are no losses. */
export const ratio = (x, d = 2) => (!Number.isFinite(x) || x >= 999 ? "∞" : x.toFixed(d));

/* Semantic color for a signed value (caller still adds a sign/arrow for a11y). */
export const signColor = (x, C) => (x > 0 ? C.green : x < 0 ? C.red : C.textMuted);

/* ═══════════════════════ DATES (single source of truth) ═══════════════════════
   NEVER render a numeric month: "7/11/2026" is Jul-11 to a US reader and Nov-7 to
   everyone else. Always spell the month. Accepts a Date, epoch ms, or epoch
   seconds (signals carry seconds; the ledger carries ms — the heuristic below
   tells them apart, since 1e12 ms is the year 2001). */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const p2 = (x) => String(x).padStart(2, "0");
const toDate = (v) => (v instanceof Date ? v : new Date(typeof v === "number" && Math.abs(v) < 1e12 ? v * 1000 : v));
const bad = (d) => !d || Number.isNaN(d.getTime());

/* 07 Nov 2026 */
export const fmtDate = (v) => { const d = toDate(v); return bad(d) ? "—" : `${p2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

/* 07 Nov — day bucket, no year */
export const fmtDayShort = (v) => { const d = toDate(v); return bad(d) ? "—" : `${p2(d.getDate())} ${MONTHS[d.getMonth()]}`; };

/* 02:30 PM — no seconds anywhere in the product */
export const fmtTime = (v) => { const d = toDate(v); return bad(d) ? "—" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); };

/* 07 Nov 2026, 02:30 PM */
export const fmtDateTime = (v) => { const d = toDate(v); return bad(d) ? "—" : `${fmtDate(d)}, ${fmtTime(d)}`; };
