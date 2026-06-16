import { useState } from "react";
import { Award, BarChart3, Flame, Gamepad2, Globe, Lightbulb, Receipt, Target, Trophy, Users, Wallet } from "lucide-react";
import { C } from "../theme";
import { CoinSelector } from "./CoinSelector";
import { MarketsTab } from "./tabs/MarketsTab";
import { SMCAnalysis } from "./tabs/SMCAnalysis";
import { RobotinSignals } from "./tabs/RobotinSignals";
import { CoinPositioning } from "./tabs/CoinPositioning";
import { ArenaTab } from "./tabs/ArenaTab";
import { smcCoins } from "../data/mockData";
import { ROBOTIN_COINS } from "../data/robotin";
import { TradersTab } from "./tabs/TradersTab";
import { HallOfFameTab } from "./tabs/HallOfFameTab";
import { AwardsTab } from "./tabs/AwardsTab";
import { PortfolioTab } from "./tabs/PortfolioTab";
import { TopTradesTab } from "./tabs/TopTradesTab";
import { RobotinWallet } from "./tabs/RobotinWallet";

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
  const [view, setView] = useState("signals"); // signals | trades | structure | positioning
  const [allCoins, setAllCoins] = useState(false);

  const pickCoin = (c) => { setCoin(c); setAllCoins(false); };

  return (
    <div>
      {/* Top bar: "All coins" sits at the SAME level as the coin selector, so it
         no longer breaks the per-coin navigation below. */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
        <button onClick={() => setAllCoins(true)} style={{
          display: "flex", alignItems: "center", gap: "7px", padding: "9px 14px", borderRadius: "8px",
          fontSize: "13px", fontWeight: "700", cursor: "pointer", transition: "all 0.15s",
          border: `1px solid ${allCoins ? C.purple : C.border}`,
          backgroundColor: allCoins ? C.purpleBg : "transparent",
          color: allCoins ? C.purple : C.textMuted,
        }}><Globe size={15} /> All coins</button>
        <div style={{ width: 1, height: 26, backgroundColor: C.border }} />
        <div style={{ opacity: allCoins ? 0.55 : 1, transition: "opacity 0.15s" }}>
          <CoinSelector coins={ROBOTIN_COINS} selected={coin} onSelect={pickCoin} meta={smcCoins} categories={COIN_CATEGORIES} />
        </div>
      </div>

      {allCoins ? (
        <MarketsTab onPick={pickCoin} activeCoin={coin} />
      ) : (
        <>
          <SubTabs active={view} onChange={setView} tabs={[
            { id: "signals", label: "Signals", icon: Lightbulb },
            { id: "trades", label: "Trades", icon: Receipt },
            { id: "structure", label: "Structure", icon: Target },
            { id: "positioning", label: "Positioning", icon: Gamepad2 },
          ]} />
          {view === "signals" && <RobotinSignals coin={coin} embedded />}
          {view === "trades" && <RobotinSignals coin={coin} embedded onlyTrades />}
          {view === "structure" && <SMCAnalysis coin={coin} embedded />}
          {view === "positioning" && <CoinPositioning coin={coin} />}
        </>
      )}
    </div>
  );
};

/* ── ACTIVITY: the global live stream of trades + signals across all traders. ── */
const ActivitySection = () => <ArenaTab />;

/* ── TRADERS: leaderboard + best/worst plays + all-time legends + season awards.
   "Top Trades" (formerly in Analyze) lives here — it's about traders' plays. ── */
const TradersSection = () => {
  const [sub, setSub] = useState("leaderboard");
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} tabs={[
        { id: "leaderboard", label: "Leaderboard", icon: Users },
        { id: "toptrades", label: "Top Trades", icon: Flame },
        { id: "legends", label: "Legends", icon: Trophy },
        { id: "awards", label: "Awards", icon: Award },
      ]} />
      {sub === "leaderboard" ? <TradersTab /> : sub === "toptrades" ? <TopTradesTab /> : sub === "legends" ? <HallOfFameTab /> : <AwardsTab />}
    </div>
  );
};

/* ── ROBOTÍN: the bot's execution Wallet + system Analytics (Portfolio folded in,
   since Robotín executes every approved signal, its book IS the system book). ── */
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
