/* ═══════════════════════ LIVE PRICES (real exchange tape) ═══════════════════════
   The one thing the platform review kept asking for: real market flows with clear
   provenance. This module fetches REAL spot prices for the terminal's coin set
   from public exchange APIs — no key, no backend — with a transparent source
   cascade and honest failure: when nothing is reachable the app simply stays in
   its deterministic SIM state (never fake "live").

   Provenance rules (credibility contract):
   - Live numbers are ALWAYS labeled with source + as-of timestamp where shown.
   - The simulated ledger is NEVER re-marked against live prices — the two books
     (live tape vs SIM book) are visually and semantically separate by design.

   Sources, in order:
   1. Crypto.com Exchange  — GET /exchange/v1/public/get-tickers (verified shape:
      { result: { data: [{ i|instrument_name, a|last, c|change(ratio), t|timestamp }] } })
   2. Binance              — GET /api/v3/ticker/24hr?symbols=[...]
   3. CoinGecko            — GET /api/v3/simple/price?ids=...&include_24hr_change=true
   All are CORS-enabled public endpoints; each attempt has a hard timeout. */

export const LIVE_COINS = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "AVAX", "ADA", "LINK", "DOT",
  "MATIC", "UNI", "AAVE", "ATOM", "FTM", "NEAR", "APT", "ARB", "OP", "SUI",
  "INJ", "TIA", "SEI", "STX", "RENDER", "FET", "WLD", "JUP", "PENDLE", "ONDO",
  "TON", "PEPE", "WIF", "BONK", "FLOKI",
]; // the full Market Panorama coin set — partial tapes are fine (uncovered coins stay SIM)

const GECKO_IDS = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", binancecoin: "BNB", ripple: "XRP",
  dogecoin: "DOGE", "avalanche-2": "AVAX", cardano: "ADA", chainlink: "LINK",
  polkadot: "DOT", "matic-network": "MATIC", uniswap: "UNI", aave: "AAVE",
  cosmos: "ATOM", fantom: "FTM", near: "NEAR", aptos: "APT", arbitrum: "ARB",
  optimism: "OP", sui: "SUI", "injective-protocol": "INJ", celestia: "TIA",
  "sei-network": "SEI", blockstack: "STX", "render-token": "RENDER",
  "fetch-ai": "FET", "worldcoin-wld": "WLD", "jupiter-exchange-solana": "JUP",
  pendle: "PENDLE", "ondo-finance": "ONDO", "the-open-network": "TON",
  pepe: "PEPE", dogwifcoin: "WIF", bonk: "BONK", floki: "FLOKI",
};

/* ── Pure parsers (unit-tested) — each returns { BTC: { px, chg24h }, ... } ── */

/* Crypto.com: `change` is a ratio (0.0134 = +1.34%). Handles both the short
   (i/a/c) and long (instrument_name/last/change) field spellings. */
export const parseCryptoCom = (json) => {
  const rows = json?.result?.data || json?.data || [];
  const out = {};
  for (const d of rows) {
    const inst = d.i ?? d.instrument_name;
    if (!inst || !inst.endsWith("_USDT")) continue;
    const sym = inst.slice(0, -5);
    if (!LIVE_COINS.includes(sym)) continue;
    const px = Number(d.a ?? d.last);
    const chg = Number(d.c ?? d.change) * 100;
    if (Number.isFinite(px) && px > 0) out[sym] = { px, chg24h: Number.isFinite(chg) ? chg : null };
  }
  return out;
};

/* Binance: array of { symbol: "BTCUSDT", lastPrice, priceChangePercent }. */
export const parseBinance = (json) => {
  const rows = Array.isArray(json) ? json : [];
  const out = {};
  for (const d of rows) {
    if (!d.symbol || !d.symbol.endsWith("USDT")) continue;
    const sym = d.symbol.slice(0, -4);
    if (!LIVE_COINS.includes(sym)) continue;
    const px = Number(d.lastPrice);
    const chg = Number(d.priceChangePercent);
    if (Number.isFinite(px) && px > 0) out[sym] = { px, chg24h: Number.isFinite(chg) ? chg : null };
  }
  return out;
};

/* CoinGecko: { bitcoin: { usd, usd_24h_change }, ... }. */
export const parseCoinGecko = (json) => {
  const out = {};
  for (const [id, sym] of Object.entries(GECKO_IDS)) {
    const d = json?.[id];
    const px = Number(d?.usd);
    const chg = Number(d?.usd_24h_change);
    if (Number.isFinite(px) && px > 0) out[sym] = { px, chg24h: Number.isFinite(chg) ? chg : null };
  }
  return out;
};

/* ── Fetch cascade ── */

const withTimeout = async (url, ms = 8000) => {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
};

const SOURCES = [
  {
    id: "Crypto.com",
    url: "https://api.crypto.com/exchange/v1/public/get-tickers",
    parse: parseCryptoCom,
  },
  {
    id: "CoinGecko",
    url: `https://api.coingecko.com/api/v3/simple/price?ids=${Object.keys(GECKO_IDS).join(",")}&vs_currencies=usd&include_24hr_change=true`,
    parse: parseCoinGecko,
  },
  {
    // last resort: majors only — one delisted symbol 400s Binance's whole batch,
    // so this list is deliberately conservative
    id: "Binance",
    url: `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "LINK", "AVAX", "DOT"].map((c) => `${c}USDT`)))}`,
    parse: parseBinance,
  },
];

/* Try each source in order; resolve with the first that yields a usable tape.
   "Usable" = at least 3 majors — a source that only knows 1 coin is worse than
   falling through. Throws when every source fails (caller stays in SIM). */
export const fetchLivePrices = async () => {
  let lastErr;
  for (const s of SOURCES) {
    try {
      const prices = s.parse(await withTimeout(s.url));
      if (Object.keys(prices).length >= 3) return { prices, source: s.id, asOf: Date.now() };
      lastErr = new Error(`${s.id}: too few instruments`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("no live source reachable");
};

export const POLL_MS = 30000;
export const STALE_MS = 120000; // 4 missed polls -> treat the tape as stale
