import { BotTag, StatCard, Tag } from "../common";
import { useProfile } from "../../contexts";
import { feedItems, mockTraders } from "../../data/mockData";
import { C, cardStyle, mono, pillStyle } from "../../theme";
import { Flame, Lightbulb, Target, TrendingUp, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
/* ═══════════════════════ TAB: HALL OF FAME ═══════════════════════ */
const HallOfFameTab = () => {
  const { openProfile } = useProfile();
  const [activeCategory, setActiveCategory] = useState("trades");
  const [activeSeason, setActiveSeason] = useState("all");

  const topTrades = useMemo(() =>
    feedItems.filter(f => f.kind === "trade" && f.status !== "active")
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0, 10), []);
  const topSignals = useMemo(() =>
    feedItems.filter(f => f.kind === "signal")
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).slice(0, 10), []);
  const topPredictions = useMemo(() =>
    feedItems.filter(f => f.kind === "prediction")
      .sort((a, b) => b.stake - a.stake).slice(0, 10), []);

  const activeData = activeCategory === "signals" ? topSignals : activeCategory === "predictions" ? topPredictions : topTrades;
  const bestTrade = topTrades.length > 0 ? topTrades[0] : null;

  const getTierFrame = (i) => {
    if (i < 3) return { border: `2px solid ${C.amber}`, glow: `0 0 20px ${C.amber}30` };
    if (i < 6) return { border: `2px solid ${C.textMuted}`, glow: `0 0 15px ${C.textMuted}20` };
    return { border: `1px solid ${C.amber}66`, glow: "none" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ ...cardStyle, padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "28px", fontWeight: "900", marginBottom: "6px" }}>🏆 Hall of Fame</div>
        <div style={{ fontSize: "12px", color: C.textMuted }}>Museum of legendary trades, signals, and predictions. The Greatest Hits.</div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {[{ id: "trades", label: "Top Trades", icon: TrendingUp }, { id: "signals", label: "Top Signals", icon: Lightbulb }, { id: "predictions", label: "Top Predictions", icon: Target }].map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
            flex: 1, padding: "10px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
            border: activeCategory === cat.id ? `2px solid ${C.amber}` : `1px solid ${C.border}`,
            backgroundColor: activeCategory === cat.id ? `${C.amber}15` : C.card,
            color: activeCategory === cat.id ? C.amber : C.text, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
          }}><cat.icon size={14} />{cat.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {["all", "s1"].map(s => (
          <button key={s} onClick={() => setActiveSeason(s)} style={pillStyle(activeSeason === s ? C.amber : C.textFaint)}>
            {s === "all" ? "All Time" : "Season 1"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <StatCard label="Total Legendary" value={feedItems.filter(f => f.kind === "trade").length} icon={Trophy} color={C.amber} />
        <StatCard label="Best Single Trade" value={bestTrade ? `+$${(bestTrade.pnl / 1000).toFixed(1)}K` : "—"} icon={Flame} color={C.amber} />
        <StatCard label="Top Win Rate" value={`${mockTraders[0].winRate}%`} sub={mockTraders[0].name} icon={Target} color={C.green} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        {activeData.map((item, idx) => {
          const tier = getTierFrame(idx);
          const trader = mockTraders.find(t => t.name === item.trader);
          if (!trader) return null;
          const medal = idx < 3 ? "🥇" : idx < 6 ? "🥈" : "🥉";
          return (
            <div key={`${activeCategory}-${idx}`} onClick={() => openProfile(trader)} className="card-hover card-glow" style={{
              ...cardStyle, border: tier.border, boxShadow: tier.glow, padding: "14px", cursor: "pointer", position: "relative",
              animation: "fadeInUp 0.3s ease both", animationDelay: `${idx * 0.04}s`
            }}>
              <div style={{ position: "absolute", top: "8px", right: "10px", fontSize: "16px" }}>{medal}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "20px" }}>{trader.avatar}</span>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700" }}>{trader.name}</div>
                  <BotTag isBot={trader.isBot} />
                </div>
              </div>
              {activeCategory === "trades" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div><Tag text={item.type} color={item.type === "LONG" ? C.green : C.red} /><span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "6px", ...mono }}>{item.pair}</span></div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: item.pnl >= 0 ? C.green : C.red, ...mono }}>{item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "10px", color: C.textMuted }}>
                    <span>Entry: <span style={{ color: C.text, ...mono }}>${item.entry?.toLocaleString()}</span></span>
                    <span>TP: <span style={{ color: C.green, ...mono }}>${item.tp?.toLocaleString()}</span></span>
                  </div>
                </>
              )}
              {activeCategory === "signals" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Tag text={item.bias} color={item.bias === "LONG" ? C.green : C.red} />
                    <span style={{ fontSize: "11px", color: C.textMuted, ...mono }}>{item.pair}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "6px", lineHeight: "1.4" }}>{item.idea?.substring(0, 80)}...</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div><span style={{ fontSize: "9px", color: C.textMuted }}>Confidence</span><div style={{ fontSize: "14px", fontWeight: "700", color: C.blue, ...mono }}>{item.confidence}%</div></div>
                    <div style={{ textAlign: "right" }}><span style={{ fontSize: "9px", color: C.textMuted }}>TF</span><div style={{ fontSize: "11px", fontWeight: "600", ...mono }}>{item.timeframe}</div></div>
                  </div>
                </>
              )}
              {activeCategory === "predictions" && (
                <>
                  <div style={{ fontSize: "11px", color: C.text, marginBottom: "8px", lineHeight: "1.4" }}>{item.question?.substring(0, 60)}...</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                    <div><span style={{ color: C.textMuted }}>Bet</span><div><Tag text={item.bet} color={item.bet === "YES" ? C.green : C.red} /></div></div>
                    <div style={{ textAlign: "center" }}><span style={{ color: C.textMuted }}>Stake</span><div style={{ fontWeight: "700", ...mono }}>${item.stake}</div></div>
                    <div style={{ textAlign: "right" }}><span style={{ color: C.textMuted }}>Odds</span><div style={{ fontWeight: "700", color: C.cyan, ...mono }}>{item.odds}%</div></div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


export {
  HallOfFameTab
};
