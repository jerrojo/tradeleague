import { CoinSelector } from "../CoinSelector";
import { InfoTip, SectionHeader, StatCard, Tag } from "../common";
import { useProMode } from "../../contexts";
import { smcCoins, mockTraders } from "../../data/mockData";
import { coinCandles, coinSignals } from "../../data/robotin";
import { C, cardStyle, mono } from "../../theme";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle, Crosshair, Target, Users } from "lucide-react";
import { useMemo, useState } from "react";
/* ═══════════════════════ COIN STRUCTURE (SMC) ═══════════════════════ */
const SMCAnalysis = ({ coin: coinProp, embedded = false } = {}) => {
  const [coinState, setSelectedCoin] = useState("BTC");
  const selectedCoin = coinProp ?? coinState; // controlled by the Coin Hub when embedded
  const proMode = useProMode(); // Simple hides the dense SMC structure + safety checks
  const coin = smcCoins[selectedCoin];

  const categories = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "AI"];

  const killZones = [
    { name: "Asia", time: "00:00–08:00 UTC", active: false },
    { name: "London", time: "08:00–16:00 UTC", active: true },
    { name: "NY AM", time: "13:00–17:00 UTC", active: true },
    { name: "NY PM", time: "17:00–21:00 UTC", active: false },
  ];

  const riskColor = coin.risk === "LOW" ? C.green : coin.risk === "MEDIUM" ? C.amber : C.red;
  const biasColor = coin.bias === "BULLISH" ? C.green : C.red;

  // Consensus source count — how many distinct traders' approved signals back this synthesis
  const sourceCount = useMemo(() => {
    const sigs = coinSignals(selectedCoin, coinCandles(selectedCoin)).filter((s) => s.approved);
    return { traders: new Set(sigs.map((s) => s.trader)).size, total: mockTraders.length };
  }, [selectedCoin]);

  // Concrete risk: average entry→stop distance (%) across this asset's approved signals —
  // replaces the subjective "MEDIUM" label with a measurable, data-driven number.
  const stopDist = useMemo(() => {
    const sigs = coinSignals(selectedCoin, coinCandles(selectedCoin)).filter((s) => s.approved && s.entry && s.sl);
    if (!sigs.length) return null;
    const avg = sigs.reduce((a, s) => a + (Math.abs(s.entry - s.sl) / s.entry) * 100, 0) / sigs.length;
    return Math.round(avg * 100) / 100;
  }, [selectedCoin]);
  const stopColor = stopDist == null ? C.textMuted : stopDist <= 1.2 ? C.green : stopDist <= 2.5 ? C.amber : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Coin Selector — hidden when the Coin Hub owns the coin ── */}
      {!embedded && (
        <CoinSelector coins={Object.keys(smcCoins)} selected={selectedCoin} onSelect={setSelectedCoin} meta={smcCoins} categories={categories} />
      )}

      {/* Stats Row — direction/sentiment lives in the Positioning compass above, so
          Structure leads with signal strength + risk (no duplicate direction read) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        <StatCard label="Signal Strength" value={`${coin.confluence}/10`} icon={Target} color={C.blue} tip="confluence" />
        <StatCard label="Avg Stop Distance" value={stopDist == null ? "—" : `${stopDist.toFixed(2)}%`} icon={AlertTriangle} color={stopColor} tip="stopDistance" sub="entry → stop, per signal" />
      </div>


      {/* Ideal Entry */}
      <div>
        <div style={cardStyle}>
          <div style={{ marginBottom: "14px" }}>
            <SectionHeader
              icon={Crosshair}
              title={`Consensus signal — ${selectedCoin}`}
              subtitle={`Robotín synthesis from ${sourceCount.traders} traders' approved signals — where to enter, the targets, and the stop`}
              right={<span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "10px", fontWeight: 700, color: C.purple, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}30`, padding: "2px 8px", borderRadius: 5 }}><Users size={11} /> {sourceCount.traders}/{sourceCount.total} traders</span>}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[
              ["Entry Zone", coin.entry.zone, C.text, "entryZone"],
              ["Risk:Reward", coin.entry.rr, C.green, "rr"],
              ["Target 1", coin.entry.tp1, C.blue, "tp"],
              ["Target 2", coin.entry.tp2, C.blue, "tp"],
              ["Target 3", coin.entry.tp3, C.blue, "tp"],
              ["Stop Loss", coin.entry.sl, C.red, "sl"],
            ].map(([l, v, clr, tipKey]) => (
              <div key={l}>
                <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "2px" }}>
                  <InfoTip k={tipKey} inline><span>{l}</span></InfoTip>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: clr, ...mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px", fontWeight: "600" }}>
              <InfoTip k="confluence" inline><span>CONFIRMATION FACTORS</span></InfoTip>
            </div>
            <div style={{ fontSize: "10px", color: C.textFaint, marginBottom: "8px" }}>More factors = more reliable signal</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {coin.confluenceFactors.map(f => {
                const tipMap = { "Order Block": "ob", "FVG": "fvg", "Liquidity": "liquidity", "Kill Zone": "killZone", "BOS": "bos" };
                return (
                  <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: C.green, cursor: tipMap[f] ? "help" : "default" }}>
                    <CheckCircle size={12} />
                    {tipMap[f] ? <InfoTip k={tipMap[f]} inline><span>{f}</span></InfoTip> : f}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};


export {
  SMCAnalysis
};
