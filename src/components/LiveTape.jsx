import { C } from "../theme";
import { price, pct } from "../lib/format";
import { useLivePrices } from "../contexts";

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
