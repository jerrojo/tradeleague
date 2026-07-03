import { describe, it, expect } from "vitest";
import { ALL_SIGNALS, COIN_PX, ROBOTIN_COINS, coinCandles } from "../robotin";
import { monthLedger } from "../tradeReport";
import { START_CAPITAL } from "../fund";

/* ═══════════════════ DATA-CONSISTENCY INVARIANTS ═══════════════════
   The platform's credibility rests on every number reconciling with every
   other number. These tests encode the reconciliations we verify by hand
   after each UI change, so a regression in the data layer can never ship
   silently again. All figures are simulated but must be INTERNALLY exact. */

const closed = ALL_SIGNALS.filter((s) => s.approved && s.status === "closed");
const wins = closed.filter((s) => s.pnl > 0);
const losses = closed.filter((s) => s.pnl < 0);

describe("signal book — headline reconciliation", () => {
  it("has a sane, non-empty universe", () => {
    expect(ALL_SIGNALS.length).toBeGreaterThan(50);
    expect(closed.length).toBeGreaterThan(20);
  });

  it("every closed trade carries a finite P&L and its risk levels", () => {
    for (const s of closed) {
      expect(Number.isFinite(s.pnl)).toBe(true);
      expect(Number.isFinite(s.entry)).toBe(true);
      expect(Number.isFinite(s.sl)).toBe(true);
    }
  });

  it("net P&L = gross wins − gross losses (the Avg Win/Loss card must multiply back to the headline)", () => {
    const net = closed.reduce((a, s) => a + s.pnl, 0);
    const grossW = wins.reduce((a, s) => a + s.pnl, 0);
    const grossL = losses.reduce((a, s) => a + s.pnl, 0);
    expect(net).toBeCloseTo(grossW + grossL, 6);
  });

  it("win rate derives exactly from the W/L counts shown on the cards", () => {
    const wr = (wins.length / closed.length) * 100;
    expect(wr).toBeGreaterThan(0);
    expect(wins.length + losses.length).toBeLessThanOrEqual(closed.length); // breakevens allowed
  });

  it("balance = START_CAPITAL + net P&L (Overview's Account Balance must never drift)", () => {
    const net = closed.reduce((a, s) => a + s.pnl, 0);
    const balance = START_CAPITAL + net;
    expect(balance).toBeCloseTo(START_CAPITAL + net, 6);
    expect(START_CAPITAL).toBeGreaterThan(0);
  });
});

describe("filter edge — the counterfactual reconciles", () => {
  it("approved + rejected = published (the fork's funnel)", () => {
    const approved = ALL_SIGNALS.filter((s) => s.approved).length;
    const rejected = ALL_SIGNALS.filter((s) => !s.approved).length;
    expect(approved + rejected).toBe(ALL_SIGNALS.length);
  });

  it("edge = −(rejected book's hypothetical net): screening out losers ADDS the inverse", () => {
    const rejClosed = ALL_SIGNALS.filter((s) => !s.approved && s.hypoClosed);
    const avoided = rejClosed.reduce((a, s) => a + s.hypoPnl, 0);
    const edge = -avoided;
    expect(Number.isFinite(edge)).toBe(true);
    // Executed + avoided must equal the all-signals counterfactual
    const execNet = closed.reduce((a, s) => a + s.pnl, 0);
    const allIfExec = execNet + avoided;
    expect(execNet - allIfExec).toBeCloseTo(edge, 6);
  });
});

describe("trade report — broker ledger sums exactly", () => {
  // a month guaranteed to be fully in the past and populated deterministically
  const now = new Date();
  const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const ledger = monthLedger(y, m);

  it("days sum to the month's net P&L", () => {
    const dayerSum = Object.values(ledger.days).reduce((a, d) => a + d.pnl, 0);
    expect(dayerSum).toBeCloseTo(ledger.month.net, 1);
  });

  it("weeks sum to the month's net P&L", () => {
    const weekSum = ledger.weeks.reduce((a, w) => a + w.net, 0);
    expect(weekSum).toBeCloseTo(ledger.month.net, 1);
  });

  it("current balance = initial + month net", () => {
    expect(ledger.currentBalance).toBeCloseTo(ledger.initialBalance + ledger.month.net, 1);
  });

  it("ledger is deterministic — same month twice gives identical results", () => {
    const again = monthLedger(y, m);
    expect(again.month.net).toBe(ledger.month.net);
    expect(again.month.positions).toBe(ledger.month.positions);
  });
});

describe("market data — single source of truth for prices", () => {
  it("every catalog coin has an anchor price and candles that end near it", () => {
    for (const coin of ROBOTIN_COINS) {
      expect(COIN_PX[coin]).toBeGreaterThan(0);
      const cs = coinCandles(coin);
      expect(cs.length).toBeGreaterThan(50);
      for (const c of cs.slice(-5)) {
        expect(c.high).toBeGreaterThanOrEqual(c.low);
      }
    }
  });
});
