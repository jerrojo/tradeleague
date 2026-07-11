import { describe, it, expect } from "vitest";
import { assessRisk, betaOf, RISK_POLICY } from "../risk";

const pos = (coin, dir, notional = 10000) => ({ coin, dir, notional });
const EQUITY = 100000;

describe("betaOf", () => {
  it("treats BTC as the factor and memes as levered versions of it", () => {
    expect(betaOf("BTC")).toBe(1);
    expect(betaOf("PEPE")).toBeGreaterThan(1.5);
    expect(betaOf("SOMETHING_NEW")).toBeGreaterThan(1); // unknown alt is not assumed safe
  });
});

describe("effective bets — the diversification illusion", () => {
  it("a 40-name crypto book is NOT 40 independent bets", () => {
    const coins = ["BTC", "ETH", "SOL", "AVAX", "LINK", "DOT", "MATIC", "ARB", "OP", "SUI"];
    const positions = coins.flatMap((c) => [pos(c, "LONG"), pos(c, "LONG"), pos(c, "LONG"), pos(c, "LONG")]);
    const r = assessRisk(positions, EQUITY);
    expect(r.n).toBe(40);
    // if these were independent, effective bets would be ~40. They are not.
    expect(r.effectiveBets).toBeLessThan(5);
  });

  it("a long-only book has fewer effective bets than one that is genuinely hedged", () => {
    const longOnly = assessRisk(["BTC", "ETH", "SOL", "AVAX"].map((c) => pos(c, "LONG")), EQUITY);
    const hedged = assessRisk([pos("BTC", "LONG"), pos("ETH", "SHORT"), pos("SOL", "LONG"), pos("AVAX", "SHORT")], EQUITY);
    expect(hedged.effectiveBets).toBeGreaterThan(longOnly.effectiveBets);
  });
});

describe("net beta — longs and shorts only cancel if their betas match", () => {
  it("an equal-count long/short book can still be directional", () => {
    // 'balanced' by position count: 1 long, 1 short — the way the rail used to read it.
    // But shorting BTC (β 1.0) against a long in PEPE (β 1.8) leaves you net LONG beta.
    const naiveBalanced = assessRisk([pos("PEPE", "LONG"), pos("BTC", "SHORT")], EQUITY);
    const trulyHedged = assessRisk([pos("PEPE", "LONG", 10000), pos("BTC", "SHORT", 18000)], EQUITY);
    expect(naiveBalanced.netBeta).toBeGreaterThan(0);                       // not flat
    expect(naiveBalanced.netBeta).toBeGreaterThan(Math.abs(trulyHedged.netBeta) * 5); // and far from it
  });

  it("is near zero only when beta-weighted exposure actually offsets", () => {
    // short ~1.8 units of BTC-beta against a long in PEPE (beta 1.8)
    const r = assessRisk([pos("PEPE", "LONG", 10000), pos("BTC", "SHORT", 18000)], EQUITY);
    expect(Math.abs(r.netBeta)).toBeLessThan(0.05);
  });

  it("a short book carries negative beta", () => {
    const r = assessRisk(["BTC", "ETH", "SOL"].map((c) => pos(c, "SHORT")), EQUITY);
    expect(r.netBeta).toBeLessThan(0);
  });
});

describe("limit breaches", () => {
  it("flags single-coin concentration", () => {
    const positions = [pos("SOL", "LONG", 60000), pos("BTC", "LONG", 10000)];
    const r = assessRisk(positions, EQUITY);
    expect(r.topCoin).toBe("SOL");
    expect(r.breaches.map((b) => b.key)).toContain("maxCoinWeightPct");
  });

  it("flags too many positions in one coin", () => {
    const positions = Array.from({ length: RISK_POLICY.maxPerCoin.limit + 1 }, () => pos("BTC", "LONG", 100));
    const r = assessRisk(positions, EQUITY);
    expect(r.breaches.map((b) => b.key)).toContain("maxPerCoin");
  });

  it("flags gross leverage over the policy", () => {
    const positions = Array.from({ length: 10 }, () => pos("BTC", "LONG", 50000)); // 500k gross on 100k
    const r = assessRisk(positions, EQUITY);
    expect(r.grossLeverage).toBeCloseTo(5, 3);
    expect(r.breaches.map((b) => b.key)).toContain("maxGrossLeverage");
  });

  it("trips the drawdown circuit breaker", () => {
    const r = assessRisk([pos("BTC", "LONG")], EQUITY, -20);
    expect(r.breaches.map((b) => b.key)).toContain("maxDrawdownPct");
  });

  it("a tame, spread book breaches nothing", () => {
    // 6 coins at equal weight → 16.7% each, under the 25% concentration limit.
    // (A two-position book is 50/50 by construction and SHOULD trip it — concentration
    // is about weight, not about whether the book "feels" small.)
    const r = assessRisk(
      [pos("BTC", "LONG", 3000), pos("ETH", "SHORT", 3000), pos("SOL", "LONG", 3000),
        pos("LINK", "SHORT", 3000), pos("DOT", "LONG", 3000), pos("LTC", "SHORT", 3000)],
      EQUITY, -2,
    );
    expect(r.breaches).toHaveLength(0);
  });

  it("handles an empty book without dividing by zero", () => {
    const r = assessRisk([], EQUITY, 0);
    expect(r.n).toBe(0);
    expect(r.breaches).toHaveLength(0);
    expect(Number.isFinite(r.netBeta)).toBe(true);
  });
});
