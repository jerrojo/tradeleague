import { useState, useMemo, useCallback, useRef, useEffect, createContext, useContext } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import {
  Settings, Bell, TrendingUp, TrendingDown, Target,
  AlertTriangle, CheckCircle, Clock, Zap, Shield, Trophy, Users,
  Activity, BarChart3, Circle, Calendar, Filter, Search, Star,
  ChevronDown, ChevronRight, Eye, Lock, Copy, RefreshCw, Crosshair,
  Layers, GitBranch, Cpu, Bot, Gamepad2, ArrowUp, ArrowDown, Flame, Award,
  DollarSign, ToggleLeft, ToggleRight, Percent, Scale, Play, Pause, Power
} from "lucide-react";

/* ═══════════════════════ THEME ═══════════════════════ */
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);
const ThemeProvider = ({ children }) => {
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

/* ═══════════════════════ COLORS ═══════════════════════ */
const C = {
  bg: "#0d1117", card: "#161b22", cardHover: "#1c2129", border: "#21262d",
  borderLight: "#30363d", text: "#e6edf3", textMuted: "#8b949e", textFaint: "#484f58",
  green: "#3fb950", greenBg: "rgba(63,185,80,0.1)", red: "#f85149", redBg: "rgba(248,81,73,0.1)",
  amber: "#d29922", amberBg: "rgba(210,153,34,0.1)", purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.1)",
  blue: "#58a6ff", blueBg: "rgba(88,166,255,0.1)", cyan: "#39d0d8"
};

/* ═══════════════════════ HELPERS ═══════════════════════ */
const mono = { fontFamily: "'SF Mono','Cascadia Code','Fira Code',monospace", fontVariantNumeric: "tabular-nums" };

const pillStyle = (color) => ({
  display: "inline-block", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
  backgroundColor: color === C.green ? C.greenBg : color === C.red ? C.redBg : color === C.amber ? C.amberBg : color === C.blue ? C.blueBg : C.purpleBg,
  color: color, border: `1px solid ${color}30`
});

const cardStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "16px" };
const thStyle = { padding: "10px 12px", textAlign: "left", color: C.textMuted, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.border}` };
const tdStyle = { padding: "10px 12px", fontSize: "12px", borderBottom: `1px solid ${C.border}` };

const StatCard = ({ label, value, sub, icon: Icon, color = C.blue }) => (
  <div style={{ ...cardStyle, display: "flex", alignItems: "flex-start", gap: "12px" }}>
    <div style={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: "700", ...mono }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: sub.startsWith("+") ? C.green : sub.startsWith("-") ? C.red : C.textMuted, marginTop: "2px" }}>{sub}</div>}
    </div>
  </div>
);

const ScoreBar = ({ label, value, max = 100, color = C.blue }) => (
  <div style={{ marginBottom: "10px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
      <span style={{ fontSize: "11px", color: C.textMuted }}>{label}</span>
      <span style={{ fontSize: "11px", fontWeight: "600", ...mono }}>{value}/{max}</span>
    </div>
    <div style={{ width: "100%", height: "5px", backgroundColor: C.border, borderRadius: "3px", overflow: "hidden" }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", backgroundColor: color, borderRadius: "3px" }} />
    </div>
  </div>
);

const Tag = ({ text, color = C.purple }) => <span style={pillStyle(color)}>{text}</span>;

/* ═══════════════════════ MOCK DATA ═══════════════════════ */
const mockChartData = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  price: Math.round(67500 + i * 35 + Math.sin(i * 0.5) * 400),
  volume: Math.floor(1200 + Math.random() * 800),
  ma20: Math.round(67400 + i * 38),
  ma50: Math.round(67200 + i * 30)
}));

const mockSignals = [
  { id: 1, group: "SMC Masters", coin: "BTC", type: "LONG", entry: 67850, tp: 69200, sl: 67200, status: "active", date: "Mar 22 14:30", pnl: 1240, leverage: "5x" },
  { id: 2, group: "Scalp Squad", coin: "ETH", type: "SHORT", entry: 3450, tp: 3380, sl: 3520, status: "tp_hit", date: "Mar 22 13:15", pnl: 2100, leverage: "3x" },
  { id: 3, group: "SMC Masters", coin: "SOL", type: "LONG", entry: 145.2, tp: 152.8, sl: 140.5, status: "active", date: "Mar 22 12:45", pnl: 860, leverage: "4x" },
  { id: 4, group: "Liquidity Hunters", coin: "BNB", type: "SHORT", entry: 618, tp: 600, sl: 635, status: "sl_hit", date: "Mar 22 11:20", pnl: -850, leverage: "2x" },
  { id: 5, group: "Scalp Squad", coin: "XRP", type: "LONG", entry: 2.15, tp: 2.35, sl: 2.05, status: "active", date: "Mar 22 10:50", pnl: 420, leverage: "6x" },
  { id: 6, group: "OB Masters", coin: "DOGE", type: "LONG", entry: 0.35, tp: 0.42, sl: 0.32, status: "pending", date: "Mar 22 09:30", pnl: 0, leverage: "1x" },
  { id: 7, group: "SMC Masters", coin: "ADA", type: "SHORT", entry: 1.28, tp: 1.15, sl: 1.40, status: "active", date: "Mar 22 08:00", pnl: -120, leverage: "3x" },
  { id: 8, group: "Liquidity Hunters", coin: "AVAX", type: "LONG", entry: 38.5, tp: 42.2, sl: 36.0, status: "tp_hit", date: "Mar 21 22:15", pnl: 3680, leverage: "4x" },
  { id: 9, group: "Scalp Squad", coin: "BTC", type: "SHORT", entry: 68200, tp: 67500, sl: 68800, status: "pending", date: "Mar 21 20:45", pnl: 0, leverage: "2x" },
  { id: 10, group: "OB Masters", coin: "ETH", type: "LONG", entry: 3420, tp: 3550, sl: 3350, status: "tp_hit", date: "Mar 21 19:00", pnl: 5200, leverage: "5x" },
];

const titleByLevel = (level) => {
  if (level >= 50) return "Legend";
  if (level >= 45) return "Grandmaster";
  if (level >= 40) return "Master";
  if (level >= 35) return "Expert";
  if (level >= 25) return "Journeyman";
  if (level >= 15) return "Apprentice";
  return "Novice";
};

const mockTraders = [
  { name: "Scalp King", avatar: "👑", winRate: 81, pnl: 156200, trades: 823, streak: 15, rank: 1, tier: "Diamond", badges: ["⚡","🎯","💰"], level: 48, xp: 8200, xpNext: 10000, radarData: [{s:"Timing",v:94},{s:"Risk",v:89},{s:"Entries",v:96},{s:"Exits",v:91},{s:"Consistency",v:93},{s:"Discipline",v:92}],
    bio: "Full-time crypto trader since 2019. Specializing in BTC/ETH scalps with SMC methodology. Previously quant analyst at a prop firm.", location: "Miami, FL", joined: "Jan 2024", followers: 1842, following: 23, copiers: 567, sharpe: 2.1, maxDD: -8.2, avgRR: "1:2.8", avgHold: "4h", bestMonth: "+$42,300", worstMonth: "-$8,100", profitFactor: 2.4, favPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"], style: "Scalping", exchange: "Binance" },
  { name: "Crypto Ninja", avatar: "🥷", winRate: 78, pnl: 125400, trades: 456, streak: 12, rank: 2, tier: "Diamond", badges: ["🔥","⚡","🎯"], level: 45, xp: 6500, xpNext: 10000, radarData: [{s:"Timing",v:92},{s:"Risk",v:88},{s:"Entries",v:95},{s:"Exits",v:85},{s:"Consistency",v:91},{s:"Discipline",v:89}],
    bio: "Swing trader focused on altcoins. I use order flow analysis and smart money concepts to find high-probability setups.", location: "Tokyo, Japan", joined: "Mar 2024", followers: 1234, following: 45, copiers: 389, sharpe: 1.9, maxDD: -11.5, avgRR: "1:3.2", avgHold: "8h", bestMonth: "+$38,500", worstMonth: "-$12,400", profitFactor: 2.1, favPairs: ["BTC/USDT", "XRP/USDT", "BNB/USDT"], style: "Swing", exchange: "Bybit" },
  { name: "Smart Money", avatar: "💼", winRate: 76, pnl: 112300, trades: 567, streak: 10, rank: 3, tier: "Platinum", badges: ["💎","🔥"], level: 42, xp: 5100, xpNext: 10000, radarData: [{s:"Timing",v:89},{s:"Risk",v:86},{s:"Entries",v:91},{s:"Exits",v:88},{s:"Consistency",v:87},{s:"Discipline",v:85}],
    bio: "Conservative position trader. Low drawdown, consistent returns. Former hedge fund analyst. Risk management is everything.", location: "London, UK", joined: "Feb 2024", followers: 892, following: 12, copiers: 234, sharpe: 2.4, maxDD: -5.8, avgRR: "1:2.4", avgHold: "1d", bestMonth: "+$28,900", worstMonth: "-$5,200", profitFactor: 2.8, favPairs: ["BTC/USDT", "ETH/USDT", "AVAX/USDT"], style: "Position", exchange: "Binance" },
  { name: "Phoenix Rise", avatar: "🔥", winRate: 73, pnl: 104200, trades: 523, streak: 11, rank: 4, tier: "Platinum", badges: ["🏆","🔥"], level: 39, xp: 4200, xpNext: 10000, radarData: [{s:"Timing",v:86},{s:"Risk",v:83},{s:"Entries",v:89},{s:"Exits",v:85},{s:"Consistency",v:86},{s:"Discipline",v:84}],
    bio: "Aggressive intraday trader. High risk, high reward. Specializing in momentum plays during NY session.", location: "New York, NY", joined: "Apr 2024", followers: 567, following: 34, copiers: 178, sharpe: 1.6, maxDD: -18.4, avgRR: "1:3.8", avgHold: "2h", bestMonth: "+$52,100", worstMonth: "-$19,800", profitFactor: 1.7, favPairs: ["SOL/USDT", "BTC/USDT", "DOGE/USDT"], style: "Day Trading", exchange: "Bitget" },
  { name: "Bull Master", avatar: "🐂", winRate: 72, pnl: 98500, trades: 342, streak: 8, rank: 5, tier: "Gold", badges: ["💎","🏆"], level: 35, xp: 3800, xpNext: 10000, radarData: [{s:"Timing",v:85},{s:"Risk",v:80},{s:"Entries",v:88},{s:"Exits",v:82},{s:"Consistency",v:84},{s:"Discipline",v:81}],
    bio: "Long-only conviction trader. I find the trend and ride it. Patient entries, wide stops, massive targets.", location: "Dubai, UAE", joined: "May 2024", followers: 456, following: 28, copiers: 145, sharpe: 1.8, maxDD: -12.1, avgRR: "1:4.2", avgHold: "3d", bestMonth: "+$31,200", worstMonth: "-$11,500", profitFactor: 1.9, favPairs: ["BTC/USDT", "ETH/USDT"], style: "Swing", exchange: "Binance" },
  { name: "Rocket Launch", avatar: "🚀", winRate: 70, pnl: 89600, trades: 445, streak: 9, rank: 6, tier: "Gold", badges: ["⚡","💰"], level: 32, xp: 2900, xpNext: 10000, radarData: [{s:"Timing",v:82},{s:"Risk",v:78},{s:"Entries",v:85},{s:"Exits",v:80},{s:"Consistency",v:81},{s:"Discipline",v:79}],
    bio: "Breakout specialist. Scanning for volume surges and structural breaks. Trading crypto full-time since the 2021 bull run.", location: "Berlin, Germany", joined: "Jun 2024", followers: 345, following: 56, copiers: 98, sharpe: 1.5, maxDD: -14.8, avgRR: "1:2.6", avgHold: "6h", bestMonth: "+$24,800", worstMonth: "-$13,200", profitFactor: 1.6, favPairs: ["BTC/USDT", "SOL/USDT", "AVAX/USDT"], style: "Breakout", exchange: "Bybit" },
  { name: "Iron Fist", avatar: "👊", winRate: 68, pnl: 72400, trades: 389, streak: 7, rank: 7, tier: "Silver", badges: ["💪"], level: 28, xp: 1800, xpNext: 10000, radarData: [{s:"Timing",v:75},{s:"Risk",v:70},{s:"Entries",v:77},{s:"Exits",v:72},{s:"Consistency",v:73},{s:"Discipline",v:71}],
    bio: "Grinding every day. Learning from the best. Focused on improving my discipline and risk management.", location: "Bogota, Colombia", joined: "Jul 2024", followers: 189, following: 67, copiers: 42, sharpe: 1.3, maxDD: -16.5, avgRR: "1:2.0", avgHold: "5h", bestMonth: "+$18,400", worstMonth: "-$9,800", profitFactor: 1.4, favPairs: ["BTC/USDT", "ETH/USDT", "XRP/USDT"], style: "Scalping", exchange: "Binance" },
  { name: "Wave Rider", avatar: "🏄", winRate: 65, pnl: 45800, trades: 234, streak: 5, rank: 8, tier: "Silver", badges: ["🌊"], level: 18, xp: 4200, xpNext: 10000, radarData: [{s:"Timing",v:78},{s:"Risk",v:72},{s:"Entries",v:80},{s:"Exits",v:75},{s:"Consistency",v:76},{s:"Discipline",v:74}],
    bio: "Part-time trader, full-time surfer. Catching waves in the market like I catch them in the ocean. Chill entries only.", location: "Bali, Indonesia", joined: "Aug 2024", followers: 123, following: 89, copiers: 28, sharpe: 1.1, maxDD: -20.2, avgRR: "1:1.8", avgHold: "12h", bestMonth: "+$14,600", worstMonth: "-$11,200", profitFactor: 1.2, favPairs: ["BTC/USDT", "SOL/USDT"], style: "Swing", exchange: "Bitget" },
];

/* Per-trader deep data */
const traderDeepData = (() => {
  const data = {};
  const pairs = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","AVAX/USDT","DOGE/USDT","ADA/USDT"];
  const platforms = ["twitter","discord","reddit","tradehub","telegram","whatsapp"];
  const platIcons = { twitter: "𝕏", discord: "💬", reddit: "🔴", tradehub: "🟣", telegram: "✈️", whatsapp: "📱" };
  const platColors = { twitter: "#1DA1F2", discord: "#5865F2", reddit: "#FF4500", tradehub: "#8b5cf6", telegram: "#0088cc", whatsapp: "#25D366" };
  mockTraders.forEach((t, ti) => {
    // Trade history (last 20 trades)
    const history = [];
    for (let i = 0; i < 20; i++) {
      const isWin = Math.random() < (t.winRate / 100);
      const pair = pairs[(ti + i) % pairs.length];
      const type = Math.random() > 0.45 ? "LONG" : "SHORT";
      const entry = pair.startsWith("BTC") ? 67000 + Math.random() * 2000 : pair.startsWith("ETH") ? 3400 + Math.random() * 200 : 50 + Math.random() * 100;
      const pnlAmt = isWin ? Math.round(200 + Math.random() * 3000) : -Math.round(100 + Math.random() * 1500);
      const day = Math.max(1, 22 - i);
      history.push({ id: ti * 100 + i, pair, type, entry: Math.round(entry * 100) / 100,
        exit: Math.round((entry + (isWin ? (type === "LONG" ? 1 : -1) * entry * 0.02 : (type === "LONG" ? -1 : 1) * entry * 0.01)) * 100) / 100,
        pnl: pnlAmt, leverage: ["2x","3x","4x","5x"][i % 4], status: isWin ? "tp_hit" : "sl_hit",
        date: `Mar ${day}, ${String(8 + (i * 2) % 14).padStart(2,"0")}:${String((i * 17) % 60).padStart(2,"0")}`,
        duration: [`${1 + i % 8}h ${(i * 13) % 60}m`, `${(i * 7) % 24}h ${(i * 23) % 60}m`][i % 2],
        rr: isWin ? `1:${(1.5 + Math.random() * 2.5).toFixed(1)}` : `1:${(0.3 + Math.random() * 0.7).toFixed(1)}`,
        notes: isWin ? ["Clean entry on OB retest","FVG filled perfectly","Momentum confirmation strong","Liquidity sweep before entry"][i%4] : ["Stopped out on fakeout","Missed the displacement","Entered too early","Should have waited for NY"][i%4]
      });
    }
    // Monthly P&L (last 6 months)
    const months = ["Oct","Nov","Dec","Jan","Feb","Mar"];
    const monthlyPnl = months.map(m => ({
      month: m,
      pnl: Math.round((t.pnl / 6) * (0.6 + Math.random() * 0.8) * (Math.random() > 0.2 ? 1 : -0.4)),
      trades: Math.round(t.trades / 6 * (0.7 + Math.random() * 0.6)),
      winRate: Math.round(t.winRate + (Math.random() - 0.5) * 12)
    }));
    // Daily equity curve (last 30 days)
    const dailyEquity = [];
    let eq = 10000 + ti * 5000;
    for (let d = 1; d <= 30; d++) { eq += (Math.random() - 0.35) * (800 + ti * 200); dailyEquity.push({ day: d, equity: Math.round(eq) }); }

    // ── PREDICTIONS (individual bets on prediction markets) ──
    const predictionsList = [
      { id: ti*20+1, question: "BTC > $80K antes de Junio?", bet: "YES", odds: 38, stake: 250 + ti * 50, status: "open", date: "Mar 20", potential: Math.round((250+ti*50) * (100/38)) },
      { id: ti*20+2, question: "ETH +10% esta semana?", bet: "NO", odds: 56, stake: 180 + ti * 30, status: "open", date: "Mar 19", potential: Math.round((180+ti*30) * (100/56)) },
      { id: ti*20+3, question: "Fed baja tasas en Mayo?", bet: "YES", odds: 72, stake: 400 + ti * 80, status: "open", date: "Mar 18", potential: Math.round((400+ti*80) * (100/72)) },
      { id: ti*20+4, question: "SOL flippea BNB Q2?", bet: ti%2===0 ? "YES" : "NO", odds: 61, stake: 150, status: "won", date: "Mar 10", potential: 246, pnl: 96 },
      { id: ti*20+5, question: "BTC dominance > 58% en Feb?", bet: "YES", odds: 65, stake: 200, status: "won", date: "Feb 28", potential: 308, pnl: 108 },
      { id: ti*20+6, question: "DOGE > $0.40 en Feb?", bet: "NO", odds: 75, stake: 300, status: "lost", date: "Feb 15", potential: 400, pnl: -300 },
      { id: ti*20+7, question: "ETH merge upgrade Q1?", bet: "YES", odds: 45, stake: 100, status: "won", date: "Jan 20", potential: 222, pnl: 122 },
    ];
    const predStats = { total: 45 + ti * 8, correct: Math.round((45 + ti * 8) * (t.winRate / 100 * 0.9)), streak: 3 + ti, totalStaked: predictionsList.reduce((a,p) => a+p.stake, 0), totalWon: predictionsList.filter(p=>p.status==="won").reduce((a,p)=>a+(p.pnl||0),0) };

    // ── SIGNALS (signals this trader has emitted) ──
    const signals = [];
    const sigGroups = ["SMC Masters","Scalp Squad","Liquidity Hunters","OB Masters","Crypto Pioneers"];
    for (let i = 0; i < 12; i++) {
      const isWin = Math.random() < (t.winRate / 100 + 0.05);
      const pair = pairs[(ti + i) % pairs.length];
      const type = Math.random() > 0.45 ? "LONG" : "SHORT";
      const basePrice = pair.startsWith("BTC") ? 67000 + Math.random() * 2000 : pair.startsWith("ETH") ? 3400 + Math.random() * 200 : 50 + Math.random() * 100;
      const entryP = Math.round(basePrice * 100) / 100;
      const tpP = Math.round((entryP * (type === "LONG" ? 1.02 : 0.98)) * 100) / 100;
      const slP = Math.round((entryP * (type === "LONG" ? 0.99 : 1.01)) * 100) / 100;
      const pnlAmt = isWin ? Math.round(400 + Math.random() * 4000) : -Math.round(200 + Math.random() * 2000);
      const day = Math.max(1, 22 - i);
      signals.push({
        id: ti * 200 + i, pair, type, entry: entryP, tp: tpP, sl: slP,
        leverage: ["2x","3x","4x","5x","10x"][i % 5],
        status: i < 3 ? "active" : isWin ? "tp_hit" : "sl_hit",
        date: `Mar ${day}`, pnl: i < 3 ? Math.round(pnlAmt * 0.3) : pnlAmt,
        group: sigGroups[(ti + i) % sigGroups.length],
        rr: isWin ? `1:${(2.0 + Math.random() * 2).toFixed(1)}` : `1:${(0.4 + Math.random() * 0.6).toFixed(1)}`,
        subscribers: Math.round(120 + ti * 30 + Math.random() * 200),
        analysis: isWin
          ? ["OB + FVG confluence at key level","Liquidity sweep + displacement entry","BOS confirmed on 1H, momentum strong","Clean break of structure with volume"][i%4]
          : ["Fakeout above resistance","Choppy PA, no clear setup","Entered against higher TF bias","Missed the killzone window"][i%4]
      });
    }
    const signalStats = {
      total: 45 + ti * 12, active: signals.filter(s => s.status === "active").length,
      accuracy: Math.round(t.winRate + 3), avgPnlPerSignal: Math.round(signals.reduce((a, s) => a + s.pnl, 0) / signals.length),
      bestSignal: Math.max(...signals.map(s => s.pnl)), subscribers: 340 + ti * 80,
    };

    // ── SOCIAL POSTS (cross-platform: Twitter, Discord, Reddit, Tradethlon, Telegram, WhatsApp) ──
    const socialPosts = [
      { id: ti*50+1, platform: "twitter", handle: `@${t.name.replace(" ","")}`, text: `$BTC looking absolutely beautiful on the 4H. SMC structure intact, OB holding strong. My target: $72K. Not financial advice, just vibes and order blocks. 📈🔥`, time: "1h ago", likes: 234 + ti * 40, retweets: 45 + ti * 8, replies: 32 + ti * 5, impressions: 12400 + ti * 2000 },
      { id: ti*50+2, platform: "discord", handle: t.name, text: `Hey everyone, just entered a BTC long at $67,850. My analysis shows strong confluence: OB + FVG + liquidity sweep. TP1 at $69,200. Will update you all on how it goes. 🎯`, time: "3h ago", likes: 67 + ti * 10, retweets: 0, replies: 23 + ti * 3, impressions: 0, channel: "#trading-signals" },
      { id: ti*50+3, platform: "telegram", handle: t.name, text: `🚨 SIGNAL ALERT 🚨\n\nBTC/USDT LONG\nEntry: $67,850\nTP1: $69,200\nTP2: $70,500\nSL: $67,200\n\nConfluence: OB + FVG + Liq Sweep\nRisk: 2% of capital\n\n⚡ Follow for more signals`, time: "2h ago", likes: 156 + ti * 25, retweets: 0, replies: 45 + ti * 6, impressions: 0, channel: "Trading Signals VIP" },
      { id: ti*50+4, platform: "twitter", handle: `@${t.name.replace(" ","")}`, text: `Thread 🧵 on why most retail traders lose money:\n\n1/ They don't understand market structure\n2/ They chase entries instead of waiting\n3/ They risk too much per trade\n4/ They don't journal\n\nFix these 4 things and you'll already be top 10%.`, time: "5h ago", likes: 892 + ti * 100, retweets: 234 + ti * 40, replies: 78 + ti * 10, impressions: 45600 + ti * 5000 },
      { id: ti*50+5, platform: "whatsapp", handle: t.name, text: `Buenos días grupo 🙌\n\nAnálisis rápido del mercado:\n- BTC consolidando en $67K-$68K\n- ETH mostrando fuerza relativa\n- SOL con estructura bullish en 4H\n\nHoy busco entradas en London session. Les aviso cuando entre. 💪`, time: "4h ago", likes: 28 + ti * 5, retweets: 0, replies: 12 + ti * 2, impressions: 0, channel: "Grupo Trading VIP" },
      { id: ti*50+6, platform: "reddit", handle: `u/${t.name.replace(" ","_")}`, text: `DD: Why I think SOL is the play for Q2 2026. The ecosystem growth is insane, DeFi TVL up 340% YoY, and the chart shows a massive cup and handle on the weekly. My position: Long from $142 with a $200 target.`, time: "8h ago", likes: 456 + ti * 50, retweets: 0, replies: 123 + ti * 15, impressions: 0, subreddit: "r/CryptoMarkets" },
      { id: ti*50+7, platform: "tradehub", handle: t.name, text: `Closed my ETH long at TP2. +$${(1200 + ti * 300).toLocaleString()} profit. The FVG at $3,420 held perfectly. Key takeaway: patience on entries saves you from fake breakouts.`, time: "12h ago", likes: 89 + ti * 12, retweets: 0, replies: 34 + ti * 4, impressions: 0 },
      { id: ti*50+8, platform: "telegram", handle: t.name, text: `📊 Actualización de posiciones:\n\n✅ BTC LONG — TP1 hit (+$1,350)\n🔄 ETH LONG — en profit, moviendo SL a BE\n❌ SOL SHORT — cerrado en SL (-$420)\n\nBalance del día: +$930\nSeguimos construyendo 💎`, time: "6h ago", likes: 89 + ti * 15, retweets: 0, replies: 34 + ti * 5, impressions: 0, channel: "Trading Updates" },
      { id: ti*50+9, platform: "discord", handle: t.name, text: `Quick market update: Funding rates just flipped negative on BTC. This usually means shorts are overcrowded and we might see a squeeze. Stay alert, don't get caught offside. 👀`, time: "1d ago", likes: 45 + ti * 8, retweets: 0, replies: 18 + ti * 2, impressions: 0, channel: "#market-chat" },
      { id: ti*50+10, platform: "whatsapp", handle: t.name, text: `🎯 Resultado del día:\n\n3 trades tomados\n2 wins / 1 loss\nPnL: +$${(1800 + ti * 400).toLocaleString()}\n\nMejor trade: BTC long desde $67,850\nPeor trade: SOL short (SL hit)\n\nMañana viene la decisión de tasas del Fed. Voy a reducir exposición. 🧠`, time: "1d ago", likes: 42 + ti * 8, retweets: 0, replies: 18 + ti * 3, impressions: 0, channel: "Grupo Trading VIP" },
      { id: ti*50+11, platform: "twitter", handle: `@${t.name.replace(" ","")}`, text: `Monthly results for February:\n✅ 34 trades\n✅ ${t.winRate - 2}% win rate\n✅ +$${(t.pnl / 8 / 1000).toFixed(1)}K profit\n✅ Max drawdown: ${t.maxDD + 2}%\n\nConsistency > home runs. Always.`, time: "2d ago", likes: 1245 + ti * 150, retweets: 312 + ti * 50, replies: 89 + ti * 10, impressions: 67800 + ti * 8000 },
      { id: ti*50+12, platform: "reddit", handle: `u/${t.name.replace(" ","_")}`, text: `Anyone else notice the massive hidden divergence on the BTC daily RSI? Last time we saw this pattern was before the move from $54K to $74K. I'm loading up longs at any dip below $67K. Risk: $66K stop. Target: $72K+.`, time: "3d ago", likes: 234 + ti * 30, retweets: 0, replies: 67 + ti * 8, impressions: 0, subreddit: "r/Bitcoin" },
    ];
    const socialStats = {
      twitterFollowers: 2400 + ti * 800, discordMessages: 1240 + ti * 200, redditKarma: 8900 + ti * 1500,
      telegramMembers: 890 + ti * 150, whatsappGroups: 2 + (ti % 3),
      totalImpressions: socialPosts.filter(p=>p.platform==="twitter").reduce((a,p)=>a+p.impressions,0),
      avgEngagement: (3.2 + ti * 0.3).toFixed(1),
      topPlatform: ["twitter","discord","telegram","twitter","discord","telegram","whatsapp","twitter"][ti]
    };

    // ── RISK DNA (behavioral patterns, session analysis, pair analysis) ──
    const riskDna = {
      sessionPerf: [
        { session: "Asia", trades: 45 + ti * 10, winRate: t.winRate - 5, avgPnl: 340 + ti * 80 },
        { session: "London", trades: 82 + ti * 15, winRate: t.winRate + 2, avgPnl: 520 + ti * 100 },
        { session: "NY AM", trades: 120 + ti * 20, winRate: t.winRate + 5, avgPnl: 780 + ti * 120 },
        { session: "NY PM", trades: 65 + ti * 12, winRate: t.winRate - 3, avgPnl: 290 + ti * 60 },
      ],
      dayOfWeek: [
        { day: "Mon", winRate: t.winRate - 2, pnl: 1200 + ti * 300 },
        { day: "Tue", winRate: t.winRate + 3, pnl: 2100 + ti * 400 },
        { day: "Wed", winRate: t.winRate + 1, pnl: 1800 + ti * 350 },
        { day: "Thu", winRate: t.winRate + 4, pnl: 2400 + ti * 450 },
        { day: "Fri", winRate: t.winRate - 4, pnl: 800 + ti * 200 },
      ],
      pairBreakdown: t.favPairs.map((pair, pi) => ({
        pair, trades: Math.round(t.trades * [0.4, 0.3, 0.2, 0.1][pi] || t.trades * 0.1),
        winRate: t.winRate + (pi === 0 ? 5 : pi === 1 ? 2 : -3),
        pnl: Math.round(t.pnl * [0.45, 0.3, 0.15, 0.1][pi] || t.pnl * 0.1),
        avgRR: `1:${(2.0 + pi * 0.4).toFixed(1)}`
      })),
      behavioral: {
        avgPositionSize: `${(2 + ti * 0.3).toFixed(1)}%`,
        maxLevUsed: ["5x","4x","3x","5x","4x","3x","2x","3x"][ti],
        revengeTradeRate: `${Math.max(2, 12 - ti * 1.2).toFixed(0)}%`,
        tiltAfterLoss: ti < 3 ? "Low" : ti < 6 ? "Medium" : "High",
        holdTimeBias: ["On schedule","Cuts early","Holds too long","On schedule","Cuts early","On schedule","Holds too long","On schedule"][ti],
        streakBehavior: ti < 4 ? "Consistent sizing" : "Increases after wins",
        recoveryTime: `${(1.5 + ti * 0.3).toFixed(1)} days avg`,
        bestTimeOfDay: ["NY AM","London","NY AM","NY AM","Asia","London","NY PM","Asia"][ti],
      },
      drawdownPeriods: [
        { start: "Jan 5", end: "Jan 12", depth: `${(Math.abs(t.maxDD) * 0.6).toFixed(1)}%`, recovery: "5 days" },
        { start: "Feb 18", end: "Feb 24", depth: `${Math.abs(t.maxDD).toFixed(1)}%`, recovery: "8 days" },
        { start: "Mar 8", end: "Mar 11", depth: `${(Math.abs(t.maxDD) * 0.4).toFixed(1)}%`, recovery: "3 days" },
      ]
    };

    // ── JOURNAL ENTRIES ──
    const journal = [
      { id: ti*30+1, date: "Mar 22", mood: "Confident", text: "Great day. 3/3 wins. My SMC analysis is really clicking this week. The key was waiting for the London session open to get the liquidity sweep before entering.", tags: ["discipline","patience","SMC"], pnl: 2400 + ti * 500 },
      { id: ti*30+2, date: "Mar 21", mood: "Frustrated", text: "Got stopped out twice on SOL. I was right on the direction but my stop was too tight. Need to give more room on 4H setups. Lesson learned.", tags: ["stop-loss","4H","SOL"], pnl: -(800 + ti * 200) },
      { id: ti*30+3, date: "Mar 20", mood: "Focused", text: "Kept position sizes small today. Market is choppy. Only took 1 trade on BTC, hit TP1 and closed. Sometimes less is more.", tags: ["risk-mgmt","patience","BTC"], pnl: 1200 + ti * 300 },
      { id: ti*30+4, date: "Mar 19", mood: "Excited", text: "Caught the ETH breakout perfectly. Order block entry, FVG confirmation, BOS on the 1H. This is what I train for. +$3.2K on a single trade.", tags: ["breakout","ETH","FVG"], pnl: 3200 + ti * 600 },
      { id: ti*30+5, date: "Mar 18", mood: "Neutral", text: "No trades today. Market is ranging and nothing meets my criteria. Sat on my hands all day. That's okay — the best trade is sometimes no trade.", tags: ["discipline","no-trade"], pnl: 0 },
    ];

    data[t.name] = { history, monthlyPnl, dailyEquity, signals, signalStats, predStats, predictionsList, socialPosts, socialStats, riskDna, journal, platIcons, platColors };
  });
  return data;
})();

const mockGroups = [
  { name: "SMC Masters", emoji: "📊", members: 24, winRate: 76, monthlyPnl: 245800, signals: 156, accuracy: 78 },
  { name: "Scalp Squad", emoji: "⚡", members: 18, winRate: 72, monthlyPnl: 189200, signals: 234, accuracy: 74 },
  { name: "Liquidity Hunters", emoji: "💧", members: 15, winRate: 68, monthlyPnl: 134500, signals: 98, accuracy: 70 },
  { name: "OB Masters", emoji: "📈", members: 12, winRate: 71, monthlyPnl: 156700, signals: 87, accuracy: 73 },
  { name: "Crypto Pioneers", emoji: "🚀", members: 21, winRate: 69, monthlyPnl: 167400, signals: 145, accuracy: 71 },
];

/* Time-series equity curves per trader (30 days) */
const traderColors = ["#58a6ff","#3fb950","#f85149","#d29922","#8b5cf6","#39d0d8","#f0883e","#bc8cff"];
const traderEquity = (() => {
  const names = ["Scalp King","Crypto Ninja","Smart Money","Phoenix Rise","Bull Master","Rocket Launch","Iron Fist","Wave Rider"];
  const seeds = [156200, 125400, 112300, 104200, 98500, 89600, 72400, 45800];
  const data = [];
  for (let d = 1; d <= 30; d++) {
    const point = { day: d };
    names.forEach((name, i) => {
      const base = seeds[i];
      const growth = (d / 30) * base;
      const noise = Math.sin(d * (i + 1) * 0.7) * base * 0.08 + Math.cos(d * 0.3 * (i + 1)) * base * 0.05;
      point[name] = Math.round(growth + noise);
    });
    data.push(point);
  }
  return data;
})();

const heatAssets = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX"];
const mockHeatmap = [
  { t: "Scalp King", d: [12300,9870,6450,5230,3120,2100,1560,4980] },
  { t: "Crypto Ninja", d: [8420,6230,4120,3850,2100,1240,890,3450] },
  { t: "Smart Money", d: [9150,7620,5340,4210,2340,1560,980,3890] },
  { t: "Bull Master", d: [6200,4850,2980,2650,1450,-820,-640,2340] },
  { t: "Rocket Launch", d: [5430,3890,2340,1980,890,-450,-220,2100] },
  { t: "Wave Rider", d: [2100,1450,890,-650,-1120,-1250,-340,1200] },
];

const marchData = {};
let cumPnl = 0;
const cumData = [];
for (let d = 1; d <= 22; d++) {
  const p = Math.round((Math.random() - 0.3) * 3000);
  const totalT = Math.floor(Math.random() * 16 + 5);
  const wr = Math.floor(Math.random() * 35 + 50);
  const wins = Math.round(totalT * wr / 100);
  const losses = totalT - wins;
  marchData[d] = { pnl: p, trades: totalT, winRate: wr, wins, losses };
  cumPnl += p;
  cumData.push({ day: d, pnl: cumPnl });
}

/* ── Prediction Markets Data ── */
const predictionMarkets = [
  { id: 1, question: "BTC > $80,000 antes de Junio 2026?", category: "Price", yesOdds: 38, noOdds: 62, volume: 245800, participants: 1842, deadline: "May 31, 2026", trending: true, resolution: "pending", yesBets: 702, noBets: 1140, priceHistory: [22, 28, 35, 31, 42, 38] },
  { id: 2, question: "ETH +10% esta semana?", category: "Price", yesOdds: 44, noOdds: 56, volume: 128400, participants: 923, deadline: "Mar 29, 2026", trending: true, resolution: "pending", yesBets: 406, noBets: 517, priceHistory: [55, 48, 52, 40, 46, 44] },
  { id: 3, question: "SOL flippea BNB en market cap Q2?", category: "Macro", yesOdds: 61, noOdds: 39, volume: 89200, participants: 645, deadline: "Jun 30, 2026", trending: false, resolution: "pending", yesBets: 394, noBets: 251, priceHistory: [45, 52, 58, 55, 63, 61] },
  { id: 4, question: "Fed baja tasas en reunión de Mayo?", category: "Macro", yesOdds: 72, noOdds: 28, volume: 312500, participants: 2341, deadline: "May 7, 2026", trending: true, resolution: "pending", yesBets: 1686, noBets: 655, priceHistory: [58, 62, 68, 65, 70, 72] },
  { id: 5, question: "BTC dominance > 60% en Abril?", category: "Dominance", yesOdds: 55, noOdds: 45, volume: 67300, participants: 478, deadline: "Apr 30, 2026", trending: false, resolution: "pending", yesBets: 263, noBets: 215, priceHistory: [48, 50, 53, 58, 54, 55] },
  { id: 6, question: "DOGE supera $0.50 en 2026?", category: "Price", yesOdds: 21, noOdds: 79, volume: 156700, participants: 1567, deadline: "Dec 31, 2026", trending: false, resolution: "pending", yesBets: 329, noBets: 1238, priceHistory: [30, 26, 22, 24, 19, 21] },
  { id: 7, question: "Scalp King mantiene #1 ranking este mes?", category: "Traders", yesOdds: 68, noOdds: 32, volume: 34200, participants: 234, deadline: "Mar 31, 2026", trending: true, resolution: "pending", yesBets: 159, noBets: 75, priceHistory: [72, 70, 65, 68, 71, 68] },
  { id: 8, question: "ETH/BTC ratio > 0.06 antes de Q3?", category: "Price", yesOdds: 29, noOdds: 71, volume: 78900, participants: 534, deadline: "Jun 30, 2026", trending: false, resolution: "pending", yesBets: 155, noBets: 379, priceHistory: [35, 32, 28, 30, 27, 29] },
];

const predCategories = ["All", "Price", "Macro", "Dominance", "Traders"];

/* ── Copy Trading Data ── */
const copyPortfolios = [
  {
    name: "Scalp King", avatar: "👑", tier: "Diamond", followers: 1842, aum: 2450000,
    monthlyReturn: 12.4, sharpe: 2.1, maxDD: -8.2, winRate: 81, avgTrade: "4h",
    fee: 15, minInvest: 500, riskLevel: "Medium",
    equity: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 100000 + i * 3200 + Math.sin(i * 0.8) * 5000 })),
    recentTrades: [
      { pair: "BTC/USDT", type: "LONG", pnl: 3240, date: "Mar 22" },
      { pair: "ETH/USDT", type: "LONG", pnl: 1850, date: "Mar 21" },
      { pair: "SOL/USDT", type: "SHORT", pnl: -420, date: "Mar 21" },
    ],
    allocation: [{ asset: "BTC", pct: 45 }, { asset: "ETH", pct: 25 }, { asset: "SOL", pct: 15 }, { asset: "Others", pct: 15 }]
  },
  {
    name: "Crypto Ninja", avatar: "🥷", tier: "Diamond", followers: 1234, aum: 1890000,
    monthlyReturn: 9.8, sharpe: 1.9, maxDD: -11.5, winRate: 78, avgTrade: "8h",
    fee: 12, minInvest: 300, riskLevel: "Medium-High",
    equity: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 80000 + i * 2800 + Math.cos(i * 0.6) * 4000 })),
    recentTrades: [
      { pair: "BTC/USDT", type: "SHORT", pnl: 2100, date: "Mar 22" },
      { pair: "XRP/USDT", type: "LONG", pnl: 890, date: "Mar 22" },
      { pair: "BNB/USDT", type: "LONG", pnl: 1560, date: "Mar 20" },
    ],
    allocation: [{ asset: "BTC", pct: 35 }, { asset: "ETH", pct: 30 }, { asset: "XRP", pct: 20 }, { asset: "Others", pct: 15 }]
  },
  {
    name: "Smart Money", avatar: "💼", tier: "Platinum", followers: 892, aum: 1340000,
    monthlyReturn: 7.2, sharpe: 2.4, maxDD: -5.8, winRate: 76, avgTrade: "1d",
    fee: 18, minInvest: 1000, riskLevel: "Low",
    equity: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 120000 + i * 2400 + Math.sin(i * 0.5) * 3000 })),
    recentTrades: [
      { pair: "BTC/USDT", type: "LONG", pnl: 4500, date: "Mar 22" },
      { pair: "ETH/USDT", type: "LONG", pnl: 2200, date: "Mar 21" },
      { pair: "AVAX/USDT", type: "SHORT", pnl: 1100, date: "Mar 19" },
    ],
    allocation: [{ asset: "BTC", pct: 50 }, { asset: "ETH", pct: 30 }, { asset: "SOL", pct: 10 }, { asset: "Others", pct: 10 }]
  },
  {
    name: "Phoenix Rise", avatar: "🔥", tier: "Platinum", followers: 567, aum: 780000,
    monthlyReturn: 15.6, sharpe: 1.6, maxDD: -18.4, winRate: 73, avgTrade: "2h",
    fee: 20, minInvest: 200, riskLevel: "High",
    equity: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 50000 + i * 4100 + Math.sin(i * 1.2) * 8000 })),
    recentTrades: [
      { pair: "SOL/USDT", type: "LONG", pnl: 5600, date: "Mar 22" },
      { pair: "DOGE/USDT", type: "LONG", pnl: -1200, date: "Mar 22" },
      { pair: "BTC/USDT", type: "SHORT", pnl: 3400, date: "Mar 21" },
    ],
    allocation: [{ asset: "SOL", pct: 35 }, { asset: "BTC", pct: 25 }, { asset: "DOGE", pct: 20 }, { asset: "Others", pct: 20 }]
  },
];

/* ── Football Trading Game Data ──
   The field IS the price chart. Ball = current price. Players = open positions.
   LONG team scores when price goes right (up). SHORT team when price goes left (down).
   Red zones = extreme price areas (end zones). */
const ftgPair = "BTCUSDT";
const ftgCurrentPrice = 67740.80;
const ftgPriceRange = { low: 66200, high: 71400 }; // field boundaries
const ftgRedZoneWidth = 8; // % of field width for each end zone

const ftgPlayers = [
  { name: "Trader Titan", avatar: "🐯", coin: "BTC", team: "SHORT", entry: 77896.90, current: ftgCurrentPrice, roi: 13.04, status: "Win", time: "3d ago" },
  { name: "Cryptex Guy", avatar: "🤖", coin: "BTC", team: "SHORT", entry: 71604.00, current: ftgCurrentPrice, roi: 5.40, status: "Win", time: "2d ago" },
  { name: "Scalp King", avatar: "👑", coin: "BTC", team: "LONG", entry: 68650.00, current: ftgCurrentPrice, roi: -1.32, status: "Loss", time: "3d ago" },
  { name: "Trader Bamp", avatar: "🐸", coin: "BTC", team: "LONG", entry: 69758.20, current: ftgCurrentPrice, roi: -2.89, status: "Loss", time: "3d ago" },
  { name: "Moon Shot", avatar: "🌙", coin: "BTC", team: "LONG", entry: 66890.50, current: ftgCurrentPrice, roi: 1.27, status: "Win", time: "1d ago" },
  { name: "Deep Freeze", avatar: "🧊", coin: "BTC", team: "SHORT", entry: 70250.00, current: ftgCurrentPrice, roi: 3.57, status: "Win", time: "4d ago" },
  { name: "Bull Master", avatar: "🐂", coin: "BTC", team: "LONG", entry: 67120.40, current: ftgCurrentPrice, roi: 0.92, status: "Win", time: "2d ago" },
];

const ftgTimeframes = ["1D","3D","7D","2W","1M","3M"];
const ftgSessions = [
  { name: "ASIA", start: "00:00", end: "08:00", active: true },
  { name: "LONDON", start: "08:00", end: "16:00", active: false },
  { name: "NY", start: "13:00", end: "21:00", active: false },
];

/* ═══════════════════════ SMC COIN DATA ═══════════════════════ */
const smcCoins = {
  BTC: {
    pair: "USDT", category: "Layer 1",
    price: "$68,326", change: "+1.2%", bias: "BULLISH", biasIcon: "up", confluence: 8, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$67,850–$68,100", rr: "1 : 2.8", tp1: "$69,200", tp2: "$70,500", tp3: "$72,000", sl: "$67,200" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.01%" },
      { name: "Open Interest", status: "pass", detail: "+2.3%" },
      { name: "Volume", status: "warning", detail: "Below avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.92" },
    ],
    chartBase: 67500, chartStep: 35, chartAmp: 400,
  },
  ETH: {
    pair: "USDT", category: "Layer 1",
    price: "$3,482", change: "+2.8%", bias: "BULLISH", biasIcon: "up", confluence: 9, risk: "LOW",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
    ],
    entry: { zone: "$3,420–$3,460", rr: "1 : 3.2", tp1: "$3,580", tp2: "$3,680", tp3: "$3,800", sl: "$3,350" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.005%" },
      { name: "Open Interest", status: "pass", detail: "+4.1%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.88" },
    ],
    chartBase: 3400, chartStep: 3.5, chartAmp: 40,
  },
  SOL: {
    pair: "USDT", category: "Layer 1",
    price: "$148.60", change: "+4.5%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$145.20–$147.00", rr: "1 : 2.5", tp1: "$152.80", tp2: "$158.00", tp3: "$165.00", sl: "$140.50" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.02%" },
      { name: "Open Interest", status: "warning", detail: "+8.7%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.85" },
    ],
    chartBase: 142, chartStep: 0.28, chartAmp: 3.2,
  },
  BNB: {
    pair: "USDT", category: "Layer 1",
    price: "$618.40", change: "-0.6%", bias: "BEARISH", biasIcon: "down", confluence: 5, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bearish", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "1H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "4H", trend: "Bearish", struct: "BOS", ob: "Bearish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$625.00–$630.00", rr: "1 : 2.0", tp1: "$600.00", tp2: "$585.00", tp3: "$570.00", sl: "$640.00" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "-0.03%" },
      { name: "Open Interest", status: "pass", detail: "+1.2%" },
      { name: "Volume", status: "warning", detail: "Below avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.78" },
    ],
    chartBase: 625, chartStep: -0.25, chartAmp: 5,
  },
  XRP: {
    pair: "USDT", category: "Layer 1",
    price: "$2.18", change: "+1.8%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
    ],
    entry: { zone: "$2.12–$2.16", rr: "1 : 2.6", tp1: "$2.35", tp2: "$2.50", tp3: "$2.70", sl: "$2.05" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.01%" },
      { name: "Open Interest", status: "pass", detail: "+3.5%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "warning", detail: "BTC 0.62" },
    ],
    chartBase: 2.10, chartStep: 0.004, chartAmp: 0.05,
  },
  DOGE: {
    pair: "USDT", category: "Meme",
    price: "$0.358", change: "+6.2%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Lows" },
    ],
    entry: { zone: "$0.340–$0.350", rr: "1 : 2.4", tp1: "$0.380", tp2: "$0.420", tp3: "$0.460", sl: "$0.320" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "+0.06%" },
      { name: "Open Interest", status: "warning", detail: "+12.3%" },
      { name: "Volume", status: "pass", detail: "Spiking" },
      { name: "Correlation", status: "pass", detail: "BTC 0.71" },
    ],
    chartBase: 0.33, chartStep: 0.0012, chartAmp: 0.015,
  },
  AVAX: {
    pair: "USDT", category: "Layer 1",
    price: "$39.20", change: "+3.1%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
    ],
    entry: { zone: "$38.00–$39.00", rr: "1 : 3.0", tp1: "$42.00", tp2: "$45.50", tp3: "$48.00", sl: "$36.00" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.01%" },
      { name: "Open Interest", status: "pass", detail: "+5.2%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.82" },
    ],
    chartBase: 37, chartStep: 0.1, chartAmp: 1.5,
  },
  ADA: {
    pair: "USDT", category: "Layer 1",
    price: "$1.24", change: "-1.3%", bias: "BEARISH", biasIcon: "down", confluence: 4, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bearish", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "1H", trend: "Bearish", struct: "BOS", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$1.28–$1.32", rr: "1 : 2.2", tp1: "$1.15", tp2: "$1.08", tp3: "$1.00", sl: "$1.40" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "-0.01%" },
      { name: "Open Interest", status: "warning", detail: "-2.1%" },
      { name: "Volume", status: "warning", detail: "Below avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.75" },
    ],
    chartBase: 1.30, chartStep: -0.003, chartAmp: 0.03,
  },
  LINK: {
    pair: "USDT", category: "DeFi",
    price: "$32.85", change: "+2.4%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$32.10–$32.50", rr: "1 : 2.9", tp1: "$35.20", tp2: "$37.80", tp3: "$40.00", sl: "$30.50" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.015%" },
      { name: "Open Interest", status: "pass", detail: "+2.8%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.72" },
    ],
    chartBase: 32, chartStep: 0.08, chartAmp: 1,
  },
  DOT: {
    pair: "USDT", category: "Layer 1",
    price: "$12.48", change: "-2.1%", bias: "BEARISH", biasIcon: "down", confluence: 4, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bearish", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "1H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "4H", trend: "Bearish", struct: "BOS", ob: "Bearish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$12.80–$13.20", rr: "1 : 1.9", tp1: "$11.80", tp2: "$11.00", tp3: "$10.20", sl: "$13.60" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "-0.02%" },
      { name: "Open Interest", status: "pass", detail: "+1.5%" },
      { name: "Volume", status: "warning", detail: "Below avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.68" },
    ],
    chartBase: 12.5, chartStep: -0.018, chartAmp: 0.25,
  },
  MATIC: {
    pair: "USDT", category: "Layer 2",
    price: "$1.42", change: "+3.7%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$1.38–$1.40", rr: "1 : 2.7", tp1: "$1.55", tp2: "$1.70", tp3: "$1.88", sl: "$1.25" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.025%" },
      { name: "Open Interest", status: "pass", detail: "+6.3%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.75" },
    ],
    chartBase: 1.4, chartStep: 0.003, chartAmp: 0.04,
  },
  UNI: {
    pair: "USDT", category: "DeFi",
    price: "$18.92", change: "+1.5%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$18.50–$18.70", rr: "1 : 3.1", tp1: "$20.50", tp2: "$22.30", tp3: "$24.50", sl: "$17.50" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.012%" },
      { name: "Open Interest", status: "pass", detail: "+4.2%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.70" },
    ],
    chartBase: 18.5, chartStep: 0.038, chartAmp: 0.6,
  },
  AAVE: {
    pair: "USDT", category: "DeFi",
    price: "$825.40", change: "-1.8%", bias: "BEARISH", biasIcon: "down", confluence: 5, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bearish", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "1H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "4H", trend: "Bearish", struct: "BOS", ob: "Bearish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$850.00–$880.00", rr: "1 : 2.1", tp1: "$780.00", tp2: "$720.00", tp3: "$650.00", sl: "$920.00" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "-0.025%" },
      { name: "Open Interest", status: "pass", detail: "+2.1%" },
      { name: "Volume", status: "warning", detail: "Below avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.65" },
    ],
    chartBase: 850, chartStep: -0.35, chartAmp: 15,
  },
  ATOM: {
    pair: "USDT", category: "Layer 1",
    price: "$14.62", change: "+2.9%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$14.10–$14.40", rr: "1 : 2.6", tp1: "$16.00", tp2: "$17.50", tp3: "$19.20", sl: "$13.00" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.018%" },
      { name: "Open Interest", status: "pass", detail: "+3.8%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.72" },
    ],
    chartBase: 14.3, chartStep: 0.044, chartAmp: 0.7,
  },
  FTM: {
    pair: "USDT", category: "Layer 1",
    price: "$0.92", change: "+4.2%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
    ],
    entry: { zone: "$0.88–$0.90", rr: "1 : 2.3", tp1: "$1.02", tp2: "$1.15", tp3: "$1.30", sl: "$0.78" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "+0.04%" },
      { name: "Open Interest", status: "warning", detail: "+9.2%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.69" },
    ],
    chartBase: 0.90, chartStep: 0.0028, chartAmp: 0.025,
  },
  NEAR: {
    pair: "USDT", category: "Layer 1",
    price: "$8.75", change: "+1.3%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$8.40–$8.60", rr: "1 : 2.8", tp1: "$9.60", tp2: "$10.40", tp3: "$11.50", sl: "$7.80" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.016%" },
      { name: "Open Interest", status: "pass", detail: "+5.1%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.74" },
    ],
    chartBase: 8.5, chartStep: 0.0175, chartAmp: 0.25,
  },
  APT: {
    pair: "USDT", category: "Layer 1",
    price: "$14.28", change: "+0.8%", bias: "BULLISH", biasIcon: "up", confluence: 5, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$13.80–$14.10", rr: "1 : 2.5", tp1: "$15.80", tp2: "$17.20", tp3: "$18.80", sl: "$12.80" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.012%" },
      { name: "Open Interest", status: "pass", detail: "+3.5%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.68" },
    ],
    chartBase: 14, chartStep: 0.028, chartAmp: 0.5,
  },
  ARB: {
    pair: "USDT", category: "Layer 2",
    price: "$2.85", change: "+5.3%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
    ],
    entry: { zone: "$2.70–$2.78", rr: "1 : 3.0", tp1: "$3.15", tp2: "$3.50", tp3: "$3.90", sl: "$2.45" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.022%" },
      { name: "Open Interest", status: "pass", detail: "+7.8%" },
      { name: "Volume", status: "pass", detail: "Spiking" },
      { name: "Correlation", status: "pass", detail: "BTC 0.71" },
    ],
    chartBase: 2.7, chartStep: 0.0057, chartAmp: 0.08,
  },
  OP: {
    pair: "USDT", category: "Layer 2",
    price: "$3.42", change: "-0.9%", bias: "BEARISH", biasIcon: "down", confluence: 4, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bearish", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "1H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "4H", trend: "Bearish", struct: "BOS", ob: "Bearish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$3.55–$3.75", rr: "1 : 1.8", tp1: "$3.15", tp2: "$2.85", tp3: "$2.55", sl: "$3.95" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "-0.018%" },
      { name: "Open Interest", status: "pass", detail: "+1.8%" },
      { name: "Volume", status: "warning", detail: "Below avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.66" },
    ],
    chartBase: 3.5, chartStep: -0.0068, chartAmp: 0.12,
  },
  SUI: {
    pair: "USDT", category: "Layer 1",
    price: "$4.28", change: "+2.6%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$4.10–$4.18", rr: "1 : 2.9", tp1: "$4.75", tp2: "$5.20", tp3: "$5.80", sl: "$3.75" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.019%" },
      { name: "Open Interest", status: "pass", detail: "+4.6%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.73" },
    ],
    chartBase: 4.2, chartStep: 0.0086, chartAmp: 0.15,
  },
  INJ: {
    pair: "USDT", category: "Layer 1",
    price: "$48.92", change: "+3.4%", bias: "BULLISH", biasIcon: "up", confluence: 8, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$47.00–$48.50", rr: "1 : 3.2", tp1: "$54.20", tp2: "$59.80", tp3: "$65.00", sl: "$43.50" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.024%" },
      { name: "Open Interest", status: "pass", detail: "+6.2%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.76" },
    ],
    chartBase: 48, chartStep: 0.098, chartAmp: 1.5,
  },
  TIA: {
    pair: "USDT", category: "Layer 1",
    price: "$11.84", change: "+1.7%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$11.40–$11.70", rr: "1 : 2.7", tp1: "$13.20", tp2: "$14.60", tp3: "$16.20", sl: "$10.60" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.017%" },
      { name: "Open Interest", status: "pass", detail: "+5.3%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.74" },
    ],
    chartBase: 11.5, chartStep: 0.028, chartAmp: 0.35,
  },
  SEI: {
    pair: "USDT", category: "Layer 1",
    price: "$0.684", change: "+4.8%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
    ],
    entry: { zone: "$0.650–$0.670", rr: "1 : 2.2", tp1: "$0.760", tp2: "$0.850", tp3: "$0.950", sl: "$0.580" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "+0.052%" },
      { name: "Open Interest", status: "warning", detail: "+10.8%" },
      { name: "Volume", status: "pass", detail: "Spiking" },
      { name: "Correlation", status: "pass", detail: "BTC 0.70" },
    ],
    chartBase: 0.65, chartStep: 0.00137, chartAmp: 0.022,
  },
  STX: {
    pair: "USDT", category: "Layer 1",
    price: "$2.96", change: "+2.1%", bias: "BULLISH", biasIcon: "up", confluence: 5, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$2.82–$2.90", rr: "1 : 2.4", tp1: "$3.35", tp2: "$3.75", tp3: "$4.20", sl: "$2.55" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.014%" },
      { name: "Open Interest", status: "pass", detail: "+2.9%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.67" },
    ],
    chartBase: 2.9, chartStep: 0.0059, chartAmp: 0.1,
  },
  RENDER: {
    pair: "USDT", category: "AI",
    price: "$7.42", change: "+1.4%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$7.10–$7.30", rr: "1 : 2.8", tp1: "$8.40", tp2: "$9.30", tp3: "$10.40", sl: "$6.40" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.020%" },
      { name: "Open Interest", status: "pass", detail: "+4.8%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.72" },
    ],
    chartBase: 7.2, chartStep: 0.0148, chartAmp: 0.25,
  },
  FET: {
    pair: "USDT", category: "AI",
    price: "$2.48", change: "+3.2%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$2.35–$2.42", rr: "1 : 3.0", tp1: "$2.80", tp2: "$3.15", tp3: "$3.55", sl: "$2.10" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.018%" },
      { name: "Open Interest", status: "pass", detail: "+5.4%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.71" },
    ],
    chartBase: 2.4, chartStep: 0.00496, chartAmp: 0.08,
  },
  WLD: {
    pair: "USDT", category: "Meme",
    price: "$4.68", change: "+2.3%", bias: "BULLISH", biasIcon: "up", confluence: 5, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
    ],
    entry: { zone: "$4.40–$4.55", rr: "1 : 2.1", tp1: "$5.25", tp2: "$5.95", tp3: "$6.75", sl: "$4.00" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "+0.035%" },
      { name: "Open Interest", status: "warning", detail: "+7.5%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.64" },
    ],
    chartBase: 4.5, chartStep: 0.0094, chartAmp: 0.18,
  },
  JUP: {
    pair: "USDT", category: "DeFi",
    price: "$1.34", change: "+2.7%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$1.28–$1.31", rr: "1 : 2.6", tp1: "$1.55", tp2: "$1.78", tp3: "$2.05", sl: "$1.15" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.016%" },
      { name: "Open Interest", status: "pass", detail: "+3.7%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.69" },
    ],
    chartBase: 1.3, chartStep: 0.00268, chartAmp: 0.05,
  },
  PENDLE: {
    pair: "USDT", category: "DeFi",
    price: "$9.28", change: "+1.9%", bias: "BULLISH", biasIcon: "up", confluence: 7, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$8.85–$9.10", rr: "1 : 2.9", tp1: "$10.60", tp2: "$11.80", tp3: "$13.20", sl: "$8.00" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone", "BOS"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.021%" },
      { name: "Open Interest", status: "pass", detail: "+5.1%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.70" },
    ],
    chartBase: 9, chartStep: 0.0186, chartAmp: 0.35,
  },
  ONDO: {
    pair: "USDT", category: "DeFi",
    price: "$1.68", change: "-0.4%", bias: "BEARISH", biasIcon: "down", confluence: 4, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bearish", struct: "CHoCH", ob: "Bearish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "1H", trend: "Ranging", struct: "CHoCH", ob: "Bearish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "4H", trend: "Bearish", struct: "BOS", ob: "Bearish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$1.75–$1.85", rr: "1 : 1.9", tp1: "$1.55", tp2: "$1.38", tp3: "$1.20", sl: "$1.98" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "-0.015%" },
      { name: "Open Interest", status: "pass", detail: "+1.2%" },
      { name: "Volume", status: "warning", detail: "Below avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.63" },
    ],
    chartBase: 1.75, chartStep: -0.0033, chartAmp: 0.04,
  },
  TON: {
    pair: "USDT", category: "Layer 1",
    price: "$7.85", change: "+3.1%", bias: "BULLISH", biasIcon: "up", confluence: 6, risk: "MEDIUM",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
    ],
    entry: { zone: "$7.50–$7.70", rr: "1 : 2.7", tp1: "$8.85", tp2: "$9.80", tp3: "$10.90", sl: "$6.90" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "pass", detail: "+0.019%" },
      { name: "Open Interest", status: "pass", detail: "+4.2%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.73" },
    ],
    chartBase: 7.6, chartStep: 0.0157, chartAmp: 0.2,
  },
  PEPE: {
    pair: "USDT", category: "Meme",
    price: "$0.00000985", change: "+5.8%", bias: "BULLISH", biasIcon: "up", confluence: 5, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
    ],
    entry: { zone: "$0.00000925–$0.00000960", rr: "1 : 2.0", tp1: "$0.00001150", tp2: "$0.00001380", tp3: "$0.00001650", sl: "$0.00000850" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "+0.070%" },
      { name: "Open Interest", status: "warning", detail: "+15.2%" },
      { name: "Volume", status: "pass", detail: "Spiking" },
      { name: "Correlation", status: "pass", detail: "BTC 0.58" },
    ],
    chartBase: 0.00000950, chartStep: 0.000000028, chartAmp: 0.00000015,
  },
  WIF: {
    pair: "USDT", category: "Meme",
    price: "$3.24", change: "+4.6%", bias: "BULLISH", biasIcon: "up", confluence: 5, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Sweep Done" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Lows" },
    ],
    entry: { zone: "$3.05–$3.15", rr: "1 : 2.2", tp1: "$3.65", tp2: "$4.15", tp3: "$4.75", sl: "$2.80" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "+0.055%" },
      { name: "Open Interest", status: "warning", detail: "+11.8%" },
      { name: "Volume", status: "pass", detail: "Spiking" },
      { name: "Correlation", status: "pass", detail: "BTC 0.61" },
    ],
    chartBase: 3.1, chartStep: 0.0065, chartAmp: 0.12,
  },
  BONK: {
    pair: "USDT", category: "Meme",
    price: "$0.0000382", change: "+7.1%", bias: "BULLISH", biasIcon: "up", confluence: 4, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
      { tf: "4H", trend: "Ranging", struct: "CHoCH", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
    ],
    entry: { zone: "$0.0000355–$0.0000370", rr: "1 : 1.9", tp1: "$0.0000440", tp2: "$0.0000510", tp3: "$0.0000600", sl: "$0.0000320" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "BOS"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "+0.082%" },
      { name: "Open Interest", status: "warning", detail: "+18.5%" },
      { name: "Volume", status: "pass", detail: "Spiking" },
      { name: "Correlation", status: "pass", detail: "BTC 0.56" },
    ],
    chartBase: 0.0000365, chartStep: 0.0000012, chartAmp: 0.0000055,
  },
  FLOKI: {
    pair: "USDT", category: "Meme",
    price: "$0.000168", change: "+3.4%", bias: "BULLISH", biasIcon: "up", confluence: 5, risk: "HIGH",
    tfData: [
      { tf: "15m", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Equal Highs" },
      { tf: "1H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Filled", liq: "Equal Lows" },
      { tf: "4H", trend: "Bullish", struct: "BOS", ob: "Bullish OB", fvg: "Unfilled", liq: "Sweep Done" },
    ],
    entry: { zone: "$0.000160–$0.000165", rr: "1 : 2.3", tp1: "$0.000195", tp2: "$0.000225", tp3: "$0.000260", sl: "$0.000145" },
    confluenceFactors: ["Order Block", "FVG", "Liquidity", "Kill Zone"],
    safety: [
      { name: "Funding Rate", status: "warning", detail: "+0.058%" },
      { name: "Open Interest", status: "warning", detail: "+13.2%" },
      { name: "Volume", status: "pass", detail: "Above avg" },
      { name: "Correlation", status: "pass", detail: "BTC 0.59" },
    ],
    chartBase: 0.000162, chartStep: 0.0000048, chartAmp: 0.000020,
  },
};

const smcCoinList = Object.keys(smcCoins);

/* ═══════════════════════ TAB 1: SMC ANALYSIS ═══════════════════════ */
const SMCAnalysis = () => {
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const { dateLabel: globalDateLabel } = useDate();
  const coin = smcCoins[selectedCoin];

  const categories = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "AI", "Other"];

  const filteredCoins = Object.keys(smcCoins).filter(ticker => {
    const matchesSearch = ticker.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || smcCoins[ticker].category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort();

  const chartData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    price: Math.round((coin.chartBase + i * coin.chartStep + Math.sin(i * 0.5) * coin.chartAmp) * 100) / 100,
    volume: Math.floor(1200 + Math.random() * 800),
    ma20: Math.round((coin.chartBase - coin.chartAmp * 0.25 + i * coin.chartStep * 1.05) * 100) / 100,
    ma50: Math.round((coin.chartBase - coin.chartAmp * 0.5 + i * coin.chartStep * 0.85) * 100) / 100,
  })), [selectedCoin]);

  const killZones = [
    { name: "Asia", time: "00:00–08:00 UTC", active: false },
    { name: "London", time: "08:00–16:00 UTC", active: true },
    { name: "NY AM", time: "13:00–17:00 UTC", active: true },
    { name: "NY PM", time: "17:00–21:00 UTC", active: false },
  ];

  const riskColor = coin.risk === "LOW" ? C.green : coin.risk === "MEDIUM" ? C.amber : C.red;
  const biasColor = coin.bias === "BULLISH" ? C.green : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Coin Selector with Search and Categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Search Bar */}
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "11px", color: C.textMuted }} />
          <input
            type="text"
            placeholder="Search coins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 38px",
              borderRadius: "8px",
              border: `1px solid ${C.border}`,
              backgroundColor: C.card,
              color: C.text,
              fontSize: "13px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                border: `1px solid ${categoryFilter === cat ? C.purple : C.border}`,
                backgroundColor: categoryFilter === cat ? C.purpleBg : "transparent",
                color: categoryFilter === cat ? C.purple : C.textMuted,
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Coin Grid with Scroll */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: "8px",
          maxHeight: "140px",
          overflowY: "auto",
          paddingRight: "4px",
        }}>
          {filteredCoins.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCoin(c)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                border: `1px solid ${selectedCoin === c ? C.purple : C.border}`,
                backgroundColor: selectedCoin === c ? C.purpleBg : "transparent",
                color: selectedCoin === c ? C.purple : C.textMuted,
                transition: "all 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                minHeight: "50px",
                justifyContent: "center",
              }}
            >
              <span>{c}<span style={{ fontSize: "9px", color: C.textFaint, fontWeight: "400" }}>/{smcCoins[c].pair}</span></span>
              {selectedCoin === c && (
                <span style={{ fontSize: "10px", color: smcCoins[c].change.startsWith("+") ? C.green : C.red, fontWeight: "700", ...mono }}>
                  {smcCoins[c].change}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Current Price" value={coin.price} sub={coin.change} icon={TrendingUp} color={coin.change.startsWith("+") ? C.green : C.red} />
        <StatCard label="Bias" value={coin.bias} icon={coin.biasIcon === "up" ? ArrowUp : ArrowDown} color={biasColor} />
        <StatCard label="Confluence" value={`${coin.confluence}/10`} icon={Target} color={C.blue} />
        <StatCard label="Risk Level" value={coin.risk} icon={AlertTriangle} color={riskColor} />
      </div>

      {/* Multi-Timeframe Grid */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Análisis Multi-Timeframe — {selectedCoin}/{coin.pair}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {coin.tfData.map(tf => (
            <div key={tf.tf} style={cardStyle}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: C.purple, marginBottom: "12px" }}>{tf.tf}</div>
              {[
                ["Trend", tf.trend, tf.trend === "Bullish" ? C.green : tf.trend === "Bearish" ? C.red : C.amber],
                ["Structure", tf.struct, tf.struct === "BOS" ? C.green : C.red],
                ["Order Block", tf.ob, tf.ob.includes("Bullish") ? C.green : C.red],
                ["FVG", tf.fvg, tf.fvg === "Filled" ? C.green : C.amber],
                ["Liquidity", tf.liq, C.blue],
              ].map(([label, val, clr]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "11px", color: C.textMuted }}>{label}</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: clr }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Ideal Entry + Kill Zones side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Entrada Ideal — {selectedCoin}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[
              ["Entry Zone", coin.entry.zone, C.text],
              ["R:R", coin.entry.rr, C.green],
              ["TP1", coin.entry.tp1, C.blue],
              ["TP2", coin.entry.tp2, C.blue],
              ["TP3", coin.entry.tp3, C.blue],
              ["Stop Loss", coin.entry.sl, C.red],
            ].map(([l, v, clr]) => (
              <div key={l}>
                <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "2px" }}>{l}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: clr, ...mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", fontWeight: "600" }}>CONFLUENCE FACTORS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {coin.confluenceFactors.map(f => (
                <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: C.green }}>
                  <CheckCircle size={12} /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kill Zones</div>
          {killZones.map(z => (
            <div key={z.name} style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: z.active ? C.green : C.textFaint }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600" }}>{z.name}</div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>{z.time}</div>
                </div>
              </div>
              <Tag text={z.active ? "ACTIVE" : "INACTIVE"} color={z.active ? C.green : C.textFaint} />
            </div>
          ))}
        </div>
      </div>

      {/* Safety Checks */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Safety Checks — {selectedCoin}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {coin.safety.map(c => (
            <div key={c.name} style={{ ...cardStyle, textAlign: "center" }}>
              {c.status === "pass" ? <CheckCircle size={22} color={C.green} /> : <AlertTriangle size={22} color={C.amber} />}
              <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "8px" }}>{c.name}</div>
              <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px", ...mono }}>{c.detail}</div>
              <div style={{ fontSize: "10px", color: c.status === "pass" ? C.green : C.amber, marginTop: "4px", textTransform: "uppercase", fontWeight: "600" }}>{c.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>
          {selectedCoin}/{smcCoins[selectedCoin].pair} — Price Action ({globalDateLabel})
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="time" stroke={C.textMuted} fontSize={10} />
            <YAxis stroke={C.textMuted} fontSize={10} domain={["dataMin - auto", "dataMax + auto"]} />
            <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
            <Area type="monotone" dataKey="price" stroke={C.blue} fill="url(#priceGrad)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ma20" stroke={C.amber} dot={false} strokeWidth={1} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="ma50" stroke={C.purple} dot={false} strokeWidth={1} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ═══════════════════════ TAB 2: SIGNALS ═══════════════════════ */
const SignalsTab = () => {
  const [coinFilter, setCoinFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const coins = ["ALL","BTC","ETH","SOL","BNB","XRP"];
  const types = ["ALL","LONG","SHORT"];
  const statuses = ["ALL","active","tp_hit","sl_hit","pending"];
  const statusLabel = { active: "Active", tp_hit: "TP Hit", sl_hit: "SL Hit", pending: "Pending" };
  const statusColor = { active: C.blue, tp_hit: C.green, sl_hit: C.red, pending: C.textFaint };

  const filtered = mockSignals.filter(s =>
    (coinFilter === "ALL" || s.coin === coinFilter) &&
    (typeFilter === "ALL" || s.type === typeFilter) &&
    (statusFilter === "ALL" || s.status === statusFilter)
  );
  const wins = filtered.filter(s => s.status === "tp_hit").length;
  const total = filtered.filter(s => s.status !== "pending").length;

  const FilterRow = ({ label, options, active, setActive, colorFn }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: "600", width: "50px" }}>{label}</span>
      {options.map(o => (
        <button key={o} onClick={() => setActive(o)} style={{
          padding: "4px 12px", borderRadius: "4px", border: `1px solid ${active === o ? (colorFn ? colorFn(o) : C.purple) : C.border}`,
          backgroundColor: active === o ? (colorFn ? colorFn(o) + "20" : C.purpleBg) : "transparent",
          color: active === o ? (colorFn ? colorFn(o) : C.purple) : C.textMuted,
          fontSize: "11px", fontWeight: "600", cursor: "pointer"
        }}>{statusLabel[o] || o}</button>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "10px" }}>
        <FilterRow label="Coin" options={coins} active={coinFilter} setActive={setCoinFilter} />
        <FilterRow label="Type" options={types} active={typeFilter} setActive={setTypeFilter} colorFn={o => o === "LONG" ? C.green : o === "SHORT" ? C.red : C.purple} />
        <FilterRow label="Status" options={statuses} active={statusFilter} setActive={setStatusFilter} colorFn={o => statusColor[o] || C.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Total Signals" value={filtered.length} icon={Zap} color={C.purple} />
        <StatCard label="Win Rate" value={total > 0 ? Math.round((wins / total) * 100) + "%" : "—"} icon={Trophy} color={C.green} />
        <StatCard label="Avg PnL" value={"$" + Math.round(filtered.reduce((a, s) => a + s.pnl, 0) / Math.max(filtered.length, 1)).toLocaleString()} icon={TrendingUp} color={C.blue} />
        <StatCard label="Active Now" value={filtered.filter(s => s.status === "active").length} icon={Activity} color={C.amber} />
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Group","Par","Tipo","Entrada","TP","SL","Lev","Estado","PnL"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderLeft: `3px solid ${s.type === "LONG" ? C.green : C.red}` }}>
                <td style={tdStyle}>{s.group}</td>
                <td style={{ ...tdStyle, fontWeight: "600" }}>{s.coin}/USDT</td>
                <td style={tdStyle}><Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} /></td>
                <td style={{ ...tdStyle, ...mono }}>${s.entry.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono, color: C.green }}>${s.tp.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono, color: C.red }}>${s.sl.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono, color: C.amber }}>{s.leverage}</td>
                <td style={tdStyle}><Tag text={statusLabel[s.status]} color={statusColor[s.status]} /></td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "600", color: s.pnl > 0 ? C.green : s.pnl < 0 ? C.red : C.textMuted, textAlign: "right" }}>
                  {s.pnl !== 0 ? (s.pnl > 0 ? "+" : "") + "$" + s.pnl.toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════ TRADER PROFILE (standalone) ═══════════════════════ */
const TraderProfile = ({ trader, onClose }) => {
  const [profileTab, setProfileTab] = useState("overview");
  const [socialFilter, setSocialFilter] = useState("all");
  const t = trader;
  const deep = traderDeepData[t.name];
  const tierColor = { Diamond: C.cyan, Platinum: C.purple, Gold: C.amber, Silver: C.textMuted };
  const profileTabs = ["overview","signals","trades","predictions","social","pnl","risk_dna","journal"];
  const tabLabels = { overview: "Overview", signals: "Señales", trades: "Trades", predictions: "Predictions", social: "Social", pnl: "P&L", risk_dna: "Risk DNA", journal: "Journal" };

  const moodColors = { Confident: C.green, Frustrated: C.red, Focused: C.blue, Excited: C.amber, Neutral: C.textMuted };
  const moodEmojis = { Confident: "😎", Frustrated: "😤", Focused: "🎯", Excited: "🔥", Neutral: "😐" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Back button */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={onClose} style={{ padding: "6px 14px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
        </button>
      </div>

      {/* Profile Header Card */}
      <div style={{ ...cardStyle, display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "120px" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: C.bg, border: `3px solid ${tierColor[t.tier]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>{t.avatar}</div>
          <div style={{ fontSize: "18px", fontWeight: "800", marginTop: "8px" }}>{t.name}</div>
          <Tag text={t.tier} color={tierColor[t.tier]} />
          <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>{t.badges.map((b, i) => <span key={i} style={{ fontSize: "18px" }}>{b}</span>)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: "1.6", marginBottom: "14px" }}>{t.bio}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[["Rank", `#${t.rank}`], ["Location", t.location], ["Joined", t.joined], ["Style", t.style],
              ["Exchange", t.exchange], ["Fav Pairs", t.favPairs.slice(0, 2).join(", ")], ["Avg Hold", t.avgHold], ["Avg R:R", t.avgRR],
            ].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: "10px", color: C.textFaint, textTransform: "uppercase", fontWeight: "600" }}>{l}</div><div style={{ fontSize: "12px", fontWeight: "600", marginTop: "2px" }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "20px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
            {[["Followers", t.followers], ["Following", t.following], ["Copiers", t.copiers], ["Trades", t.trades]].map(([l, v]) => (
              <div key={l}><span style={{ fontSize: "16px", fontWeight: "800", ...mono }}>{v.toLocaleString()}</span><span style={{ fontSize: "11px", color: C.textMuted, marginLeft: "4px" }}>{l}</span></div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>
          {[["Total PnL", `+$${(t.pnl / 1000).toFixed(1)}K`, C.green], ["Win Rate", `${t.winRate}%`, C.green], ["Sharpe", t.sharpe.toFixed(1), C.blue], ["Max DD", `${t.maxDD}%`, C.red], ["Profit Factor", t.profitFactor?.toFixed(1) || "—", C.amber], ["Streak", `${t.streak}W`, C.purple]].map(([l, v, clr]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", color: C.textMuted }}>{l}</span><span style={{ fontSize: "12px", fontWeight: "700", color: clr, ...mono }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-Tabs */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {profileTabs.map(pt => (
          <button key={pt} onClick={() => setProfileTab(pt)} style={{
            padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
            border: `1px solid ${profileTab === pt ? C.purple : C.border}`,
            backgroundColor: profileTab === pt ? C.purpleBg : "transparent",
            color: profileTab === pt ? C.purple : C.textMuted
          }}>{tabLabels[pt]}</button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {profileTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Equity Curve — Last 30 Days</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={deep.dailyEquity}>
                <defs><linearGradient id="profEq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="day" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                <Area type="monotone" dataKey="equity" stroke={C.green} fill="url(#profEq)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Skill Radar</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={t.radarData.map(r => ({ subject: r.s, value: r.v }))}><PolarGrid stroke={C.border} /><PolarAngleAxis dataKey="subject" stroke={C.textMuted} fontSize={10} /><PolarRadiusAxis stroke={C.border} fontSize={9} domain={[0, 100]} /><Radar dataKey="value" stroke={C.purple} fill={C.purpleBg} fillOpacity={0.6} /></RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Monthly P&L</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deep.monthlyPnl}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="month" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "PnL"]} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>{deep.monthlyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Recent social post preview */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Latest Activity</div>
            {deep.socialPosts.slice(0, 2).map(post => (
              <div key={post.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}`, display: "flex", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>{deep.platIcons[post.platform]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600" }}>{post.handle}</span>
                    <span style={{ fontSize: "9px", color: deep.platColors[post.platform], fontWeight: "700", textTransform: "uppercase" }}>{post.platform}</span>
                    <span style={{ fontSize: "10px", color: C.textFaint, marginLeft: "auto" }}>{post.time}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: C.text, lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{post.text.slice(0, 150)}{post.text.length > 150 ? "..." : ""}</div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}><span style={{ fontSize: "10px", color: C.textMuted }}>❤️ {post.likes}</span><span style={{ fontSize: "10px", color: C.textMuted }}>💬 {post.replies}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SEÑALES ═══ */}
      {profileTab === "signals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Total Señales" value={deep.signalStats.total} icon={Zap} color={C.purple} />
            <StatCard label="Accuracy" value={`${deep.signalStats.accuracy}%`} icon={Target} color={C.green} />
            <StatCard label="Active Now" value={deep.signalStats.active} icon={Activity} color={C.amber} />
            <StatCard label="Subscribers" value={deep.signalStats.subscribers} icon={Users} color={C.blue} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <StatCard label="Avg PnL / Signal" value={`$${deep.signalStats.avgPnlPerSignal.toLocaleString()}`} icon={TrendingUp} color={deep.signalStats.avgPnlPerSignal >= 0 ? C.green : C.red} />
            <StatCard label="Best Signal" value={`+$${deep.signalStats.bestSignal.toLocaleString()}`} icon={Trophy} color={C.green} />
          </div>
          {/* Active Signals */}
          {deep.signals.filter(s => s.status === "active").length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.green, animation: "none" }} /> Señales Activas
              </div>
              {deep.signals.filter(s => s.status === "active").map(s => (
                <div key={s.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700" }}>{s.pair}</span>
                      <Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} />
                      <span style={{ fontSize: "11px", color: C.amber, fontWeight: "600", ...mono }}>{s.leverage}</span>
                      <span style={{ fontSize: "10px", color: C.textMuted }}>{s.group}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: C.textMuted }}>
                      <span>Entry: <span style={{ color: C.text, ...mono }}>${s.entry.toLocaleString()}</span></span>
                      <span>TP: <span style={{ color: C.green, ...mono }}>${s.tp.toLocaleString()}</span></span>
                      <span>SL: <span style={{ color: C.red, ...mono }}>${s.sl.toLocaleString()}</span></span>
                      <span>R:R <span style={{ color: C.blue, ...mono }}>{s.rr}</span></span>
                    </div>
                    <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px", fontStyle: "italic" }}>{s.analysis}</div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: "100px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: s.pnl >= 0 ? C.green : C.red, ...mono }}>{s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}</div>
                    <div style={{ fontSize: "10px", color: C.textMuted }}>{s.subscribers} subs</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Signal History Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Historial de Señales — Últimas 12</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead><tr>{["Par","Tipo","Entry","TP","SL","Lev","R:R","Grupo","PnL","Status","Subs","Fecha"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {deep.signals.map(s => (
                    <tr key={s.id} style={{ borderLeft: `3px solid ${s.type === "LONG" ? C.green : C.red}` }}>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{s.pair}</td>
                      <td style={tdStyle}><Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${s.entry.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px", color: C.green }}>${s.tp.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px", color: C.red }}>${s.sl.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, color: C.amber }}>{s.leverage}</td>
                      <td style={{ ...tdStyle, ...mono }}>{s.rr}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{s.group}</td>
                      <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: s.pnl >= 0 ? C.green : C.red }}>{s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}</td>
                      <td style={tdStyle}><Tag text={s.status === "active" ? "Active" : s.status === "tp_hit" ? "TP Hit" : "SL Hit"} color={s.status === "active" ? C.blue : s.status === "tp_hit" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>{s.subscribers}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRADES ═══ */}
      {profileTab === "trades" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Total Trades" value={t.trades} icon={Activity} color={C.blue} />
            <StatCard label="Win Rate" value={`${t.winRate}%`} icon={Trophy} color={C.green} />
            <StatCard label="Avg R:R" value={t.avgRR} icon={Target} color={C.purple} />
            <StatCard label="Avg Hold" value={t.avgHold} icon={Clock} color={C.amber} />
          </div>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Trade History — Last 20 Trades</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead><tr>{["Par","Tipo","Entry","Exit","PnL","Lev","R:R","Duración","Status","Notes","Fecha"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {deep.history.map(tr => (
                    <tr key={tr.id} style={{ borderLeft: `3px solid ${tr.type === "LONG" ? C.green : C.red}` }}>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{tr.pair}</td>
                      <td style={tdStyle}><Tag text={tr.type} color={tr.type === "LONG" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${tr.entry.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${tr.exit.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: tr.pnl >= 0 ? C.green : C.red }}>{tr.pnl >= 0 ? "+" : ""}${tr.pnl.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, color: C.amber }}>{tr.leverage}</td>
                      <td style={{ ...tdStyle, ...mono }}>{tr.rr}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{tr.duration}</td>
                      <td style={tdStyle}><Tag text={tr.status === "tp_hit" ? "TP Hit" : "SL Hit"} color={tr.status === "tp_hit" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, fontSize: "10px", color: C.textMuted, maxWidth: "160px" }}>{tr.notes}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{tr.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PREDICTIONS ═══ */}
      {profileTab === "predictions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Accuracy" value={`${Math.round((deep.predStats.correct / deep.predStats.total) * 100)}%`} sub={`${deep.predStats.correct}/${deep.predStats.total}`} icon={Target} color={C.green} />
            <StatCard label="Current Streak" value={`${deep.predStats.streak} correct`} icon={Flame} color={C.amber} />
            <StatCard label="Total Staked" value={`$${deep.predStats.totalStaked.toLocaleString()}`} icon={DollarSign} color={C.blue} />
            <StatCard label="Net Won" value={`+$${deep.predStats.totalWon.toLocaleString()}`} icon={Trophy} color={C.green} />
          </div>
          {/* Active bets */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Active Predictions</div>
            {deep.predictionsList.filter(p => p.status === "open").map(p => (
              <div key={p.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{p.question}</div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Tag text={p.bet} color={p.bet === "YES" ? C.green : C.red} />
                    <span style={{ fontSize: "11px", color: C.textMuted }}>at {p.odds}¢</span>
                    <span style={{ fontSize: "11px", color: C.textMuted }}>{p.date}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: "120px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", ...mono }}>${p.stake}</div>
                  <div style={{ fontSize: "10px", color: C.green }}>Potential: ${p.potential}</div>
                </div>
              </div>
            ))}
          </div>
          {/* History */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Prediction History</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Market","Bet","Odds","Stake","Result","P&L","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {deep.predictionsList.filter(p => p.status !== "open").map(p => (
                  <tr key={p.id} style={{ borderLeft: `3px solid ${p.status === "won" ? C.green : C.red}` }}>
                    <td style={{ ...tdStyle, maxWidth: "250px" }}>{p.question}</td>
                    <td style={tdStyle}><Tag text={p.bet} color={p.bet === "YES" ? C.green : C.red} /></td>
                    <td style={{ ...tdStyle, ...mono }}>{p.odds}¢</td>
                    <td style={{ ...tdStyle, ...mono }}>${p.stake}</td>
                    <td style={tdStyle}><Tag text={p.status === "won" ? "Won" : "Lost"} color={p.status === "won" ? C.green : C.red} /></td>
                    <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: (p.pnl||0) >= 0 ? C.green : C.red }}>{(p.pnl||0) >= 0 ? "+" : ""}${(p.pnl||0)}</td>
                    <td style={{ ...tdStyle, color: C.textMuted }}>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ SOCIAL ═══ */}
      {profileTab === "social" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <StatCard label="𝕏 Followers" value={deep.socialStats.twitterFollowers.toLocaleString()} icon={Users} color={"#1DA1F2"} />
            <StatCard label="Discord Messages" value={deep.socialStats.discordMessages.toLocaleString()} icon={Activity} color={"#5865F2"} />
            <StatCard label="Reddit Karma" value={deep.socialStats.redditKarma.toLocaleString()} icon={Star} color={"#FF4500"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <StatCard label="Telegram Members" value={deep.socialStats.telegramMembers.toLocaleString()} icon={Users} color={"#0088cc"} />
            <StatCard label="WhatsApp Groups" value={deep.socialStats.whatsappGroups} icon={Users} color={"#25D366"} />
            <StatCard label="Avg Engagement" value={`${deep.socialStats.avgEngagement}%`} sub={`Top: ${deep.socialStats.topPlatform}`} icon={TrendingUp} color={C.green} />
          </div>
          {/* Platform filter */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["all","twitter","discord","telegram","whatsapp","reddit","tradehub"].map(p => (
              <button key={p} onClick={() => setSocialFilter(p)} style={{
                padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${socialFilter === p ? (p === "all" ? C.purple : deep.platColors[p]) : C.border}`,
                backgroundColor: socialFilter === p ? (p === "all" ? C.purpleBg : deep.platColors[p] + "18") : "transparent",
                color: socialFilter === p ? (p === "all" ? C.purple : deep.platColors[p]) : C.textMuted, textTransform: "capitalize"
              }}>{p === "all" ? "All Platforms" : p === "tradehub" ? "Tradethlon" : p === "twitter" ? "𝕏 Twitter" : p === "telegram" ? "✈️ Telegram" : p === "whatsapp" ? "📱 WhatsApp" : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            ))}
          </div>
          {/* Posts */}
          {deep.socialPosts.filter(p => socialFilter === "all" || p.platform === socialFilter).map(post => (
            <div key={post.id} style={{ ...cardStyle, borderLeft: `3px solid ${deep.platColors[post.platform]}` }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ fontSize: "20px", width: 32, textAlign: "center" }}>{deep.platIcons[post.platform]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700" }}>{post.handle}</span>
                    <span style={{ fontSize: "10px", color: deep.platColors[post.platform], fontWeight: "700", textTransform: "uppercase", padding: "2px 6px", borderRadius: "3px", backgroundColor: deep.platColors[post.platform] + "18" }}>{post.platform}</span>
                    {post.channel && <span style={{ fontSize: "10px", color: C.textMuted }}>{post.channel}</span>}
                    {post.subreddit && <span style={{ fontSize: "10px", color: C.textMuted }}>{post.subreddit}</span>}
                    <span style={{ fontSize: "10px", color: C.textFaint, marginLeft: "auto" }}>{post.time}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.6", marginBottom: "10px", whiteSpace: "pre-wrap" }}>{post.text}</div>
                  <div style={{ display: "flex", gap: "16px", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "11px", color: C.textMuted }}>❤️ {post.likes.toLocaleString()}</span>
                    {post.retweets > 0 && <span style={{ fontSize: "11px", color: C.textMuted }}>🔄 {post.retweets}</span>}
                    <span style={{ fontSize: "11px", color: C.textMuted }}>💬 {post.replies}</span>
                    {post.impressions > 0 && <span style={{ fontSize: "11px", color: C.textMuted }}>👁 {(post.impressions / 1000).toFixed(1)}K</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ P&L ═══ */}
      {profileTab === "pnl" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Total PnL" value={`+$${(t.pnl / 1000).toFixed(1)}K`} icon={TrendingUp} color={C.green} />
            <StatCard label="Best Month" value={t.bestMonth} icon={Trophy} color={C.green} />
            <StatCard label="Worst Month" value={t.worstMonth} icon={TrendingDown} color={C.red} />
            <StatCard label="Profit Factor" value={t.profitFactor?.toFixed(1) || "—"} icon={Target} color={C.amber} />
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Monthly P&L Breakdown</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deep.monthlyPnl}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="month" stroke={C.textMuted} fontSize={11} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "PnL"]} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>{deep.monthlyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Mes","PnL","Trades","Win Rate","Resultado"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>{deep.monthlyPnl.map(m => (
                <tr key={m.month}><td style={{ ...tdStyle, fontWeight: "600" }}>{m.month} 2026</td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: m.pnl >= 0 ? C.green : C.red }}>{m.pnl >= 0 ? "+" : ""}${m.pnl.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono }}>{m.trades}</td><td style={{ ...tdStyle, ...mono }}>{m.winRate}%</td>
                <td style={tdStyle}><Tag text={m.pnl >= 0 ? "Profitable" : "Loss"} color={m.pnl >= 0 ? C.green : C.red} /></td></tr>
              ))}</tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Equity Curve — 30 Days</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={deep.dailyEquity}>
                <defs><linearGradient id="pnlEq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="day" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                <Area type="monotone" dataKey="equity" stroke={C.blue} fill="url(#pnlEq)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ RISK DNA ═══ */}
      {profileTab === "risk_dna" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Sharpe Ratio" value={t.sharpe.toFixed(1)} icon={BarChart3} color={C.blue} />
            <StatCard label="Max Drawdown" value={`${t.maxDD}%`} icon={TrendingDown} color={C.red} />
            <StatCard label="Profit Factor" value={t.profitFactor?.toFixed(1) || "—"} icon={DollarSign} color={C.green} />
            <StatCard label="Win Streak" value={`${t.streak} trades`} icon={Flame} color={C.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Session Performance */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Session</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deep.riskDna.sessionPerf}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="session" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                <Bar dataKey="winRate" name="Win %" fill={C.green} radius={[3, 3, 0, 0]} /></BarChart>
              </ResponsiveContainer>
              {deep.riskDna.sessionPerf.map(s => (
                <div key={s.session} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "11px" }}>
                  <span style={{ color: C.textMuted }}>{s.session}</span>
                  <span style={{ ...mono }}>{s.trades} trades — {s.winRate}% WR — avg ${s.avgPnl}</span>
                </div>
              ))}
            </div>
            {/* Day of Week */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Day</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deep.riskDna.dayOfWeek}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="day" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                <Bar dataKey="pnl" name="PnL" radius={[3, 3, 0, 0]}>{deep.riskDna.dayOfWeek.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Pair Breakdown */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Pair</div>
              {deep.riskDna.pairBreakdown.map(p => (
                <div key={p.pair} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700" }}>{p.pair}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: C.green, ...mono }}>+${(p.pnl / 1000).toFixed(1)}K</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: C.textMuted }}>
                    <span>{p.trades} trades</span><span>{p.winRate}% WR</span><span>R:R {p.avgRR}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Behavioral Analysis */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Behavioral Analysis</div>
              {Object.entries({
                "Avg Position Size": deep.riskDna.behavioral.avgPositionSize,
                "Max Leverage Used": deep.riskDna.behavioral.maxLevUsed,
                "Revenge Trade Rate": deep.riskDna.behavioral.revengeTradeRate,
                "Tilt After Loss": deep.riskDna.behavioral.tiltAfterLoss,
                "Hold Time Bias": deep.riskDna.behavioral.holdTimeBias,
                "Streak Behavior": deep.riskDna.behavioral.streakBehavior,
                "Recovery Time": deep.riskDna.behavioral.recoveryTime,
                "Best Time of Day": deep.riskDna.behavioral.bestTimeOfDay,
              }).map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                  <span style={{ color: C.textMuted }}>{l}</span>
                  <span style={{ fontWeight: "600", color: v === "Low" ? C.green : v === "Medium" ? C.amber : v === "High" ? C.red : C.text, ...mono }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Drawdown History */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Drawdown History</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              {deep.riskDna.drawdownPeriods.map((dd, i) => (
                <div key={i} style={{ padding: "12px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px" }}>{dd.start} → {dd.end}</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: C.red, ...mono }}>-{dd.depth}</div>
                  <div style={{ fontSize: "11px", color: C.green, marginTop: "4px" }}>Recovery: {dd.recovery}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Radar */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>Skill Radar</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={t.radarData.map(r => ({ subject: r.s, value: r.v }))}><PolarGrid stroke={C.border} /><PolarAngleAxis dataKey="subject" stroke={C.textMuted} fontSize={10} /><PolarRadiusAxis stroke={C.border} fontSize={9} domain={[0, 100]} /><Radar dataKey="value" stroke={C.purple} fill={C.purpleBg} fillOpacity={0.6} /></RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ JOURNAL ═══ */}
      {profileTab === "journal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Journal Entries" value={deep.journal.length} icon={Activity} color={C.blue} />
            <StatCard label="Net PnL (Journaled)" value={`$${deep.journal.reduce((a, j) => a + j.pnl, 0).toLocaleString()}`} icon={TrendingUp} color={C.green} />
            <StatCard label="Most Common Mood" value="Focused" icon={Target} color={C.blue} />
            <StatCard label="Avg Tags/Entry" value={(deep.journal.reduce((a, j) => a + j.tags.length, 0) / deep.journal.length).toFixed(1)} icon={Star} color={C.purple} />
          </div>
          {deep.journal.map(entry => (
            <div key={entry.id} style={{ ...cardStyle, borderLeft: `3px solid ${moodColors[entry.mood] || C.textMuted}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{moodEmojis[entry.mood]}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>{entry.date}, 2026</div>
                    <div style={{ fontSize: "11px", color: moodColors[entry.mood], fontWeight: "600" }}>{entry.mood}</div>
                  </div>
                </div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: entry.pnl >= 0 ? C.green : entry.pnl < 0 ? C.red : C.textMuted, ...mono }}>
                  {entry.pnl > 0 ? "+" : ""}{entry.pnl === 0 ? "No trades" : `$${entry.pnl.toLocaleString()}`}
                </div>
              </div>
              <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.7", marginBottom: "10px" }}>{entry.text}</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {entry.tags.map(tag => (
                  <span key={tag} style={{ fontSize: "10px", color: C.purple, backgroundColor: C.purpleBg, padding: "3px 8px", borderRadius: "4px", fontWeight: "600" }}>#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════ LIVE PnL TICKER ═══════════════════════ */
const LivePnLTicker = () => {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev - 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const tickerItems = [
    "🔥 Scalp King +$2,340 (BTC LONG) ⚡",
    "🥷 Crypto Ninja +$890 (ETH SHORT) ⚡",
    "🐂 Bull Master -$420 (SOL LONG) 📉",
    "💼 Smart Money +$1,560 (AVAX LONG) ⚡",
    "🚀 Rocket Launch +$745 (BTC SHORT) ✅",
    "🔥 Phoenix Rise +$2,100 (DOGE LONG) 🚀",
    "👊 Iron Fist -$180 (ETH LONG) 📉",
    "🏄 Wave Rider +$320 (BTC LONG) ✅",
  ];

  const repeatedItems = [...tickerItems, ...tickerItems];

  return (
    <div style={{
      height: 32, backgroundColor: C.bg, borderBottom: `1px solid ${C.border}`,
      overflow: "hidden", display: "flex", alignItems: "center", position: "relative"
    }}>
      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <div style={{
        display: "flex", whiteSpace: "nowrap", animation: "tickerScroll 60s linear infinite",
        fontSize: "12px", fontWeight: "600", color: C.text, gap: "24px", ...mono
      }}>
        {repeatedItems.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════ TAB 3: TRADERS ═══════════════════════ */
const TradersTab = () => {
  const [view, setView] = useState("groups");
  const [compareMetric, setCompareMetric] = useState("equity");
  const { openProfile } = useProfile();
  const [visibleTraders, setVisibleTraders] = useState(() => {
    const m = {};
    mockTraders.forEach((t, i) => { m[t.name] = i < 3; });
    return m;
  });
  const tierColor = { Diamond: C.cyan, Platinum: C.purple, Gold: C.amber, Silver: C.textMuted };
  const medals = ["🥇","🥈","🥉"];
  const toggleTrader = (name) => setVisibleTraders(prev => ({ ...prev, [name]: !prev[name] }));
  const allOn = mockTraders.every(t => visibleTraders[t.name]);
  const toggleAll = () => { const next = {}; mockTraders.forEach(t => { next[t.name] = !allOn; }); setVisibleTraders(next); };

  // Season countdown
  const seasonEnd = new Date(2026, 3, 1);
  const now = new Date();
  const daysLeft = Math.max(0, Math.floor((seasonEnd - now) / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor(((seasonEnd - now) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* SEASON BANNER */}
      <div style={{
        ...cardStyle, border: `2px solid transparent`, backgroundImage: `linear-gradient(${C.card}, ${C.card}), linear-gradient(135deg, ${C.purple}, ${C.blue})`,
        backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box",
        padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>🏆</span>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "1px" }}>SEASON 1 — MARCH 2026</div>
            <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px" }}>
              ⏱️ {daysLeft}d {hoursLeft}h remaining
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: C.textMuted, marginBottom: "4px" }}>Prize Pool</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: C.amber, ...mono }}>$50,000</div>
          </div>
          <div style={{ height: 30, width: "1px", backgroundColor: C.border }} />
          <div style={{ display: "flex", gap: "8px" }}>
            {[["🥇", "$25K"], ["🥈", "$15K"], ["🥉", "$10K"]].map(([emoji, prize]) => (
              <div key={emoji} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "16px", marginBottom: "2px" }}>{emoji}</div>
                <div style={{ fontSize: "11px", fontWeight: "600", ...mono }}>{prize}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {["groups","compare","profiles"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "8px 20px", borderRadius: "6px", border: `1px solid ${view === v ? C.purple : C.border}`,
            backgroundColor: view === v ? C.purpleBg : "transparent", color: view === v ? C.purple : C.textMuted,
            fontSize: "12px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize"
          }}>{v === "groups" ? "Groups" : v === "compare" ? "Compare" : "Profiles"}</button>
        ))}
      </div>

      {view === "groups" && (
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["Rank","Group","Members","Win Rate","Monthly PnL","Signals","Accuracy","🔥 Hot"].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {mockGroups.map((g, i) => {
                const topTraders = mockTraders.filter(t => mockGroups[i].name.includes(t.avatar));
                const highestStreak = Math.max(...topTraders.map(t => t.streak), 0);
                const streakFlames = highestStreak >= 15 ? "🔥🔥🔥" : highestStreak >= 10 ? "🔥🔥" : highestStreak >= 5 ? "🔥" : "";
                return (
                <tr key={g.name} style={{ backgroundColor: i % 2 === 0 ? "transparent" : C.cardHover }}>
                  <td style={{ ...tdStyle, fontWeight: "700", fontSize: "14px" }}>{i < 3 ? medals[i] : i + 1}</td>
                  <td style={tdStyle}><span style={{ marginRight: "6px" }}>{g.emoji}</span>{g.name}</td>
                  <td style={{ ...tdStyle, ...mono }}>{g.members}</td>
                  <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{g.winRate}%</td>
                  <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(g.monthlyPnl / 1000).toFixed(1)}K</td>
                  <td style={{ ...tdStyle, ...mono }}>{g.signals}</td>
                  <td style={{ ...tdStyle, ...mono, color: C.amber, fontWeight: "600" }}>{g.accuracy}%</td>
                  <td style={{ ...tdStyle, fontSize: "14px", fontWeight: "600" }}>{streakFlames || "—"}</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}

      {view === "compare" && (() => {
        const activeTraders = mockTraders.filter(t => visibleTraders[t.name]);
        const compareBarData = activeTraders.map((t, i) => {
          const deep = traderDeepData[t.name];
          return {
            name: t.name, avatar: t.avatar, color: traderColors[mockTraders.indexOf(t)],
            winRate: t.winRate, pnl: t.pnl, trades: t.trades, streak: t.streak,
            signalAccuracy: deep.signalStats.accuracy, signalTotal: deep.signalStats.total, signalAvgPnl: deep.signalStats.avgPnlPerSignal,
            predAccuracy: Math.round((deep.predStats.correct / deep.predStats.total) * 100), predTotal: deep.predStats.total, predStreak: deep.predStats.streak,
            sharpe: t.sharpe, maxDD: Math.abs(t.maxDD), profitFactor: t.profitFactor || 0,
          };
        });
        const compareMetrics = [
          { id: "equity", label: "Equity", icon: "📈" },
          { id: "signals", label: "Señales", icon: "⚡" },
          { id: "trades", label: "Trades", icon: "💹" },
          { id: "predictions", label: "Predictions", icon: "🎯" },
        ];
        return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Trader selector */}
          <div style={{ ...cardStyle, display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <button onClick={toggleAll} style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
              border: `1px solid ${allOn ? C.textMuted : C.border}`,
              backgroundColor: allOn ? C.cardHover : "transparent",
              color: allOn ? C.text : C.textMuted, marginRight: "4px"
            }}>{allOn ? "Deselect All" : "Select All"}</button>
            {mockTraders.map((t, i) => {
              const on = visibleTraders[t.name];
              const color = traderColors[i];
              return (
                <button key={t.name} onClick={() => toggleTrader(t.name)} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                  border: `1px solid ${on ? color : C.border}`,
                  backgroundColor: on ? color + "18" : "transparent",
                  color: on ? color : C.textFaint, transition: "all 0.15s"
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: on ? color : C.textFaint, transition: "background-color 0.15s" }} />
                  {t.avatar} {t.name}
                </button>
              );
            })}
          </div>

          {/* Compare metric tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            {compareMetrics.map(m => (
              <button key={m.id} onClick={() => setCompareMetric(m.id)} style={{
                padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${compareMetric === m.id ? C.purple : C.border}`,
                backgroundColor: compareMetric === m.id ? C.purpleBg : "transparent",
                color: compareMetric === m.id ? C.purple : C.textMuted,
                display: "flex", alignItems: "center", gap: "6px"
              }}>{m.icon} {m.label}</button>
            ))}
          </div>

          {/* ── EQUITY COMPARISON ── */}
          {compareMetric === "equity" && (<>
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Equity Curve Comparison</div>
              <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "16px" }}>Cumulative PnL over 30 days</div>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={traderEquity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} />
                  <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px" }} formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} labelFormatter={l => `Day ${l}`} />
                  {mockTraders.map((t, i) => visibleTraders[t.name] && <Line key={t.name} type="monotone" dataKey={t.name} stroke={traderColors[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["","Trader","Win Rate","Total PnL","Trades","Day 30 Equity","Streak"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {activeTraders.map(t => {
                    const i = mockTraders.indexOf(t);
                    const lastEquity = traderEquity[traderEquity.length - 1][t.name];
                    return (
                      <tr key={t.name} style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{t.avatar} {t.name}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{t.winRate}%</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(t.pnl / 1000).toFixed(1)}K</td>
                        <td style={{ ...tdStyle, ...mono }}>{t.trades}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.blue, fontWeight: "600" }}>${(lastEquity / 1000).toFixed(1)}K</td>
                        <td style={{ ...tdStyle, ...mono, color: C.amber }}>{t.streak}W</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}

          {/* ── SIGNALS COMPARISON ── */}
          {compareMetric === "signals" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Signal Accuracy (%)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" stroke={C.textMuted} fontSize={10} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke={C.textMuted} fontSize={10} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`${v}%`, "Accuracy"]} />
                    <Bar dataKey="signalAccuracy" radius={[0, 4, 4, 0]}>{compareBarData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Avg PnL per Signal ($)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" stroke={C.textMuted} fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke={C.textMuted} fontSize={10} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${v}`, "Avg PnL"]} />
                    <Bar dataKey="signalAvgPnl" radius={[0, 4, 4, 0]}>{compareBarData.map((e, i) => <Cell key={i} fill={e.signalAvgPnl >= 0 ? C.green : C.red} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["","Trader","Accuracy","Total Signals","Avg PnL/Signal","Best Signal","Subscribers"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {activeTraders.map(t => {
                    const i = mockTraders.indexOf(t);
                    const deep = traderDeepData[t.name];
                    return (
                      <tr key={t.name} style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{t.avatar} {t.name}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{deep.signalStats.accuracy}%</td>
                        <td style={{ ...tdStyle, ...mono }}>{deep.signalStats.total}</td>
                        <td style={{ ...tdStyle, ...mono, color: deep.signalStats.avgPnlPerSignal >= 0 ? C.green : C.red, fontWeight: "600" }}>${deep.signalStats.avgPnlPerSignal.toLocaleString()}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green }}>+${deep.signalStats.bestSignal.toLocaleString()}</td>
                        <td style={{ ...tdStyle, ...mono }}>{deep.signalStats.subscribers}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}

          {/* ── TRADES COMPARISON ── */}
          {compareMetric === "trades" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Win Rate (%)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" stroke={C.textMuted} fontSize={10} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke={C.textMuted} fontSize={10} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`${v}%`, "Win Rate"]} />
                    <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>{compareBarData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Sharpe Ratio vs Max Drawdown</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" stroke={C.textMuted} fontSize={9} angle={-20} textAnchor="end" height={50} />
                    <YAxis stroke={C.textMuted} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                    <Bar dataKey="sharpe" name="Sharpe" fill={C.blue} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="profitFactor" name="Profit Factor" fill={C.purple} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["","Trader","Win Rate","Total PnL","Trades","Sharpe","Max DD","Profit Factor","Streak"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {activeTraders.map(t => {
                    const i = mockTraders.indexOf(t);
                    return (
                      <tr key={t.name} style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{t.avatar} {t.name}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{t.winRate}%</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(t.pnl / 1000).toFixed(1)}K</td>
                        <td style={{ ...tdStyle, ...mono }}>{t.trades}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.blue, fontWeight: "600" }}>{t.sharpe.toFixed(1)}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.red }}>{t.maxDD}%</td>
                        <td style={{ ...tdStyle, ...mono, color: C.amber }}>{t.profitFactor?.toFixed(1) || "—"}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.amber }}>{t.streak}W</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}

          {/* ── PREDICTIONS COMPARISON ── */}
          {compareMetric === "predictions" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Prediction Accuracy (%)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis type="number" stroke={C.textMuted} fontSize={10} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke={C.textMuted} fontSize={10} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`${v}%`, "Accuracy"]} />
                    <Bar dataKey="predAccuracy" radius={[0, 4, 4, 0]}>{compareBarData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Total Predictions & Current Streak</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" stroke={C.textMuted} fontSize={9} angle={-20} textAnchor="end" height={50} />
                    <YAxis stroke={C.textMuted} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                    <Bar dataKey="predTotal" name="Total Predictions" fill={C.blue} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="predStreak" name="Current Streak" fill={C.amber} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["","Trader","Accuracy","Total Predictions","Current Streak","Total Staked","Net Won"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {activeTraders.map(t => {
                    const i = mockTraders.indexOf(t);
                    const deep = traderDeepData[t.name];
                    return (
                      <tr key={t.name} style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}>{t.avatar} {t.name}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{Math.round((deep.predStats.correct / deep.predStats.total) * 100)}%</td>
                        <td style={{ ...tdStyle, ...mono }}>{deep.predStats.total}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.amber }}>{deep.predStats.streak} correct</td>
                        <td style={{ ...tdStyle, ...mono }}>${deep.predStats.totalStaked.toLocaleString()}</td>
                        <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${deep.predStats.totalWon.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}
        </div>
        );
      })()}

      {view === "profiles" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {mockTraders.map((t, ti) => {
            const title = titleByLevel(t.level);
            const xpPct = Math.round((t.xp / t.xpNext) * 100);
            const isTopRanked = t.rank === 1;
            return (
            <div key={t.name} style={{ ...cardStyle, cursor: "pointer", border: isTopRanked ? `2px solid ${C.amber}` : `1px solid ${C.border}`, transition: "border-color 0.15s", position: "relative" }} onClick={() => openProfile(t)}>
              {isTopRanked && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${C.amber}, ${C.amber}80)`, borderRadius: "8px 8px 0 0" }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "28px" }}>{t.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                    {t.name}
                    <span style={{ fontSize: "12px", fontWeight: "700", color: C.purple, ...mono }}>LVL {t.level}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: C.amber, fontWeight: "700", marginBottom: "4px" }}>{title}</div>
                  <div style={{ fontSize: "11px", color: C.textMuted }}>Rank #{t.rank} — {t.style}</div>
                </div>
                <Tag text={t.tier} color={tierColor[t.tier]} />
              </div>
              {/* XP Progress Bar */}
              <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "10px", color: C.textMuted }}>XP to Level {t.level + 1}</span>
                  <span style={{ fontSize: "10px", fontWeight: "600", color: C.textMuted, ...mono }}>{t.xp}/{t.xpNext}</span>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: C.border, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${xpPct}%`, height: "100%", backgroundColor: C.purple, borderRadius: "3px", transition: "width 0.3s" }} />
                </div>
              </div>
              <div style={{ fontSize: "11px", color: C.textMuted, lineHeight: "1.5", marginBottom: "10px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.bio}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                {[
                  ["Win Rate", t.winRate + "%", C.green],
                  ["PnL", "$" + (t.pnl / 1000).toFixed(1) + "K", C.green],
                  ["Sharpe", t.sharpe.toFixed(1), C.blue],
                  ["Streak", t.streak + "W", C.amber],
                ].map(([l, v, clr]) => (
                  <div key={l}>
                    <div style={{ fontSize: "10px", color: C.textMuted }}>{l}</div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: clr, ...mono }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <div style={{ display: "flex", gap: "4px" }}>{t.badges.map((b, i) => <span key={i} style={{ fontSize: "16px" }}>{b}</span>)}</div>
                <div style={{ fontSize: "11px", color: C.purple, fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>View Profile <ChevronRight size={12} /></div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════ TAB 4: HEATMAP ═══════════════════════ */
const HeatmapTab = () => {
  const maxVal = 12300;
  const cellColor = (v) => {
    const intensity = Math.min(Math.abs(v) / maxVal, 1);
    return v >= 0
      ? `rgba(63,185,80,${0.15 + intensity * 0.6})`
      : `rgba(248,81,73,${0.15 + intensity * 0.6})`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: "700" }}>Heatmap de Rendimiento</div>
      <div style={{ ...cardStyle, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "120px" }}>Trader</th>
              {heatAssets.map(a => <th key={a} style={{ ...thStyle, textAlign: "center" }}>{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {mockHeatmap.map(row => (
              <tr key={row.t}>
                <td style={{ ...tdStyle, fontWeight: "500" }}><TraderLink name={row.t}>{row.t}</TraderLink></td>
                {row.d.map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: "center", padding: "6px" }}>
                    <div style={{ backgroundColor: cellColor(v), borderRadius: "4px", padding: "8px 4px", ...mono, fontSize: "11px", fontWeight: "600", color: v >= 0 ? C.green : C.red }}>
                      {v >= 0 ? "+" : ""}${(Math.abs(v) / 1000).toFixed(1)}K
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <StatCard label="Best Performer" value="Scalp King" sub="+$46.6K total" icon={Trophy} color={C.green} />
        <StatCard label="Worst Performer" value="Wave Rider" sub="$2.3K total" icon={TrendingDown} color={C.red} />
        <StatCard label="Top Asset" value="BTC" sub="$43.6K combined" icon={Star} color={C.amber} />
      </div>
    </div>
  );
};

/* ═══════════════════════ TAB 5: REPORT ═══════════════════════ */
const ReportTab = () => {
  const days = Object.entries(marchData);
  const totalPnl = days.reduce((a, [, d]) => a + d.pnl, 0);
  const totalTrades = days.reduce((a, [, d]) => a + d.trades, 0);
  const bestDay = days.reduce((best, [day, d]) => d.pnl > best.pnl ? { day, pnl: d.pnl } : best, { day: "0", pnl: -Infinity });
  const worstDay = days.reduce((worst, [day, d]) => d.pnl < worst.pnl ? { day, pnl: d.pnl } : worst, { day: "0", pnl: Infinity });
  // March 1 2026 is Sunday → 6 empty cells (Mon-Sat)
  const emptyBefore = 6;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: "700" }}>Reporte — Marzo 2026</div>

      {/* Calendar */}
      <div style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
          {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: "700", color: C.textMuted, padding: "6px" }}>{d}</div>
          ))}
          {Array.from({ length: emptyBefore }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: 22 }).map((_, i) => {
            const day = i + 1;
            const d = marchData[day];
            const clr = d.pnl >= 0 ? C.green : C.red;
            const bg = d.pnl >= 0 ? C.greenBg : C.redBg;
            const winPct = d.trades > 0 ? Math.round((d.wins / d.trades) * 100) : 0;
            return (
              <div key={day} style={{ backgroundColor: bg, borderRadius: "6px", padding: "8px", minHeight: "82px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>{day}</span>
                  <span style={{ fontSize: "9px", color: C.textMuted, ...mono }}>{d.trades} trades</span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: clr, ...mono }}>
                  {d.pnl >= 0 ? "+" : ""}${d.pnl.toLocaleString()}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ flex: 1, display: "flex", height: "4px", borderRadius: "2px", overflow: "hidden", gap: "1px" }}>
                    <div style={{ flex: d.wins, backgroundColor: C.green, borderRadius: "2px 0 0 2px" }} />
                    <div style={{ flex: d.losses, backgroundColor: C.red, borderRadius: "0 2px 2px 0" }} />
                  </div>
                  <span style={{ fontSize: "8px", color: C.textMuted, ...mono, minWidth: "24px", textAlign: "right" }}>{d.wins}W {d.losses}L</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Total PnL" value={"$" + totalPnl.toLocaleString()} sub={totalPnl >= 0 ? "+Profitable" : "-Loss"} icon={TrendingUp} color={totalPnl >= 0 ? C.green : C.red} />
        <StatCard label="Total Trades" value={totalTrades} icon={Activity} color={C.blue} />
        <StatCard label="Best Day" value={"Mar " + bestDay.day} sub={"+$" + bestDay.pnl.toLocaleString()} icon={Trophy} color={C.green} />
        <StatCard label="Worst Day" value={"Mar " + worstDay.day} sub={"$" + worstDay.pnl.toLocaleString()} icon={TrendingDown} color={C.red} />
      </div>

      {/* Cumulative PnL Chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Equity Curve — Cumulative PnL</div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={cumData}>
            <defs>
              <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} />
            <YAxis stroke={C.textMuted} fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
            <Area type="monotone" dataKey="pnl" stroke={C.green} fill="url(#cumGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ═══════════════════════ TAB 6: COPY TRADING ═══════════════════════ */
const CopyTradingTab = () => {
  const [selected, setSelected] = useState(0);
  const [riskMult, setRiskMult] = useState(1.0);
  const [copying, setCopying] = useState({});
  const port = copyPortfolios[selected];
  const riskColor = { "Low": C.green, "Medium": C.amber, "Medium-High": C.amber, "High": C.red };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ fontSize: "18px", fontWeight: "700" }}>Copy Trading</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {copyPortfolios.map((p, i) => (
            <button key={p.name} onClick={() => setSelected(i)} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
              border: `1px solid ${selected === i ? C.purple : C.border}`,
              backgroundColor: selected === i ? C.purpleBg : "transparent",
              color: selected === i ? C.purple : C.textMuted
            }}><span>{p.avatar}</span> {p.name}</button>
          ))}
        </div>
      </div>

      {/* Top Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Monthly Return" value={`+${port.monthlyReturn}%`} sub={`Sharpe ${port.sharpe}`} icon={TrendingUp} color={C.green} />
        <StatCard label="Followers" value={port.followers.toLocaleString()} sub={`$${(port.aum / 1e6).toFixed(1)}M AUM`} icon={Users} color={C.blue} />
        <StatCard label="Max Drawdown" value={`${port.maxDD}%`} sub={`Risk: ${port.riskLevel}`} icon={AlertTriangle} color={riskColor[port.riskLevel] || C.amber} />
        <StatCard label="Win Rate" value={`${port.winRate}%`} sub={`Avg hold: ${port.avgTrade}`} icon={Trophy} color={C.amber} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>
        {/* Left: Equity + Trades */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Equity Curve */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Equity Curve — <TraderLink name={port.name}>{port.name}</TraderLink></div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={port.equity}>
                <defs>
                  <linearGradient id="copyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} />
                <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                <Area type="monotone" dataKey="value" stroke={C.green} fill="url(#copyGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Trades */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Trades Recientes</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["Par", "Tipo", "PnL", "Fecha"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {port.recentTrades.map((t, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{t.pair}</td>
                    <td style={tdStyle}><Tag text={t.type} color={t.type === "LONG" ? C.green : C.red} /></td>
                    <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: t.pnl >= 0 ? C.green : C.red }}>
                      {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, color: C.textMuted }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Copy Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Copy Action Card */}
          <div style={{ ...cardStyle, border: `1px solid ${C.purple}40` }}>
            <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Copy size={16} color={C.purple} /> Copiar a <TraderLink name={port.name}>{port.name}</TraderLink>
            </div>

            {/* Social Proof */}
            <div style={{ marginBottom: "12px", padding: "10px", backgroundColor: C.greenBg, borderRadius: "6px", border: `1px solid ${C.green}40` }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: C.green, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px" }}>🟢</span> {port.copiers} people copying right now
              </div>
              <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "4px" }}>Last copied: 2 min ago</div>
              {port.copiers > 300 && (
                <div style={{ fontSize: "11px", fontWeight: "700", color: C.amber, marginTop: "4px", display: "inline-block", backgroundColor: C.amberBg, padding: "2px 6px", borderRadius: "4px" }}>🔥 Trending</div>
              )}
            </div>

            {/* Risk Multiplier */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "6px", fontWeight: "600" }}>AJUSTAR RIESGO</div>
              <div style={{ display: "flex", gap: "6px" }}>
                {[0.5, 0.75, 1.0, 1.5, 2.0].map(m => (
                  <button key={m} onClick={() => setRiskMult(m)} style={{
                    flex: 1, padding: "8px 4px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${riskMult === m ? C.purple : C.border}`,
                    backgroundColor: riskMult === m ? C.purpleBg : "transparent",
                    color: riskMult === m ? C.purple : C.textMuted
                  }}>{m}x</button>
                ))}
              </div>
            </div>

            {/* Info rows */}
            {[
              ["Performance Fee", `${port.fee}%`],
              ["Min. Investment", `$${port.minInvest}`],
              ["Risk Level", port.riskLevel],
              ["Avg Trade Duration", port.avgTrade],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                <span style={{ color: C.textMuted }}>{l}</span>
                <span style={{ fontWeight: "600", ...mono }}>{v}</span>
              </div>
            ))}

            {/* Copy Button */}
            <button onClick={() => setCopying(prev => ({ ...prev, [port.name]: !prev[port.name] }))} style={{
              width: "100%", marginTop: "16px", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer",
              backgroundColor: copying[port.name] ? C.red : C.green,
              color: copying[port.name] ? "#fff" : "#000",
              fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}>
              {copying[port.name] ? <><Pause size={14} /> Stop Copying</> : <><Play size={14} /> Start Copying</>}
            </button>
          </div>

          {/* Allocation */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Allocación del Portfolio</div>
            {port.allocation.map(a => (
              <div key={a.asset} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600" }}>{a.asset}</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", ...mono }}>{a.pct}%</span>
                </div>
                <div style={{ height: "6px", backgroundColor: C.border, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${a.pct}%`, height: "100%", backgroundColor: a.asset === "BTC" ? C.amber : a.asset === "ETH" ? C.blue : a.asset === "SOL" ? C.purple : C.textMuted, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Trader Stats Summary */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px" }}>Métricas del Trader</div>
            {[
              ["Sharpe Ratio", port.sharpe.toFixed(1), C.blue],
              ["Max Drawdown", `${port.maxDD}%`, C.red],
              ["Win Rate", `${port.winRate}%`, C.green],
              ["Followers", port.followers.toLocaleString(), C.purple],
              ["AUM", `$${(port.aum / 1e6).toFixed(1)}M`, C.amber],
            ].map(([l, v, clr]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                <span style={{ color: C.textMuted }}>{l}</span>
                <span style={{ fontWeight: "700", color: clr, ...mono }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Traders Comparison Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Todos los Portfolios</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            {["Trader", "Return/Mes", "Sharpe", "Win Rate", "Max DD", "Followers", "AUM", "Fee", "Risk", "Hot", "Status"].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>
            {copyPortfolios.map((p, i) => {
              const isHot = p.copiers > 300;
              return (
              <tr key={p.name} style={{ backgroundColor: i === selected ? C.purpleBg : i % 2 === 0 ? "transparent" : C.cardHover, cursor: "pointer" }} onClick={() => setSelected(i)}>
                <td style={tdStyle}><span style={{ marginRight: "6px" }}>{p.avatar}</span><TraderLink name={p.name}>{p.name}</TraderLink></td>
                <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "700" }}>+{p.monthlyReturn}%</td>
                <td style={{ ...tdStyle, ...mono, color: C.blue, fontWeight: "600" }}>{p.sharpe}</td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "600" }}>{p.winRate}%</td>
                <td style={{ ...tdStyle, ...mono, color: C.red }}>{p.maxDD}%</td>
                <td style={{ ...tdStyle, ...mono }}>{p.followers.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono }}>${(p.aum / 1e6).toFixed(1)}M</td>
                <td style={{ ...tdStyle, ...mono }}>{p.fee}%</td>
                <td style={tdStyle}><Tag text={p.riskLevel} color={riskColor[p.riskLevel] || C.amber} /></td>
                <td style={{ ...tdStyle, fontSize: "14px", fontWeight: "700" }}>{isHot ? "🔥" : "—"}</td>
                <td style={tdStyle}>
                  {copying[p.name]
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: C.green, fontWeight: "600" }}><CheckCircle size={12} /> Copying</span>
                    : <span style={{ fontSize: "11px", color: C.textMuted }}>—</span>
                  }
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════ TAB 7: PREDICTION MARKETS ═══════════════════════ */
const PredictionMarketsTab = () => {
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("volume");
  const [userBets, setUserBets] = useState({});

  const filtered = predictionMarkets
    .filter(m => catFilter === "All" || m.category === catFilter)
    .sort((a, b) => sortBy === "volume" ? b.volume - a.volume : sortBy === "participants" ? b.participants - a.participants : b.yesOdds - a.yesOdds);

  const totalVolume = predictionMarkets.reduce((a, m) => a + m.volume, 0);
  const totalParticipants = predictionMarkets.reduce((a, m) => a + m.participants, 0);
  const trending = predictionMarkets.filter(m => m.trending).length;

  const placeBet = (id, side) => {
    setUserBets(prev => {
      const current = prev[id];
      if (current === side) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: side };
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ fontSize: "18px", fontWeight: "700" }}>Prediction Markets</div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: "600" }}>Sort:</span>
          {[["volume", "Volume"], ["participants", "Popular"], ["yesOdds", "Yes %"]].map(([k, l]) => (
            <button key={k} onClick={() => setSortBy(k)} style={{
              padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
              border: `1px solid ${sortBy === k ? C.purple : C.border}`,
              backgroundColor: sortBy === k ? C.purpleBg : "transparent",
              color: sortBy === k ? C.purple : C.textMuted
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Total Volume" value={`$${(totalVolume / 1000).toFixed(0)}K`} icon={DollarSign} color={C.green} />
        <StatCard label="Participants" value={totalParticipants.toLocaleString()} icon={Users} color={C.blue} />
        <StatCard label="Active Markets" value={predictionMarkets.length} icon={Activity} color={C.purple} />
        <StatCard label="Trending" value={trending} sub="Hot markets" icon={Flame} color={C.amber} />
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {predCategories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
            border: `1px solid ${catFilter === c ? C.purple : C.border}`,
            backgroundColor: catFilter === c ? C.purpleBg : "transparent",
            color: catFilter === c ? C.purple : C.textMuted
          }}>{c}</button>
        ))}
      </div>

      {/* Market Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {filtered.map(m => {
          const userBet = userBets[m.id];
          return (
            <div key={m.id} style={{ ...cardStyle, border: m.trending ? `1px solid ${C.amber}30` : `1px solid ${C.border}`, position: "relative" }}>
              {m.trending && (
                <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Flame size={12} color={C.amber} />
                  <span style={{ fontSize: "10px", fontWeight: "700", color: C.amber }}>TRENDING</span>
                </div>
              )}

              {/* Question */}
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "10px", paddingRight: m.trending ? "80px" : 0, lineHeight: "1.4" }}>{m.question}</div>

              {/* Category + Deadline */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <Tag text={m.category} color={C.blue} />
                <span style={{ fontSize: "11px", color: C.textMuted, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={11} /> {m.deadline}
                </span>
              </div>

              {/* Pot Size + Odds Bar */}
              <div style={{ marginBottom: "14px", padding: "10px", backgroundColor: C.purpleBg, borderRadius: "6px", border: `1px solid ${C.purple}40` }}>
                <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "6px", fontWeight: "600" }}>POT SIZE</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: C.purple, ...mono, marginBottom: "10px" }}>${(m.volume / 1000).toFixed(0)}K</div>
                <div style={{ display: "flex", height: "20px", borderRadius: "6px", overflow: "hidden", gap: "1px", marginBottom: "6px" }}>
                  <div style={{ flex: m.yesOdds, backgroundColor: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: "#000" }}>
                    {m.yesOdds > 25 ? `${m.yesOdds}%` : ""}
                  </div>
                  <div style={{ flex: m.noOdds, backgroundColor: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: "#fff" }}>
                    {m.noOdds > 25 ? `${m.noOdds}%` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: C.green }}>YES {m.yesOdds}¢</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: C.red }}>NO {m.noOdds}¢</span>
                </div>
              </div>

              {/* Mini Sparkline */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>Historial de YES %</div>
                <ResponsiveContainer width="100%" height={40}>
                  <AreaChart data={m.priceHistory.map((v, i) => ({ i, v }))}>
                    <defs>
                      <linearGradient id={`spark${m.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={C.green} fill={`url(#spark${m.id})`} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume + Participants */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>Volumen</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", ...mono }}>${(m.volume / 1000).toFixed(0)}K</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>Participantes</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", ...mono }}>{m.participants.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>Apuestas</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", ...mono }}>{m.yesBets} / {m.noBets}</div>
                </div>
              </div>

              {/* Bet Buttons - DRAMATIC */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => placeBet(m.id, "yes")} style={{
                  flex: 1, padding: "14px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer",
                  border: userBet === "yes" ? `3px solid ${C.green}` : `2px solid ${C.green}80`,
                  backgroundColor: userBet === "yes" ? C.green : C.greenBg,
                  color: userBet === "yes" ? "#000" : C.green, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  textTransform: "uppercase", letterSpacing: "0.5px", transition: "all 0.2s"
                }}>
                  <ArrowUp size={16} /> YES — {m.yesOdds}¢
                </button>
                <button onClick={() => placeBet(m.id, "no")} style={{
                  flex: 1, padding: "14px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer",
                  border: userBet === "no" ? `3px solid ${C.red}` : `2px solid ${C.red}80`,
                  backgroundColor: userBet === "no" ? C.red : C.redBg,
                  color: userBet === "no" ? "#fff" : C.red, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  textTransform: "uppercase", letterSpacing: "0.5px", transition: "all 0.2s"
                }}>
                  <ArrowDown size={16} /> NO — {m.noOdds}¢
                </button>
              </div>

              {userBet && (
                <div style={{ marginTop: "10px", padding: "8px", fontSize: "12px", color: userBet === "yes" ? C.green : C.red, fontWeight: "700", textAlign: "center", backgroundColor: userBet === "yes" ? C.greenBg : C.redBg, borderRadius: "6px", border: `1px solid ${userBet === "yes" ? C.green : C.red}40` }}>
                  ✓ Tu apuesta: {userBet.toUpperCase()} @ {userBet === "yes" ? m.yesOdds : m.noOdds}¢
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════ TAB 8: FOOTBALL TRADING GAME ═══════════════════════ */

const FootballTab = () => {
  const [selTf, setSelTf] = useState("3D");

  const longs = ftgPlayers.filter(p => p.team === "LONG");
  const shorts = ftgPlayers.filter(p => p.team === "SHORT");
  const longCount = longs.length;
  const shortCount = shorts.length;
  const totalPlayers = ftgPlayers.length;
  const longPct = Math.round((longCount / totalPlayers) * 100);
  const shortPct = 100 - longPct;
  const avgRoi = (ftgPlayers.reduce((a, p) => a + p.roi, 0) / totalPlayers).toFixed(2);
  const bestPlayer = [...ftgPlayers].sort((a, b) => b.roi - a.roi)[0];
  const range = ftgPriceRange.high - ftgPriceRange.low;

  /* Map entry price to horizontal % position on the field (0% = left/SHORT goal, 100% = right/LONG goal) */
  const priceToX = (price) => {
    const pct = ((price - ftgPriceRange.low) / range) * 100;
    return Math.max(2, Math.min(98, pct));
  };
  const ballX = priceToX(ftgCurrentPrice);

  /* Momentum: which team is "winning" the market */
  const momentum = shortPct > longPct ? "SHORT" : longPct > shortPct ? "LONG" : "NEUTRAL";
  const momStrength = Math.abs(longPct - shortPct) > 30 ? "STRONG" : Math.abs(longPct - shortPct) > 10 ? "MODERATE" : "WEAK";

  /* Orderflow / Volume / Structure / Liquidity mini-gauges */
  const gauges = [
    { label: "Orderflow", val: 8, max: 23 },
    { label: "Volume", val: 0, max: 7 },
    { label: "Structure", val: 0, max: 20 },
    { label: "Liquidity", val: 10, max: 10 },
  ];

  /* Down & Distance (American football metaphor: how far from next support/resistance) */
  const nearestTarget = 67400;
  const distance = Math.abs(ftgCurrentPrice - nearestTarget).toFixed(0);

  /* Active session */
  const activeSession = ftgSessions.find(s => s.active) || ftgSessions[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>🏈</span>
          <span style={{ fontSize: "18px", fontWeight: "800" }}>Football Trading Game</span>
          <Tag text={`${totalPlayers} jugadores activos`} color={C.green} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", ...mono }}>{ftgPair}</div>
          {ftgTimeframes.map(tf => (
            <button key={tf} onClick={() => setSelTf(tf)} style={{
              padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
              backgroundColor: selTf === tf ? C.green : C.bg, color: selTf === tf ? "#000" : C.textMuted,
              border: `1px solid ${selTf === tf ? C.green : C.border}`, transition: "all 0.15s"
            }}>{tf}</button>
          ))}
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", backgroundColor: C.green, border: "none", color: "#000", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Main: Field + Scoreboard ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>

        {/* Campo de Juego */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>🏈 Campo de Juego</div>
              <div style={{ fontSize: "10px", color: C.textMuted, ...mono }}>Rango: ${ftgPriceRange.low.toLocaleString()} – ${ftgPriceRange.high.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: C.textMuted }}>Balón (Precio)</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: C.green, ...mono }}>${ftgCurrentPrice.toLocaleString()}</div>
            </div>
          </div>

          {/* The Field = Price Chart */}
          <div style={{ position: "relative", width: "100%", height: "320px", backgroundColor: C.bg, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {/* Red zones (end zones) */}
            <div style={{ position: "absolute", top: 0, left: 0, width: `${ftgRedZoneWidth}%`, height: "100%", backgroundColor: "rgba(248,81,73,0.12)", borderRight: "2px dashed rgba(248,81,73,0.4)" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-90deg)", fontSize: "10px", fontWeight: "700", color: C.red, textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>RED ZONE</div>
            </div>
            <div style={{ position: "absolute", top: 0, right: 0, width: `${ftgRedZoneWidth}%`, height: "100%", backgroundColor: "rgba(248,81,73,0.12)", borderLeft: "2px dashed rgba(248,81,73,0.4)" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(90deg)", fontSize: "10px", fontWeight: "700", color: C.red, textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>RED ZONE</div>
            </div>

            {/* Goal labels */}
            <div style={{ position: "absolute", bottom: "12px", left: "12px", fontSize: "11px", fontWeight: "700", color: C.red }}>SHORT<div style={{ fontSize: "9px", fontWeight: "400", color: C.textMuted }}>Goal Line</div></div>
            <div style={{ position: "absolute", bottom: "12px", right: "12px", fontSize: "11px", fontWeight: "700", color: C.green, textAlign: "right" }}>LONG<div style={{ fontSize: "9px", fontWeight: "400", color: C.textMuted }}>Goal Line</div></div>

            {/* Vertical yard lines */}
            {[20, 35, 50, 65, 80].map(pct => {
              const price = ftgPriceRange.low + (pct / 100) * range;
              return (
                <div key={pct} style={{ position: "absolute", top: 0, left: `${pct}%`, height: "100%", borderLeft: `1px solid ${C.border}` }}>
                  <div style={{ position: "absolute", bottom: "2px", left: "4px", fontSize: "9px", color: C.textFaint, ...mono }}>${price.toFixed(0)}</div>
                </div>
              );
            })}

            {/* Center line */}
            <div style={{ position: "absolute", top: 0, left: "50%", height: "100%", borderLeft: `1px solid ${C.borderLight}` }} />

            {/* Ball (current price) */}
            <div style={{ position: "absolute", top: "50%", left: `${ballX}%`, transform: "translate(-50%,-50%)", zIndex: 10, textAlign: "center" }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ffd700", border: "2px solid #fff", margin: "0 auto 4px", boxShadow: "0 0 12px rgba(255,215,0,0.6)" }} />
              <div style={{ fontSize: "9px", fontWeight: "700", color: "#ffd700", textTransform: "uppercase" }}>BALL</div>
            </div>

            {/* Players positioned by entry price */}
            {ftgPlayers.map((p, i) => {
              const x = priceToX(p.entry);
              const isLong = p.team === "LONG";
              const isWin = p.status === "Win";
              const dotColor = isLong
                ? (isWin ? C.green : "rgba(63,185,80,0.5)")
                : (isWin ? C.red : "rgba(248,81,73,0.5)");
              const yOffset = 20 + (i % 4) * 18; // stagger vertically
              return (
                <div key={p.name} style={{ position: "absolute", left: `${x}%`, top: `${yOffset}%`, transform: "translate(-50%,-50%)", textAlign: "center", cursor: "pointer", zIndex: 5 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", backgroundColor: dotColor,
                    border: `2px solid ${isWin ? "white" : "rgba(255,255,255,0.4)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 2px", fontSize: "10px",
                    boxShadow: isWin ? `0 0 8px ${dotColor}` : "none"
                  }}>
                    {isLong ? (isWin ? "↗" : "↘") : (isWin ? "↙" : "↗")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "20px", marginTop: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              [C.green, "LONG (Ganando) ↗"],
              ["rgba(63,185,80,0.5)", "LONG (Perdiendo) ↘"],
              [C.red, "SHORT (Ganando) ↙"],
              ["rgba(248,81,73,0.5)", "SHORT (Perdiendo) ↗"],
            ].map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: C.textMuted }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Scoreboard ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Score */}
          <div style={cardStyle}>
            <div style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>🏈 Scoreboard</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
              {/* LONG */}
              <div style={{ flex: 1, border: `1px solid ${C.green}40`, borderRadius: "8px", padding: "12px", textAlign: "center", backgroundColor: C.greenBg }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: C.green, textTransform: "uppercase" }}>LONG</div>
                <div style={{ fontSize: "32px", fontWeight: "900", color: C.green, ...mono, lineHeight: 1, marginTop: "4px" }}>{longPct}</div>
                <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "2px" }}>Bulls</div>
              </div>
              {/* Momentum */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: "70px" }}>
                <div style={{ fontSize: "9px", color: C.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Momentum</div>
                <div style={{ fontSize: "18px", marginTop: "4px" }}>{momentum === "SHORT" ? "⬇" : momentum === "LONG" ? "⬆" : "↔"}</div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: momStrength === "STRONG" ? C.amber : C.textMuted, marginTop: "2px" }}>{momStrength}</div>
              </div>
              {/* SHORT */}
              <div style={{ flex: 1, border: `1px solid ${C.red}40`, borderRadius: "8px", padding: "12px", textAlign: "center", backgroundColor: C.redBg }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: C.red, textTransform: "uppercase" }}>SHORT</div>
                <div style={{ fontSize: "32px", fontWeight: "900", color: C.red, ...mono, lineHeight: 1, marginTop: "4px", textShadow: shortPct > longPct ? `0 0 16px ${C.red}50` : "none" }}>{shortPct}</div>
                <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "2px" }}>Bears</div>
              </div>
            </div>

            {/* Possession bar */}
            <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
              <span>POSESIÓN</span>
              <span style={{ ...mono }}>{longPct}% LONG / {shortPct}% SHORT</span>
            </div>
            <div style={{ display: "flex", height: "10px", borderRadius: "5px", overflow: "hidden", gap: "2px" }}>
              <div style={{ flex: longPct, backgroundColor: C.green, borderRadius: "5px 0 0 5px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "8px", fontWeight: "700", color: "#000" }}>{longPct}%</span>
              </div>
              <div style={{ flex: shortPct, backgroundColor: C.red, borderRadius: "0 5px 5px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "8px", fontWeight: "700", color: "#fff" }}>{shortPct}%</span>
              </div>
            </div>
          </div>

          {/* Down & Distance + Game Clock */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={cardStyle}>
              <div style={{ fontSize: "10px", color: C.textMuted, fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>Down & Distance</div>
              <div style={{ fontSize: "18px", fontWeight: "800", ...mono }}>4th & {distance}</div>
              <div style={{ fontSize: "10px", color: C.amber, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <AlertTriangle size={10} /> Critical Down!
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "10px", color: C.textMuted, fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>Game Clock</div>
              <div style={{ fontSize: "18px", fontWeight: "800", ...mono }}>Q4 — 10:04</div>
              <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "4px" }}>{activeSession.name} Session</div>
            </div>
          </div>

          {/* Mini gauges */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {gauges.map(g => {
              const pct = (g.val / g.max) * 100;
              const clr = pct >= 60 ? C.green : pct >= 30 ? C.amber : C.red;
              return (
                <div key={g.label} style={{ ...cardStyle, padding: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", color: C.textMuted }}>{g.label}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", ...mono }}>{g.val}/{g.max}</span>
                  </div>
                  <div style={{ height: "4px", backgroundColor: C.border, borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: clr, borderRadius: "2px" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estadísticas */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>📊 Estadísticas</div>
            {[
              ["Total Jugadores", totalPlayers],
              ["Distribución", `${longCount} LONG / ${shortCount} SHORT`],
              ["ROI Promedio", <span style={{ color: Number(avgRoi) >= 0 ? C.green : C.red }}>+{avgRoi}%</span>],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                <span style={{ color: C.textMuted }}>{label}</span>
                <span style={{ fontWeight: "600", ...mono }}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>🏆 Mejor Jugador</div>
              <div style={{ fontSize: "14px", fontWeight: "700" }}><TraderLink name={bestPlayer.name}>{bestPlayer.avatar} {bestPlayer.name}</TraderLink></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Jugadores Activos ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>👥 Jugadores Activos</div>
          <span style={{ fontSize: "12px", color: C.textMuted }}>{totalPlayers} posiciones</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead><tr>
              {["Trader","Team","Entry","Current","ROI","Status","Time"].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {ftgPlayers.map(p => (
                <tr key={p.name}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>{p.avatar}</span>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "600" }}><TraderLink name={p.name}>{p.name}</TraderLink></div>
                        <div style={{ fontSize: "10px", color: C.textMuted }}>{p.coin}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <Tag text={p.team} color={p.team === "LONG" ? C.green : C.red} />
                  </td>
                  <td style={{ ...tdStyle, ...mono, fontSize: "12px" }}>${p.entry.toLocaleString()}</td>
                  <td style={{ ...tdStyle, ...mono, fontSize: "12px" }}>${p.current.toLocaleString()}</td>
                  <td style={{ ...tdStyle, ...mono, fontSize: "12px", fontWeight: "700", color: p.roi >= 0 ? C.green : C.red }}>
                    {p.roi >= 0 ? "+" : ""}{p.roi.toFixed(2)}%
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: p.status === "Win" ? C.green : C.red }}>
                      {p.status === "Win" ? "🏆" : "📉"} {p.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════ PROFILE CONTEXT ═══════════════════════ */
const ProfileContext = createContext();
const useProfile = () => useContext(ProfileContext);

/* Clickable trader name — used across all tabs */
const TraderLink = ({ name, children }) => {
  const { openProfile } = useProfile();
  const trader = mockTraders.find(t => t.name === name);
  if (!trader) return children || <span>{name}</span>;
  return (
    <span onClick={(e) => { e.stopPropagation(); openProfile(trader); }} style={{ cursor: "pointer", color: C.text, fontWeight: "600", borderBottom: `1px dashed ${C.purple}40`, transition: "color 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.color = C.purple; }}
      onMouseLeave={e => { e.currentTarget.style.color = C.text; }}
    >{children || <>{trader.avatar} {trader.name}</>}</span>
  );
};

/* ═══════════════════════ DATE CONTEXT ═══════════════════════ */
const DateContext = createContext();
const useDate = () => useContext(DateContext);

const dateRanges = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "1m", label: "1m" },
  { id: "3m", label: "3m" },
  { id: "6m", label: "6m" },
  { id: "1y", label: "1y" },
  { id: "ytd", label: "YTD" },
  { id: "all", label: "All" },
];

/* ═══════════════════════ MAIN APP ═══════════════════════ */
const App = () => {
  const [activeTab, setActiveTab] = useState("smc");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState("1m");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [profileTrader, setProfileTrader] = useState(null);

  const handlePresetClick = (id) => {
    setDateRange(id);
    setDateFrom("");
    setDateTo("");
  };
  const handleCustomDate = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
    if (from || to) setDateRange("custom");
  };
  const dateLabel = dateRange === "custom"
    ? (dateFrom && dateTo ? `${dateFrom.slice(5)} → ${dateTo.slice(5)}` : dateFrom ? `From ${dateFrom.slice(5)}` : `To ${dateTo.slice(5)}`)
    : (dateRanges.find(d => d.id === dateRange)?.label || "1m");

  const dateDropdownRef = useRef(null);
  useEffect(() => {
    if (!showDateDropdown) return;
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDateDropdown]);

  const openProfile = (trader) => setProfileTrader(trader);
  const closeProfile = () => setProfileTrader(null);

  const tabs = [
    { id: "smc", label: "Análisis SMC", icon: Crosshair },
    { id: "signals", label: "Señales", icon: Zap },
    { id: "traders", label: "Traders", icon: Users },
    { id: "heatmap", label: "Heatmap", icon: Layers },
    { id: "report", label: "Reporte", icon: Calendar },
    { id: "copy", label: "Copy Trading", icon: Copy },
    { id: "predictions", label: "Predictions", icon: Scale },
    { id: "football", label: "Football", icon: Gamepad2 },
  ];

  const tabContent = { smc: SMCAnalysis, signals: SignalsTab, traders: TradersTab, heatmap: HeatmapTab, report: ReportTab, copy: CopyTradingTab, predictions: PredictionMarketsTab, football: FootballTab };
  const ActiveComponent = tabContent[activeTab];
  const sideW = sidebarCollapsed ? 56 : 200;

  return (
    <ThemeProvider>
      <DateContext.Provider value={{ dateRange, setDateRange, dateFrom, dateTo, dateLabel }}>
        <ProfileContext.Provider value={{ openProfile, closeProfile, profileTrader }}>
        <div style={{ backgroundColor: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", display: "flex" }}>

          {/* ── Left Sidebar ── */}
          <aside style={{
            width: sideW, minHeight: "100vh", backgroundColor: C.card, borderRight: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 200,
            transition: "width 0.2s ease"
          }}>
            {/* Logo + collapse toggle */}
            <div style={{ height: 56, display: "flex", alignItems: "center", padding: sidebarCollapsed ? "0 12px" : "0 16px", borderBottom: `1px solid ${C.border}`, justifyContent: sidebarCollapsed ? "center" : "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                <div style={{ width: 12, height: 12, backgroundColor: C.purple, borderRadius: "50%", flexShrink: 0 }} />
                {!sidebarCollapsed && <span style={{ fontWeight: "800", fontSize: "16px", letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>Tradethlon</span>}
              </div>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <ChevronRight size={16} style={{ transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }} />
              </button>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setProfileTrader(null); }} title={sidebarCollapsed ? tab.label : undefined} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: sidebarCollapsed ? "10px 0" : "10px 12px",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    backgroundColor: isActive ? C.purpleBg : "transparent",
                    border: "none", borderRadius: "6px", cursor: "pointer",
                    color: isActive ? C.purple : C.textMuted,
                    fontSize: "13px", fontWeight: isActive ? "600" : "400",
                    transition: "all 0.15s", width: "100%"
                  }}>
                    <Icon size={18} />
                    {!sidebarCollapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tab.label}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Bottom section */}
            <div style={{ padding: "8px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "2px" }}>
              {[{ icon: Settings, label: "Settings" }, { icon: Bell, label: "Alerts" }].map(item => (
                <button key={item.label} title={sidebarCollapsed ? item.label : undefined} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: sidebarCollapsed ? "10px 0" : "10px 12px",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  backgroundColor: "transparent", border: "none", borderRadius: "6px",
                  cursor: "pointer", color: C.textMuted, fontSize: "13px", width: "100%"
                }}>
                  <item.icon size={18} />
                  {!sidebarCollapsed && item.label}
                </button>
              ))}
            </div>
          </aside>

          {/* ── Main Area ── */}
          <div style={{ flex: 1, marginLeft: sideW, transition: "margin-left 0.2s ease", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

            {/* Top Bar */}
            <header style={{ height: 56, position: "sticky", top: 0, zIndex: 100, backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
              {/* Left: Tab title */}
              <div style={{ fontSize: "16px", fontWeight: "700" }}>
                {profileTrader ? `${profileTrader.avatar} ${profileTrader.name}` : tabs.find(t => t.id === activeTab)?.label}
              </div>

              {/* Right: Unified date range selector + icons */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div ref={dateDropdownRef} style={{ position: "relative" }}>
                  <button onClick={() => setShowDateDropdown(!showDateDropdown)} style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px",
                    backgroundColor: C.bg, border: `1px solid ${showDateDropdown ? C.purple : C.border}`, borderRadius: "6px",
                    color: C.text, fontSize: "12px", fontWeight: "600", cursor: "pointer",
                    transition: "border-color 0.15s"
                  }}>
                    <Calendar size={14} color={C.purple} />
                    <span style={{ ...mono }}>{dateLabel}</span>
                    <ChevronDown size={14} color={C.textMuted} style={{ transform: showDateDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  </button>
                  {showDateDropdown && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", right: 0, backgroundColor: C.card,
                      border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px",
                      minWidth: "340px", zIndex: 300, boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                      display: "flex", flexDirection: "column", gap: "14px"
                    }}>
                      {/* Presets grid */}
                      <div>
                        <div style={{ fontSize: "10px", color: C.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Quick Select</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                          {dateRanges.map(dr => (
                            <button key={dr.id} onClick={() => { handlePresetClick(dr.id); setShowDateDropdown(false); }} style={{
                              padding: "8px 0", textAlign: "center",
                              backgroundColor: dateRange === dr.id ? C.purpleBg : C.bg,
                              border: `1px solid ${dateRange === dr.id ? C.purple : C.border}`,
                              borderRadius: "6px", cursor: "pointer",
                              color: dateRange === dr.id ? C.purple : C.text,
                              fontSize: "12px", fontWeight: dateRange === dr.id ? "700" : "500",
                              transition: "all 0.15s", ...mono
                            }}>{dr.label}</button>
                          ))}
                        </div>
                      </div>

                      {/* Separator */}
                      <div style={{ height: "1px", backgroundColor: C.border }} />

                      {/* Custom range */}
                      <div>
                        <div style={{ fontSize: "10px", color: C.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Custom Range</div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>From</div>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => handleCustomDate(e.target.value, dateTo)}
                              style={{
                                width: "100%", padding: "8px 10px", borderRadius: "6px",
                                border: `1px solid ${dateRange === "custom" ? C.purple + "60" : C.border}`,
                                backgroundColor: C.bg, color: C.text, fontSize: "12px",
                                fontFamily: "inherit", cursor: "pointer", outline: "none",
                              }}
                            />
                          </div>
                          <div style={{ color: C.textFaint, marginTop: "16px", fontSize: "14px" }}>→</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>To</div>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => handleCustomDate(dateFrom, e.target.value)}
                              style={{
                                width: "100%", padding: "8px 10px", borderRadius: "6px",
                                border: `1px solid ${dateRange === "custom" ? C.purple + "60" : C.border}`,
                                backgroundColor: C.bg, color: C.text, fontSize: "12px",
                                fontFamily: "inherit", cursor: "pointer", outline: "none",
                              }}
                            />
                          </div>
                        </div>
                        {dateRange === "custom" && dateFrom && dateTo && (
                          <button onClick={() => setShowDateDropdown(false)} style={{
                            width: "100%", marginTop: "10px", padding: "8px", borderRadius: "6px",
                            backgroundColor: C.purpleBg, border: `1px solid ${C.purple}`,
                            color: C.purple, fontSize: "12px", fontWeight: "600", cursor: "pointer",
                          }}>Apply</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Search */}
                <button style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
                  <Search size={17} />
                </button>
              </div>
            </header>

            {/* Live PnL Ticker */}
            <LivePnLTicker />

            {/* Content */}
            <main style={{ flex: 1, padding: "24px", maxWidth: "1400px", width: "100%" }}>
              {profileTrader ? <TraderProfile trader={profileTrader} onClose={closeProfile} /> : <ActiveComponent />}
            </main>

            {/* Footer - Live Stats Bar */}
            <footer style={{ height: 36, backgroundColor: C.card, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", color: C.text, fontSize: "11px", fontWeight: "600", ...mono, justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🏆</span>
                  <span>Season 1 Active</span>
                </div>
                <div style={{ width: "1px", height: 20, backgroundColor: C.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>👥</span>
                  <span>{mockTraders.length.toLocaleString()} Traders</span>
                </div>
                <div style={{ width: "1px", height: 20, backgroundColor: C.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📊</span>
                  <span style={{ color: C.green }}>$2.4M Volume Today</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ width: "1px", height: 20, backgroundColor: C.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🔥</span>
                  <span>47 Active Signals</span>
                </div>
                <div style={{ width: "1px", height: 20, backgroundColor: C.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>⚡</span>
                  <span>Last Trade: 12s ago</span>
                </div>
              </div>
            </footer>
          </div>

        </div>
        </ProfileContext.Provider>
      </DateContext.Provider>
    </ThemeProvider>
  );
};

export default App;
