import { describe, it, expect } from "vitest";
import { calcAlphaScore, alphaConfidence, MIN_SAMPLE } from "../scoring";

/* The trap this suite exists to prevent: a leaderboard that rewards luck.
   Ranking on raw ratios means the SMALLEST sample wins, which is backwards. */

const lucky = { trades: 5, winRate: 100, sharpe: 3.0, profitFactor: 6, maxDD: 2, streak: 5, copiers: 10 };
const proven = { trades: 500, winRate: 62, sharpe: 2.1, profitFactor: 2.4, maxDD: 8, streak: 9, copiers: 300 };

describe("alpha score — evidence weighting", () => {
  it("does NOT let a 5-signal, 100%-win-rate provider outrank a 500-signal, 62% one", () => {
    expect(calcAlphaScore(proven)).toBeGreaterThan(calcAlphaScore(lucky));
  });

  it("a perfect record on a tiny sample scores well below the same record on a large one", () => {
    // Hold Sharpe/PF AT the population prior so shrinkage is a no-op and the win-rate
    // component is the only thing moving. 5/5 is consistent with a true rate near 50%,
    // so it must not collect the same 25 points as 2000/2000.
    const base = { sharpe: 1.2, profitFactor: 1.4, maxDD: 8, streak: 0, copiers: 0 };
    const perfectTiny = calcAlphaScore({ ...base, trades: 5, winRate: 100 });
    const perfectHuge = calcAlphaScore({ ...base, trades: 2000, winRate: 100 });
    expect(perfectHuge).toBeGreaterThan(perfectTiny + 8);
  });

  it("rises monotonically with evidence when the rate is held constant", () => {
    const at = (n) => calcAlphaScore({ trades: n, winRate: 70, sharpe: 2, profitFactor: 2.5, maxDD: 8, streak: 6, copiers: 100 });
    expect(at(10)).toBeLessThan(at(100));
    expect(at(100)).toBeLessThan(at(1000));
  });

  it("shrinks an unproven Sharpe toward the population prior", () => {
    // a wild Sharpe on 3 trades should not buy the full risk-adjusted component
    const wild = calcAlphaScore({ trades: 3, winRate: 60, sharpe: 5, profitFactor: 1.4, maxDD: 8, streak: 0, copiers: 0 });
    const earned = calcAlphaScore({ trades: 800, winRate: 60, sharpe: 5, profitFactor: 1.4, maxDD: 8, streak: 0, copiers: 0 });
    expect(earned).toBeGreaterThan(wild);
  });

  it("never returns NaN on an empty record", () => {
    expect(Number.isFinite(calcAlphaScore({}))).toBe(true);
  });
});

describe("alphaConfidence", () => {
  it("flags a thin record as provisional", () => {
    expect(alphaConfidence(lucky).provisional).toBe(true);
    expect(alphaConfidence(proven).provisional).toBe(false);
  });

  it("uses the documented minimum sample", () => {
    expect(alphaConfidence({ trades: MIN_SAMPLE - 1 }).provisional).toBe(true);
    expect(alphaConfidence({ trades: MIN_SAMPLE }).provisional).toBe(false);
  });
});
