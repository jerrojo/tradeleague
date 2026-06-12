import { C } from "../theme";
import { Crosshair, DollarSign, Eye, Flame, Lightbulb, Radio, Shield, Star, Target, TrendingUp, Trophy, Zap } from "lucide-react";
/* ── Alpha Score: composite "power rating" 0–100 (the metric traders obsess over) ── */
const calcAlphaScore = (t) => {
  // Calibrated: top traders reach 85-92, mid 60-75, low 40-55
  const wrScore = Math.min(t.winRate / 100, 1) * 25;              // 25pts: win rate
  const sharpeScore = Math.min((t.sharpe || 0) / 2.5, 1) * 25;   // 25pts: risk-adj returns (cap 2.5)
  const pfScore = Math.min((t.profitFactor || 0) / 4, 1) * 20;    // 20pts: profit factor (cap 4.0)
  const ddScore = Math.max(0, 1 - Math.abs(t.maxDD || 0) / 20) * 10; // 10pts: low drawdown
  const streakScore = Math.min(t.streak / 15, 1) * 10;            // 10pts: consistency streak
  const copierScore = Math.min((t.copiers || 0) / 500, 1) * 10;   // 10pts: social proof
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
