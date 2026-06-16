import { useMemo, useState } from "react";
import { CandlestickChart, LineChart, Check, X, Clock, Activity, ChevronDown, Cpu } from "lucide-react";
import { CandleChart } from "../CandleChart";
import { CoinSelector } from "../CoinSelector";
import { TradeDetail } from "../TradeDetail";
import { Avatar, BotTag } from "../common";
import { useProfile } from "../../contexts";
import { coinCandles, coinSignals, signalMarkers, ROBOTIN_COINS } from "../../data/robotin";
import { mockTraders } from "../../data/mockData";
import { C, cardStyle, mono } from "../../theme";

const fmt = (p) => (p == null ? "—" : p < 1 ? p.toFixed(4) : p.toLocaleString());

/* Status → label + color */
const STATUS = {
  pending: { label: "Pending", color: C.amber },
  active: { label: "Active", color: C.blue },
  closed_TP: { label: "Take Profit", color: C.green },
  closed_SL: { label: "Stop Loss", color: C.red },
  expired: { label: "No entry", color: C.textFaint },
  rejected: { label: "Rejected", color: C.textFaint },
};
const statusKey = (s) => (s.status === "closed" ? `closed_${s.hit}` : s.status);

const RobotinSignals = ({ coin: coinProp, embedded = false, onlyTrades = false } = {}) => {
  const { openProfile } = useProfile();
  const [coinState, setCoin] = useState("BTC");
  const coin = coinProp ?? coinState; // controlled by the Coin Hub when embedded
  const [chartMode, setChartMode] = useState("candles");
  const [open, setOpen] = useState(null); // expanded signal id

  const candles = useMemo(() => coinCandles(coin), [coin]);
  const signals = useMemo(() => coinSignals(coin, candles), [coin, candles]);
  const markers = useMemo(() => signalMarkers(signals), [signals]);

  const sel = signals.find((s) => s.id === open) || null;
  const priceLines = sel
    ? [
        { price: sel.entry, color: C.text, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "Entry" },
        { price: sel.tp1, color: C.green, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "TP" },
        { price: sel.sl, color: C.red, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "SL" },
      ]
    : [];

  const approved = signals.filter((s) => s.approved).length;

  // Per-coin meta (price + 24-period change) for the shared CoinSelector
  const coinMeta = useMemo(() => {
    const m = {};
    ROBOTIN_COINS.forEach((c) => {
      const cs = coinCandles(c);
      const last = cs[cs.length - 1].close, first = cs[0].close;
      const ch = ((last - first) / first) * 100;
      m[c] = { pair: "USDT", price: fmt(last), change: `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%` };
    });
    return m;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Asset selector (shared component: dropdown + editable favorites) — hidden when the Coin Hub owns the coin */}
      {!embedded && (
        <CoinSelector coins={ROBOTIN_COINS} selected={coin} onSelect={(c) => { setCoin(c); setOpen(null); }} meta={coinMeta} />
      )}

      {/* Chart */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{coin}/USDT — {onlyTrades ? "Robotín-executed trades" : "signals on chart"}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{onlyTrades ? `${approved} trades executed from approved signals · click a row for full detail` : `${signals.length} signals · ${approved} approved by Robotín · click a row to plot its levels`}</div>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {[["candles", "Candles", CandlestickChart], ["line", "Line", LineChart]].map(([m, label, Icon]) => (
              <button key={m} onClick={() => setChartMode(m)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${chartMode === m ? C.purple : C.border}`, backgroundColor: chartMode === m ? C.purpleBg : "transparent", color: chartMode === m ? C.purple : C.textMuted,
              }}><Icon size={13} /> {label}</button>
            ))}
          </div>
        </div>
        <CandleChart data={candles} mode={chartMode} markers={markers} priceLines={priceLines} height={360} />
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 9, color: C.textMuted, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: `7px solid ${C.green}` }} /> Long signal</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `7px solid ${C.red}` }} /> Short signal</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 0, borderTop: `1px dashed ${C.green}` }} /> TP</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 0, borderTop: `1px dashed ${C.red}` }} /> SL</span>
        </div>
      </div>

      {/* Signals / Trades list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(onlyTrades ? signals.filter((s) => s.approved) : signals).map((s) => {
          const st = STATUS[statusKey(s)] || STATUS.pending;
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="card-hover" style={{ ...cardStyle, padding: 0, overflow: "hidden", borderLeft: `3px solid ${s.dir === "LONG" ? C.green : C.red}` }}>
              <button onClick={() => setOpen(isOpen ? null : s.id)} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={s.trader} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{s.trader}</span>
                    <BotTag isBot={s.isBot} size={14} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: s.dir === "LONG" ? C.green : C.red, backgroundColor: `${s.dir === "LONG" ? C.green : C.red}18`, padding: "1px 6px", borderRadius: 3 }}>{s.dir}</span>
                    <span style={{ fontSize: 9, color: C.purple, ...mono }}>{s.tag.split("_").slice(0, 3).join("·")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.textMuted, ...mono, marginTop: 3 }}>
                    <span>Entry <b style={{ color: C.text }}>{fmt(s.entry)}</b></span>
                    <span>TP <b style={{ color: C.green }}>{fmt(s.tp1)}</b></span>
                    <span>SL <b style={{ color: C.red }}>{fmt(s.sl)}</b></span>
                  </div>
                </div>
                {/* Robotín decision */}
                <div style={{ textAlign: "center", minWidth: 92 }}>
                  <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}><Cpu size={9} /> Robotín</div>
                  {s.approved
                    ? <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800, color: C.green }}><Check size={12} /> {s.confidence}%</div>
                    : <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800, color: C.textFaint }}><X size={12} /> Rejected</div>}
                </div>
                {/* Status */}
                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: st.color }}>
                    {s.status === "pending" ? <Clock size={11} /> : s.status === "active" ? <Activity size={11} /> : null}{st.label}
                  </div>
                  {s.status === "closed" && <div style={{ fontSize: 12, fontWeight: 800, color: s.pnl >= 0 ? C.green : C.red, ...mono }}>{s.pnl >= 0 ? "+" : ""}${Math.abs(s.pnl).toFixed(2)}</div>}
                </div>
                <ChevronDown size={16} color={C.textFaint} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px" }}>
                  {!s.approved && (
                    <div style={{ marginBottom: 12, fontSize: 12, color: C.red, display: "flex", alignItems: "center", gap: 6 }}>
                      <X size={13} /> Robotín rejected this signal — {s.rejectReason}. Not executed.
                    </div>
                  )}
                  <TradeDetail trade={s} candles={candles} />
                  <button onClick={() => { const tr = mockTraders.find((x) => x.name === s.trader); if (tr) openProfile(tr); }} style={{ marginTop: 10, fontSize: 11, color: C.purple, background: "none", border: "none", cursor: "pointer", padding: 0 }}>View {s.trader}'s profile →</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { RobotinSignals };
