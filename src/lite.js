/* ═══════════════════════ LITE / MVP MODE ═══════════════════════
   The MVP is NOT a fork of this codebase — it is the same app with pieces switched
   off at build time. One repo, one `main`, two Vercel projects: the full product at
   tradeleague.xyz, and the MVP at mvp.tradeleague.xyz built with VITE_APP_MODE=lite.

   Why this way: a forked "lite repo" rots. Within a month the two drift, a fix lands in
   one and not the other, and you end up maintaining two products. A build flag keeps
   every fix, every number and every invariant shared — the MVP is a VIEW of the product,
   not a copy of it.

   Rule for anything gated below: LITE MAY HIDE, IT MAY NEVER LIE. We remove depth
   (secondary metrics, quant surfaces), never the honesty layer — the "not significant"
   verdict on the filter's edge and the risk-limit breaches stay, because a smaller
   product is allowed to say less, not to claim more. */

export const IS_LITE = import.meta.env.VITE_APP_MODE === "lite";
export const IS_FULL = !IS_LITE;

/* Overview: the only KPI cards that survive in the MVP, in render order. */
export const LITE_OVERVIEW_KPIS = [
  "sharpe",
  "avgR",
  "bestWorstDay",
  "maxDD",
  "avgHold",
  "largestWinLoss",
  "avgWinLoss",
];

/* Trader profile: the only sub-tabs the MVP exposes. Drops Trade Lab, Signal Log
   and Risk DNA — the quant depth an early user has no use for yet. */
export const LITE_PROFILE_TABS = ["overview", "signals", "trades", "pnl", "journal"];
