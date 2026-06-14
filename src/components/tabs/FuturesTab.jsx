import { useMemo, useState } from "react";
import { Scale, Flame, Users, Clock, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { predictionMarkets, predCategories, mockTraders, traderDeepData } from "../../data/mockData";
import { Avatar, BotTag, InfoTip, MiniSparkline } from "../common";
import { useProfile } from "../../contexts";
import { C, cardStyle, mono } from "../../theme";

/* ═══════════════════════ TAB: FUTURES (Prediction Markets) ═══════════════════════
   Crypto prediction markets — the question, the odds, who's betting, and who calls
   them best. Replaces the old football-game view that didn't match the tab's job. */

const OddsBar = ({ yes, no }) => (
  <div>
    <div style={{ display: "flex", height: 22, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ width: `${yes}%`, backgroundColor: `${C.green}28`, borderRight: `1px solid ${C.green}55`, display: "flex", alignItems: "center", paddingLeft: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.green, ...mono }}>YES {yes}%</span>
      </div>
      <div style={{ width: `${no}%`, backgroundColor: `${C.red}20`, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.red, ...mono }}>NO {no}%</span>
      </div>
    </div>
  </div>
);

const FuturesTab = () => {
  const { openProfile } = useProfile();
  const [cat, setCat] = useState("All");

  const markets = useMemo(
    () => (cat === "All" ? predictionMarkets : predictionMarkets.filter(m => m.category === cat)),
    [cat]
  );

  const totals = useMemo(() => ({
    open: predictionMarkets.length,
    volume: predictionMarkets.reduce((a, m) => a + m.volume, 0),
    participants: predictionMarkets.reduce((a, m) => a + m.participants, 0),
  }), []);

  // Oracle leaderboard — who predicts best (from each trader's prediction record)
  const oracles = useMemo(() =>
    mockTraders
      .map(t => {
        const ps = traderDeepData[t.name]?.predStats;
        const acc = ps && ps.total ? Math.round((ps.correct / ps.total) * 100) : 0;
        return { name: t.name, isBot: t.isBot, acc, total: ps?.total ?? 0, streak: ps?.streak ?? 0, t };
      })
      .sort((a, b) => b.acc - a.acc)
      .slice(0, 6)
  , []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Hero stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {[
          ["Open markets", String(totals.open), Scale, C.amber],
          ["Total volume", `$${(totals.volume / 1000).toFixed(0)}K`, TrendingUp, C.green],
          ["Participants", totals.participants.toLocaleString(), Users, C.blue],
        ].map(([l, v, Icon, clr]) => (
          <div key={l} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: `${clr}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={17} color={clr} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 21, fontWeight: 800, ...mono }}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {predCategories.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer",
            border: `1px solid ${cat === c ? C.purple : C.border}`,
            backgroundColor: cat === c ? C.purpleBg : "transparent",
            color: cat === c ? C.purple : C.textMuted,
          }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "14px", alignItems: "start" }}>
        {/* Markets grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {markets.map(m => {
            const trend = m.priceHistory[m.priceHistory.length - 1] - m.priceHistory[0];
            return (
              <div key={m.id} className="card-hover" style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: C.blue, backgroundColor: C.blueBg, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>{m.category}</span>
                  {m.trending && <span style={{ fontSize: 9, fontWeight: 800, color: C.amber, display: "inline-flex", alignItems: "center", gap: 3 }}><Flame size={10} /> Trending</span>}
                  <span style={{ marginLeft: "auto", fontSize: 9, color: C.textFaint, display: "inline-flex", alignItems: "center", gap: 3, ...mono }}><Clock size={9} /> {m.deadline}</span>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, minHeight: 36 }}>{m.question}</div>

                <OddsBar yes={m.yesOdds} no={m.noOdds} />

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: 9, color: C.textFaint, ...mono }}>odds trend</span>
                  <MiniSparkline data={m.priceHistory} width={70} height={18} color={trend >= 0 ? C.green : C.red} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: trend >= 0 ? C.green : C.red, ...mono, display: "inline-flex", alignItems: "center", gap: 2 }}>
                    {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{trend >= 0 ? "+" : ""}{trend}%
                  </span>
                </div>

                <div style={{ display: "flex", gap: "14px", paddingTop: "8px", borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textMuted, ...mono }}>
                  <span><InfoTip k="pot" inline><span>Vol</span></InfoTip> <span style={{ color: C.text, fontWeight: 700 }}>${(m.volume / 1000).toFixed(0)}K</span></span>
                  <span>{m.participants.toLocaleString()} traders</span>
                  <span style={{ marginLeft: "auto", color: C.green }}>{m.yesBets} yes</span>
                  <span style={{ color: C.red }}>{m.noBets} no</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Oracle leaderboard */}
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Trophy size={14} color={C.amber} />
            <span style={{ fontSize: 12, fontWeight: 800 }}>Top Oracles</span>
            <InfoTip k="odds" inline><span style={{ fontSize: 9, color: C.textFaint }}>best callers</span></InfoTip>
          </div>
          {oracles.map((o, i) => (
            <button key={o.name} onClick={() => openProfile(o.t)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
              padding: "9px 14px", background: "transparent", border: "none", cursor: "pointer",
              borderBottom: i < oracles.length - 1 ? `1px solid ${C.border}` : "none",
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.cardHover; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: i < 3 ? C.amber : C.textFaint, width: 14, ...mono }}>{i + 1}</span>
              <Avatar name={o.name} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
                  <BotTag isBot={o.isBot} />
                </div>
                <div style={{ fontSize: 9, color: C.textFaint, ...mono }}>{o.total} calls · {o.streak} streak</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: o.acc >= 70 ? C.green : o.acc >= 55 ? C.amber : C.red, ...mono }}>{o.acc}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { FuturesTab };
