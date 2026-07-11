import { describe, it, expect } from "vitest";
import { wilson, bootstrapSum, bootstrapMean, verdict, pctCI } from "../stats";

describe("wilson score interval", () => {
  it("brackets the point estimate", () => {
    const w = wilson(72, 141);
    expect(w.p).toBeCloseTo(72 / 141, 6);
    expect(w.lo).toBeLessThan(w.p);
    expect(w.hi).toBeGreaterThan(w.p);
  });

  it("never escapes [0,1] — the Wald interval's classic failure", () => {
    const perfect = wilson(5, 5);   // 100% on 5 trades
    expect(perfect.hi).toBeLessThanOrEqual(1);
    expect(perfect.lo).toBeGreaterThanOrEqual(0);
    const zero = wilson(0, 5);
    expect(zero.lo).toBeGreaterThanOrEqual(0);
    expect(zero.hi).toBeLessThanOrEqual(1);
  });

  it("is much wider at small n — a 5-trade record proves nothing", () => {
    const small = wilson(4, 5);      // 80% on 5
    const large = wilson(400, 500);  // 80% on 500
    expect(small.margin).toBeGreaterThan(large.margin * 5);
  });

  it("handles an empty sample without dividing by zero", () => {
    expect(wilson(0, 0)).toMatchObject({ p: 0, lo: 0, hi: 0, n: 0 });
  });
});

describe("bootstrapSum", () => {
  it("is deterministic — a CI must not flicker between renders", () => {
    const v = [120, -300, 50, -20, 400, -90, 15];
    const a = bootstrapSum(v, { seed: "t" });
    const b = bootstrapSum(v, { seed: "t" });
    expect(a.lo).toBe(b.lo);
    expect(a.hi).toBe(b.hi);
    expect(a.pPositive).toBe(b.pPositive);
  });

  it("brackets the observed total", () => {
    const v = [10, 20, 30, 40, 50];
    const r = bootstrapSum(v, { seed: "t" });
    expect(r.sum).toBe(150);
    expect(r.lo).toBeLessThanOrEqual(r.sum);
    expect(r.hi).toBeGreaterThanOrEqual(r.sum);
  });

  it("calls a clearly positive sample significant", () => {
    const v = Array.from({ length: 60 }, (_, i) => 100 + (i % 5));
    const r = bootstrapSum(v, { seed: "t" });
    expect(r.significant).toBe(true);
    expect(r.pPositive).toBe(1);
    expect(verdict(r)).toBe("significant");
  });

  it("calls a noisy zero-centred sample NOISE — this is the whole point", () => {
    // symmetric wins and losses: a total near zero that a point estimate would
    // happily report as "+$X of edge"
    const v = [500, -500, 300, -300, 200, -200, 100, -100, 50, -50];
    const r = bootstrapSum(v, { seed: "t" });
    expect(r.significant).toBe(false);
    expect(verdict(r)).toBe("noise");
  });

  it("degrades gracefully on a single observation", () => {
    const r = bootstrapSum([42], { seed: "t" });
    expect(r.significant).toBe(false);
    expect(r.sum).toBe(42);
  });
});

describe("bootstrapMean", () => {
  it("scales the sum interval by n", () => {
    const v = [10, 20, 30, 40];
    const r = bootstrapMean(v, { seed: "t" });
    expect(r.mean).toBeCloseTo(25, 6);
    expect(r.lo).toBeLessThanOrEqual(r.mean);
    expect(r.hi).toBeGreaterThanOrEqual(r.mean);
  });
});

describe("pctCI", () => {
  it("renders as 51.1% ± 8.3", () => {
    expect(pctCI(wilson(72, 141))).toMatch(/^\d+\.\d% ± \d+\.\d$/);
  });
});
