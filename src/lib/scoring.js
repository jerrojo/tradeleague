import { C } from "../theme";
import { wilson } from "./stats";
import { Crosshair, DollarSign, Eye, Flame, Lightbulb, Radio, Shield, Star, Target, TrendingUp, Trophy, Zap } from "lucide-react";

/* ═══════════════════════ PROVIDER RANKING ═══════════════════════
   The trap this fixes: ranking on RAW ratios lets luck beat skill. A provider with
   5 signals and a 100% hit rate scored a perfect win-rate component and outranked one
   with 500 signals at 62% — so the leaderboard rewarded the smallest sample, which is
   exactly backwards. Small samples are the LEAST trustworthy, not the most.

   Two fixes, both standard:

   1. WIN RATE → the Wilson LOWER BOUND, not the point estimate. It asks "what is the
      worst win rate consistent with this evidence?", which collapses toward 0 when n is
      tiny and converges on the true rate as evidence accumulates. 5/5 scores ~48%, not
      100%; 310/500 scores ~58%. Luck stops paying.

   2. SHARPE / PROFIT FACTOR → shrunk toward the population prior in proportion to how
      little evidence backs them (James-Stein). With few trades you inherit the average;
      you only earn your own number by producing enough of a record to prove it. */

/* Below this a provider's record is not yet evidence — the UI marks them PROVISIONAL
   and they are ineligible for allocation, no matter how pretty the numbers look. */
export const MIN_SAMPLE = 30;

/* Population priors (what an unremarkable provider looks like). */
const PRIOR = { sharpe: 1.2, profitFactor: 1.4 };
/* k = the "phantom trades" of prior evidence. At n = k you sit halfway between the
   prior and your own number. */
const K = 40;
const shrink = (value, n, prior, k = K) => ((n || 0) * (value || 0) + k * prior) / ((n || 0) + k);

/* Is this record big enough to mean anything yet? */
const alphaConfidence = (t) => {
  const n = t.trades || 0;
  return { n, provisional: n < MIN_SAMPLE, minSample: MIN_SAMPLE };
};

/* ── Alpha Score: composite "power rating" 0–100, evidence-weighted ── */
const calcAlphaScore = (t) => {
  const n = t.trades || 0;
  const wins = Math.round((n * (t.winRate || 0)) / 100);
  // the worst win rate consistent with the evidence — small n is punished automatically
  const wrLower = wilson(wins, n).lo;

  const wrScore = Math.min(wrLower, 1) * 25;                                        // 25pts: win rate (evidence-weighted)
  const sharpeScore = Math.min(shrink(t.sharpe, n, PRIOR.sharpe) / 2.5, 1) * 25;    // 25pts: risk-adj returns (cap 2.5)
  const pfScore = Math.min(shrink(t.profitFactor, n, PRIOR.profitFactor) / 4, 1) * 20; // 20pts: profit factor (cap 4.0)
  const ddScore = Math.max(0, 1 - Math.abs(t.maxDD || 0) / 20) * 10;                // 10pts: low drawdown
  const streakScore = Math.min((t.streak || 0) / 15, 1) * 10;                       // 10pts: consistency streak
  const copierScore = Math.min((t.copiers || 0) / 500, 1) * 10;                     // 10pts: social proof
  return Math.round(wrScore + sharpeScore + pfScore + ddScore + streakScore + copierScore);
};
const alphaColor = (score) => score >= 80 ? C.green : score >= 60 ? C.blue : score >= 40 ? C.amber : C.red;
const alphaLabel = (score) => score >= 90 ? "S+" : score >= 80 ? "S" : score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : "D";

/* ── Expectancy: (Win% × AvgWin) − (Loss% × AvgLoss) — per VARIV metrics catalog ── */
const calcExpectancy = (t) => {
  const wr = t.winRate / 100;
  const avgWin = Math.abs(t.pnl) / Math.max(1, t.trades * wr) * 1.2;
  const avgLoss = Math.abs(t.pnl) / Math.max(1, t.trades * (1 - wr)) * 0.6;
  return Math.round((wr * avgWin - (1 - wr) * avgLoss) * 100) / 100;
};
const expectancyColor = (e) => e > 50 ? C.green : e > 0 ? C.blue : C.red;

/* ── Named Achievement Badges (crypto culture) ── */
const ACHIEVEMENTS = {
  diamondHands:    { icon: Shield,        color: C.cyan,   name: "Diamond Hands",     desc: "Held through 20%+ drawdown" },
  wagmi:           { icon: TrendingUp,    color: C.green,  name: "WAGMI",             desc: "10 consecutive green days" },
  degenGod:        { icon: Zap,           color: C.amber,  name: "Degen God",         desc: "Won 5+ prediction bets in a row" },
  liqHunter:       { icon: Crosshair,     color: C.red,    name: "Liquidation Hunter", desc: "Caught 10+ reversal trades" },
  moonShot:        { icon: TrendingUp,    color: C.amber,  name: "Moon Shot",         desc: "100%+ monthly return" },
  alphaLeaker:     { icon: Lightbulb,     color: C.purple, name: "Alpha Leaker",      desc: "Signal accuracy > 80%" },
  whaleSpotter:    { icon: Eye,           color: C.cyan,   name: "Whale Spotter",     desc: "Front-ran 3+ whale moves" },
  streakMachine:   { icon: Flame,         color: C.amber,  name: "Streak Machine",    desc: "15+ consecutive wins" },
  copyKing:        { icon: Trophy,        color: C.amber,  name: "Copy King",         desc: "500+ copiers" },
  sharpShooter:    { icon: Target,        color: C.green,  name: "Sharp Shooter",     desc: "Sharpe ratio > 2.0" },
  ironNerves:      { icon: Shield,        color: C.blue,   name: "Iron Nerves",       desc: "Max DD under 10%" },
  profitPrinter:   { icon: DollarSign,    color: C.green,  name: "Profit Printer",    desc: "6 profitable months straight" },
  ctInfluencer:    { icon: Radio,         color: C.blue,   name: "CT Influencer",     desc: "10K+ Twitter impressions/week" },
  earlyApe:        { icon: Zap,           color: C.purple, name: "Early Ape",         desc: "Top 3 in new coin entries" },
  riskDjinn:       { icon: Star,          color: C.amber,  name: "Risk Djinn",        desc: "Profit factor > 2.5" },
};
/* ── Degen Score: how aggressive/degenerate a trader is (0–100, higher = more degen) ── */
const calcDegenScore = (t) => {
  const levScore = (t.style === "Scalping" ? 35 : t.style === "Day Trading" ? 25 : t.style === "Breakout" ? 20 : 10);
  const ddScore = Math.min(Math.abs(t.maxDD || 0) / 25, 1) * 30;
  const streakScore = Math.min(t.streak / 20, 1) * 15;
  const tradeFreq = Math.min(t.trades / 1000, 1) * 20;
  return Math.round(levScore + ddScore + streakScore + tradeFreq);
};
const degenLabel = (score) => score >= 80 ? "FULL DEGEN" : score >= 60 ? "APE MODE" : score >= 40 ? "CALCULATED" : "SAFE PLAYER";

const titleByLevel = (level) => {
  if (level >= 50) return "Legend";
  if (level >= 45) return "Grandmaster";
  if (level >= 40) return "Master";
  if (level >= 35) return "Expert";
  if (level >= 25) return "Journeyman";
  if (level >= 15) return "Apprentice";
  return "Novice";
};

const srand = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

export {
  calcAlphaScore,
  alphaConfidence,
  alphaColor,
  alphaLabel,
  calcExpectancy,
  expectancyColor,
  ACHIEVEMENTS,
  calcDegenScore,
  degenLabel,
  titleByLevel,
  srand
};
