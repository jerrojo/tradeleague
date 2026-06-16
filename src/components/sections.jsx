import { useState } from "react";
import { Activity, Award, Beaker, Briefcase, Flame, Gamepad2, Globe, Lightbulb, Scale, Target, Trophy, Users } from "lucide-react";
import { C } from "../theme";
import { CoinSelector } from "./CoinSelector";
import { MarketsTab } from "./tabs/MarketsTab";
import { SMCAnalysis } from "./tabs/SMCAnalysis";
import { RobotinSignals } from "./tabs/RobotinSignals";
import { CoinPositioning } from "./tabs/CoinPositioning";
import { ArenaTab } from "./tabs/ArenaTab";
import { smcCoins } from "../data/mockData";
import { ROBOTIN_COINS } from "../data/robotin";
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

/* ── MARKETS: the Coin Hub. Pick a coin once (single price, in the selector),
   then move between its Signals, Structure and Positioning — plus an All-coins
   overview. This folds the old standalone Signals tab and Coin Detail into one
   coin-first terminal, killing the duplicated price displays. ── */
const COIN_CATEGORIES = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "AI"];

const MarketsSection = () => {
  const [coin, setCoin] = useState("BTC");
  const [view, setView] = useState("signals"); // signals | structure | positioning | overview
  const onOverview = view === "overview";

  return (
    <div>
      {/* Coin selector (single source of price) — hidden on the coin-agnostic overview */}
      {!onOverview && (
        <div style={{ marginBottom: "14px" }}>
          <CoinSelector coins={ROBOTIN_COINS} selected={coin} onSelect={setCoin} meta={smcCoins} categories={COIN_CATEGORIES} />
        </div>
      )}

      <SubTabs active={view} onChange={setView} tabs={[
        { id: "signals", label: "Signals", icon: Lightbulb },
        { id: "structure", label: "Structure", icon: Target },
        { id: "positioning", label: "Positioning", icon: Gamepad2 },
        { id: "overview", label: "All coins", icon: Globe },
      ]} />

      {view === "signals" && <RobotinSignals coin={coin} embedded />}
      {view === "structure" && <SMCAnalysis coin={coin} embedded />}
      {view === "positioning" && <CoinPositioning coin={coin} />}
      {view === "overview" && <MarketsTab />}
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
