import { PositioningMap } from "../PositioningMap";
import { TokenFieldViz } from "../TokenFieldViz";
import { smcCoins, ftgPlayers } from "../../data/mockData";
import { C, cardStyle } from "../../theme";

/* ═══════════════════════ COIN POSITIONING ═══════════════════════
   The single home for "where is the crowd positioned on this coin." Merges what
   used to be three overlapping views (the SMC positioning map, the token field,
   and the standalone Football game) into one: an analytical map on top, and the
   gamified Trading Field below. Both read the same single price source. */

const parsePx = (s) => Number(String(s).replace(/[^0-9.]/g, "")) || 100;

const CoinPositioning = ({ coin = "BTC" }) => {
  const cd = smcCoins[coin];
  if (!cd) return null;
  const price = parsePx(cd.price);
  const base = cd.chartBase || price;
  const step = cd.chartStep || base * 0.002;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Analytical map: every open position vs the current price */}
      <PositioningMap coin={coin} currentPrice={price} />

      {/* Gamified Trading Field — one unified field (the Football idea, single instance) */}
      <div style={cardStyle}>
        <TokenFieldViz
          pair={`${coin}/USDT`}
          currentPrice={Math.round((base + 12 * step) * 100) / 100}
          priceRange={{ low: Math.round(base * 0.97), high: Math.round((base + 24 * step) * 1.03) }}
          players={ftgPlayers.map((p, i) => ({
            ...p, coin,
            entry: Math.round((base + i * 1.3 * step) * 100) / 100,
            current: Math.round((base + 12 * step + (p.roi / 100) * base * 0.01) * 100) / 100,
          }))}
        />
      </div>

      <div style={{ fontSize: "11px", color: C.textFaint, textAlign: "center" }}>
        Positioning blends every trader's open trades and live signals on {coin} against the current price — simulated.
      </div>
    </div>
  );
};

export { CoinPositioning };
