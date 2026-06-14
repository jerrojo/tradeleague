import { useState } from "react";
import { Beaker } from "lucide-react";
import { TradeLab } from "../TradeLab";
import { mockTraders, traderDeepData } from "../../data/mockData";
import { Avatar, BotTag } from "../common";
import { C, cardStyle, mono, tierColor } from "../../theme";

/* ═══════════════════════ TAB: TRADE LAB (top-level, VARIV moat) ═══════════════════════
   The counterfactual attribution sandbox, promoted out of the profile sub-tab to a
   first-class Analyze destination with its own trader picker. */
const TradeLabTab = () => {
  const ranked = [...mockTraders].sort((a, b) => a.rank - b.rank);
  const [name, setName] = useState(ranked[0]?.name);
  const trader = mockTraders.find(t => t.name === name) || ranked[0];
  const history = traderDeepData[trader.name]?.history || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Trader picker */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "4px" }}>
          <Beaker size={16} color={C.purple} />
          <span style={{ fontSize: "12px", fontWeight: "700" }}>Whose track record do you want to stress-test?</span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
          {ranked.map(t => {
            const on = t.name === trader.name;
            const tc = tierColor[t.tier] || C.textMuted;
            return (
              <button key={t.name} onClick={() => setName(t.name)} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px",
                fontSize: "11px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s",
                border: `1px solid ${on ? C.purple : C.border}`,
                backgroundColor: on ? C.purpleBg : "transparent",
                color: on ? C.text : C.textMuted,
              }}>
                <Avatar name={t.name} size={20} />
                <span>{t.name}</span>
                <BotTag isBot={t.isBot} />
                <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: tc }} />
                <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>#{t.rank}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* The lab itself */}
      <TradeLab key={trader.name} trader={trader} history={history} />
    </div>
  );
};

export { TradeLabTab };
