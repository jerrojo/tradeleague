import { mockTraders } from "./data/mockData";
import { C } from "./theme";
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { fetchLivePrices, POLL_MS, STALE_MS } from "./lib/livePrices";

/* ═══════════════════════ TIMEFRAME CONTEXT (global date/time filter) ═══════════════════════
   One source of truth for the header time filter. Every signal-driven view reads
   `within(timeSec)` and filters its data, so changing the range updates the whole
   dashboard at once. Data spans ~1 week of 1h candles, so windows are relative
   (LukeW: presets for the common case + a custom range + the resolved span shown). */
/* Full range catalog, grouped by unit (TradingView-style). Pin any of these to the
   quick bar; the rest live in the grouped "Range ▾" dropdown. */
const TIMEFRAMES = [
  { key: "15m", label: "15m", ms: 15 * 60e3, group: "Minutes" },
  { key: "30m", label: "30m", ms: 30 * 60e3, group: "Minutes" },
  { key: "45m", label: "45m", ms: 45 * 60e3, group: "Minutes" },
  { key: "1h", label: "1H", ms: 3600e3, group: "Hours" },
  { key: "2h", label: "2H", ms: 2 * 3600e3, group: "Hours" },
  { key: "4h", label: "4H", ms: 4 * 3600e3, group: "Hours" },
  { key: "6h", label: "6H", ms: 6 * 3600e3, group: "Hours" },
  { key: "12h", label: "12H", ms: 12 * 3600e3, group: "Hours" },
  { key: "1d", label: "1D", ms: 86400e3, group: "Days" },
  { key: "3d", label: "3D", ms: 3 * 86400e3, group: "Days" },
  { key: "7d", label: "7D", ms: 7 * 86400e3, group: "Days" },
  { key: "14d", label: "14D", ms: 14 * 86400e3, group: "Days" },
  { key: "2w", label: "2W", ms: 14 * 86400e3, group: "Weeks" },
  { key: "4w", label: "4W", ms: 28 * 86400e3, group: "Weeks" },
  { key: "3mo", label: "3M", ms: 90 * 86400e3, group: "Months" },
  { key: "6mo", label: "6M", ms: 180 * 86400e3, group: "Months" },
  { key: "all", label: "All", ms: Infinity, group: "Other" },
];
const DEFAULT_PINNED = ["6h", "1d", "3d", "7d", "all"];
const fmtShort = (ms) => new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const TimeframeContext = createContext();
const useTimeframe = () => useContext(TimeframeContext);
const fmtChip = (ms) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const TimeframeProvider = ({ children }) => {
  const [key, setKey] = useState(() => { try { return localStorage.getItem("tf") || "all"; } catch { return "all"; } });
  const [custom, setCustom] = useState(null); // { from, to } in ms when key === "custom"
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem("tf:favs") || "[]"); } catch { return []; } });
  const [pinned, setPinned] = useState(() => { try { const v = JSON.parse(localStorage.getItem("tf:pinned") || "null"); return Array.isArray(v) && v.length ? v : DEFAULT_PINNED; } catch { return DEFAULT_PINNED; } });
  const togglePin = useCallback((k) => setPinned((prev) => {
    const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
    try { localStorage.setItem("tf:pinned", JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  }), []);
  const setRange = useCallback((k) => { setKey(k); if (k !== "custom") { setCustom(null); try { localStorage.setItem("tf", k); } catch { /* ignore */ } } }, []);
  const setCustomRange = useCallback((from, to) => { if (from && to && from < to) { setCustom({ from, to }); setKey("custom"); } }, []);
  const persistFavs = (next) => { try { localStorage.setItem("tf:favs", JSON.stringify(next)); } catch { /* ignore */ } };
  const addFavorite = useCallback((from, to) => {
    if (!(from && to && from < to)) return;
    setFavorites((prev) => {
      if (prev.some((f) => f.from === from && f.to === to)) return prev;
      const fav = { id: `${from}-${to}`, from, to, label: `${fmtChip(from)}–${fmtChip(to)}` };
      const next = [...prev, fav].slice(-6); // keep the 6 most recent
      persistFavs(next); return next;
    });
  }, []);
  const removeFavorite = useCallback((id) => setFavorites((prev) => { const n = prev.filter((f) => f.id !== id); persistFavs(n); return n; }), []);
  const value = useMemo(() => {
    const now = Date.now();
    let fromMs, toMs, label;
    if (key === "custom" && custom) {
      fromMs = custom.from; toMs = custom.to; label = `${fmtShort(custom.from)} → ${fmtShort(custom.to)}`;
    } else {
      const tf = TIMEFRAMES.find((t) => t.key === key) || TIMEFRAMES[4];
      toMs = now; fromMs = tf.ms === Infinity ? -Infinity : now - tf.ms;
      label = tf.key === "all" ? "All time" : `Last ${tf.label.toLowerCase()}`;
    }
    const within = (timeSec) => { const ms = (timeSec || 0) * 1000; return ms >= fromMs && ms <= toMs; };
    const activeFavId = key === "custom" && custom ? `${custom.from}-${custom.to}` : null;
    const pinnedRanges = TIMEFRAMES.filter((t) => pinned.includes(t.key));
    return { key, label, fromMs, toMs, within, setRange, setCustomRange, presets: TIMEFRAMES, pinned, pinnedRanges, togglePin, isFiltered: key !== "all", custom, favorites, addFavorite, removeFavorite, activeFavId };
  }, [key, custom, setRange, setCustomRange, favorites, addFavorite, removeFavorite, pinned, togglePin]);
  return <TimeframeContext.Provider value={value}>{children}</TimeframeContext.Provider>;
};
/* ═══════════════════════ PROFILE CONTEXT ═══════════════════════ */
const ProfileContext = createContext();
const useProfile = () => useContext(ProfileContext);

/* Clickable trader name — used across all tabs */
const TraderLink = ({ name, children }) => {
  const { openProfile } = useProfile();
  const trader = mockTraders.find(t => t.name === name);
  if (!trader) return children || <span>{name}</span>;
  return (
    <span onClick={(e) => { e.stopPropagation(); openProfile(trader); }} style={{ cursor: "pointer", color: C.text, fontWeight: "600", borderBottom: `1px dashed ${C.purple}40`, transition: "color 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.color = C.purple; }}
      onMouseLeave={e => { e.currentTarget.style.color = C.text; }}
    >{children || trader.name}</span>
  );
};

/* ═══════════════════════ FEED FILTER CONTEXT ═══════════════════════ */
const FeedFilterContext = createContext();
const useFeedFilter = () => useContext(FeedFilterContext);

/* ═══════════════════════ DATE CONTEXT ═══════════════════════ */
const DateContext = createContext();
const useDate = () => useContext(DateContext);

/* ═══════════════════════ PRO MODE CONTEXT ═══════════════════════ */
/* The Casual/Pro split was removed — the product now always shows full Pro detail.
   useProMode() is kept (and always true) so existing `proMode &&` guards keep
   rendering everything; ProContext remains exported for backward compatibility. */
const ProContext = createContext();
const useProMode = () => true;


/* ═══════════════════════ LIVE PRICE CONTEXT ═══════════════════════
   Real exchange tape (see lib/livePrices.js). status: "connecting" → "live" | "sim".
   Honest by construction: if every public source is unreachable, the app stays in
   its deterministic SIM state — it never fabricates a "live" label. A tape older
   than STALE_MS degrades back to SIM rather than showing stale numbers as fresh. */
const LivePriceContext = createContext({ status: "connecting", prices: {}, source: null, asOf: null });
const useLivePrices = () => useContext(LivePriceContext);

const LivePriceProvider = ({ children }) => {
  const [state, setState] = useState({ status: "connecting", prices: {}, source: null, asOf: null });
  useEffect(() => {
    let alive = true, timer;
    const schedule = () => { if (alive) timer = setTimeout(tick, POLL_MS); };
    const tick = async () => {
      if (document.hidden) { schedule(); return; } // background tabs don't poll
      try {
        const next = await fetchLivePrices();
        if (alive) setState({ status: "live", ...next });
      } catch {
        // keep a recent tape through one bad poll; otherwise fall back to SIM
        if (alive) setState((p) => (p.status === "live" && p.asOf && Date.now() - p.asOf < STALE_MS ? p : { ...p, status: "sim" }));
      }
      schedule();
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, []);
  const value = useMemo(() => state, [state]);
  return <LivePriceContext.Provider value={value}>{children}</LivePriceContext.Provider>;
};

/* ═══════════════════════ NAV CONTEXT ═══════════════════════
   Lets any deep component jump to another section (and an Audit sub-view) — used
   to make the Overview KPI cards click through to their underlying detail. */
const NavContext = createContext({ go: () => {} });
const useNav = () => useContext(NavContext);

export {
  ProfileContext,
  useProfile,
  TraderLink,
  FeedFilterContext,
  useFeedFilter,
  DateContext,
  useDate,
  TimeframeContext,
  useTimeframe,
  TimeframeProvider,
  ProContext,
  useProMode,
  NavContext,
  useNav,
  LivePriceProvider,
  useLivePrices
};
