import { mockTraders } from "./data/mockData";
import { C } from "./theme";
import { createContext, useContext, useState, useMemo, useCallback } from "react";

/* ═══════════════════════ TIMEFRAME CONTEXT (global date/time filter) ═══════════════════════
   One source of truth for the header time filter. Every signal-driven view reads
   `within(timeSec)` and filters its data, so changing the range updates the whole
   dashboard at once. Data spans ~1 week of 1h candles, so windows are relative
   (LukeW: presets for the common case + a custom range + the resolved span shown). */
const TIMEFRAMES = [
  { key: "6h", label: "6H", ms: 6 * 3600e3 },
  { key: "24h", label: "24H", ms: 24 * 3600e3 },
  { key: "3d", label: "3D", ms: 3 * 86400e3 },
  { key: "7d", label: "7D", ms: 7 * 86400e3 },
  { key: "all", label: "All", ms: Infinity },
];
const fmtShort = (ms) => new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const TimeframeContext = createContext();
const useTimeframe = () => useContext(TimeframeContext);
const TimeframeProvider = ({ children }) => {
  const [key, setKey] = useState(() => { try { return localStorage.getItem("tf") || "all"; } catch { return "all"; } });
  const [custom, setCustom] = useState(null); // { from, to } in ms when key === "custom"
  const setRange = useCallback((k) => { setKey(k); if (k !== "custom") { setCustom(null); try { localStorage.setItem("tf", k); } catch { /* ignore */ } } }, []);
  const setCustomRange = useCallback((from, to) => { if (from && to && from < to) { setCustom({ from, to }); setKey("custom"); } }, []);
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
    return { key, label, fromMs, toMs, within, setRange, setCustomRange, presets: TIMEFRAMES, isFiltered: key !== "all", custom };
  }, [key, custom, setRange, setCustomRange]);
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

/* ═══════════════════════ WATCHLIST CONTEXT ═══════════════════════ */
const WatchlistContext = createContext();
const useWatchlist = () => useContext(WatchlistContext);

/* ═══════════════════════ DATE CONTEXT ═══════════════════════ */
const DateContext = createContext();
const useDate = () => useContext(DateContext);

/* ═══════════════════════ PRO MODE CONTEXT ═══════════════════════ */
/* The Casual/Pro split was removed — the product now always shows full Pro detail.
   useProMode() is kept (and always true) so existing `proMode &&` guards keep
   rendering everything; ProContext remains exported for backward compatibility. */
const ProContext = createContext();
const useProMode = () => true;

export {
  ProfileContext,
  useProfile,
  TraderLink,
  FeedFilterContext,
  useFeedFilter,
  WatchlistContext,
  useWatchlist,
  DateContext,
  useDate,
  TimeframeContext,
  useTimeframe,
  TimeframeProvider,
  ProContext,
  useProMode
};
