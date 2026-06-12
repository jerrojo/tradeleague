import { BotTag } from "../common";
import { useProfile } from "../../contexts";
import { mockTraders } from "../../data/mockData";
import { C, cardStyle, mono, tierColor } from "../../theme";
import { useState } from "react";
/* ═══════════════════════ TAB: AWARDS ═══════════════════════ */
const AwardsTab = () => {
  const { openProfile } = useProfile();
  const [season, setSeason] = useState("Season 1");

  const awards = [
    { id: 1, icon: "🏆", category: "Trader of the Season", desc: "Highest risk-adjusted returns", winner: mockTraders[0], stat: { label: "Sharpe Ratio", value: `${mockTraders[0].sharpe}` } },
    { id: 2, icon: "🎯", category: "Sniper", desc: "Best single trade ROI", winner: mockTraders[3], stat: { label: "Best Trade", value: mockTraders[3].bestMonth } },
    { id: 3, icon: "📊", category: "Signal Master", desc: "Most accurate signal provider", winner: mockTraders[1], stat: { label: "Win Rate", value: `${mockTraders[1].winRate}%` } },
    { id: 4, icon: "🔮", category: "Oracle", desc: "Best prediction accuracy", winner: mockTraders[2], stat: { label: "Profit Factor", value: `${mockTraders[2].profitFactor}` } },
    { id: 5, icon: "🤖", category: "Best Bot", desc: "Top automated strategy", winner: mockTraders[4], stat: { label: "Monthly Return", value: "+18.3%" } },
    { id: 6, icon: "🛡️", category: "Iron Wall", desc: "Lowest max drawdown while profitable", winner: mockTraders[2], stat: { label: "Max Drawdown", value: `${mockTraders[2].maxDD}%` } },
    { id: 7, icon: "🔥", category: "Streak King", desc: "Longest winning streak", winner: mockTraders[0], stat: { label: "Win Streak", value: `${mockTraders[0].streak} trades` } },
    { id: 8, icon: "🌱", category: "Rising Star", desc: "Best newcomer", winner: mockTraders[5], stat: { label: "PnL", value: `+$${(mockTraders[5].pnl / 1000).toFixed(1)}K` } },
    { id: 9, icon: "🧠", category: "Teacher", desc: "Most helpful content (community voted)", winner: mockTraders[7], stat: { label: "Impressions", value: "45.6K" } },
    { id: 10, icon: "💎", category: "Diamond Hands", desc: "Best long-term hold ROI", winner: mockTraders[4], stat: { label: "Avg Hold", value: mockTraders[4].avgHold } },
  ];
  const uniqueWinners = [...new Set(awards.map(a => a.winner.name))].length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ ...cardStyle, padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "28px", fontWeight: "900", marginBottom: "6px" }}>🏅 The Oscars of Trading</div>
        <div style={{ fontSize: "12px", color: C.textMuted }}>Celebrating skill, not frequency. 10 categories, {uniqueWinners} winners.</div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {["Season 1", "All Time"].map(s => (
          <button key={s} onClick={() => setSeason(s)} style={{
            padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: s === "All Time" ? "not-allowed" : "pointer",
            border: `2px solid ${season === s ? C.amber : C.border}`,
            backgroundColor: season === s ? C.amberBg : "transparent",
            color: season === s ? C.amber : C.textFaint, opacity: s === "All Time" ? 0.5 : 1
          }}>{s}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "11px", color: C.textMuted }}>10 Categories · {uniqueWinners} Winners · {season}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
        {awards.map((award, idx) => (
          <div key={award.id} className="card-hover card-glow" style={{
            ...cardStyle, border: `2px solid ${C.amber}40`, boxShadow: `0 0 12px ${C.amber}15`,
            display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer", transition: "all 0.2s",
            animation: "fadeInUp 0.3s ease both", animationDelay: `${idx * 0.04}s`
          }} onClick={() => openProfile(award.winner)}>
            <div>
              <div style={{ fontSize: "32px", marginBottom: "6px" }}>{award.icon}</div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: C.text, marginBottom: "2px" }}>{award.category}</div>
              <div style={{ fontSize: "11px", color: C.textMuted }}>{award.desc}</div>
            </div>
            <div style={{ ...cardStyle, backgroundColor: `${C.amber}08`, border: `1px solid ${C.amber}30`, padding: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ fontSize: "28px", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${C.amber}15`, borderRadius: "6px", flexShrink: 0 }}>{award.winner.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "700" }}>{award.winner.name}</div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "10px" }}>
                    <span style={{ color: tierColor[award.winner.tier], fontWeight: "700" }}>{award.winner.tier}</span>
                    <BotTag isBot={award.winner.isBot} />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: `1px solid ${C.amber}20` }}>
                <div style={{ fontSize: "9px", color: C.textMuted, marginBottom: "2px" }}>{award.stat.label}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: C.amber, ...mono }}>{award.stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export {
  AwardsTab
};
