import { PositioningMap } from "../PositioningMap";
import { lastCloseByCoin, COIN_PX } from "../../data/robotin";
import { C } from "../../theme";

/* ═══════════════════════ COIN POSITIONING ═══════════════════════
   One single view for "where is the crowd positioned on this coin": the
   Positioning Map plots every open trade and live signal against the current
   price (dot size = leverage, color = side). Price comes from the candle-derived
   single source of truth so "NOW" matches the chart's right edge everywhere. */

const CoinPositioning = ({ coin = "BTC" }) => {
  const price = lastCloseByCoin[coin] ?? COIN_PX[coin];
  if (price == null) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <PositioningMap coin={coin} currentPrice={price} />
      <div style={{ fontSize: "11px", color: C.textFaint, textAlign: "center" }}>
        Each dot is an open trade or live signal on {coin}; size reflects leverage, side reflects long vs short — all measured against the current price. Simulated.
      </div>
    </div>
  );
};

export { CoinPositioning };
