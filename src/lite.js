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

/* HOW THE BUILD KNOWS IT IS THE MVP — two ways, on purpose.

   1) THE HOSTNAME. mvp.tradeleague.xyz is the MVP; anything else is the full product.
      This is the one that actually runs the thing, and it needs no configuration at all:
      no env var to forget, no "did you uncheck the build cache?", no dashboard state that
      can silently drift from the code. The deployment IS the switch.

   2) VITE_APP_MODE=lite, still honoured. Setting it lets Vite dead-code-eliminate the
      gated blocks at build time, so the lite bundle is genuinely smaller. It is an
      OPTIMISATION, not a requirement — if nobody ever sets it, the MVP still renders
      correctly, it just ships some code it doesn't use.

   `?lite=1` is there so either of us can preview the MVP against any deployment. */
const envLite = import.meta.env.VITE_APP_MODE === "lite";
const hostLite = typeof window !== "undefined" && /^mvp\./i.test(window.location.hostname);
const queryLite = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("lite") === "1";

export const IS_LITE = envLite || hostLite || queryLite;
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
