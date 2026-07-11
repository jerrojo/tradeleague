import { CoinSelector } from "../CoinSelector";
import { useNav } from "../../contexts";
import { InfoTip, SectionHeader } from "../common";
import { smcCoins, mockTraders } from "../../data/mockData";
import { coinCandles, coinSignals, COIN_PX } from "../../data/robotin";
import { price as fmtPrice } from "../../lib/format";
import { C, cardStyle, mono } from "../../theme";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle, Crosshair, Target, Users } from "lucide-react";
import { useMemo, useState } from "react";

/* ═══════════════════════ COIN STRUCTURE (SMC) — LIVE CONSENSUS ═══════════════════════
   Everything here is derived from the coin's APPROVED signals (not static strings),
   so the entry zone, targets, stop, direction and confluence always track the live
   simulated price instead of drifting away from it. */

const SETUP_NAME = { OB: "Order Block", FVG: "Fair Value Gap", LIQ: "Liquidity", BOS: "Break of Structure", CHOCH: "Change of Character" };
const SETUP_TIP = { OB: "ob", FVG: "fvg", LIQ: "liquidity", BOS: "bos", CHOCH: "bos" };

const SMCAnalysis = ({ coin: coinProp, embedded = false } = {}) => {
  const { go } = useNav();
  const [coinState, setSelectedCoin] = useState("BTC");
  const selectedCoin = coinProp ?? coinState; // controlled by the Coin Hub when embedded

  const categories = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "AI"];

  // ── Live consensus synthesised from this coin's approved signals ──
  const con = useMemo(() => {
    const all = coinSignals(selectedCoin, coinCandles(selectedCoin)).filter((s) => s.approved);
    const sized = all.filter((s) => s.entry && s.sl);
    if (!sized.length) return null;
    const longs = sized.filter((s) => s.dir === "LONG").length;
    const dir = longs >= sized.length - longs ? "LONG" : "SHORT";
    const dirSigs = sized.filter((s) => s.dir === dir);
    const avg = (f) => dirSigs.reduce((a, s) => a + f(s), 0) / dirSigs.length;
    const entryAvg = avg((s) => s.entry);
    const entryLo = Math.min(...dirSigs.map((s) => s.entry));
    const entryHi = Math.max(...dirSigs.map((s) => s.entry));
    const sl = avg((s) => s.sl);
    const tp1 = avg((s) => s.tp1), tp2 = avg((s) => s.tp2), tp3 = avg((s) => s.tp3);
    const rr = Math.abs(entryAvg - sl) > 0 ? Math.abs(tp1 - entryAvg) / Math.abs(entryAvg - sl) : 0;
    const setups = [...new Set(dirSigs.map((s) => s.setup))];
    const stopDist = avg((s) => (Math.abs(s.entry - s.sl) / s.entry) * 100);
    // crowd vs outcome: how one-sided the book is vs how often it actually wins
    const longPct = Math.round((longs / sized.length) * 100);
    const closed = all.filter((s) => s.status === "closed");
    const winRate = closed.length ? Math.round((closed.filter((s) => s.hit === "TP").length / closed.length) * 100) : null;
    const traders = new Set(all.map((s) => s.trader)).size;
    return { dir, entryLo, entryHi, sl, tp1, tp2, tp3, rr, setups, stopDist, longPct, winRate, traders, n: dirSigs.length, total: all.length, px: COIN_PX[selectedCoin] };
  }, [selectedCoin]);

  const dirColor = con && con.dir === "LONG" ? C.green : C.red;
  const stopColor = !con ? C.textMuted : con.stopDist <= 1.2 ? C.green : con.stopDist <= 2.5 ? C.amber : C.red;
  // crowd-and-wrong: heavily one-sided book with a sub-50% realized win rate
  const skew = con ? Math.max(con.longPct, 100 - con.longPct) : 0;
  const crowdedWrong = con && con.winRate != null && skew >= 70 && con.winRate < 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {!embedded && (
        <CoinSelector coins={Object.keys(smcCoins)} selected={selectedCoin} onSelect={setSelectedCoin} meta={smcCoins} categories={categories} />
      )}

      <div style={cardStyle}>
        <div style={{ marginBottom: "14px" }}>
          <SectionHeader
            icon={Crosshair}
            title={`Consensus signal — ${selectedCoin}`}
            subtitle={con ? `Live synthesis from ${con.traders} providers' approved signals — where to enter, the targets, and the stop` : "No approved signals for this coin in view"}
            right={con && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "11px", fontWeight: 800, color: dirColor, backgroundColor: `${dirColor}1c`, border: `1px solid ${dirColor}40`, padding: "2px 9px", borderRadius: 5 }}>{con.dir === "LONG" ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {con.dir}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "10px", fontWeight: 700, color: C.blue, backgroundColor: C.blueBg, border: `1px solid ${C.blue}30`, padding: "2px 8px", borderRadius: 5 }} title="Confluence — distinct structure setups backing the call"><Target size={11} /> {con.setups.length}/5</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "10px", fontWeight: 700, color: stopColor, backgroundColor: `${stopColor}1c`, border: `1px solid ${stopColor}30`, padding: "2px 8px", borderRadius: 5 }} title="Average entry → stop distance across this coin's approved signals"><AlertTriangle size={11} /> {con.stopDist.toFixed(2)}% stop</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "10px", fontWeight: 700, color: C.purple, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}30`, padding: "2px 8px", borderRadius: 5 }}><Users size={11} /> {con.traders}/{mockTraders.length}</span>
              </div>
            )}
          />
        </div>

        {!con ? (
          <div style={{ padding: "24px", textAlign: "center", color: C.textMuted, fontSize: 12 }}>Widen the timeframe to see Robotín's consensus for {selectedCoin}.</div>
        ) : (
          <>
            <div style={{ fontSize: 10, color: C.textFaint, marginBottom: 8 }}>Live price <span style={{ color: C.text, ...mono }}>{fmtPrice(con.px)}</span> · levels averaged across{" "}
              <span role="button" tabIndex={0} title={`See the ${con.n} approved ${con.dir} signals these levels come from`}
                onClick={() => go("activity", { coin: selectedCoin, book: "approved", dir: con.dir })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("activity", { coin: selectedCoin, book: "approved", dir: con.dir }); } }}
                style={{ cursor: "pointer", color: C.text, fontWeight: 700, borderBottom: `1px dashed ${C.purple}55` }}>
                {con.n} approved {con.dir} signal{con.n === 1 ? "" : "s"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              {[
                ["Entry Zone", `${fmtPrice(Math.min(con.entryLo, con.entryHi))} – ${fmtPrice(Math.max(con.entryLo, con.entryHi))}`, C.text, "entryZone"],
                ["Risk:Reward", `1 : ${con.rr.toFixed(1)}`, con.rr >= 1.5 ? C.green : C.amber, "rr"],
                ["Target 1", fmtPrice(con.tp1), C.blue, "tp"],
                ["Target 2", fmtPrice(con.tp2), C.blue, "tp"],
                ["Target 3", fmtPrice(con.tp3), C.blue, "tp"],
                ["Stop Loss", fmtPrice(con.sl), C.red, "sl"],
              ].map(([l, v, clr, tipKey]) => (
                <div key={l}>
                  <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "2px" }}>
                    <InfoTip k={tipKey} inline><span>{l}</span></InfoTip>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: clr, ...mono }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Crowd vs outcome — is the book one-sided, and does that side actually win? */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 14, border: `1px solid ${crowdedWrong ? C.red : C.border}`, backgroundColor: crowdedWrong ? `${C.red}0d` : C.bg }}>
              <Users size={15} color={crowdedWrong ? C.red : C.textMuted} />
              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                Book is <b style={{ color: C.text }}>{skew}%</b> {con.longPct >= 50 ? "long" : "short"}
                {con.winRate != null && <> · approved win rate <b style={{ color: con.winRate >= 50 ? C.green : C.red }}>{con.winRate}%</b></>}
                {" — "}
                <b style={{ color: crowdedWrong ? C.red : con.winRate != null && con.winRate >= 50 ? C.green : C.textMuted }}>
                  {crowdedWrong ? "crowded & underperforming" : con.winRate != null && con.winRate >= 50 ? "one-sided and winning" : "balanced read"}
                </b>.
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
              <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px", fontWeight: "600" }}>
                <InfoTip k="confluence" inline><span>CONFIRMATION FACTORS</span></InfoTip>
              </div>
              <div style={{ fontSize: "10px", color: C.textFaint, marginBottom: "8px" }}>Distinct structure setups across the approved {con.dir} signals</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {con.setups.map((s) => (
                  <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: C.green }}>
                    <CheckCircle size={12} />
                    {SETUP_TIP[s] ? <InfoTip k={SETUP_TIP[s]} inline><span>{SETUP_NAME[s] || s}</span></InfoTip> : (SETUP_NAME[s] || s)}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { SMCAnalysis };
