import { useMemo, useState } from "react";
import { CandlestickChart, LineChart } from "lucide-react";
import { CandleChart } from "../CandleChart";
import { CoinSelector } from "../CoinSelector";
import { SignalRow } from "../SignalRow";
import { useProfile } from "../../contexts";
import { coinCandles, coinSignals, signalMarkers, ROBOTIN_COINS } from "../../data/robotin";
import { mockTraders } from "../../data/mockData";
import { C, cardStyle } from "../../theme";

const fmt = (p) => {
  if (p == null) return "—";
  const a = Math.abs(p);
  if (a >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (a >= 0.01) return p.toFixed(4);
  if (a >= 0.0001) return p.toFixed(6);
  return p.toPrecision(3);
};

const RobotinSignals = ({ coin: coinProp, embedded = false, onlyTrades = false } = {}) => {
  const { openProfile } = useProfile();
  const [coinState, setCoin] = useState("BTC");
  const coin = coinProp ?? coinState; // controlled by the Coin Hub when embedded
  const [chartMode, setChartMode] = useState("candles");
  const [open, setOpen] = useState(null); // expanded signal id

  const candles = useMemo(() => coinCandles(coin), [coin]);
  const signals = useMemo(() => coinSignals(coin, candles), [coin, candles]);
  const markers = useMemo(() => signalMarkers(onlyTrades ? signals.filter((s) => s.approved) : signals), [signals, onlyTrades]);

  const sel = signals.find((s) => s.id === open) || null;
  const priceLines = sel
    ? [
        { price: sel.entry, color: C.text, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "Entry" },
        { price: sel.tp1, color: C.green, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "TP" },
        { price: sel.sl, color: C.red, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "SL" },
      ]
    : [];

  const approved = signals.filter((s) => s.approved).length;
  const visibleList = onlyTrades ? signals.filter((s) => s.approved) : signals;

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
            <div style={{ fontSize: 10, color: C.textMuted }}>{onlyTrades ? `${approved} executed · ${signals.filter((s) => s.status === "active").length} active · ${signals.filter((s) => s.status === "closed").length} closed · click a row for full detail` : `${signals.length} signals · ${approved} approved · ${signals.filter((s) => s.status === "active").length} active · ${signals.filter((s) => s.status === "closed").length} closed · click a row to plot levels`}</div>
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
        {visibleList.length === 0 && (
          <div style={{ ...cardStyle, textAlign: "center", padding: "32px", color: C.textMuted }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{onlyTrades ? "No trades executed on " + coin + " yet" : "No signals on " + coin + " yet"}</div>
            <div style={{ fontSize: 11 }}>{onlyTrades ? "Robotín hasn't approved and executed any signal on this asset in the current window." : "No trader has published a signal on this asset in the current window."}</div>
          </div>
        )}
        {visibleList.map((s) => (
          <SignalRow
            key={s.id}
            signal={s}
            isOpen={open === s.id}
            onToggle={() => setOpen(open === s.id ? null : s.id)}
            onTrader={(name) => { const tr = mockTraders.find((x) => x.name === name); if (tr) openProfile(tr); }}
            lastClose={candles.length ? candles[candles.length - 1].close : null}
            candles={candles}
          />
        ))}
      </div>
    </div>
  );
};

export { RobotinSignals };
