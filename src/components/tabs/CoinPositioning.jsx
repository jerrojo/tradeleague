import { PositioningMap } from "../PositioningMap";
import { smcCoins } from "../../data/mockData";
import { C } from "../../theme";

/* ═══════════════════════ COIN POSITIONING ═══════════════════════
   One single view for "where is the crowd positioned on this coin": the
   Positioning Map plots every open trade and live signal against the current
   price (dot size = leverage, color = side). Previously this screen showed two
   charts that said the same thing — now there is exactly one. */

const parsePx = (s) => Number(String(s).replace(/[^0-9.]/g, "")) || 100;

const CoinPositioning = ({ coin = "BTC" }) => {
  const cd = smcCoins[coin];
  if (!cd) return null;
  const price = parsePx(cd.price);

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
