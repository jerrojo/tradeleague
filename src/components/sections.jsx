import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, GitBranch, ShieldCheck } from "lucide-react";
import { C } from "../theme";
import { FearGreedGauge } from "./FearGreedGauge";
import { IS_FULL } from "../lite";
import { SMCAnalysis } from "./tabs/SMCAnalysis";
import { RobotinSignals } from "./tabs/RobotinSignals";
import { CoinPositioning } from "./tabs/CoinPositioning";
import { MarketPanorama } from "./tabs/MarketPanorama";
import { HomeTab } from "./tabs/HomeTab";
import { TradersTab } from "./tabs/TradersTab";
import { ActivityFeed } from "./tabs/ActivityFeed";
import { PortfolioTab } from "./tabs/PortfolioTab";
import { ExecutionAudit } from "./tabs/ExecutionAudit";
import { FilterEdge } from "./tabs/FilterEdge";
import { useNav, useLivePrices } from "../contexts";
import { smcCoins } from "../data/mockData";
import { coinCandles, coinSignals, ROBOTIN_COINS, MARKET_META } from "../data/robotin";

const COIN_CATEGORIES = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "AI"];

/* ── MARKETS: one coin, everything on a single page (no sub-tabs). Pick a coin,
   then scroll its chart + the signals it produced + the trades those became +
   how the crowd is positioned + its structure. Positioning lives right under the
   chart since it's just another lens on the same price. ── */
/* Deep-link inbox: another section can hand Markets a coin (go("markets", { coin })).
   Consumed on read so an ordinary visit still lands on the last coin, not a stale one. */
const takeCoin = () => {
  try { const c = localStorage.getItem("mk:coin"); if (c) { localStorage.removeItem("mk:coin"); return c; } } catch { /* ignore */ }
  return "BTC";
};

const MarketsSection = () => {
  const [coin, setCoin] = useState(takeCoin);
  const tape = useLivePrices();
  const live = tape.status === "live" ? tape.prices : null;
  const detailRef = useRef(null);
  // pick from the panorama → load the coin's detail and glide down to it
  const pick = (c) => { setCoin(c); setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); };
  // Enriched coin meta so the selector dropdown + quick cards carry cross-coin
  // context (price/Δ, sentiment, live/total signals, model bias). Computed once.
  const coinMeta = useMemo(() => {
    const m = {};
    ROBOTIN_COINS.forEach((c) => {
      const cs = coinCandles(c);
      const last = cs[cs.length - 1].close, first = cs[0].close;
      const change = ((last - first) / first) * 100;
      const sigs = coinSignals(c, cs);
      const appr = sigs.filter((s) => s.approved);
      const longs = appr.filter((s) => s.dir === "LONG").length;
      const tot = appr.length;
      const meta = smcCoins[c] || {};
      const mm = MARKET_META[c] || {};
      const lv = live?.[c]; // real quote takes over price/Δ when the tape is up
      const px = lv?.px ?? last;
      const chg = lv?.chg24h ?? change;
      m[c] = {
        pair: "USDT",
        price: px >= 1 ? px.toLocaleString(undefined, { maximumFractionDigits: 2 }) : px.toFixed(4),
        change: `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`,
        category: meta.category, bias: meta.bias,
        longPct: tot ? Math.round((longs / tot) * 100) : null,
        signals: sigs.length,
        active: sigs.filter((s) => s.status === "active" || s.status === "pending").length,
        closes: cs.filter((_, i) => i % 4 === 0).map((k) => k.close), // downsampled spark for the quick cards
        // rich dropdown columns: 1h/1d/1w moves + market cap (1d live, others SIM)
        chg1h: mm.chg1h, chg1d: chg, chg1w: mm.chg1w, marketCap: mm.marketCap,
      };
    });
    return m;
  }, [live]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Cross-coin lead: the whole board at a glance */}
      {IS_FULL && <MarketPanorama selected={coin} onSelect={pick} />}
      {/* ── Detail for the selected coin ── */}
      <div ref={detailRef} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
        <div style={{ height: 1, flex: 1, backgroundColor: C.border }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textFaint }}>Coin detail</span>
        <div style={{ height: 1, flex: 1, backgroundColor: C.border }} />
      </div>
      {/* Chart with the coin selector merged INTO its header (primary switcher +
          searchable dropdown + quick-access cards) — one consolidated control. */}
      <RobotinSignals coin={coin} embedded onSelectCoin={setCoin} coins={ROBOTIN_COINS} coinMeta={coinMeta} categories={COIN_CATEGORIES} />
      {/* Consensus signal + market-wide mood, side by side at equal height —
          the F&G fills the Consensus card's spare width instead of a bare strip. */}
      <div className="grid-consensus" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(0, 2.3fr)", gap: 16, alignItems: "stretch" }}>
        <FearGreedGauge compact vertical />
        <SMCAnalysis coin={coin} embedded />
      </div>
      {/* Positioning — the same price, one more lens (kept last as a wrap-up) */}
      <CoinPositioning coin={coin} />
    </div>
  );
};

/* ── ACTIVITY: the global live tape of Robotín's lifecycle across every coin. ── */
const ActivitySection = () => <ActivityFeed />;

/* ── TRADERS: the home. A live overview (the race + highlights) on top, then the
   searchable directory of everyone you can follow, compare and open. Pulse folded
   in here — there is one home for "the people", not two. ── */
const TradersSection = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
    <HomeTab />
    <div style={{ height: 1, backgroundColor: C.border }} />
    <TradersTab />
  </div>
);

/* ── AUDIT: the verification layer as ONE page, read top to bottom in pipeline
   order — 1) what actually executed (fills, fees, slippage), 2) what the filter's
   approve/reject was worth (counterfactual), 3) the raw provider edge pre-filter.
   No tabs: an auditor reads the whole chain; a sticky jump-nav replaces them and
   deep links from Overview cards scroll to the right part. ── */
const AUDIT_PARTS = [
  { id: "execution", label: "Execution", icon: ShieldCheck, Comp: ExecutionAudit, num: "1", desc: "what actually executed" },
  { id: "edge", label: "Filter edge", icon: GitBranch, Comp: FilterEdge, num: "2", desc: "what the filter was worth" },
  { id: "analytics", label: "Provider analytics", icon: BarChart3, Comp: PortfolioTab, num: "3", desc: "raw edge before the filter" },
];

const AuditSection = () => {
  const { auditView, setAuditView } = useNav();
  const refs = useRef({});
  // Instant jumps via explicit window.scrollTo (scrollIntoView proved flaky
  // with the sticky header/nav combo). Offset = app header (56) + sticky
  // jump-nav (~44). Teleport, not tour: smooth-scrolling across thousands of
  // px of lazy-mounting charts meant seconds of travel through blank space.
  const scrollToPart = (id) => {
    const el = refs.current[id];
    if (!el) return;
    const y = id === "execution" ? 0 : el.getBoundingClientRect().top + window.scrollY - 104;
    window.scrollTo({ top: Math.max(0, y) });
  };
  const jump = (id) => { setAuditView(id); scrollToPart(id); };
  // Deep links (Overview KPI cards → go("audit", { auditView })) land on the section.
  useEffect(() => {
    if (auditView && auditView !== "execution") {
      const t = setTimeout(() => scrollToPart(auditView), 120);
      return () => clearTimeout(t);
    }
  }, [auditView]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* sticky jump-nav — same offset as the app header */}
      <div style={{ position: "sticky", top: 56, zIndex: 5, display: "flex", alignItems: "center", gap: 6, padding: "8px 0", backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginRight: 4 }}>On this page</span>
        {AUDIT_PARTS.map((p) => {
          const on = (auditView || "execution") === p.id;
          const Icon = p.icon;
          return (
            <button key={p.id} onClick={() => jump(p.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${on ? C.purple : C.border}`,
              backgroundColor: on ? C.purpleBg : "transparent", color: on ? C.purple : C.textMuted,
            }}>
              <Icon size={13} />{p.num} · {p.label}
            </button>
          );
        })}
      </div>

      {AUDIT_PARTS.map((p, i) => (
        <div key={p.id} ref={(el) => { refs.current[p.id] = el; }} style={{ scrollMarginTop: 110, paddingTop: i === 0 ? 8 : 0 }}>
          {i > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 18px" }}>
              <div style={{ height: 1, flex: 1, backgroundColor: C.border }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textFaint }}>Part {p.num} · {p.label} — {p.desc}</span>
              <div style={{ height: 1, flex: 1, backgroundColor: C.border }} />
            </div>
          )}
          <p.Comp />
        </div>
      ))}
    </div>
  );
};

export { MarketsSection, ActivitySection, TradersSection, AuditSection };
