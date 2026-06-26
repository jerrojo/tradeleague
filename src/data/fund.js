/* ═══════════════════════ FUND IDENTITY (single source of truth) ═══════════════════════
   One canonical definition of the fund so every section is a lens on the SAME
   entity at the SAME capital base. Before this, Overview/Audit ran on $50k while
   Trade Report ran on $250k and Traders showed provider books in the hundreds of
   thousands — three scales, three stories. Everything fund-side now references
   START_CAPITAL so the numbers reconcile into one coherent fund. */

export const FUND = {
  name: "VARIV",
  startCapital: 50000,   // the fund's capital base (USD)
  currency: "USD",
  inceptionLabel: "since inception",
};

export const START_CAPITAL = FUND.startCapital;
