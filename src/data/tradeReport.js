import { COIN_PX } from "./robotin";

/* ═══════════════════════ TRADE REPORT LEDGER (v1, simulated) ═══════════════════════
   A dedicated, deterministic per-position ledger for the VARIV trading accounts —
   the broker-level record behind the fund. One month at a time: every day gets
   zero or more closed/open positions, aggregated into daily, weekly and monthly
   views plus by-symbol / by-account breakdowns. Seeded by (year, month) so the
   numbers are stable across reloads and internally consistent (days sum to weeks
   sum to month). This is the account ledger lens — distinct from the signal
   engine that drives Overview/Audit. */

const SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "AVAX", "LINK", "ADA", "ARB", "OP", "SUI", "TON", "NEAR", "INJ"];
const ACCOUNTS = { LONG: ["VARIV_LONGS", "VARIV_CORE"], SHORT: ["VARIV_SHORTS", "VARIV_CORE"] };
const INITIAL_BALANCE = 250000;

const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const r2 = (x) => Math.round(x * 100) / 100;
const pxRound = (x) => (x >= 100 ? r2(x) : x >= 1 ? Math.round(x * 1e4) / 1e4 : Math.round(x * 1e6) / 1e6);

const dayKey = (y, m, d) => `${y}-${m}-${d}`;

/* Build the full ledger for a given month. */
export function monthLedger(year, month) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const isFutureMonth = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastDay = isFutureMonth ? 0 : isCurrentMonth ? now.getDate() : daysInMonth;
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sun

  const rnd = lcg(year * 10007 + month * 131 + 7);
  const days = {};
  const positions = [];

  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month, d).getDay();
    const weekend = dow === 0 || dow === 6;
    if (rnd() > (weekend ? 0.32 : 0.74)) continue; // some days are flat
    const n = 1 + Math.floor(rnd() * (weekend ? 2 : 4)); // 1–4 positions
    const dayPos = [];
    for (let k = 0; k < n; k++) {
      const symbol = SYMBOLS[Math.floor(rnd() * SYMBOLS.length)];
      const basePx = COIN_PX[symbol] || 100;
      const side = rnd() < 0.5 ? "LONG" : "SHORT";
      const account = ACCOUNTS[side][rnd() < 0.72 ? 0 : 1];
      const leverage = [3, 4, 5, 5, 8, 10][Math.floor(rnd() * 6)];
      const margin = r2(4000 + rnd() * 36000);
      const notional = r2(margin * leverage);
      const win = rnd() < 0.53; // slight positive edge
      const sign = win ? 1 : -1;
      const movePct = 0.003 + rnd() * 0.02; // 0.3%–2.3% underlying move
      const priceDir = side === "LONG" ? sign : -sign; // price direction that produced the result
      const grossPnl = r2(notional * sign * movePct);
      const commission = r2(notional * 0.0004);
      const netPnl = r2(grossPnl - commission);
      const roiLev = r2(sign * movePct * leverage * 100); // % on margin (leveraged)
      const entryH = 1 + Math.floor(rnd() * 20), entryMin = Math.floor(rnd() * 60);
      const entryTime = new Date(year, month, d, entryH, entryMin).getTime();
      const durationMin = 15 + Math.floor(rnd() * 60 * 9);
      const stillOpen = isCurrentMonth && d === lastDay && rnd() < 0.28;
      const exitTime = stillOpen ? null : entryTime + durationMin * 60000;
      const entryPx = pxRound(basePx * (1 + (rnd() - 0.5) * 0.01));
      const exitPx = stillOpen ? null : pxRound(entryPx * (1 + priceDir * movePct));
      const pos = {
        id: `${symbol}-${year}${month}${d}-${k}`, symbol, side, account,
        entryTime, exitTime, entryPx, exitPx, leverage, margin, notional,
        grossPnl, commission, netPnl, roiLev, durationMin: stillOpen ? null : durationMin,
        status: stillOpen ? "open" : "closed",
      };
      dayPos.push(pos); positions.push(pos);
    }
    const pnl = r2(dayPos.reduce((a, p) => a + p.netPnl, 0));
    const commission = r2(dayPos.reduce((a, p) => a + p.commission, 0));
    const wins = dayPos.filter((p) => p.netPnl >= 0).length;
    days[dayKey(year, month, d)] = { day: d, pnl, commission, count: dayPos.length, wins, losses: dayPos.length - wins, positions: dayPos };
  }

  // ── aggregate a set of positions into a summary block ──
  const summarize = (pos) => {
    const closed = pos.filter((p) => p.status === "closed");
    const wins = closed.filter((p) => p.netPnl >= 0);
    const losses = closed.filter((p) => p.netPnl < 0);
    const net = r2(pos.reduce((a, p) => a + p.netPnl, 0));
    const fees = r2(pos.reduce((a, p) => a + p.commission, 0));
    const avgWin = wins.length ? wins.reduce((a, p) => a + p.netPnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a, p) => a + p.netPnl, 0) / losses.length) : 0;
    const rrr = avgLoss ? r2(avgWin / avgLoss) : avgWin ? 999 : 0;
    return {
      net, fees, wins: wins.length, losses: losses.length, positions: closed.length,
      winRate: closed.length ? r2((wins.length / closed.length) * 100) : 0,
      rrr, capitalVol: r2(pos.reduce((a, p) => a + p.margin, 0)), leveragedVol: r2(pos.reduce((a, p) => a + p.notional, 0)),
    };
  };

  // ── weekly summaries (calendar rows, Sun–Sat) ──
  const weekCount = Math.ceil((firstDow + daysInMonth) / 7);
  const weeks = [];
  for (let w = 0; w < weekCount; w++) {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dnum = w * 7 + i - firstDow + 1;
      if (dnum >= 1 && dnum <= daysInMonth) weekDays.push(dnum);
    }
    const wpos = positions.filter((p) => weekDays.includes(new Date(p.entryTime).getDate()));
    const activeDays = weekDays.filter((d) => days[dayKey(year, month, d)]).length;
    weeks.push({ idx: w + 1, activeDays, ...summarize(wpos) });
  }

  const month_ = summarize(positions);
  const realizedNet = r2(positions.filter((p) => p.status === "closed").reduce((a, p) => a + p.netPnl, 0));
  const currentBalance = r2(INITIAL_BALANCE + realizedNet);

  return {
    year, month, isFutureMonth,
    initialBalance: INITIAL_BALANCE,
    currentBalance,
    roiPct: r2((realizedNet / INITIAL_BALANCE) * 100),
    month: month_,
    days,
    weeks,
  };
}

/* Breakdown helpers for a single day's positions. */
export function breakdownBy(positions, field) {
  const m = {};
  positions.forEach((p) => { m[p[field]] = r2((m[p[field]] || 0) + p.netPnl); });
  return Object.entries(m).map(([k, v]) => ({ key: k, net: v })).sort((a, b) => b.net - a.net);
}

export { INITIAL_BALANCE };
