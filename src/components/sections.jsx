import { useState } from "react";
import { BarChart3, Wallet } from "lucide-react";
import { C } from "../theme";
import { CoinSelector } from "./CoinSelector";
import { SMCAnalysis } from "./tabs/SMCAnalysis";
import { RobotinSignals } from "./tabs/RobotinSignals";
import { CoinPositioning } from "./tabs/CoinPositioning";
import { HomeTab } from "./tabs/HomeTab";
import { TradersTab } from "./tabs/TradersTab";
import { ActivityFeed } from "./tabs/ActivityFeed";
import { PortfolioTab } from "./tabs/PortfolioTab";
import { RobotinWallet } from "./tabs/RobotinWallet";
import { smcCoins } from "../data/mockData";
import { ROBOTIN_COINS } from "../data/robotin";

/* ═══════════════════════ SECTION SUB-NAV ═══════════════════════ */
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

const COIN_CATEGORIES = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "AI"];

/* ── MARKETS: one coin, everything on a single page (no sub-tabs). Pick a coin,
   then scroll its chart + the signals it produced + the trades those became +
   how the crowd is positioned + its structure. Positioning lives right under the
   chart since it's just another lens on the same price. ── */
const MarketsSection = () => {
  const [coin, setCoin] = useState("BTC");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <CoinSelector coins={ROBOTIN_COINS} selected={coin} onSelect={setCoin} meta={smcCoins} categories={COIN_CATEGORIES} />
      {/* Chart + the unified Signal→Trade lifecycle list (Approved/Rejected · Pending/Active/Closed) */}
      <RobotinSignals coin={coin} embedded />
      {/* Positioning — the same price, one more lens */}
      <CoinPositioning coin={coin} />
      {/* Structure (SMC) */}
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

/* ── ROBOTÍN: the bot's execution Wallet + system Analytics. ── */
const RobotinSection = () => {
  const [sub, setSub] = useState("wallet");
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} tabs={[
        { id: "wallet", label: "Wallet", icon: Wallet },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
      ]} />
      {sub === "wallet" ? <RobotinWallet /> : <PortfolioTab />}
    </div>
  );
};

export { MarketsSection, ActivitySection, TradersSection, RobotinSection };
