import { useMemo, useState } from "react";
import { Award, Crosshair, Flame, Lightbulb, TrendingDown, Trophy } from "lucide-react";
import { C, cardStyle, mono } from "../../theme";
import { Tag } from "../common";
import { TradeStructureDiagram } from "../widgets";
import { useProfile } from "../../contexts";
import { mockTraders, traderDeepData } from "../../data/mockData";
import { topTrades, worstTrades, bestExecuted, qualityLabel } from "../../lib/tradeInsights";

/* ═══════════════════════════════════════════════════════════════════════════
   TOP TRADES — which plays were the best/worst across every trader, and WHY.
   Each card explains the drivers behind the result and the lesson to take.
   ═══════════════════════════════════════════════════════════════════════════ */

const QualityMeter = ({ score }) => {
  const color = score >= 80 ? C.green : score >= 65 ? C.blue : score >= 45 ? C.amber : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: 5, backgroundColor: C.border, borderRadius: 3, overflow: "hidden", minWidth: 70 }}>
        <div style={{ width: `${score}%`, height: "100%", backgroundColor: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, ...mono, whiteSpace: "nowrap" }}>{score} · {qualityLabel(score)}</span>
    </div>
  );
};

const TradeCard = ({ t, rank, mode, onOpen }) => {
  const trader = mockTraders.find((x) => x.name === t.trader);
  const win = t.outcome === "WIN";
  const accent = mode === "worst" ? C.red : win ? C.green : C.amber;
  const medal = rank != null && rank < 3 ? ["🥇", "🥈", "🥉"][rank] : null;
  return (
    <div style={{ ...cardStyle, padding: 14, borderLeft: `3px solid ${accent}`, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {medal && <span style={{ fontSize: 16 }}>{medal}</span>}
        <span style={{ fontSize: 18 }}>{trader?.avatar}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button onClick={() => trader && onOpen(trader)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.text, fontSize: 13, fontWeight: 700, borderBottom: `1px dashed ${C.purple}40` }}>{t.trader}</button>
          <div style={{ fontSize: 10, color: C.textMuted, ...mono }}>{t.pair} · {t.style} · {t.session} · {t.date}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: t.pnl >= 0 ? C.green : C.red, ...mono }}>{t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: C.textMuted, ...mono }}>{t.pnlPct >= 0 ? "+" : ""}{t.pnlPct}% · {t.leverage} · {t.rMultiple >= 0 ? "+" : ""}{t.rMultiple}R</div>
        </div>
      </div>

      {/* badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <Tag text={t.type} color={t.type === "LONG" ? C.green : C.red} />
        {t.tpReached && t.tpReached !== "NONE" && <Tag text={t.tpReached} color={C.green} />}
        {t.setupTag
          ? <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3, backgroundColor: `${C.purple}12`, color: C.purple, border: `1px solid ${C.purple}25`, ...mono }}>{t.setupTag.split("_").slice(0, 3).join("·")}</span>
          : <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3, backgroundColor: C.amberBg, color: C.amber, border: `1px dashed ${C.amber}60`, ...mono }}>UNLABELED</span>}
        <div style={{ flex: 1, minWidth: 90 }}><QualityMeter score={t.quality} /></div>
      </div>

      {/* geometry + path */}
      <TradeStructureDiagram entry={t.entry} sl={t.sl} tps={[t.tp1, t.tp2, t.tp3]} close={t.exit} maePct={t.maePct} mfePct={t.mfePct} type={t.type} />

      {/* WHY */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {t.reasons.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, lineHeight: 1.45 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: accent, backgroundColor: `${accent}15`, border: `1px solid ${accent}30`, borderRadius: 3, padding: "2px 5px", height: "fit-content", whiteSpace: "nowrap", ...mono }}>{r.tag}</span>
            <span style={{ color: C.textMuted }}>{r.text}</span>
          </div>
        ))}
      </div>

      {/* lesson */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", backgroundColor: `${C.amber}0c`, border: `1px solid ${C.amber}25`, borderRadius: 6, padding: "8px 10px" }}>
        <Lightbulb size={13} color={C.amber} style={{ marginTop: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: C.text, lineHeight: 1.45, fontWeight: 500 }}>{t.lesson}</span>
      </div>
    </div>
  );
};

const TopTradesTab = () => {
  const { openProfile } = useProfile();
  const [mode, setMode] = useState("top");

  const allTrades = useMemo(
    () => mockTraders.flatMap((t) => (traderDeepData[t.name]?.history || []).map((h) => ({ ...h, trader: t.name }))),
    []
  );

  const data = useMemo(() => {
    if (mode === "worst") return worstTrades(allTrades, 6);
    if (mode === "quality") return bestExecuted(allTrades, 6);
    return topTrades(allTrades, 8);
  }, [mode, allTrades]);

  const wins = allTrades.filter((t) => t.outcome === "WIN");
  const biggest = wins.reduce((a, b) => (b.pnl > (a?.pnl ?? -Infinity) ? b : a), null);
  const avgWinR = wins.length ? (wins.reduce((a, t) => a + (t.rMultiple || 0), 0) / wins.length) : 0;

  const modes = [
    { id: "top", label: "Biggest Wins", icon: Trophy, desc: "Ranked by realized P&L" },
    { id: "quality", label: "Best Executed", icon: Crosshair, desc: "Ranked by quality of play, not size" },
    { id: "worst", label: "Worst Trades", icon: TrendingDown, desc: "What went wrong, and the lesson" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${C.amber}` }}>
        <Flame size={20} color={C.amber} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Top Trades — what worked, what didn't, and why</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>Every play across {mockTraders.length} traders, scored on quality (not just P&L) and explained. Click a name for the full profile and Trade Lab.</div>
        </div>
      </div>

      {/* summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10 }}>
          <Trophy size={16} color={C.amber} />
          <div><div style={{ fontSize: 10, color: C.textMuted }}>Biggest single win</div><div style={{ fontSize: 15, fontWeight: 800, color: C.green, ...mono }}>{biggest ? `+$${biggest.pnl.toLocaleString()}` : "—"}</div><div style={{ fontSize: 9, color: C.textFaint }}>{biggest?.trader} · {biggest?.pair}</div></div>
        </div>
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10 }}>
          <Award size={16} color={C.blue} />
          <div><div style={{ fontSize: 10, color: C.textMuted }}>Avg winning trade</div><div style={{ fontSize: 15, fontWeight: 800, color: C.blue, ...mono }}>+{avgWinR.toFixed(2)}R</div><div style={{ fontSize: 9, color: C.textFaint }}>{wins.length} winning trades</div></div>
        </div>
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10 }}>
          <Crosshair size={16} color={C.green} />
          <div><div style={{ fontSize: 10, color: C.textMuted }}>Trades analyzed</div><div style={{ fontSize: 15, fontWeight: 800, ...mono }}>{allTrades.length}</div><div style={{ fontSize: 9, color: C.textFaint }}>full ML schema, scored on quality</div></div>
        </div>
      </div>

      {/* mode switch */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {modes.map((m) => {
          const on = mode === m.id;
          return (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              flex: "1 1 200px", padding: "10px 12px", borderRadius: 8, cursor: "pointer", textAlign: "left",
              border: `1px solid ${on ? C.amber : C.border}`, backgroundColor: on ? `${C.amber}12` : C.card,
              color: on ? C.amber : C.text, display: "flex", alignItems: "center", gap: 8,
            }}>
              <m.icon size={15} />
              <div><div style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</div><div style={{ fontSize: 9, color: C.textMuted }}>{m.desc}</div></div>
            </button>
          );
        })}
      </div>

      {/* cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {data.map((t, i) => <TradeCard key={t.id} t={t} rank={mode === "worst" ? null : i} mode={mode === "worst" ? "worst" : "top"} onOpen={openProfile} />)}
      </div>
    </div>
  );
};

export { TopTradesTab };
