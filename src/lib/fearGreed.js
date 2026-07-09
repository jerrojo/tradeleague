/* ═══════════════════════ CRYPTO FEAR & GREED INDEX ═══════════════════════
   Real market-sentiment reading (0 = extreme fear, 100 = extreme greed) from the
   public alternative.me index. Fetched client-side with a timeout; if the endpoint
   is unreachable we degrade to a deterministic SIM value (stable within the day and
   flagged as SIM) instead of lying with a stale live badge — matching the platform's
   provenance-first "two books never mix" rule. */

export function classifyFng(v) {
  return v < 25 ? "Extreme Fear" : v < 45 ? "Fear" : v < 55 ? "Neutral" : v < 75 ? "Greed" : "Extreme Greed";
}

export async function fetchFearGreed(timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = await res.json();
    const d = j?.data?.[0];
    const value = Number(d?.value);
    if (!Number.isFinite(value)) return null;
    return {
      value: Math.max(0, Math.min(100, Math.round(value))),
      label: d.value_classification || classifyFng(value),
      ts: Number(d.timestamp) ? Number(d.timestamp) * 1000 : Date.now(),
      source: "alternative.me",
      live: true,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/* Deterministic SIM fallback — stable within a UTC day, mid-range fear/neutral so it
   never masquerades as a strong real signal. Clearly flagged as sim by the caller. */
export function simFearGreed(now = Date.now()) {
  const day = Math.floor(now / 86400000);
  const x = Math.sin(day * 12.9898) * 43758.5453;
  const r = x - Math.floor(x); // 0..1 deterministic per day
  const value = Math.round(35 + r * 30); // 35–65
  return { value, label: classifyFng(value), ts: now, source: "sim", live: false };
}
