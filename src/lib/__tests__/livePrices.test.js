import { describe, it, expect } from "vitest";
import { parseCryptoCom, parseBinance, parseCoinGecko, LIVE_COINS } from "../livePrices";

/* Fixtures mirror REAL observed payloads (Crypto.com shape verified against the
   live public API on 2026-07-05; change is a ratio: 0.0134 = +1.34%). */

describe("live price parsers", () => {
  it("parses Crypto.com long field names and converts change ratio to percent", () => {
    const out = parseCryptoCom({ data: [
      { instrument_name: "BTC_USDT", last: "63932.22", change: "0.0134" },
      { instrument_name: "ETH_USDT", last: "3482.10", change: "-0.021" },
      { instrument_name: "BTC_USD", last: "63930.00", change: "0.01" },    // non-USDT quote ignored
      { instrument_name: "ZZZZ_USDT", last: "1.00", change: "0.5" },       // outside coin set ignored
    ]});
    expect(out.BTC).toEqual({ px: 63932.22, chg24h: 1.34 });
    expect(out.ETH.chg24h).toBeCloseTo(-2.1);
    expect(Object.keys(out)).toEqual(["BTC", "ETH"]);
  });

  it("parses Crypto.com short field names (i/a/c) nested under result", () => {
    const out = parseCryptoCom({ result: { data: [{ i: "SOL_USDT", a: "148.60", c: "0.045" }] } });
    expect(out.SOL).toEqual({ px: 148.6, chg24h: 4.5 });
  });

  it("parses Binance 24h tickers", () => {
    const out = parseBinance([
      { symbol: "BTCUSDT", lastPrice: "63932.22", priceChangePercent: "1.34" },
      { symbol: "DOGEUSDT", lastPrice: "0.358", priceChangePercent: "-6.2" },
      { symbol: "BTCUSDC", lastPrice: "63931.00", priceChangePercent: "1.3" }, // non-USDT ignored
    ]);
    expect(out.BTC).toEqual({ px: 63932.22, chg24h: 1.34 });
    expect(out.DOGE).toEqual({ px: 0.358, chg24h: -6.2 });
    expect(out.USDC).toBeUndefined();
  });

  it("parses CoinGecko simple/price", () => {
    const out = parseCoinGecko({
      bitcoin: { usd: 63932.22, usd_24h_change: 1.34 },
      "avalanche-2": { usd: 39.2, usd_24h_change: 3.1 },
    });
    expect(out.BTC.px).toBe(63932.22);
    expect(out.AVAX).toEqual({ px: 39.2, chg24h: 3.1 });
  });

  it("rejects garbage rows instead of emitting NaN prices", () => {
    expect(parseCryptoCom({ data: [{ instrument_name: "BTC_USDT", last: "not-a-number", change: "x" }] })).toEqual({});
    expect(parseBinance([{ symbol: "ETHUSDT", lastPrice: "0", priceChangePercent: "1" }])).toEqual({});
    expect(parseCoinGecko({ bitcoin: {} })).toEqual({});
  });

  it("keeps a price whose 24h change is missing (chg24h: null, never NaN)", () => {
    const out = parseCryptoCom({ data: [{ instrument_name: "BTC_USDT", last: "63932.22" }] });
    expect(out.BTC.px).toBe(63932.22);
    expect(out.BTC.chg24h).toBeNull();
  });

  it("covers every coin in the terminal set (all 35 panorama coins) via CoinGecko id map", () => {
    const ids = ["bitcoin","ethereum","solana","binancecoin","ripple","dogecoin","avalanche-2","cardano","chainlink","polkadot",
      "matic-network","uniswap","aave","cosmos","fantom","near","aptos","arbitrum","optimism","sui",
      "injective-protocol","celestia","sei-network","blockstack","render-token","fetch-ai","worldcoin-wld","jupiter-exchange-solana",
      "pendle","ondo-finance","the-open-network","pepe","dogwifcoin","bonk","floki"];
    const full = Object.fromEntries(ids.map((id) => [id, { usd: 1, usd_24h_change: 0 }]));
    expect(LIVE_COINS.length).toBe(35);
    expect(Object.keys(parseCoinGecko(full)).sort()).toEqual([...LIVE_COINS].sort());
  });
});
