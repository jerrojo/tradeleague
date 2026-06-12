import { mockTraders } from "./data/mockData";
import { C } from "./theme";
import { createContext, useContext } from "react";
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

export {
  ProfileContext,
  useProfile,
  TraderLink,
  FeedFilterContext,
  useFeedFilter,
  WatchlistContext,
  useWatchlist,
  DateContext,
  useDate
};
