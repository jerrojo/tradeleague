import { useState } from "react";
import { Activity, Award, Beaker, Briefcase, Coins, Flame, Globe, Scale, Trophy, Users } from "lucide-react";
import { C } from "../theme";
import { MarketsTab } from "./tabs/MarketsTab";
import { SMCAnalysis } from "./tabs/SMCAnalysis";
import { ArenaTab } from "./tabs/ArenaTab";
import { FuturesTab } from "./tabs/FuturesTab";
import { TradersTab } from "./tabs/TradersTab";
import { HallOfFameTab } from "./tabs/HallOfFameTab";
import { AwardsTab } from "./tabs/AwardsTab";
import { PortfolioTab } from "./tabs/PortfolioTab";
import { TradeLabTab } from "./tabs/TradeLabTab";
import { TopTradesTab } from "./tabs/TopTradesTab";

/* ═══════════════════════ SECTION SUB-NAV ═══════════════════════
   Each top-level section groups related destinations behind one nav item, so the
   left rail stays at six clear sections while every screen is one click away. */
const SubTabs = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
    {tabs.map(t => {
      const on = active === t.id;
      const Icon = t.icon;
      return (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          display: "flex", alignItems: "center", gap: "7px",
          padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer",
          border: `1px solid ${on ? C.purple : C.border}`,
          backgroundColor: on ? C.purpleBg : "transparent",
          color: on ? C.purple : C.textMuted, transition: "all 0.15s",
        }}>
          {Icon && <Icon size={15} />}{t.label}
        </button>
      );
    })}
  </div>
);

/* ── MARKETS: per-coin sentiment + the coin terminal (absorbs Tokens) ── */
const MarketsSection = () => {
  const [sub, setSub] = useState("sentiment");
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} tabs={[
        { id: "sentiment", label: "Sentiment", icon: Globe },
        { id: "coin", label: "Coin Detail", icon: Coins },
      ]} />
      {sub === "sentiment" ? <MarketsTab /> : <SMCAnalysis />}
    </div>
  );
};

/* ── ACTIVITY: the live stream (trades + signals + predictions) + prediction markets ── */
const ActivitySection = () => {
  const [sub, setSub] = useState("stream");
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} tabs={[
        { id: "stream", label: "Live Stream", icon: Activity },
        { id: "predictions", label: "Predictions", icon: Scale },
      ]} />
      {sub === "stream" ? <ArenaTab /> : <FuturesTab />}
    </div>
  );
};

/* ── TRADERS: leaderboard + all-time legends + season awards ── */
const TradersSection = () => {
  const [sub, setSub] = useState("leaderboard");
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} tabs={[
        { id: "leaderboard", label: "Leaderboard", icon: Users },
        { id: "legends", label: "Legends", icon: Trophy },
        { id: "awards", label: "Awards", icon: Award },
      ]} />
      {sub === "leaderboard" ? <TradersTab /> : sub === "legends" ? <HallOfFameTab /> : <AwardsTab />}
    </div>
  );
};

/* ── ANALYZE (Pro): the expert workbench ── */
const AnalyzeSection = () => {
  const [sub, setSub] = useState("portfolio");
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} tabs={[
        { id: "portfolio", label: "Portfolio", icon: Briefcase },
        { id: "tradelab", label: "Trade Lab", icon: Beaker },
        { id: "toptrades", label: "Top Trades", icon: Flame },
      ]} />
      {sub === "portfolio" ? <PortfolioTab /> : sub === "tradelab" ? <TradeLabTab /> : <TopTradesTab />}
    </div>
  );
};

export { MarketsSection, ActivitySection, TradersSection, AnalyzeSection };
