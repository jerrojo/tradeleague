import { CoinSelector } from "../CoinSelector";
import { InfoTip, StatCard, Tag } from "../common";
import { useProMode } from "../../contexts";
import { smcCoins } from "../../data/mockData";
import { C, cardStyle, mono } from "../../theme";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle, Target } from "lucide-react";
import { useState } from "react";
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Coin Selector — hidden when the Coin Hub owns the coin ── */}
      {!embedded && (
        <CoinSelector coins={Object.keys(smcCoins)} selected={selectedCoin} onSelect={setSelectedCoin} meta={smcCoins} categories={categories} />
      )}

      {/* Stats Row — price lives in the hub header, so structure leads with bias/strength/risk */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <StatCard label="Direction" value={coin.bias === "BULLISH" ? "↑ UP" : "↓ DOWN"} icon={coin.biasIcon === "up" ? ArrowUp : ArrowDown} color={biasColor} tip="bias" />
        <StatCard label="Signal Strength" value={`${coin.confluence}/10`} icon={Target} color={C.blue} tip="confluence" />
        <StatCard label="Risk Level" value={coin.risk === "LOW" ? "LOW" : coin.risk === "MEDIUM" ? "MEDIUM" : "HIGH"} icon={AlertTriangle} color={riskColor} tip="riskLevel" />
      </div>

      {/* Multi-Timeframe Grid — Pro only (dense SMC structure) */}
      {proMode && (
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Multi-Timeframe Analysis — {selectedCoin}/{coin.pair}</div>
        <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "10px" }}>Multi-Timeframe Analysis shows what happens across different time scales (minutes → hours)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {coin.tfData.map(tf => (
            <div key={tf.tf} style={cardStyle}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: C.purple, marginBottom: "12px" }}>{tf.tf === "15m" ? "15 min" : tf.tf === "1H" ? "1 hour" : "4 hours"}</div>
              {[
                ["Trend", tf.trend === "Bullish" ? "↑ Bullish" : tf.trend === "Bearish" ? "↓ Bearish" : "↔ Sideways", tf.trend === "Bullish" ? C.green : tf.trend === "Bearish" ? C.red : C.amber, null],
                ["Structure", tf.struct, tf.struct === "BOS" ? C.green : C.red, tf.struct === "BOS" ? "bos" : "choch"],
                ["Order Block", tf.ob.includes("Bullish")  ? "Buy" : "Sell", tf.ob.includes("Bullish") ? C.green : C.red, "ob"],
                ["Price Gap", tf.fvg === "Filled"  ? "Filled" : "Pending", tf.fvg === "Filled" ? C.green : C.amber, "fvg"],
                ["Liquidity", tf.liq === "Sweep Done" ? "✅ Captured" : tf.liq, C.blue, "liquidity"],
              ].map(([label, val, clr, tipKey]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "11px", color: C.textMuted }}>
                    {tipKey ? <InfoTip k={tipKey} inline><span>{label}</span></InfoTip> : label}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: clr }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Ideal Entry + Kill Zones side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ideal Entry — {selectedCoin}</div>
          <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "14px" }}>Where to enter, how much you can gain, and where to cut losses</div>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <InfoTip k="killZone" inline><span>Key Sessions</span></InfoTip>
          </div>
          {killZones.map(z => (
            <div key={z.name} style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: z.active ? C.green : C.textFaint }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600" }}>{z.name}</div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>{z.time}</div>
                </div>
              </div>
              <Tag text={z.active ? "ACTIVE" : "INACTIVE"} color={z.active ? C.green : C.textFaint} />
            </div>
          ))}
        </div>
      </div>

      {/* Safety Checks — Pro only (funding / OI / correlation) */}
      {proMode && (
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Safety Check — {selectedCoin}</div>
        <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "10px" }}>Indicators confirming whether it's safe to trade right now</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {coin.safety.map(c => {
            const tipMap = { "Funding Rate": "fundingRate", "Open Interest": "openInterest" };
            const nameMap = { "Funding Rate": "Funding Rate", "Open Interest": "Open Interest", "Volume": "Volume", "Correlation": "Correlation" };
            return (
              <div key={c.name} style={{ ...cardStyle, textAlign: "center" }}>
                {c.status === "pass" ? <CheckCircle size={22} color={C.green} /> : <AlertTriangle size={22} color={C.amber} />}
                <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "8px" }}>
                  {tipMap[c.name] ? <InfoTip k={tipMap[c.name]} inline><span>{nameMap[c.name] || c.name}</span></InfoTip> : (nameMap[c.name] || c.name)}
                </div>
                <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px", ...mono }}>{c.detail}</div>
                <div style={{ fontSize: "10px", color: c.status === "pass" ? C.green : C.amber, marginTop: "4px", textTransform: "uppercase", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>{c.status === "pass" ? <><CheckCircle size={10} /> OK</> : <><AlertTriangle size={10} /> Warning</>}</div>
              </div>
            );
          })}
        </div>
      </div>
      )}

    </div>
  );
};


export {
  SMCAnalysis
};
