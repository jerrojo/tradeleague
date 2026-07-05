import { C, cardStyle, mono } from "../theme";
import { price, pct } from "../lib/format";
import { useLivePrices } from "../contexts";
import { LIVE_COINS } from "../lib/livePrices";

/* ═══════════════════════ LIVE TAPE ═══════════════════════
   Real spot prices from a public exchange API, shown as their own clearly-labeled
   surface. This is deliberately NOT merged into the SIM analytics below it: the
   two books never contaminate each other (provenance is the product's trust
   story). Renders nothing when no live source is reachable — the footer already
   says SIM, and a dead "live" panel would be worse than none. */
export const LiveTape = ({ selected, onSelect }) => {
  const { status, prices, source, asOf } = useLivePrices();
  if (status !== "live") return null;
  const coins = LIVE_COINS.filter((c) => prices[c]);
  return (
    <div style={{ ...cardStyle, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.green, display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: C.green, letterSpacing: "0.4px" }}>LIVE TAPE</span>
          <span style={{ fontSize: 11, color: C.textMuted }}>real spot · {source} public API</span>
        </div>
        <span style={{ fontSize: 10.5, color: C.textFaint, ...mono }} title="Auto-refreshes every 30s. Live prices are market context only — the analytics below run on the deterministic SIM book and are never re-marked against this tape.">
          as of {new Date(asOf).toLocaleTimeString()} · 30s refresh
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 8 }}>
        {coins.map((c) => {
          const d = prices[c];
          const chColor = d.chg24h == null ? C.textMuted : d.chg24h >= 0 ? C.green : C.red;
          const isSel = selected === c;
          return (
            <div
              key={c}
              onClick={onSelect ? () => onSelect(c) : undefined}
              title={`${c}/USDT — last ${price(d.px)} · 24h ${d.chg24h == null ? "—" : pct(d.chg24h, { signed: true })} · ${source} spot`}
              style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${isSel ? C.purple : C.border}`, backgroundColor: isSel ? C.purpleBg : "transparent", cursor: onSelect ? "pointer" : "default", userSelect: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.text }}>{c}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: chColor, ...mono }}>{d.chg24h == null ? "—" : pct(d.chg24h, { signed: true })}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text, ...mono, marginTop: 2 }}>${price(d.px)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 10 }}>
        Market context only — analytics below run on the deterministic <span style={{ color: C.amber, fontWeight: 700 }}>SIM book</span> and are never re-marked against this tape.
      </div>
    </div>
  );
};

/* Compact footer readout: one flagship live quote (BTC) for the status bar. */
export const LiveFooterQuote = () => {
  const { status, prices } = useLivePrices();
  const d = status === "live" ? prices.BTC : null;
  if (!d) return null;
  const chColor = d.chg24h == null ? C.textMuted : d.chg24h >= 0 ? C.green : C.red;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ color: C.textMuted }}>BTC</span>
      <span style={{ color: C.text, fontWeight: 700 }}>${price(d.px)}</span>
      <span style={{ color: chColor, fontWeight: 700 }}>{d.chg24h == null ? "" : pct(d.chg24h, { signed: true })}</span>
    </span>
  );
};
