import { useEffect, useRef, useState } from "react";
import { BarChart3, GitBranch, ShieldCheck } from "lucide-react";
import { C, cardStyle } from "../theme";
import { CoinTable } from "./CoinTable";
import { FearGreedGauge } from "./FearGreedGauge";
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
import { useNav } from "../contexts";
import { ROBOTIN_COINS } from "../data/robotin";

/* ── MARKETS: one coin, everything on a single page (no sub-tabs). Pick a coin,
   then scroll its chart + the signals it produced + the trades those became +
   how the crowd is positioned + its structure. Positioning lives right under the
   chart since it's just another lens on the same price. ── */
const MarketsSection = () => {
  const [coin, setCoin] = useState("BTC");
  const detailRef = useRef(null);
  // pick from the panorama → load the coin's detail and glide down to it
  const pick = (c) => { setCoin(c); setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Market-wide sentiment — the crypto Fear & Greed index (live when reachable) */}
      <div style={{ display: "flex" }}>
        <FearGreedGauge />
      </div>
      {/* Cross-coin lead: the whole board at a glance */}
      <MarketPanorama selected={coin} onSelect={pick} />
      {/* ── Detail for the selected coin ── */}
      <div ref={detailRef} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
        <div style={{ height: 1, flex: 1, backgroundColor: C.border }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textFaint }}>Coin detail</span>
        <div style={{ height: 1, flex: 1, backgroundColor: C.border }} />
      </div>
      {/* Coin table (rich selector) sits beside the chart — pick a coin right where you read it */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <div style={{ ...cardStyle, padding: 12, flex: "1 1 320px", minWidth: 300, maxWidth: 420 }}>
          <CoinTable coins={ROBOTIN_COINS} selected={coin} onSelect={setCoin} />
        </div>
        <div style={{ flex: "2 1 480px", minWidth: 0 }}>
          <RobotinSignals coin={coin} embedded />
        </div>
      </div>
      {/* Positioning — the same price, one more lens */}
      <CoinPositioning coin={coin} />
      {/* Consensus signal — where to enter, the targets, the stop */}
      <SMCAnalysis coin={coin} embedded />
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
