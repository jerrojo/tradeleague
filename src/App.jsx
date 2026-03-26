import { useState, useMemo, useCallback, useRef, useEffect, createContext, useContext } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie, Customized
} from "recharts";
import {
  Settings, Bell, TrendingUp, TrendingDown, Target,
  AlertTriangle, CheckCircle, Clock, Zap, Shield, Trophy, Users,
  Activity, BarChart3, Circle, Calendar, Filter, Search, Star,
  ChevronDown, ChevronRight, Eye, Lock, Copy, RefreshCw, Crosshair,
  Layers, GitBranch, Cpu, Bot, Gamepad2, ArrowUp, ArrowDown, Flame, Award,
  DollarSign, ToggleLeft, ToggleRight, Percent, Scale, Play, Pause, Power,
  MessageCircle, ThumbsUp, ThumbsDown, Radio, Heart, Lightbulb,
  X, ExternalLink, Bookmark, BellRing, Home
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

const cardStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "12px" };
const thStyle = { padding: "10px 12px", textAlign: "left", color: C.textMuted, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.border}` };
const tdStyle = { padding: "10px 12px", fontSize: "12px", borderBottom: `1px solid ${C.border}` };

const StatCard = ({ label, value, sub, icon: Icon, color = C.blue, tip }) => (
  <div style={{ ...cardStyle, display: "flex", alignItems: "flex-start", gap: "12px" }}>
    <div style={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "2px" }}>
        {tip ? <InfoTip k={tip}><span>{label}</span></InfoTip> : label}
      </div>
      <div style={{ fontSize: "18px", fontWeight: "700", ...mono }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: typeof sub === "string" && sub.startsWith("+") ? C.green : typeof sub === "string" && sub.startsWith("-") ? C.red : C.textMuted, marginTop: "2px" }}>{sub}</div>}
    </div>
  </div>
);

const Tag = ({ text, color = C.purple }) => <span style={pillStyle(color)}>{text}</span>;

/* ── InfoTip: hover tooltip explaining jargon in plain language ── */
const GLOSSARY = {
  // SMC Analysis
  bias:           "¿Hacia dónde se mueve? BULLISH = sube, BEARISH = baja",
  confluence:     "Fuerza de la señal: cuántas pruebas coinciden (más = más confiable)",
  riskLevel:      "Qué tan arriesgado es operar ahora. LOW = seguro, HIGH = peligroso",
  bos:            "Break of Structure — el precio rompió un nivel clave, señal de que la tendencia sigue",
  choch:          "Change of Character — el precio cambió de dirección, posible reversión",
  fvg:            "Fair Value Gap — un hueco en el precio que suele rellenarse. Filled = ya se llenó",
  ob:             "Order Block — zona donde los grandes jugadores pusieron órdenes. El precio tiende a volver ahí",
  liquidity:      "Liquidez — zonas donde hay muchas órdenes pendientes que el mercado busca capturar",
  killZone:       "Horarios donde el mercado se mueve más fuerte. Mejor momento para operar",
  entryZone:      "Rango de precio ideal para entrar a la operación",
  rr:             "Risk:Reward — por cada $1 que arriesgas, cuánto puedes ganar. 1:2.8 = ganas $2.80 por cada $1",
  tp:             "Take Profit — precio al que cierras la operación para asegurar ganancia",
  sl:             "Stop Loss — precio al que cierras para cortar pérdidas. Tu seguro contra desastres",
  fundingRate:    "Tasa que pagan los traders apalancados. Si es muy alta, el mercado puede revertir",
  openInterest:   "Cuánto dinero hay apostado en contratos. Subida fuerte = movimiento grande viene",
  // Trader metrics
  alpha:          "Puntuación total de rendimiento (0-100). Combina win rate, consistencia y manejo de riesgo",
  sharpe:         "Ratio Sharpe — ganancia ajustada por riesgo. Más de 2.0 = excelente, menos de 1.0 = regular",
  maxDD:          "Máxima Caída — la peor racha de pérdidas en porcentaje. Mientras menos, mejor",
  profitFactor:   "Por cada $1 perdido, cuánto ganó. 2.0 = ganó el doble de lo que perdió",
  winRate:        "Porcentaje de operaciones ganadoras. 70%+ = muy bueno",
  streak:         "Rachas — operaciones ganadoras seguidas. Más largo = más en racha",
  copiers:        "Personas que copian automáticamente las operaciones de este trader",
  aum:            "Assets Under Management — dinero total que otros confían a este trader",
  perfFee:        "Comisión que cobra el trader sobre tus ganancias. 15% = de cada $100 que ganes, paga $15",
  leverage:       "Apalancamiento — multiplica ganancias Y pérdidas. 5x = 5 veces más potente (y más riesgoso)",
  degen:          "Nivel de agresividad del trader. Degen = arriesgado y rápido. Safe = conservador y tranquilo",
  // Signals
  signalActive:   "Señal que sigue activa — el trader aún tiene esta operación abierta",
  tpHit:          "Take Profit alcanzado — la operación cerró en ganancia",
  slHit:          "Stop Loss alcanzado — la operación cerró en pérdida",
  // Predictions
  odds:           "Probabilidad según el mercado. 38% YES = la mayoría cree que NO va a pasar",
  pot:            "Dinero total apostado en esta predicción. Se reparte entre los ganadores",
};

const InfoTip = ({ k, children, inline = false }) => {
  const [show, setShow] = useState(false);
  const text = GLOSSARY[k];
  if (!text) return children || null;
  return (
    <span
      style={{ position: "relative", display: inline ? "inline-flex" : "inline-flex", alignItems: "center", gap: "3px", cursor: "help" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <span style={{
        width: 14, height: 14, borderRadius: "50%", backgroundColor: C.border, color: C.textMuted,
        fontSize: "9px", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0
      }}>?</span>
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          backgroundColor: "#1c2129", border: `1px solid ${C.borderLight}`, borderRadius: "8px",
          padding: "10px 14px", fontSize: "12px", color: C.text, lineHeight: "1.5",
          width: "260px", zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          pointerEvents: "none", fontWeight: "400", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          textTransform: "none", letterSpacing: "0"
        }}>{text}</span>
      )}
    </span>
  );
};


/* ── MiniSparkline: inline SVG sparkline for tables & cards ── */
const MiniSparkline = ({ data, width = 60, height = 20, color = C.green, showDot = true }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height - 4) - 2
  ]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const trend = data[data.length - 1] >= data[0] ? C.green : C.red;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={trend} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {showDot && <circle cx={last[0]} cy={last[1]} r="2" fill={trend} />}
    </svg>
  );
};

/* ── Alpha Score: composite "power rating" 0–100 (the metric traders obsess over) ── */
const calcAlphaScore = (t) => {
  const wrScore = Math.min(t.winRate / 100, 1) * 30;             // 30% weight: win rate
  const sharpeScore = Math.min((t.sharpe || 0) / 3, 1) * 25;     // 25% weight: risk-adjusted returns
  const streakScore = Math.min(t.streak / 20, 1) * 15;           // 15% weight: consistency streak
  const pfScore = Math.min((t.profitFactor || 0) / 3, 1) * 15;   // 15% weight: profit factor
  const ddScore = Math.max(0, 1 - Math.abs(t.maxDD || 0) / 25) * 15; // 15% weight: low drawdown
  return Math.round(wrScore + sharpeScore + streakScore + pfScore + ddScore);
};
const alphaColor = (score) => score >= 80 ? C.green : score >= 60 ? C.blue : score >= 40 ? C.amber : C.red;
const alphaLabel = (score) => score >= 90 ? "S+" : score >= 80 ? "S" : score >= 70 ? "A" : score >= 60 ? "B" : score >= 50 ? "C" : "D";

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
  { name: "Scalp King", avatar: "👑", winRate: 81, pnl: 156200, trades: 823, streak: 15, rank: 1, tier: "Diamond", isBot: false,
    badges: ["streakMachine","copyKing","sharpShooter","alphaLeaker","profitPrinter"], level: 48, xp: 8200, xpNext: 10000,
    radarData: [{s:"Timing",v:94},{s:"Risk",v:89},{s:"Entries",v:96},{s:"Exits",v:91},{s:"Consistency",v:93},{s:"Discipline",v:92}],
    sparkData: [12,15,14,18,22,19,25,28,24,31,29,35,33,38,36,42], viewersNow: 47,
    bio: "Full-time crypto trader since 2019. Specializing in BTC/ETH scalps with SMC methodology. Previously quant analyst at a prop firm.", location: "Miami, FL", joined: "Jan 2024", followers: 1842, following: 23, copiers: 567, sharpe: 2.1, maxDD: -8.2, avgRR: "1:2.8", avgHold: "4h", bestMonth: "+$42,300", worstMonth: "-$8,100", profitFactor: 2.4, favPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"], style: "Scalping", exchange: "Binance" },
  { name: "Crypto Ninja", avatar: "🥷", winRate: 78, pnl: 125400, trades: 456, streak: 12, rank: 2, tier: "Diamond", isBot: false,
    badges: ["diamondHands","wagmi","sharpShooter","liqHunter"], level: 45, xp: 6500, xpNext: 10000,
    radarData: [{s:"Timing",v:92},{s:"Risk",v:88},{s:"Entries",v:95},{s:"Exits",v:85},{s:"Consistency",v:91},{s:"Discipline",v:89}],
    sparkData: [10,8,12,15,13,18,16,22,20,26,24,28,27,30,29,33], viewersNow: 32,
    bio: "Swing trader focused on altcoins. I use order flow analysis and smart money concepts to find high-probability setups.", location: "Tokyo, Japan", joined: "Mar 2024", followers: 1234, following: 45, copiers: 389, sharpe: 1.9, maxDD: -11.5, avgRR: "1:3.2", avgHold: "8h", bestMonth: "+$38,500", worstMonth: "-$12,400", profitFactor: 2.1, favPairs: ["BTC/USDT", "XRP/USDT", "BNB/USDT"], style: "Swing", exchange: "Bybit" },
  { name: "Smart Money", avatar: "💼", winRate: 76, pnl: 112300, trades: 567, streak: 10, rank: 3, tier: "Platinum", isBot: true,
    badges: ["ironNerves","riskDjinn","profitPrinter","diamondHands"], level: 42, xp: 5100, xpNext: 10000,
    radarData: [{s:"Timing",v:89},{s:"Risk",v:86},{s:"Entries",v:91},{s:"Exits",v:88},{s:"Consistency",v:87},{s:"Discipline",v:85}],
    sparkData: [8,10,11,14,16,15,18,20,19,22,24,23,26,28,27,30], viewersNow: 28,
    bio: "Conservative position trader. Low drawdown, consistent returns. Former hedge fund analyst. Risk management is everything.", location: "London, UK", joined: "Feb 2024", followers: 892, following: 12, copiers: 234, sharpe: 2.4, maxDD: -5.8, avgRR: "1:2.4", avgHold: "1d", bestMonth: "+$28,900", worstMonth: "-$5,200", profitFactor: 2.8, favPairs: ["BTC/USDT", "ETH/USDT", "AVAX/USDT"], style: "Position", exchange: "Binance" },
  { name: "Phoenix Rise", avatar: "🔥", winRate: 73, pnl: 104200, trades: 523, streak: 11, rank: 4, tier: "Platinum", isBot: false,
    badges: ["moonShot","degenGod","earlyApe"], level: 39, xp: 4200, xpNext: 10000,
    radarData: [{s:"Timing",v:86},{s:"Risk",v:83},{s:"Entries",v:89},{s:"Exits",v:85},{s:"Consistency",v:86},{s:"Discipline",v:84}],
    sparkData: [5,12,8,20,15,28,22,35,18,40,30,25,38,45,32,48], viewersNow: 19,
    bio: "Aggressive intraday trader. High risk, high reward. Specializing in momentum plays during NY session.", location: "New York, NY", joined: "Apr 2024", followers: 567, following: 34, copiers: 178, sharpe: 1.6, maxDD: -18.4, avgRR: "1:3.8", avgHold: "2h", bestMonth: "+$52,100", worstMonth: "-$19,800", profitFactor: 1.7, favPairs: ["SOL/USDT", "BTC/USDT", "DOGE/USDT"], style: "Day Trading", exchange: "Bitget" },
  { name: "Bull Master", avatar: "🐂", winRate: 72, pnl: 98500, trades: 342, streak: 8, rank: 5, tier: "Gold", isBot: true,
    badges: ["diamondHands","wagmi"], level: 35, xp: 3800, xpNext: 10000,
    radarData: [{s:"Timing",v:85},{s:"Risk",v:80},{s:"Entries",v:88},{s:"Exits",v:82},{s:"Consistency",v:84},{s:"Discipline",v:81}],
    sparkData: [6,8,7,11,10,14,13,16,15,18,17,20,19,22,21,24], viewersNow: 14,
    bio: "Long-only conviction trader. I find the trend and ride it. Patient entries, wide stops, massive targets.", location: "Dubai, UAE", joined: "May 2024", followers: 456, following: 28, copiers: 145, sharpe: 1.8, maxDD: -12.1, avgRR: "1:4.2", avgHold: "3d", bestMonth: "+$31,200", worstMonth: "-$11,500", profitFactor: 1.9, favPairs: ["BTC/USDT", "ETH/USDT"], style: "Swing", exchange: "Binance" },
  { name: "Rocket Launch", avatar: "🚀", winRate: 70, pnl: 89600, trades: 445, streak: 9, rank: 6, tier: "Gold", isBot: false,
    badges: ["earlyApe","whaleSpotter"], level: 32, xp: 2900, xpNext: 10000,
    radarData: [{s:"Timing",v:82},{s:"Risk",v:78},{s:"Entries",v:85},{s:"Exits",v:80},{s:"Consistency",v:81},{s:"Discipline",v:79}],
    sparkData: [4,7,5,10,8,14,11,18,13,20,16,22,19,24,21,26], viewersNow: 11,
    bio: "Breakout specialist. Scanning for volume surges and structural breaks. Trading crypto full-time since the 2021 bull run.", location: "Berlin, Germany", joined: "Jun 2024", followers: 345, following: 56, copiers: 98, sharpe: 1.5, maxDD: -14.8, avgRR: "1:2.6", avgHold: "6h", bestMonth: "+$24,800", worstMonth: "-$13,200", profitFactor: 1.6, favPairs: ["BTC/USDT", "SOL/USDT", "AVAX/USDT"], style: "Breakout", exchange: "Bybit" },
  { name: "Iron Fist", avatar: "👊", winRate: 68, pnl: 72400, trades: 389, streak: 7, rank: 7, tier: "Silver", isBot: true,
    badges: ["liqHunter"], level: 28, xp: 1800, xpNext: 10000,
    radarData: [{s:"Timing",v:75},{s:"Risk",v:70},{s:"Entries",v:77},{s:"Exits",v:72},{s:"Consistency",v:73},{s:"Discipline",v:71}],
    sparkData: [3,5,4,6,5,8,7,10,8,12,9,11,10,13,11,14], viewersNow: 6,
    bio: "Grinding every day. Learning from the best. Focused on improving my discipline and risk management.", location: "Bogota, Colombia", joined: "Jul 2024", followers: 189, following: 67, copiers: 42, sharpe: 1.3, maxDD: -16.5, avgRR: "1:2.0", avgHold: "5h", bestMonth: "+$18,400", worstMonth: "-$9,800", profitFactor: 1.4, favPairs: ["BTC/USDT", "ETH/USDT", "XRP/USDT"], style: "Scalping", exchange: "Binance" },
  { name: "Wave Rider", avatar: "🏄", winRate: 65, pnl: 45800, trades: 234, streak: 5, rank: 8, tier: "Silver", isBot: false,
    badges: ["ctInfluencer"], level: 18, xp: 4200, xpNext: 10000,
    radarData: [{s:"Timing",v:78},{s:"Risk",v:72},{s:"Entries",v:80},{s:"Exits",v:75},{s:"Consistency",v:76},{s:"Discipline",v:74}],
    sparkData: [2,4,3,5,4,3,5,7,6,8,5,7,6,9,7,10], viewersNow: 3,
    bio: "Part-time trader, full-time surfer. Catching waves in the market like I catch them in the ocean. Chill entries only.", location: "Bali, Indonesia", joined: "Aug 2024", followers: 123, following: 89, copiers: 28, sharpe: 1.1, maxDD: -20.2, avgRR: "1:1.8", avgHold: "12h", bestMonth: "+$14,600", worstMonth: "-$11,200", profitFactor: 1.2, favPairs: ["BTC/USDT", "SOL/USDT"], style: "Swing", exchange: "Bitget" },
];

/* Trader social links */
const traderSocials = {
  "Scalp King": { twitter: "@ScalpKing", discord: "ScalpKing#1234", telegram: "t.me/scalpking", youtube: "ScalpKingTV" },
  "Crypto Ninja": { twitter: "@CryptoNinja_", discord: "CryptoNinja#5678", telegram: "t.me/cryptoninja" },
  "Smart Money": { twitter: "@SmartMoneyBot", discord: "SmartMoney#9012", website: "smartmoney.trade" },
  "Phoenix Rise": { twitter: "@PhoenixRise", discord: "PhoenixRise#3456", telegram: "t.me/phoenixrise", youtube: "PhoenixRiseTrader" },
  "Bull Master": { twitter: "@BullMasterBot", discord: "BullMaster#7890" },
  "Rocket Launch": { twitter: "@RocketLaunch_", discord: "RocketLaunch#2345", telegram: "t.me/rocketlaunch" },
  "Iron Fist": { discord: "IronFist#6789", telegram: "t.me/ironfist" },
  "Wave Rider": { twitter: "@WaveRider_Bali", discord: "WaveRider#0123", youtube: "WaveRiderCrypto" },
};

/* Per-trader deep data */
const traderDeepData = (() => {
  const data = {};
  const pairs = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","AVAX/USDT","DOGE/USDT","ADA/USDT"];
  const platforms = ["twitter","discord","reddit","tradehub","telegram","whatsapp"];
  const platIcons = { twitter: "𝕏", discord: "DC", reddit: "R", tradehub: "TH", telegram: "TG", whatsapp: "WA" };
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
  // Staggered start days — not all traders have full 30-day history
  const startDay = [1, 1, 3, 1, 5, 8, 1, 12];
  const data = [];
  for (let d = 1; d <= 30; d++) {
    const point = { day: d };
    names.forEach((name, i) => {
      if (d < startDay[i]) { point[name] = null; return; }
      const base = seeds[i];
      const activeDays = d - startDay[i] + 1;
      const totalActive = 30 - startDay[i] + 1;
      const growth = (activeDays / totalActive) * base;
      const noise = Math.sin(d * (i + 1) * 0.7) * base * 0.08 + Math.cos(d * 0.3 * (i + 1)) * base * 0.05;
      // Some traders have drawdown periods
      const drawdown = (i === 4 && d >= 14 && d <= 18) ? -base * 0.15 : (i === 7 && d >= 20 && d <= 24) ? -base * 0.2 : 0;
      point[name] = Math.round(growth + noise + drawdown);
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

/* ── BotTag: visual distinction for bots vs humans ── */
const tagBase = { display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: "700", padding: "1px 6px", borderRadius: "3px" };
const BotTag = ({ isBot }) => isBot ? (
  <span style={{ ...tagBase, color: C.cyan, backgroundColor: `${C.cyan}15`, border: `1px solid ${C.cyan}30` }}>
    <Bot size={9} /> BOT
  </span>
) : (
  <span style={{ ...tagBase, color: C.green, backgroundColor: C.greenBg, border: `1px solid ${C.green}30` }}>
    <Users size={9} /> HUMAN
  </span>
);

/* ── TP Progress Bar: thin inline bar ── */
const TpProgressBar = ({ entry, tp, sl, status }) => {
  if (status !== "active") return null;
  const isLong = tp > entry;
  const currentPrice = isLong ? entry + (tp - entry) * (0.3 + Math.random() * 0.5) : entry - (entry - tp) * (0.3 + Math.random() * 0.5);
  const pct = Math.round(Math.min(1, Math.max(0, Math.abs(currentPrice - entry) / Math.abs(tp - entry))) * 100);
  const barColor = pct > 70 ? C.green : pct > 40 ? C.amber : C.blue;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
      <div style={{ flex: 1, height: "2px", backgroundColor: C.border, borderRadius: "1px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: barColor, borderRadius: "1px" }} />
      </div>
      <span style={{ fontSize: "9px", fontWeight: "700", color: barColor, ...mono, whiteSpace: "nowrap" }}>{pct}% TP</span>
    </div>
  );
};

/* ── Community Vote: a favor / en contra on cards ── */
const CommunityVote = ({ itemId, votesState, setVotesState }) => {
  const v = votesState[itemId] || { up: Math.floor(Math.random() * 40 + 10), down: Math.floor(Math.random() * 15 + 2), myVote: null };
  const total = v.up + v.down;
  const upPct = total > 0 ? Math.round((v.up / total) * 100) : 50;
  const vote = (side) => {
    setVotesState(prev => {
      const cur = { ...(prev[itemId] || v) };
      if (cur.myVote === side) { cur[side]--; cur.myVote = null; }
      else { if (cur.myVote) cur[cur.myVote]--; cur[side]++; cur.myVote = side; }
      return { ...prev, [itemId]: cur };
    });
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <button onClick={() => vote("up")} style={{
        display: "flex", alignItems: "center", gap: "3px", padding: "2px 8px", borderRadius: "4px",
        border: `1px solid ${v.myVote === "up" ? C.green : C.border}`,
        backgroundColor: v.myVote === "up" ? C.greenBg : "transparent",
        color: v.myVote === "up" ? C.green : C.textMuted, cursor: "pointer", fontSize: "10px", fontWeight: "600",
      }}>
        <ThumbsUp size={10} /> <span style={mono}>{v.up}</span>
      </button>
      <div style={{ flex: 1, height: "2px", backgroundColor: C.border, borderRadius: "1px", overflow: "hidden", display: "flex", maxWidth: "60px" }}>
        <div style={{ width: `${upPct}%`, height: "100%", backgroundColor: C.green }} />
        <div style={{ width: `${100 - upPct}%`, height: "100%", backgroundColor: C.red }} />
      </div>
      <button onClick={() => vote("down")} style={{
        display: "flex", alignItems: "center", gap: "3px", padding: "2px 8px", borderRadius: "4px",
        border: `1px solid ${v.myVote === "down" ? C.red : C.border}`,
        backgroundColor: v.myVote === "down" ? C.redBg : "transparent",
        color: v.myVote === "down" ? C.red : C.textMuted, cursor: "pointer", fontSize: "10px", fontWeight: "600",
      }}>
        <ThumbsDown size={10} /> <span style={mono}>{v.down}</span>
      </button>
    </div>
  );
};

/* ── Toast Notification System ── */
const ToastContext = createContext();
const useToast = () => useContext(ToastContext);
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const colors = { success: C.green, error: C.red, info: C.blue, warning: C.amber, achievement: C.purple };
  const icons = { success: "+", error: "x", info: "i", warning: "!", achievement: "*" };
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: "fixed", top: 44, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "12px 18px",
            backgroundColor: C.card, border: `1px solid ${colors[t.type]}40`, borderLeft: `3px solid ${colors[t.type]}`,
            borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", fontSize: "12px", fontWeight: "600",
            color: C.text, maxWidth: "360px", pointerEvents: "auto",
            animation: "toastSlideIn 0.3s ease"
          }}>
            <span style={{ fontSize: "16px" }}>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ── Live Feed Data (the social heart) ── */
const feedItems = (() => {
  const items = [];
  let id = 1;
  // Trade events from all traders
  mockTraders.forEach((t, ti) => {
    const pairs = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT"];
    for (let i = 0; i < 3; i++) {
      const isWin = Math.random() < (t.winRate / 100);
      const type = Math.random() > 0.45 ? "LONG" : "SHORT";
      const pair = pairs[(ti + i) % pairs.length];
      const entry = pair.startsWith("BTC") ? 67000 + Math.random() * 2000 : pair.startsWith("ETH") ? 3400 + Math.random() * 200 : 50 + Math.random() * 100;
      const pnl = isWin ? Math.round(400 + Math.random() * 4000) : -Math.round(200 + Math.random() * 2000);
      const tp = Math.round((entry * (type === "LONG" ? 1.025 : 0.975)) * 100) / 100;
      const sl = Math.round((entry * (type === "LONG" ? 0.99 : 1.01)) * 100) / 100;
      const status = i === 0 ? "active" : isWin ? "tp_hit" : "sl_hit";
      const minsAgo = ti * 12 + i * 25 + Math.floor(Math.random() * 15);
      items.push({
        id: id++, kind: "trade", trader: t.name, avatar: t.avatar, isBot: t.isBot, tier: t.tier,
        pair, type, entry: Math.round(entry * 100) / 100, tp, sl, pnl, status,
        leverage: ["3x","5x","10x","2x","4x"][(ti+i)%5],
        analysis: isWin
          ? ["OB + FVG confluence en zona clave. Entrada limpia.", "Liquidez barrida + desplazamiento fuerte. Confluencia alta.", "BOS confirmado en 1H con volumen. Momentum a favor.", "Retest de Order Block + estructura intacta. Setup A+."][((ti*3+i)*7)%4]
          : ["Fakeout sobre resistencia. Mercado lateral.", "PA choppy sin dirección clara. Entré sin confirmación.", "Entré contra el bias de timeframe mayor.", "Perdí la killzone, volumen bajo."][((ti*3+i)*7)%4],
        time: minsAgo < 60 ? `${minsAgo}m` : `${Math.floor(minsAgo/60)}h`,
        timestamp: Date.now() - minsAgo * 60000, copiers: Math.floor(Math.random() * 50 + 5),
      });
    }
  });
  // Prediction events — multiple traders predict on same questions, ordered by who called it first
  const predQuestions = [
    { q: "BTC > $80K antes de Junio?", participants: [0, 2, 1, 4] },
    { q: "Fed baja tasas en Mayo?", participants: [1, 3, 0] },
    { q: "SOL flippea BNB Q2?", participants: [2, 0, 5] },
    { q: "ETH +10% esta semana?", participants: [3, 1, 6] },
  ];
  predQuestions.forEach((pq, qi) => {
    pq.participants.forEach((ti, order) => {
      const t = mockTraders[ti];
      if (!t) return;
      const minsAgo = 30 + qi * 25 + order * 8 + Math.floor(Math.random() * 5);
      items.push({
        id: id++, kind: "prediction", trader: t.name, avatar: t.avatar, isBot: t.isBot, tier: t.tier,
        question: pq.q,
        bet: (ti + qi) % 2 === 0 ? "YES" : "NO", stake: 200 + order * 50 + qi * 80, odds: [38, 72, 61, 44][qi],
        time: minsAgo < 60 ? `${minsAgo}m` : `${Math.floor(minsAgo / 60)}h`,
        timestamp: Date.now() - minsAgo * 60000,
        predOrder: order + 1, // 1 = first to predict
        totalPredictors: pq.participants.length,
        questionId: qi,
      });
    });
  });
  // Signal events — trade ideas shared BEFORE executing (alerts/tips)
  const signalSetups = [
    { pair: "BTC/USDT", bias: "LONG", idea: "OB diario en $66.8K con FVG sin mitigar. Espero barrido de liquidez para entrada.", conf: 85, tf: "4H" },
    { pair: "ETH/USDT", bias: "SHORT", idea: "Divergencia bajista en RSI + rechazo en zona premium. Posible drop a $3.2K.", conf: 72, tf: "1H" },
    { pair: "SOL/USDT", bias: "LONG", idea: "Acumulación Wyckoff en rango. Spring confirmado, buscando markup.", conf: 78, tf: "1D" },
    { pair: "BNB/USDT", bias: "SHORT", idea: "Distribución en HTF. BOS bajista en 4H con volumen decreciente.", conf: 65, tf: "4H" },
    { pair: "XRP/USDT", bias: "LONG", idea: "Zona de demanda institucional + confluencia con MA200. Setup de alta probabilidad.", conf: 90, tf: "1D" },
    { pair: "BTC/USDT", bias: "SHORT", idea: "Resistencia semanal + sobrecomprado en múltiples TFs. Veo corrección.", conf: 68, tf: "1W" },
  ];
  mockTraders.slice(0, 6).forEach((t, i) => {
    const s = signalSetups[i];
    const minsAgo = 5 + i * 18 + Math.floor(Math.random() * 10);
    items.push({
      id: id++, kind: "signal", trader: t.name, avatar: t.avatar, isBot: t.isBot, tier: t.tier,
      pair: s.pair, bias: s.bias, idea: s.idea, confidence: s.conf, timeframe: s.tf,
      time: minsAgo < 60 ? `${minsAgo}m` : `${Math.floor(minsAgo / 60)}h`,
      timestamp: Date.now() - minsAgo * 60000,
    });
  });

  // Achievement events
  mockTraders.slice(0, 3).forEach((t, i) => {
    const ach = [ACHIEVEMENTS.streakMachine, ACHIEVEMENTS.sharpShooter, ACHIEVEMENTS.diamondHands][i];
    items.push({
      id: id++, kind: "achievement", trader: t.name, avatar: t.avatar, isBot: t.isBot, tier: t.tier,
      achievement: ach, time: `${1 + i}h`, timestamp: Date.now() - (1 + i) * 3600000,
    });
  });
  // Whale alerts
  items.push(
    { id: id++, kind: "whale", text: "$3.2M BTC LONG abierto en Binance", time: "8m", timestamp: Date.now() - 480000 },
    { id: id++, kind: "liquidation", text: "$1.2M en SHORTS liquidados — bears rekt", time: "22m", timestamp: Date.now() - 1320000 },
  );
  return items.sort((a, b) => b.timestamp - a.timestamp);
})();

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
  const [coinPickerOpen, setCoinPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const { dateLabel: globalDateLabel } = useDate();
  const coin = smcCoins[selectedCoin];
  const coinPickerRef = useRef(null);

  const categories = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "AI"];

  const filteredCoins = useMemo(() => Object.keys(smcCoins).filter(ticker => {
    const matchesSearch = ticker.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || smcCoins[ticker].category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort(), [searchQuery, categoryFilter]);

  useEffect(() => {
    if (!coinPickerOpen) return;
    const handler = (e) => { if (coinPickerRef.current && !coinPickerRef.current.contains(e.target)) setCoinPickerOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [coinPickerOpen]);

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
      {/* ── Coin Selector: inline active coin + dropdown picker ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        {/* Active coin display */}
        <div ref={coinPickerRef} style={{ position: "relative" }}>
          <button onClick={() => { setCoinPickerOpen(!coinPickerOpen); setSearchQuery(""); }} style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px",
            backgroundColor: C.card, border: `1px solid ${coinPickerOpen ? C.purple : C.border}`,
            borderRadius: "8px", cursor: "pointer", transition: "border-color 0.15s"
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: "20px", fontWeight: "800", color: C.text, ...mono }}>{selectedCoin}</span>
              <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: "500" }}>/{coin.pair}</span>
            </div>
            <div style={{ width: "1px", height: "24px", backgroundColor: C.border }} />
            <span style={{ fontSize: "16px", fontWeight: "700", color: C.text, ...mono }}>{coin.price}</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: coin.change.startsWith("+") ? C.green : C.red, ...mono }}>{coin.change}</span>
            <div style={{ width: "1px", height: "24px", backgroundColor: C.border }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: biasColor, textTransform: "uppercase" }}>{coin.bias}</span>
            <ChevronDown size={16} color={C.textMuted} style={{ transform: coinPickerOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: "4px" }} />
          </button>

          {/* Dropdown picker */}
          {coinPickerOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300,
              backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "10px",
              width: "420px", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", overflow: "hidden"
            }}>
              {/* Search */}
              <div style={{ padding: "12px 12px 8px", position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "22px", top: "22px", color: C.textMuted }} />
                <input
                  type="text" placeholder="Search coins..." value={searchQuery} autoFocus
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px 8px 32px", borderRadius: "6px",
                    border: `1px solid ${C.border}`, backgroundColor: C.bg, color: C.text,
                    fontSize: "12px", fontFamily: "inherit", outline: "none",
                  }}
                />
              </div>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: "2px", padding: "0 12px 8px", borderBottom: `1px solid ${C.border}` }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                    padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                    border: "none", backgroundColor: categoryFilter === cat ? C.purpleBg : "transparent",
                    color: categoryFilter === cat ? C.purple : C.textMuted,
                  }}>{cat}</button>
                ))}
              </div>
              {/* Coin list */}
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {filteredCoins.map(c => {
                  const cd = smcCoins[c];
                  const isSelected = selectedCoin === c;
                  return (
                    <button key={c} onClick={() => { setSelectedCoin(c); setCoinPickerOpen(false); }} style={{
                      display: "flex", alignItems: "center", width: "100%", padding: "8px 14px",
                      border: "none", cursor: "pointer", gap: "12px",
                      backgroundColor: isSelected ? C.purpleBg : "transparent",
                      borderLeft: isSelected ? `3px solid ${C.purple}` : "3px solid transparent",
                    }}>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: isSelected ? C.purple : C.text }}>{c}</span>
                        <span style={{ fontSize: "10px", color: C.textFaint, marginLeft: "2px" }}>/{cd.pair}</span>
                        <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "8px" }}>{cd.category}</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: C.text, ...mono, minWidth: "80px", textAlign: "right" }}>{cd.price}</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", minWidth: "50px", textAlign: "right", ...mono,
                        color: cd.change.startsWith("+") ? C.green : C.red
                      }}>{cd.change}</span>
                    </button>
                  );
                })}
                {filteredCoins.length === 0 && (
                  <div style={{ padding: "20px", textAlign: "center", color: C.textMuted, fontSize: "12px" }}>No coins found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick-switch: top coins with performance */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["BTC","ETH","SOL","BNB","XRP","DOGE","AVAX","ADA"].map(c => {
            const cd = smcCoins[c];
            const isUp = cd.change.startsWith("+");
            const isActive = selectedCoin === c;
            return (
              <button key={c} onClick={() => setSelectedCoin(c)} style={{
                padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                border: `1px solid ${isActive ? C.purple : C.border}`,
                backgroundColor: isActive ? C.purpleBg : "transparent",
                color: isActive ? C.purple : C.text,
                transition: "all 0.15s ease",
                ...mono
              }}>
                <span>{c}</span>
                <span style={{
                  fontSize: "9px", fontWeight: "700",
                  color: isUp ? C.green : C.red,
                  backgroundColor: isUp ? C.greenBg : C.redBg,
                  padding: "1px 4px", borderRadius: "3px"
                }}>{cd.change}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Precio Actual" value={coin.price} sub={coin.change} icon={TrendingUp} color={coin.change.startsWith("+") ? C.green : C.red} />
        <StatCard label="Dirección" value={coin.bias === "BULLISH" ? "↑ SUBE" : "↓ BAJA"} icon={coin.biasIcon === "up" ? ArrowUp : ArrowDown} color={biasColor} tip="bias" />
        <StatCard label="Fuerza de Señal" value={`${coin.confluence}/10`} icon={Target} color={C.blue} tip="confluence" />
        <StatCard label="Nivel de Riesgo" value={coin.risk === "LOW" ? "BAJO" : coin.risk === "MEDIUM" ? "MEDIO" : "ALTO"} icon={AlertTriangle} color={riskColor} tip="riskLevel" />
      </div>

      {/* Multi-Timeframe Grid */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Análisis Multi-Timeframe — {selectedCoin}/{coin.pair}</div>
        <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "10px" }}>Cada timeframe muestra lo que pasa en diferentes escalas de tiempo (minutos → horas)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {coin.tfData.map(tf => (
            <div key={tf.tf} style={cardStyle}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: C.purple, marginBottom: "12px" }}>{tf.tf === "15m" ? "15 min" : tf.tf === "1H" ? "1 hora" : "4 horas"}</div>
              {[
                ["Tendencia", tf.trend === "Bullish" ? "↑ Alcista" : tf.trend === "Bearish" ? "↓ Bajista" : "↔ Lateral", tf.trend === "Bullish" ? C.green : tf.trend === "Bearish" ? C.red : C.amber, null],
                ["Estructura", tf.struct, tf.struct === "BOS" ? C.green : C.red, tf.struct === "BOS" ? "bos" : "choch"],
                ["Bloque de Órdenes", tf.ob.includes("Bullish") ? "Compra" : "Venta", tf.ob.includes("Bullish") ? C.green : C.red, "ob"],
                ["Gap de Precio", tf.fvg === "Filled" ? "Llenado" : "Pendiente", tf.fvg === "Filled" ? C.green : C.amber, "fvg"],
                ["Liquidez", tf.liq === "Sweep Done" ? "✅ Capturada" : tf.liq, C.blue, "liquidity"],
              ].map(([label, val, clr, tipKey]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "11px", color: C.textMuted }}>
                    {tipKey ? <InfoTip k={tipKey} inline><span>{label}</span></InfoTip> : label}
                  </span>
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
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Entrada Ideal — {selectedCoin}</div>
          <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "14px" }}>Dónde entrar, cuánto puedes ganar, y dónde cortar pérdidas</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[
              ["Zona de Entrada", coin.entry.zone, C.text, "entryZone"],
              ["Riesgo:Ganancia", coin.entry.rr, C.green, "rr"],
              ["Objetivo 1", coin.entry.tp1, C.blue, "tp"],
              ["Objetivo 2", coin.entry.tp2, C.blue, "tp"],
              ["Objetivo 3", coin.entry.tp3, C.blue, "tp"],
              ["Stop Loss", coin.entry.sl, C.red, "sl"],
            ].map(([l, v, clr, tipKey]) => (
              <div key={l}>
                <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "2px" }}>
                  <InfoTip k={tipKey} inline><span>{l}</span></InfoTip>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: clr, ...mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px", fontWeight: "600" }}>
              <InfoTip k="confluence" inline><span>FACTORES DE CONFIRMACIÓN</span></InfoTip>
            </div>
            <div style={{ fontSize: "10px", color: C.textFaint, marginBottom: "8px" }}>Más factores = señal más confiable</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {coin.confluenceFactors.map(f => {
                const tipMap = { "Order Block": "ob", "FVG": "fvg", "Liquidity": "liquidity", "Kill Zone": "killZone", "BOS": "bos" };
                return (
                  <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: C.green, cursor: tipMap[f] ? "help" : "default" }}>
                    <CheckCircle size={12} />
                    {tipMap[f] ? <InfoTip k={tipMap[f]} inline><span>{f}</span></InfoTip> : f}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <InfoTip k="killZone" inline><span>Horarios Clave</span></InfoTip>
          </div>
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
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Chequeo de Seguridad — {selectedCoin}</div>
        <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "10px" }}>Indicadores que confirman si es seguro operar ahora</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {coin.safety.map(c => {
            const tipMap = { "Funding Rate": "fundingRate", "Open Interest": "openInterest" };
            const nameMap = { "Funding Rate": "Tasa de Fondeo", "Open Interest": "Interés Abierto", "Volume": "Volumen", "Correlation": "Correlación" };
            return (
              <div key={c.name} style={{ ...cardStyle, textAlign: "center" }}>
                {c.status === "pass" ? <CheckCircle size={22} color={C.green} /> : <AlertTriangle size={22} color={C.amber} />}
                <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "8px" }}>
                  {tipMap[c.name] ? <InfoTip k={tipMap[c.name]} inline><span>{nameMap[c.name] || c.name}</span></InfoTip> : (nameMap[c.name] || c.name)}
                </div>
                <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px", ...mono }}>{c.detail}</div>
                <div style={{ fontSize: "10px", color: c.status === "pass" ? C.green : C.amber, marginTop: "4px", textTransform: "uppercase", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>{c.status === "pass" ? <><CheckCircle size={10} /> OK</> : <><AlertTriangle size={10} /> Precaución</>}</div>
              </div>
            );
          })}
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

/* ═══════════════════════ TAB: HOME (Live Chart) ═══════════════════════ */
const HomeTab = () => {
  const { openProfile } = useProfile();
  const { setFeedFilter, setActiveTab } = useFeedFilter();
  const [selectedTrader, setSelectedTrader] = useState(mockTraders[0].name);
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [showTraderDD, setShowTraderDD] = useState(false);
  const [showPairDD, setShowPairDD] = useState(false);
  const [chartRange, setChartRange] = useState("1D");
  const traderDDRef = useRef(null);
  const pairDDRef = useRef(null);

  const allPairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "DOGE/USDT", "AVAX/USDT"];
  const ranges = ["1H", "4H", "1D", "1W", "1M"];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (traderDDRef.current && !traderDDRef.current.contains(e.target)) setShowTraderDD(false);
      if (pairDDRef.current && !pairDDRef.current.contains(e.target)) setShowPairDD(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Generate candlestick OHLC data + embed signal/trade markers
  const chartData = useMemo(() => {
    const trader = mockTraders.find(t => t.name === selectedTrader) || mockTraders[0];
    const basePrice = selectedPair.startsWith("BTC") ? 67500 : selectedPair.startsWith("ETH") ? 3450 : selectedPair.startsWith("SOL") ? 145 : selectedPair.startsWith("BNB") ? 580 : selectedPair.startsWith("XRP") ? 0.62 : selectedPair.startsWith("DOGE") ? 0.15 : 35;
    const volatility = basePrice * 0.008;
    const traderSeed = trader.winRate + trader.pnl * 0.0001;
    const points = chartRange === "1H" ? 12 : chartRange === "4H" ? 16 : chartRange === "1D" ? 24 : chartRange === "1W" ? 28 : 30;

    // Collect feed events to place on chart
    const traderEvents = feedItems.filter(f =>
      (f.kind === "trade" || f.kind === "signal") && f.trader === selectedTrader && f.pair === selectedPair
    );

    const data = [];
    let price = basePrice;
    for (let i = 0; i < points; i++) {
      const trend = (trader.winRate - 70) * 0.0003 * volatility;
      const noise = (Math.sin(i * 2.3 + traderSeed) * 0.6 + Math.cos(i * 1.1 + traderSeed * 0.5) * 0.4) * volatility;
      price = price + trend + noise;
      const high = price + Math.abs(Math.sin(i * 1.7)) * volatility * 0.5;
      const low = price - Math.abs(Math.cos(i * 2.1)) * volatility * 0.5;
      const open = price - noise * 0.3;
      const close = price;
      const label = chartRange === "1H" ? `${i * 5}m` : chartRange === "4H" ? `${i}:00` : chartRange === "1D" ? `${i}:00` : `Día ${i + 1}`;
      const bullish = close >= open;

      // Candlestick body: store as [bodyLow, bodyHigh] for stacked rendering
      const bodyLow = Math.min(open, close);
      const bodyHigh = Math.max(open, close);

      const point = {
        label, open: +open.toFixed(2), close: +close.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2),
        price: +close.toFixed(2), bodyLow: +bodyLow.toFixed(2), bodyHigh: +bodyHigh.toFixed(2), bullish,
        vol: Math.round(500 + Math.random() * 3000),
        marker: null, markerKind: null, markerDir: null, markerPnl: null
      };

      // Place events at specific candle positions (spread across chart)
      const evtIdx = Math.floor(i / (points / Math.max(traderEvents.length, 1)));
      if (traderEvents[evtIdx] && i === Math.floor(evtIdx * (points / traderEvents.length)) + 2) {
        const evt = traderEvents[evtIdx];
        point.marker = evt.kind;
        point.markerKind = evt.kind;
        point.markerDir = evt.type || evt.bias;
        point.markerPnl = evt.pnl || null;
        point.markerLev = evt.leverage || null;
        point.markerConf = evt.confidence || null;
        traderEvents[evtIdx] = { ...traderEvents[evtIdx], _placed: true };
      }

      data.push(point);
    }
    return data;
  }, [selectedTrader, selectedPair, chartRange]);

  // Custom candlestick bar shape
  const CandlestickBar = useCallback((props) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;
    const { open, close, high, low, bullish } = payload;
    const color = bullish ? C.green : C.red;
    const yScale = (val) => {
      // Approximate y position from bar props
      const bodyLow = Math.min(open, close);
      const bodyHigh = Math.max(open, close);
      const bodyRange = bodyHigh - bodyLow || 0.01;
      return y + height - ((val - bodyLow) / bodyRange) * height;
    };
    const candleX = x + width / 2;
    const wickWidth = 1;
    // We render wick + body in SVG
    const bodyH = Math.max(height, 1);
    return (
      <g>
        {/* Wick */}
        <line x1={candleX} y1={yScale(high)} x2={candleX} y2={yScale(low)} stroke={color} strokeWidth={wickWidth} />
        {/* Body */}
        <rect x={x + 1} y={y} width={Math.max(width - 2, 2)} height={bodyH} fill={bullish ? color : color} rx={1} opacity={bullish ? 0.9 : 0.7} />
      </g>
    );
  }, []);

  // Custom chart marker renderer for signals/trades
  const ChartMarkers = useCallback((props) => {
    const { formattedGraphicalItems } = props;
    if (!formattedGraphicalItems || !formattedGraphicalItems[0]) return null;
    const areaPoints = formattedGraphicalItems[0].props.points || [];
    return (
      <g>
        {chartData.map((d, i) => {
          if (!d.marker || !areaPoints[i]) return null;
          const pt = areaPoints[i];
          const isLong = d.markerDir === "LONG";
          const color = isLong ? C.green : C.red;
          const arrowY = isLong ? -1 : 1;

          if (d.markerKind === "signal") {
            // Signal: speech bubble pin with arrow
            const bx = pt.x;
            const by = pt.y - 28;
            return (
              <g key={`marker-${i}`}>
                {/* Pin line */}
                <line x1={bx} y1={pt.y} x2={bx} y2={by + 12} stroke={color} strokeWidth={1.5} strokeDasharray="2 2" />
                {/* Bubble */}
                <ellipse cx={bx} cy={by} rx={14} ry={11} fill={color} />
                {/* Arrow inside */}
                <path d={isLong ? `M${bx} ${by+4} L${bx} ${by-4} M${bx-3} ${by-1} L${bx} ${by-4} L${bx+3} ${by-1}` : `M${bx} ${by-4} L${bx} ${by+4} M${bx-3} ${by+1} L${bx} ${by+4} L${bx+3} ${by+1}`} stroke="#fff" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Label */}
                <text x={bx} y={by + 20} textAnchor="middle" fontSize={7} fontWeight="700" fill={color}>SEÑAL</text>
              </g>
            );
          }

          if (d.markerKind === "trade") {
            // Trade: flag/pennant on pole
            const px = pt.x;
            const poleTop = pt.y - 40;
            const poleBot = pt.y;
            const flagW = 48;
            const flagH = 22;
            return (
              <g key={`marker-${i}`}>
                {/* Pole */}
                <line x1={px} y1={poleBot} x2={px} y2={poleTop} stroke={color} strokeWidth={1.5} />
                {/* Pole dot */}
                <circle cx={px} cy={poleTop} r={2.5} fill={color} />
                {/* Flag body (pennant shape) */}
                <polygon points={`${px},${poleTop} ${px + flagW},${poleTop + flagH / 2} ${px},${poleTop + flagH}`} fill={color} opacity={0.9} />
                {/* Arrow inside flag */}
                <path d={isLong ? `M${px+8} ${poleTop+flagH/2+2} L${px+8} ${poleTop+flagH/2-3} M${px+6} ${poleTop+flagH/2-1} L${px+8} ${poleTop+flagH/2-3} L${px+10} ${poleTop+flagH/2-1}` : `M${px+8} ${poleTop+flagH/2-2} L${px+8} ${poleTop+flagH/2+3} M${px+6} ${poleTop+flagH/2+1} L${px+8} ${poleTop+flagH/2+3} L${px+10} ${poleTop+flagH/2+1}`} stroke="#fff" strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Pair text in flag */}
                <text x={px + 18} y={poleTop + flagH / 2 - 2} fontSize={6} fontWeight="800" fill="#fff" dominantBaseline="middle">{selectedPair.split("/")[0]}</text>
                {/* PnL / Price below flag */}
                {d.markerPnl != null && (
                  <text x={px + 18} y={poleTop + flagH / 2 + 6} fontSize={6} fontWeight="700" fill="#fff" dominantBaseline="middle" opacity={0.9}>
                    {d.markerPnl >= 0 ? "+" : ""}${d.markerPnl.toLocaleString()}
                  </text>
                )}
                {d.markerLev && (
                  <text x={px + flagW - 4} y={poleTop + flagH / 2 + 1} fontSize={5.5} fontWeight="700" fill="#fff" dominantBaseline="middle" textAnchor="end" opacity={0.7}>{d.markerLev}</text>
                )}
              </g>
            );
          }
          return null;
        })}
      </g>
    );
  }, [chartData, selectedPair]);

  // Get trades + signals for this trader + pair (for the feed below)
  const relevantFeed = useMemo(() => {
    return feedItems.filter(f =>
      (f.kind === "trade" || f.kind === "signal") &&
      f.trader === selectedTrader &&
      f.pair === selectedPair
    );
  }, [selectedTrader, selectedPair]);

  const allTraderFeed = useMemo(() => {
    return feedItems.filter(f => (f.kind === "trade" || f.kind === "signal") && f.trader === selectedTrader).slice(0, 8);
  }, [selectedTrader]);

  const currentTrader = mockTraders.find(t => t.name === selectedTrader) || mockTraders[0];
  const traderIdx = mockTraders.indexOf(currentTrader);
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const startPrice = chartData.length > 0 ? chartData[0].price : 0;
  const priceChange = currentPrice - startPrice;
  const priceChangePct = startPrice > 0 ? ((priceChange / startPrice) * 100).toFixed(2) : "0.00";
  const isUp = priceChange >= 0;
  const trendColor = isUp ? C.green : C.red;

  const tierColor = { Diamond: C.cyan, Platinum: C.purple, Gold: C.amber, Silver: C.textMuted };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* ── Selectors row: Trader dropdown + Pair dropdown ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

        {/* Trader dropdown */}
        <div ref={traderDDRef} style={{ position: "relative" }}>
          <button onClick={() => { setShowTraderDD(!showTraderDD); setShowPairDD(false); }} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "7px 14px",
            backgroundColor: C.card, border: `1px solid ${showTraderDD ? C.purple : C.border}`, borderRadius: "8px",
            color: C.text, fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "border-color 0.15s", minWidth: 160
          }}>
            <span style={{ fontSize: "16px" }}>{currentTrader.avatar}</span>
            <span>{currentTrader.name}</span>
            <Tag text={currentTrader.tier} color={tierColor[currentTrader.tier]} />
            <ChevronDown size={14} color={C.textMuted} style={{ marginLeft: "auto", transform: showTraderDD ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
          </button>
          {showTraderDD && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: 220, maxHeight: 300, overflowY: "auto" }}>
              {mockTraders.map((t, i) => (
                <button key={t.name} onClick={() => { setSelectedTrader(t.name); setShowTraderDD(false); }} style={{
                  display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px",
                  backgroundColor: t.name === selectedTrader ? C.purpleBg : "transparent", border: "none",
                  borderBottom: i < mockTraders.length - 1 ? `1px solid ${C.border}` : "none",
                  color: C.text, fontSize: "11px", fontWeight: "600", cursor: "pointer", textAlign: "left"
                }}>
                  <span style={{ fontSize: "14px" }}>{t.avatar}</span>
                  <span style={{ flex: 1 }}>{t.name}</span>
                  <BotTag isBot={t.isBot} />
                  <span style={{ fontSize: "10px", color: C.green, fontWeight: "700", ...mono }}>{t.winRate}%</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pair dropdown */}
        <div ref={pairDDRef} style={{ position: "relative" }}>
          <button onClick={() => { setShowPairDD(!showPairDD); setShowTraderDD(false); }} style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
            backgroundColor: C.card, border: `1px solid ${showPairDD ? C.blue : C.border}`, borderRadius: "8px",
            color: C.text, fontSize: "13px", fontWeight: "800", cursor: "pointer", ...mono, transition: "border-color 0.15s"
          }}>
            {selectedPair}
            <ChevronDown size={14} color={C.textMuted} style={{ transform: showPairDD ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
          </button>
          {showPairDD && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", minWidth: 140 }}>
              {allPairs.map((pair, i) => (
                <button key={pair} onClick={() => { setSelectedPair(pair); setShowPairDD(false); }} style={{
                  display: "block", width: "100%", padding: "8px 14px",
                  backgroundColor: pair === selectedPair ? C.blueBg : "transparent", border: "none",
                  borderBottom: i < allPairs.length - 1 ? `1px solid ${C.border}` : "none",
                  color: pair === selectedPair ? C.blue : C.text, fontSize: "12px", fontWeight: "700", cursor: "pointer", textAlign: "left", ...mono
                }}>{pair}</button>
              ))}
            </div>
          )}
        </div>

        {/* Price display */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "22px", fontWeight: "900", ...mono }}>${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span style={{ fontSize: "12px", fontWeight: "700", color: trendColor, ...mono }}>
            {isUp ? "+" : ""}{priceChange.toFixed(2)} ({isUp ? "+" : ""}{priceChangePct}%)
          </span>
        </div>
      </div>

      {/* ── Chart range selector ── */}
      <div style={{ display: "flex", gap: "4px" }}>
        {ranges.map(r => (
          <button key={r} onClick={() => setChartRange(r)} style={{
            padding: "4px 12px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
            border: `1px solid ${chartRange === r ? C.purple : C.border}`,
            backgroundColor: chartRange === r ? C.purpleBg : "transparent",
            color: chartRange === r ? C.purple : C.textMuted, ...mono
          }}>{r}</button>
        ))}
      </div>

      {/* ── Main Chart with Candlesticks + Signal/Trade Markers ── */}
      <div style={{ ...cardStyle, padding: "16px" }}>
        {/* Chart legend for markers */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "8px", fontSize: "9px", color: C.textMuted }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="12" height="12"><ellipse cx="6" cy="6" rx="5" ry="4" fill={C.green} /><path d="M6 8 L6 4 M4 5.5 L6 4 L8 5.5" stroke="#fff" strokeWidth="1" fill="none" /></svg>
            <span>Señal LONG</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="12" height="12"><ellipse cx="6" cy="6" rx="5" ry="4" fill={C.red} /><path d="M6 4 L6 8 M4 6.5 L6 8 L8 6.5" stroke="#fff" strokeWidth="1" fill="none" /></svg>
            <span>Señal SHORT</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="16" height="12"><line x1="2" y1="10" x2="2" y2="1" stroke={C.green} strokeWidth="1" /><polygon points="2,1 14,6 2,11" fill={C.green} opacity="0.8" /></svg>
            <span>Trade LONG</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="16" height="12"><line x1="2" y1="10" x2="2" y2="1" stroke={C.red} strokeWidth="1" /><polygon points="2,1 14,6 2,11" fill={C.red} opacity="0.8" /></svg>
            <span>Trade SHORT</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={chartData} margin={{ top: 50, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="homeChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="label" stroke={C.textMuted} fontSize={9} tickLine={false} />
            <YAxis stroke={C.textMuted} fontSize={9} tickLine={false} domain={["auto", "auto"]} tickFormatter={v => selectedPair.startsWith("BTC") ? `$${(v/1000).toFixed(1)}K` : `$${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "11px" }}
              formatter={(value, name) => {
                if (name === "price") return [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Precio"];
                if (name === "open") return [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Open"];
                if (name === "high") return [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "High"];
                if (name === "low") return [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Low"];
                return [value, name];
              }}
            />
            {/* Price line + fill */}
            <Area type="monotone" dataKey="price" stroke={trendColor} strokeWidth={1.5} fill="url(#homeChartGrad)" dot={false} activeDot={{ r: 3, strokeWidth: 0, fill: trendColor }} />
            {/* High/Low as invisible references for scale */}
            <Area type="monotone" dataKey="high" stroke="transparent" fill="transparent" dot={false} />
            <Area type="monotone" dataKey="low" stroke="transparent" fill="transparent" dot={false} />
            {/* Signal + Trade markers overlay */}
            <Customized component={ChartMarkers} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Volume bars underneath */}
        <div style={{ marginTop: "-4px" }}>
          <ResponsiveContainer width="100%" height={36}>
            <BarChart data={chartData}>
              <Bar dataKey="vol" radius={[1, 1, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.bullish ? C.green + "25" : C.red + "25"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Trader summary strip ── */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { label: "Win Rate", value: `${currentTrader.winRate}%`, color: C.green, icon: Target },
          { label: "PnL Total", value: `+$${(currentTrader.pnl / 1000).toFixed(0)}K`, color: C.green, icon: DollarSign },
          { label: "Alpha Score", value: String(calcAlphaScore(currentTrader)), color: alphaColor(calcAlphaScore(currentTrader)), icon: Zap },
          { label: "Racha", value: `${currentTrader.streak}W`, color: C.amber, icon: Flame },
          { label: "Copiers", value: String(currentTrader.copiers), color: C.purple, icon: Users },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle, flex: 1, padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <s.icon size={13} color={s.color} />
            <div>
              <div style={{ fontSize: "8px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: "14px", fontWeight: "900", color: s.color, ...mono }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active signals & trades for this trader on this pair ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700" }}>Actividad de {selectedTrader}</span>
        <span style={{ fontSize: "10px", color: C.textFaint }}>{selectedPair}</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
        {relevantFeed.length === 0 && <span style={{ fontSize: "10px", color: C.textFaint }}>Sin actividad en este par</span>}
      </div>

      {/* Relevant feed for selected pair */}
      {relevantFeed.length > 0 && (
        <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
          {relevantFeed.map((item, idx) => {
            const accent = item.kind === "signal" ? C.blue : (item.type === "LONG" ? C.green : C.red);
            const DirIcon = (item.type === "LONG" || item.bias === "LONG") ? ArrowUp : ArrowDown;
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: idx < relevantFeed.length - 1 ? `1px solid ${C.border}` : "none", gap: "8px", fontSize: "11px" }}>
                <div style={{ width: 20, height: 20, borderRadius: "4px", backgroundColor: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DirIcon size={12} color={accent} />
                </div>
                <span style={{ fontSize: "9px", fontWeight: "700", color: accent, backgroundColor: accent + "15", padding: "1px 5px", borderRadius: "3px" }}>{item.kind === "signal" ? "SEÑAL" : "TRADE"}</span>
                <span style={{ fontWeight: "700" }}>{item.pair}</span>
                <span style={{ fontSize: "9px", fontWeight: "800", color: accent }}>{item.type || item.bias}</span>
                {item.kind === "trade" && <span style={{ marginLeft: "auto", fontWeight: "900", color: item.pnl >= 0 ? C.green : C.red, ...mono }}>{item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}</span>}
                {item.kind === "signal" && <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "700", color: item.confidence >= 80 ? C.green : C.amber, ...mono }}>{item.confidence}%</span>}
                <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* All recent activity for this trader (any pair) */}
      {allTraderFeed.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700" }}>Toda la actividad</span>
            <span style={{ fontSize: "10px", color: C.textFaint }}>todos los pares</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
          </div>
          <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
            {allTraderFeed.map((item, idx) => {
              const accent = item.kind === "signal" ? C.blue : (item.type === "LONG" ? C.green : C.red);
              const DirIcon = (item.type === "LONG" || item.bias === "LONG") ? ArrowUp : ArrowDown;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: idx < allTraderFeed.length - 1 ? `1px solid ${C.border}` : "none", gap: "8px", fontSize: "11px" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "4px", backgroundColor: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DirIcon size={12} color={accent} />
                  </div>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: accent, backgroundColor: accent + "15", padding: "1px 5px", borderRadius: "3px" }}>{item.kind === "signal" ? "SEÑAL" : "TRADE"}</span>
                  <span style={{ fontWeight: "700" }}>{item.pair}</span>
                  <span style={{ fontSize: "9px", fontWeight: "800", color: accent }}>{item.type || item.bias}</span>
                  {item.kind === "trade" && (
                    <>
                      <span style={{ fontSize: "9px", fontWeight: "700", color: C.textFaint, ...mono }}>{item.leverage}</span>
                      <span style={{ marginLeft: "auto", fontWeight: "900", color: item.pnl >= 0 ? C.green : C.red, ...mono }}>{item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}</span>
                    </>
                  )}
                  {item.kind === "signal" && <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "700", color: item.confidence >= 80 ? C.green : C.amber, ...mono }}>{item.confidence}%</span>}
                  <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Quick link to full profile */}
      <button onClick={() => openProfile(currentTrader)} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        padding: "10px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px",
        color: C.purple, fontSize: "12px", fontWeight: "600", cursor: "pointer"
      }}>
        <Eye size={14} /> Ver perfil completo de {selectedTrader}
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

/* ═══════════════════════ TAB: ARENA (Watch traders live) ═══════════════════════ */
const ArenaTab = () => {
  const { openProfile } = useProfile();
  const { feedFilter, setFeedFilter, setActiveTab } = useFeedFilter();
  const [watching, setWatching] = useState(() => {
    const m = {};
    mockTraders.forEach((t, i) => { m[t.name] = i < 4; });
    return m;
  });
  const [votes, setVotes] = useState({});
  const [copied, setCopied] = useState({});
  const [signalCoin, setSignalCoin] = useState("ALL");
  const [signalType, setSignalType] = useState("ALL");
  // Sub-view trader selector: ordered + visibility
  const [subViewOrder, setSubViewOrder] = useState(() => mockTraders.slice(0, 5).map(t => t.name));
  const [subViewVisible, setSubViewVisible] = useState(() => {
    const m = {};
    mockTraders.slice(0, 4).forEach(t => { m[t.name] = true; });
    return m;
  });
  const [dragIdx, setDragIdx] = useState(null);
  const toast = useToast();
  const TOTAL_TRADERS = 300;

  const tierColor = { Diamond: C.cyan, Platinum: C.purple, Gold: C.amber, Silver: C.textMuted };
  const toggleWatch = (name) => setWatching(prev => ({ ...prev, [name]: !prev[name] }));
  const watchedNames = Object.keys(watching).filter(k => watching[k]);
  const watchedTraders = mockTraders.filter(t => watching[t.name]);

  // Filter feed items to only watched traders (+ whales/liquidations always show)
  const traderFeed = feedItems.filter(f =>
    f.kind === "whale" || f.kind === "liquidation" || watchedNames.includes(f.trader)
  );
  const filteredFeed = (() => {
    let feed = traderFeed;
    if (feedFilter === "all") return feed;
    if (feedFilter === "whale") return feed.filter(f => f.kind === "whale" || f.kind === "liquidation");
    if (feedFilter === "trade") {
      feed = feed.filter(f => f.kind === "trade");
      if (signalCoin !== "ALL") feed = feed.filter(f => f.pair && f.pair.startsWith(signalCoin));
      if (signalType !== "ALL") feed = feed.filter(f => f.type === signalType);
      return feed;
    }
    if (feedFilter === "signal") {
      feed = feed.filter(f => f.kind === "signal");
      if (signalCoin !== "ALL") feed = feed.filter(f => f.pair && f.pair.startsWith(signalCoin));
      if (signalType !== "ALL") feed = feed.filter(f => f.bias === signalType);
      return feed;
    }
    if (feedFilter === "prediction") return feed.filter(f => f.kind === "prediction");
    return feed.filter(f => f.kind === feedFilter);
  })();

  const handleCopy = (item) => {
    setCopied(prev => ({ ...prev, [item.id]: true }));
    toast.addToast(`Copiando ${item.type} ${item.pair} de ${item.trader}`, "success");
  };

  const activeCount = traderFeed.filter(f => f.kind === "trade" && f.status === "active").length;
  const watchedPnl = watchedTraders.reduce((a, t) => a + t.pnl, 0);

  const statusColors = { active: C.blue, tp_hit: C.green, sl_hit: C.red };
  const statusLabels = { active: "Activa", tp_hit: "TP Hit", sl_hit: "SL Hit" };
  const isNew = (ts) => (Date.now() - ts) < 600000; // < 10 min
  const NewBadge = () => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "8px", fontWeight: "700", color: C.green, backgroundColor: C.greenBg, padding: "1px 5px", borderRadius: "3px", border: `1px solid ${C.green}30`, animation: "livePulse 2s ease-in-out infinite" }}>
      NEW
    </span>
  );

  // Group predictions by question — only show the first predictor's card, embed others inside
  const dedupedFeed = useMemo(() => {
    const seen = new Set();
    return filteredFeed.filter(item => {
      if (item.kind === "prediction") {
        if (seen.has(item.questionId)) return false;
        seen.add(item.questionId);
      }
      return true;
    });
  }, [filteredFeed]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* ── Header: title + LIVE badge + total traders (only in full Arena view) ── */}
      {feedFilter === "all" && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "18px", fontWeight: "800" }}>Arena</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "700", color: C.green, backgroundColor: C.greenBg, padding: "3px 10px", borderRadius: "10px", border: `1px solid ${C.green}30` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.green, display: "inline-block" }} /> EN VIVO
          </span>
          <span style={{ fontSize: "11px", color: C.textMuted }}>300 traders</span>
          <span style={{ fontSize: "11px", color: C.textFaint }}>·</span>
          <span style={{ fontSize: "11px", color: C.purple, fontWeight: "600" }}>Siguiendo {watchedNames.length}</span>
        </div>
        <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: C.textMuted, ...mono }}>
          <span>{activeCount} ops activas</span>
          <span style={{ color: C.green }}>+${(watchedPnl / 1000).toFixed(0)}K PnL total</span>
        </div>
      </div>
      )}

      {/* ── Top 10 Trader selector: pick who you're watching (only in full Arena view) ── */}
      {feedFilter === "all" && (
      <div style={{ ...cardStyle, padding: "12px 16px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "10px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase", marginRight: "4px" }}>Top 10:</span>
        {mockTraders.map((t, i) => {
          const on = watching[t.name];
          const color = traderColors[i];
          return (
            <button key={t.name} onClick={() => toggleWatch(t.name)} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
              border: `1px solid ${on ? color : C.border}`,
              backgroundColor: on ? color + "15" : "transparent",
              color: on ? C.text : C.textFaint, transition: "all 0.15s"
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: on ? color : C.textFaint }} />
              <span>{t.name}</span>
              {on && <span style={{ fontSize: "9px", color: color, ...mono }}>{t.winRate}%</span>}
            </button>
          );
        })}
        <span style={{ fontSize: "10px", color: C.textFaint, marginLeft: "4px" }}>+292 más</span>
      </div>
      )}

      {/* ── Live Equity Curves (only watched, only in full Arena view) ── */}
      {feedFilter === "all" && watchedTraders.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700" }}>Performance en vivo</div>
              <div style={{ fontSize: "10px", color: C.textMuted }}>Equity acumulada — últimos 30 días</div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {watchedTraders.slice(0, 5).map((t) => {
                const ci = mockTraders.indexOf(t);
                return (
                  <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
                    <div style={{ width: 8, height: 3, borderRadius: "1px", backgroundColor: traderColors[ci] }} />
                    <span style={{ color: traderColors[ci], fontWeight: "600" }}>{t.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={traderEquity}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} />
              <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px" }} formatter={(value, name) => [value != null ? `$${Number(value).toLocaleString()}` : "—", name]} labelFormatter={l => `Día ${l}`} />
              {mockTraders.map((t, i) => watching[t.name] && <Line key={t.name} type="monotone" dataKey={t.name} stroke={traderColors[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Top 10 Leaderboard + Ver todos (compact table, only in full Arena view) ── */}
      {feedFilter === "all" && (
        <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={14} color={C.amber} />
              <span style={{ fontSize: "12px", fontWeight: "700" }}>Top 10 Leaderboard</span>
              <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>de 300</span>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: "8px 10px", textAlign: "left", color: C.textFaint, fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", width: "30px" }}>#</th>
                {[["Trader",null],["Alpha","alpha"],["Win","winRate"],["PnL",null],["Racha","streak"],["Copiers","copiers"]].map(([h,tip]) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: C.textFaint, fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tip ? <InfoTip k={tip}><span>{h}</span></InfoTip> : h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTraders.map((t) => {
                const ci = mockTraders.indexOf(t);
                const alpha = calcAlphaScore(t);
                const aClr = alphaColor(alpha);
                const isWatched = watching[t.name];
                return (
                  <tr key={t.name} className="hoverable" onClick={() => openProfile(t)} style={{ cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "6px 10px", fontWeight: "700", color: t.rank <= 3 ? C.amber : C.textFaint, ...mono, fontSize: "12px" }}>{t.rank}</td>
                    <td style={{ padding: "6px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: 3, height: 20, borderRadius: "1px", backgroundColor: traderColors[ci] }} />
                        <span style={{ fontWeight: "700", fontSize: "12px" }}>{t.name}</span>
                        <BotTag isBot={t.isBot} />
                        {isWatched && <Eye size={10} color={C.purple} />}
                      </div>
                    </td>
                    <td style={{ padding: "6px 10px", fontWeight: "800", color: aClr, ...mono }}>{alpha}</td>
                    <td style={{ padding: "6px 10px", fontWeight: "700", color: C.green, ...mono }}>{t.winRate}%</td>
                    <td style={{ padding: "6px 10px", fontWeight: "700", color: C.green, ...mono }}>+${(t.pnl/1000).toFixed(0)}K</td>
                    <td style={{ padding: "6px 10px", fontWeight: "700", color: C.amber, ...mono }}>{t.streak}W</td>
                    <td style={{ padding: "6px 10px", fontWeight: "700", ...mono }}>{t.copiers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button onClick={() => { setActiveTab("traders"); setFeedFilter("all"); }} style={{
            width: "100%", padding: "10px", backgroundColor: "transparent", border: "none",
            borderTop: `1px solid ${C.border}`, color: C.purple, fontSize: "12px", fontWeight: "600",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            transition: "background-color 0.15s"
          }}>
            <Users size={14} />
            Ver los 300 traders
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ═══ SUB-VIEW: Trades / Señales / Predicciones ═══ */}
      {feedFilter !== "all" && (() => {
        const tradeCount = traderFeed.filter(f => f.kind === "trade").length;
        const signalCount = traderFeed.filter(f => f.kind === "signal").length;
        const predCount = traderFeed.filter(f => f.kind === "prediction").length;
        const filterMeta = { trade: { label: "Trades", color: C.green, icon: Activity, count: tradeCount }, signal: { label: "Señales", color: C.blue, icon: Lightbulb, count: signalCount }, prediction: { label: "Predicciones", color: C.amber, icon: Scale, count: predCount } };
        const current = filterMeta[feedFilter] || filterMeta.trade;
        const CurrentIcon = current.icon;

        // Summary stats per section
        const sectionItems = filteredFeed.filter(f => f.kind === feedFilter);
        const totalPnl = feedFilter === "trade" ? sectionItems.reduce((s, f) => s + (f.pnl || 0), 0) : 0;
        const avgWin = feedFilter === "trade" && sectionItems.length > 0 ? Math.round(sectionItems.filter(f => f.pnl > 0).length / sectionItems.length * 100) : 0;
        const avgConf = feedFilter === "signal" && sectionItems.length > 0 ? Math.round(sectionItems.reduce((s, f) => s + (f.confidence || 0), 0) / sectionItems.length) : 0;
        const totalVol = feedFilter === "prediction" ? sectionItems.reduce((s, f) => s + (f.stake || 0), 0) : 0;

        return (
          <>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CurrentIcon size={16} color={current.color} />
              <span style={{ fontSize: "16px", fontWeight: "800", color: current.color }}>{current.label}</span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: current.color, ...mono, backgroundColor: current.color + "18", padding: "2px 10px", borderRadius: "10px" }}>{current.count}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => { setFeedFilter("all"); setActiveTab("arena"); }} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, display: "flex", alignItems: "center", gap: "4px" }}>
                <Radio size={10} /> Arena
              </button>
            </div>

            {/* Draggable trader selector */}
            <div style={{ ...cardStyle, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                <span style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Comparar Traders</span>
                <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>· arrastra para reordenar</span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {subViewOrder.map((name, idx) => {
                  const t = mockTraders.find(tt => tt.name === name);
                  if (!t) return null;
                  const on = subViewVisible[name];
                  const ci = mockTraders.indexOf(t);
                  const color = traderColors[ci];
                  return (
                    <button key={name} draggable onDragStart={e => { e.dataTransfer.setData("text/plain", String(idx)); setDragIdx(idx); }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData("text/plain")); if (from === idx) return; setSubViewOrder(prev => { const n = [...prev]; const item = n.splice(from, 1)[0]; n.splice(idx, 0, item); return n; }); setDragIdx(null); }}
                      onDragEnd={() => setDragIdx(null)}
                      onClick={() => setSubViewVisible(prev => ({ ...prev, [name]: !prev[name] }))}
                      style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        padding: "4px 10px", borderRadius: "16px", fontSize: "10px", fontWeight: "600", cursor: "grab",
                        border: `1px solid ${on ? color : C.border}`,
                        backgroundColor: on ? color + "15" : "transparent",
                        color: on ? C.text : C.textFaint, transition: "all 0.15s",
                        opacity: dragIdx === idx ? 0.5 : 1,
                      }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: on ? color : C.textFaint }} />
                      {name}
                      {on && <span style={{ fontSize: "8px", color, ...mono }}>{t.winRate}%</span>}
                    </button>
                  );
                })}
                {/* Add trader button */}
                <button onClick={() => {
                  const notInList = mockTraders.filter(t => !subViewOrder.includes(t.name));
                  if (notInList.length > 0) {
                    const next = notInList[0].name;
                    setSubViewOrder(prev => [...prev, next]);
                    setSubViewVisible(prev => ({ ...prev, [next]: true }));
                  }
                }} style={{
                  display: "flex", alignItems: "center", gap: "3px",
                  padding: "4px 10px", borderRadius: "16px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                  border: `1px dashed ${C.border}`, backgroundColor: "transparent", color: C.textFaint
                }}>
                  <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span> Agregar
                </button>
              </div>
            </div>

            {/* Filters: coin + direction (all sub-views) */}
            {(feedFilter === "trade" || feedFilter === "signal") && (
              <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                {["ALL","BTC","ETH","SOL","BNB","XRP"].map(coin => (
                  <button key={coin} onClick={() => setSignalCoin(coin)} style={{
                    padding: "3px 9px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${signalCoin === coin ? current.color : C.border}`,
                    backgroundColor: signalCoin === coin ? `${current.color}15` : "transparent",
                    color: signalCoin === coin ? current.color : C.textMuted, ...mono
                  }}>{coin}</button>
                ))}
                <div style={{ width: "1px", height: 14, backgroundColor: C.border }} />
                {["ALL","LONG","SHORT"].map(typ => (
                  <button key={typ} onClick={() => setSignalType(typ)} style={{
                    padding: "3px 9px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${signalType === typ ? (typ === "LONG" ? C.green : typ === "SHORT" ? C.red : current.color) : C.border}`,
                    backgroundColor: signalType === typ ? (typ === "LONG" ? C.greenBg : typ === "SHORT" ? C.redBg : `${current.color}15`) : "transparent",
                    color: signalType === typ ? (typ === "LONG" ? C.green : typ === "SHORT" ? C.red : current.color) : C.textMuted, ...mono
                  }}>{typ}</button>
                ))}
              </div>
            )}

            {/* Comparison chart */}
            {(() => {
              const visibleNames = subViewOrder.filter(n => subViewVisible[n]);
              return visibleNames.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700" }}>Performance comparada</span>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {visibleNames.slice(0, 6).map(name => {
                        const ci = mockTraders.findIndex(t => t.name === name);
                        return (
                          <div key={name} style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "9px" }}>
                            <div style={{ width: 6, height: 2, borderRadius: "1px", backgroundColor: traderColors[ci] }} />
                            <span style={{ color: traderColors[ci], fontWeight: "600" }}>{name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={traderEquity}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="day" stroke={C.textMuted} fontSize={9} />
                      <YAxis stroke={C.textMuted} fontSize={9} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
                      <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "10px" }} formatter={(value, name) => [value != null ? `$${Number(value).toLocaleString()}` : "—", name]} />
                      {visibleNames.map(name => {
                        const ci = mockTraders.findIndex(t => t.name === name);
                        return <Line key={name} type="monotone" dataKey={name} stroke={traderColors[ci]} strokeWidth={1.5} dot={false} connectNulls={false} />;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}

            {/* P&L / Performance summary bar */}
            <div style={{ display: "flex", gap: "8px" }}>
              {feedFilter === "trade" && (
                <>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <DollarSign size={14} color={totalPnl >= 0 ? C.green : C.red} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>PnL Total</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: totalPnl >= 0 ? C.green : C.red, ...mono }}>{totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Target size={14} color={C.green} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Win Rate</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: C.green, ...mono }}>{avgWin}%</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Activity size={14} color={current.color} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Trades</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{sectionItems.length}</div>
                    </div>
                  </div>
                </>
              )}
              {feedFilter === "signal" && (
                <>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={14} color={C.blue} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Avg Conviction</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: C.blue, ...mono }}>{avgConf}%</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Lightbulb size={14} color={current.color} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Señales</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{sectionItems.length}</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={14} color={C.green} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Bullish</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: C.green, ...mono }}>{sectionItems.filter(f => f.bias === "LONG").length}</div>
                    </div>
                  </div>
                </>
              )}
              {feedFilter === "prediction" && (
                <>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <DollarSign size={14} color={C.amber} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Vol Total</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: C.amber, ...mono }}>${totalVol.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Scale size={14} color={current.color} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Predicciones</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{sectionItems.length}</div>
                    </div>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users size={14} color={C.purple} />
                    <div>
                      <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase" }}>Traders</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{new Set(sectionItems.map(f => f.trader)).size}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Compact Feed — table-like rows for max scanning speed */}
            <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${C.border}`, fontSize: "9px", fontWeight: "600", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {feedFilter === "trade" && (
                  <>
                    <span style={{ width: 24 }} />
                    <span style={{ flex: 2, minWidth: 80 }}>Trader</span>
                    <span style={{ flex: 2, minWidth: 80 }}>Par</span>
                    <span style={{ width: 40, textAlign: "center" }}>Lev</span>
                    <span style={{ width: 55, textAlign: "right" }}>Entry</span>
                    <span style={{ width: 50, textAlign: "right" }}>TP</span>
                    <span style={{ width: 50, textAlign: "right" }}>SL</span>
                    <span style={{ flex: 1, minWidth: 70, textAlign: "right" }}>PnL</span>
                    <span style={{ width: 44, textAlign: "center" }}>Status</span>
                    <span style={{ width: 40, textAlign: "right" }}>Hora</span>
                    <span style={{ width: 36 }} />
                  </>
                )}
                {feedFilter === "signal" && (
                  <>
                    <span style={{ width: 24 }} />
                    <span style={{ flex: 2, minWidth: 80 }}>Trader</span>
                    <span style={{ flex: 2, minWidth: 80 }}>Par</span>
                    <span style={{ width: 46, textAlign: "center" }}>TF</span>
                    <span style={{ flex: 1, textAlign: "center" }}>Convicción</span>
                    <span style={{ width: 40, textAlign: "right" }}>Hora</span>
                    <span style={{ width: 36 }} />
                  </>
                )}
                {feedFilter === "prediction" && (
                  <>
                    <span style={{ flex: 3 }}>Pregunta</span>
                    <span style={{ width: 80, textAlign: "center" }}>Consenso</span>
                    <span style={{ width: 50, textAlign: "right" }}>Odds</span>
                    <span style={{ width: 50, textAlign: "right" }}>Vol</span>
                    <span style={{ width: 40, textAlign: "right" }}>Hora</span>
                  </>
                )}
              </div>

              {/* Rows */}
              {filteredFeed.length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: C.textMuted, fontSize: "12px" }}>Sin resultados para los filtros seleccionados</div>
              )}
              {dedupedFeed.filter(f => f.kind === feedFilter).map(item => {
                if (feedFilter === "trade") {
                  const tradeAccent = item.type === "LONG" ? C.green : C.red;
                  const DirIcon = item.type === "LONG" ? ArrowUp : ArrowDown;
                  const levNum = parseInt(item.leverage);
                  const levColor = levNum >= 10 ? C.red : levNum >= 5 ? C.amber : C.green;
                  return (
                    <div key={item.id} className="hoverable" onClick={() => openProfile(mockTraders.find(tt => tt.name === item.trader))} style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontSize: "11px", minHeight: "36px" }}>
                      <div style={{ width: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "4px", backgroundColor: tradeAccent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <DirIcon size={12} color={tradeAccent} />
                        </div>
                      </div>
                      <div style={{ flex: 2, minWidth: 80, fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.trader}</div>
                      <div style={{ flex: 2, minWidth: 80, display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontWeight: "700" }}>{item.pair}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: tradeAccent }}>{item.type}</span>
                      </div>
                      <div style={{ width: 40, textAlign: "center" }}>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: levColor, backgroundColor: `${levColor}15`, padding: "1px 4px", borderRadius: "3px", ...mono }}>{item.leverage}</span>
                      </div>
                      <div style={{ width: 55, textAlign: "right", ...mono, color: C.textMuted, fontSize: "10px" }}>${item.entry.toLocaleString()}</div>
                      <div style={{ width: 50, textAlign: "right", ...mono, color: C.green, fontSize: "10px" }}>${item.tp.toLocaleString()}</div>
                      <div style={{ width: 50, textAlign: "right", ...mono, color: C.red, fontSize: "10px" }}>${item.sl.toLocaleString()}</div>
                      <div style={{ flex: 1, minWidth: 70, textAlign: "right", fontWeight: "900", color: item.pnl >= 0 ? C.green : C.red, ...mono }}>
                        {item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}
                      </div>
                      <div style={{ width: 44, textAlign: "center" }}>
                        <span style={{ fontSize: "8px", fontWeight: "700", color: statusColors[item.status], backgroundColor: statusColors[item.status] + "18", padding: "2px 5px", borderRadius: "3px" }}>{statusLabels[item.status]}</span>
                      </div>
                      <div style={{ width: 40, textAlign: "right", fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</div>
                      <div style={{ width: 36, display: "flex", justifyContent: "center" }}>
                        {item.status === "active" && (
                          <button onClick={e => { e.stopPropagation(); handleCopy(item); }} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: copied[item.id] ? C.green : C.textFaint, padding: "2px", display: "flex" }}>
                            {copied[item.id] ? <CheckCircle size={12} /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                if (feedFilter === "signal") {
                  const biasColor = item.bias === "LONG" ? C.green : C.red;
                  const BiasIcon = item.bias === "LONG" ? ArrowUp : ArrowDown;
                  const confColor = item.confidence >= 80 ? C.green : item.confidence >= 65 ? C.amber : C.red;
                  return (
                    <div key={item.id} className="hoverable" style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontSize: "11px", minHeight: "36px" }}>
                      <div style={{ width: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "4px", backgroundColor: biasColor + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <BiasIcon size={12} color={biasColor} />
                        </div>
                      </div>
                      <div style={{ flex: 2, minWidth: 80, fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.trader}</div>
                      <div style={{ flex: 2, minWidth: 80, display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontWeight: "700" }}>{item.pair}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: biasColor }}>{item.bias}</span>
                      </div>
                      <div style={{ width: 46, textAlign: "center", fontSize: "9px", color: C.textMuted, ...mono }}>{item.timeframe}</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                        <div style={{ display: "flex", gap: "1px" }}>
                          {[1,2,3,4,5].map(i => (
                            <div key={i} style={{ width: 3, height: 10, borderRadius: "1px", backgroundColor: i <= Math.ceil(item.confidence / 20) ? confColor : C.border }} />
                          ))}
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: confColor, ...mono }}>{item.confidence}%</span>
                      </div>
                      <div style={{ width: 40, textAlign: "right", fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</div>
                      <div style={{ width: 36, display: "flex", justifyContent: "center" }}>
                        <button onClick={e => e.stopPropagation()} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: C.blue, padding: "2px", display: "flex" }}>
                          <BellRing size={12} />
                        </button>
                      </div>
                    </div>
                  );
                }
                if (feedFilter === "prediction") {
                  const allOnQ = traderFeed.filter(f => f.kind === "prediction" && f.questionId === item.questionId);
                  const yesC = allOnQ.filter(p => p.bet === "YES").length;
                  const yesPct = allOnQ.length > 0 ? Math.round((yesC / allOnQ.length) * 100) : 50;
                  const noPct = 100 - yesPct;
                  const tStake = allOnQ.reduce((s, p) => s + p.stake, 0);
                  return (
                    <div key={item.id} className="hoverable" style={{ display: "flex", alignItems: "center", padding: "7px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontSize: "11px", minHeight: "38px" }}>
                      <div style={{ flex: 3, fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>{item.question}</div>
                      <div style={{ width: 80, display: "flex", alignItems: "center", gap: "3px" }}>
                        <div style={{ flex: 1, height: "6px", borderRadius: "3px", overflow: "hidden", display: "flex", backgroundColor: C.border }}>
                          <div style={{ width: `${yesPct}%`, height: "100%", backgroundColor: C.green }} />
                          <div style={{ width: `${noPct}%`, height: "100%", backgroundColor: C.red }} />
                        </div>
                        <span style={{ fontSize: "8px", fontWeight: "700", color: C.green, ...mono, minWidth: 20 }}>{yesPct}%</span>
                      </div>
                      <div style={{ width: 50, textAlign: "right", fontSize: "10px", color: C.textMuted, ...mono }}>{item.odds}%</div>
                      <div style={{ width: 50, textAlign: "right", fontSize: "10px", fontWeight: "700", color: C.amber, ...mono }}>${tStake.toLocaleString()}</div>
                      <div style={{ width: 40, textAlign: "right", fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </>
        );
      })()}

      {/* ═══ ARENA FULL VIEW (feedFilter === "all") — Feed section ═══ */}
      {feedFilter === "all" && (() => {
        const tradeCount = traderFeed.filter(f => f.kind === "trade").length;
        const signalCount = traderFeed.filter(f => f.kind === "signal").length;
        const predCount = traderFeed.filter(f => f.kind === "prediction").length;
        const filterItems = [
          { id: "all", label: "Todo", color: C.purple, icon: null, count: traderFeed.length },
          { id: "trade", label: "Trades", color: C.green, icon: Activity, count: tradeCount },
          { id: "signal", label: "Señales", color: C.blue, icon: Lightbulb, count: signalCount },
          { id: "prediction", label: "Predicciones", color: C.amber, icon: Scale, count: predCount },
        ];
        return (
          <>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>Actividad</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
              {filterItems.map(f => {
                const Icon = f.icon;
                return (
                  <button key={f.id} onClick={() => setFeedFilter(f.id)} style={{
                    padding: "5px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                    border: `1px solid ${feedFilter === f.id ? f.color : C.border}`,
                    backgroundColor: feedFilter === f.id ? f.color + "18" : "transparent",
                    color: feedFilter === f.id ? f.color : C.textMuted,
                    display: "flex", alignItems: "center", gap: "6px"
                  }}>
                    {Icon && <Icon size={12} />}
                    {f.label}
                    <span style={{ fontSize: "9px", fontWeight: "700", ...mono, color: feedFilter === f.id ? f.color : C.textFaint }}>{f.count}</span>
                  </button>
                );
              })}
            </div>
            {filteredFeed.length === 0 && (
              <div style={{ ...cardStyle, textAlign: "center", padding: "40px", color: C.textMuted }}>
                <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Selecciona traders para seguir</div>
                <div style={{ fontSize: "12px" }}>Usa los botones de arriba para elegir a quién quieres ver en vivo</div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dedupedFeed.map(item => {
                if (item.kind === "whale" || item.kind === "liquidation") {
                  return (
                    <div key={item.id} style={{ ...cardStyle, padding: "10px 14px", borderLeft: `3px solid ${item.kind === "whale" ? C.cyan : C.red}`, display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: item.kind === "whale" ? C.cyan : C.red }}>{item.kind === "whale" ? "WHALE" : "LIQUIDACIÓN"}</div>
                      <div style={{ fontSize: "11px", color: C.text, flex: 1 }}>{item.text}</div>
                      <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>{item.time}</span>
                    </div>
                  );
                }
                if (item.kind === "achievement") {
                  return (
                    <div key={item.id} style={{ ...cardStyle, padding: "10px 14px", borderLeft: `3px solid ${item.achievement.color || C.purple}`, display: "flex", alignItems: "center", gap: "10px" }}>
                      {item.achievement.icon && (() => { const AchIcon = item.achievement.icon; return <AchIcon size={16} color={item.achievement.color || C.purple} />; })()}
                      <div style={{ flex: 1, fontSize: "12px" }}>
                        <TraderLink name={item.trader} /> <span style={{ color: item.achievement.color || C.purple, fontWeight: "600" }}>desbloqueó</span> <span style={{ fontWeight: "700", color: C.text }}>{item.achievement.name}</span>
                      </div>
                      <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>{item.time}</span>
                    </div>
                  );
                }
                if (item.kind === "signal") {
                  const biasColor = item.bias === "LONG" ? C.green : C.red;
                  const BiasIcon = item.bias === "LONG" ? ArrowUp : ArrowDown;
                  const confColor = item.confidence >= 80 ? C.green : item.confidence >= 65 ? C.amber : C.red;
                  return (
                    <div key={item.id} style={{ ...cardStyle, padding: "8px 14px", borderLeft: `3px solid ${C.blue}`, display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "4px", backgroundColor: biasColor + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BiasIcon size={12} color={biasColor} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <TraderLink name={item.trader} />
                          <span style={{ fontWeight: "700", fontSize: "12px" }}>{item.pair}</span>
                          <span style={{ fontSize: "9px", fontWeight: "800", color: biasColor }}>{item.bias}</span>
                          <div style={{ display: "flex", gap: "1px", marginLeft: "4px" }}>
                            {[1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 8, borderRadius: "1px", backgroundColor: i <= Math.ceil(item.confidence / 20) ? confColor : C.border }} />)}
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "700", color: confColor, ...mono }}>{item.confidence}%</span>
                        </div>
                        <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.idea}</div>
                      </div>
                      <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</span>
                    </div>
                  );
                }
                if (item.kind === "prediction") {
                  const allOnQ = traderFeed.filter(f => f.kind === "prediction" && f.questionId === item.questionId);
                  const yesC = allOnQ.filter(p => p.bet === "YES").length;
                  const yesPct = allOnQ.length > 0 ? Math.round((yesC / allOnQ.length) * 100) : 50;
                  const noPct = 100 - yesPct;
                  return (
                    <div key={item.id} style={{ ...cardStyle, padding: "8px 14px", borderLeft: `3px solid ${C.amber}`, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Scale size={14} color={C.amber} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: "600" }}>{item.question}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          <div style={{ width: 60, height: "5px", borderRadius: "3px", overflow: "hidden", display: "flex", backgroundColor: C.border }}>
                            <div style={{ width: `${yesPct}%`, height: "100%", backgroundColor: C.green }} />
                            <div style={{ width: `${noPct}%`, height: "100%", backgroundColor: C.red }} />
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "700", color: C.green, ...mono }}>YES {yesPct}%</span>
                          <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{allOnQ.length} traders</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{item.time}</span>
                    </div>
                  );
                }
                /* Trade card (compact for arena feed) */
                const tradeAccent = item.type === "LONG" ? C.green : C.red;
                const DirIcon = item.type === "LONG" ? ArrowUp : ArrowDown;
                const levNum = parseInt(item.leverage);
                const levColor = levNum >= 10 ? C.red : levNum >= 5 ? C.amber : C.green;
                return (
                  <div key={item.id} style={{ ...cardStyle, padding: "8px 14px", borderLeft: `3px solid ${tradeAccent}`, display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "4px", backgroundColor: tradeAccent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <DirIcon size={12} color={tradeAccent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <TraderLink name={item.trader} />
                        <span style={{ fontWeight: "700", fontSize: "12px" }}>{item.pair}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: tradeAccent }}>{item.type}</span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: levColor, ...mono }}>{item.leverage}</span>
                        <span style={{ fontSize: "8px", fontWeight: "700", color: statusColors[item.status], backgroundColor: statusColors[item.status] + "18", padding: "1px 4px", borderRadius: "2px" }}>{statusLabels[item.status]}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", fontSize: "9px", color: C.textMuted, marginTop: "2px", ...mono }}>
                        <span>E ${item.entry.toLocaleString()}</span>
                        <span style={{ color: C.green }}>TP ${item.tp.toLocaleString()}</span>
                        <span style={{ color: C.red }}>SL ${item.sl.toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: "900", color: item.pnl >= 0 ? C.green : C.red, ...mono }}>{item.pnl >= 0 ? "+" : ""}${item.pnl.toLocaleString()}</div>
                    </div>
                    <span style={{ fontSize: "9px", color: C.textFaint, ...mono, minWidth: 30, textAlign: "right" }}>{item.time}</span>
                    {item.status === "active" && (
                      <button onClick={e => { e.stopPropagation(); handleCopy(item); }} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: copied[item.id] ? C.green : C.textFaint, padding: "2px", display: "flex" }}>
                        {copied[item.id] ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
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
        <StatCard label="Total Señales" value={filtered.length} icon={Zap} color={C.purple} />
        <StatCard label="% Ganadoras" value={total > 0 ? Math.round((wins / total) * 100) + "%" : "—"} icon={Trophy} color={C.green} tip="winRate" />
        <StatCard label="Ganancia Promedio" value={"$" + Math.round(filtered.reduce((a, s) => a + s.pnl, 0) / Math.max(filtered.length, 1)).toLocaleString()} icon={TrendingUp} color={C.blue} />
        <StatCard label="Activas Ahora" value={filtered.filter(s => s.status === "active").length} icon={Activity} color={C.amber} tip="signalActive" />
      </div>

      {/* Signal Cards (card view for better UX) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map(s => (
          <div key={s.id} style={{ ...cardStyle, borderLeft: `3px solid ${s.type === "LONG" ? C.green : C.red}`, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800" }}>{s.coin}/USDT</span>
                    <Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} />
                    <span style={{ fontSize: "12px", color: C.amber, fontWeight: "600", ...mono }}>{s.leverage}</span>
                    <Tag text={statusLabel[s.status]} color={statusColor[s.status]} />
                  </div>
                  <div style={{ fontSize: "10px", color: C.textFaint, marginTop: "3px" }}>{s.group} · {s.date}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: s.pnl > 0 ? C.green : s.pnl < 0 ? C.red : C.textMuted, ...mono }}>
                  {s.pnl !== 0 ? (s.pnl > 0 ? "+" : "") + "$" + s.pnl.toLocaleString() : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: C.textMuted, marginBottom: "6px" }}>
              <span><InfoTip k="entryZone" inline><span>Entrada:</span></InfoTip> <span style={{ color: C.text, ...mono }}>${s.entry.toLocaleString()}</span></span>
              <span><InfoTip k="tp" inline><span>TP:</span></InfoTip> <span style={{ color: C.green, ...mono }}>${s.tp.toLocaleString()}</span></span>
              <span><InfoTip k="sl" inline><span>SL:</span></InfoTip> <span style={{ color: C.red, ...mono }}>${s.sl.toLocaleString()}</span></span>
            </div>

            {/* TP Progress for active signals */}
            {s.status === "active" && <TpProgressBar entry={s.entry} tp={s.tp} sl={s.sl} status={s.status} />}

            {/* Quick Action */}
            {s.status === "active" && (
              <div style={{ marginTop: "6px" }}>
                <button style={{
                  display: "flex", alignItems: "center", gap: "3px", padding: "3px 10px", borderRadius: "4px",
                  cursor: "pointer", fontSize: "10px", fontWeight: "700",
                  backgroundColor: C.purpleBg, color: C.purple, border: "none"
                }}><Copy size={10} /> Copiar</button>
              </div>
            )}
          </div>
        ))}
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "130px" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: C.bg, border: `3px solid ${tierColor[t.tier]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>{t.avatar}</div>
          <div style={{ fontSize: "18px", fontWeight: "800", marginTop: "8px" }}>{t.name}</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
            <Tag text={t.tier} color={tierColor[t.tier]} />
            <BotTag isBot={t.isBot} />
            <span style={{ fontSize: "9px", color: C.textFaint }}>{titleByLevel(t.level)}</span>
          </div>
          {/* Alpha Score Badge */}
          {(() => { const alpha = calcAlphaScore(t); const aClr = alphaColor(alpha); return (
            <div style={{ marginTop: "10px", padding: "8px 16px", borderRadius: "8px", backgroundColor: `${aClr}12`, border: `1px solid ${aClr}30`, textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "900", color: aClr, ...mono, lineHeight: 1 }}>{alpha}</div>
              <div style={{ fontSize: "9px", fontWeight: "700", color: aClr, marginTop: "2px" }}>ALPHA {alphaLabel(alpha)}</div>
            </div>
          ); })()}
          {/* Badges summary */}
          {t.badges.length > 0 && (
            <div style={{ marginTop: "10px", fontSize: "10px", color: C.amber, fontWeight: "600" }}>
              {t.badges.length} badges earned
            </div>
          )}
          {/* Degen Score */}
          {(() => { const degen = calcDegenScore(t); return (
            <div style={{ marginTop: "8px", fontSize: "9px", fontWeight: "700", color: degen >= 60 ? C.red : degen >= 40 ? C.amber : C.green, padding: "3px 8px", borderRadius: "4px", backgroundColor: degen >= 60 ? C.redBg : degen >= 40 ? C.amberBg : C.greenBg }}>
              {degenLabel(degen)}
            </div>
          ); })()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: "1.6", marginBottom: "14px" }}>{t.bio}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[["Ranking", `#${t.rank}`, null], ["Ubicación", t.location, null], ["Desde", t.joined, null], ["Estilo", t.style, null],
              ["Exchange", t.exchange, null], ["Pares Fav.", t.favPairs.slice(0, 2).join(", "), null], ["Duración Prom.", t.avgHold, null], ["Riesgo:Gan.", t.avgRR, "rr"],
            ].map(([l, v, tip]) => (
              <div key={l}><div style={{ fontSize: "10px", color: C.textFaint, textTransform: "uppercase", fontWeight: "600" }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</div><div style={{ fontSize: "12px", fontWeight: "600", marginTop: "2px" }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "20px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
            {[["Seguidores", t.followers, null], ["Siguiendo", t.following, null], ["Copiadores", t.copiers, "copiers"], ["Trades", t.trades, null]].map(([l, v, tip]) => (
              <div key={l}><span style={{ fontSize: "16px", fontWeight: "800", ...mono }}>{v.toLocaleString()}</span><span style={{ fontSize: "11px", color: C.textMuted, marginLeft: "4px" }}>{tip ? <InfoTip k={tip} inline><span>{l}</span></InfoTip> : l}</span></div>
            ))}
          </div>
          {/* Social quick links */}
          {(() => {
            const socials = traderSocials[t.name] || {};
            const socialMeta = { twitter: { label: "X / Twitter", color: "#1DA1F2", icon: "𝕏" }, discord: { label: "Discord", color: "#5865F2", icon: "DC" }, telegram: { label: "Telegram", color: "#0088cc", icon: "TG" }, youtube: { label: "YouTube", color: "#FF0000", icon: "YT" }, website: { label: "Website", color: C.textMuted, icon: "WEB" } };
            const keys = Object.keys(socials);
            if (keys.length === 0) return null;
            return (
              <div style={{ display: "flex", gap: "6px", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                {keys.map(platform => {
                  const sm = socialMeta[platform];
                  if (!sm) return null;
                  return (
                    <button key={platform} title={`${sm.label}: ${socials[platform]}`} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${sm.color}30`, cursor: "pointer", backgroundColor: `${sm.color}10`, color: sm.color, fontSize: "10px", fontWeight: "700" }}>
                      <ExternalLink size={10} />
                      <span>{sm.icon}</span>
                      <span style={{ color: C.textMuted, fontWeight: "500" }}>{socials[platform]}</span>
                    </button>
                  );
                })}
                <button style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${C.purple}30`, cursor: "pointer", backgroundColor: C.purpleBg, color: C.purple, fontSize: "10px", fontWeight: "700" }}>
                  <MessageCircle size={10} /> Chat
                </button>
              </div>
            );
          })()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>
          {[["PnL Total", `+$${(t.pnl / 1000).toFixed(1)}K`, C.green, null], ["% Ganadoras", `${t.winRate}%`, C.green, "winRate"], ["Sharpe", t.sharpe.toFixed(1), C.blue, "sharpe"], ["Máx. Caída", `${t.maxDD}%`, C.red, "maxDD"], ["Factor Ganancia", t.profitFactor?.toFixed(1) || "—", C.amber, "profitFactor"], ["Racha", `${t.streak}W`, C.purple, "streak"]].map(([l, v, clr, tip]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", color: C.textMuted }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</span><span style={{ fontSize: "12px", fontWeight: "700", color: clr, ...mono }}>{v}</span>
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
                  <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}><span style={{ fontSize: "10px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><Heart size={9} /> {post.likes}</span><span style={{ fontSize: "10px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><MessageCircle size={9} /> {post.replies}</span></div>
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
            <StatCard label="Precisión" value={`${deep.signalStats.accuracy}%`} icon={Target} color={C.green} tip="winRate" />
            <StatCard label="Activas Ahora" value={deep.signalStats.active} icon={Activity} color={C.amber} tip="signalActive" />
            <StatCard label="Suscriptores" value={deep.signalStats.subscribers} icon={Users} color={C.blue} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <StatCard label="Ganancia Prom. / Señal" value={`$${deep.signalStats.avgPnlPerSignal.toLocaleString()}`} icon={TrendingUp} color={deep.signalStats.avgPnlPerSignal >= 0 ? C.green : C.red} />
            <StatCard label="Mejor Señal" value={`+$${deep.signalStats.bestSignal.toLocaleString()}`} icon={Trophy} color={C.green} />
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
                      <span><InfoTip k="entryZone" inline><span>Entrada:</span></InfoTip> <span style={{ color: C.text, ...mono }}>${s.entry.toLocaleString()}</span></span>
                      <span><InfoTip k="tp" inline><span>TP:</span></InfoTip> <span style={{ color: C.green, ...mono }}>${s.tp.toLocaleString()}</span></span>
                      <span><InfoTip k="sl" inline><span>SL:</span></InfoTip> <span style={{ color: C.red, ...mono }}>${s.sl.toLocaleString()}</span></span>
                      <span><InfoTip k="rr" inline><span>R:R</span></InfoTip> <span style={{ color: C.blue, ...mono }}>{s.rr}</span></span>
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
            <StatCard label="Precisión" value={`${Math.round((deep.predStats.correct / deep.predStats.total) * 100)}%`} sub={`${deep.predStats.correct}/${deep.predStats.total}`} icon={Target} color={C.green} tip="winRate" />
            <StatCard label="Racha Actual" value={`${deep.predStats.streak} correctas`} icon={Flame} color={C.amber} tip="streak" />
            <StatCard label="Total Apostado" value={`$${deep.predStats.totalStaked.toLocaleString()}`} icon={DollarSign} color={C.blue} tip="pot" />
            <StatCard label="Ganancia Neta" value={`+$${deep.predStats.totalWon.toLocaleString()}`} icon={Trophy} color={C.green} />
          </div>
          {/* Active bets */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Predicciones Activas</div>
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
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Historial de Predicciones</div>
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
              }}>{p === "all" ? "Todas" : p === "tradehub" ? "Tradethlon" : p === "twitter" ? "𝕏 Twitter" : p === "telegram" ? "Telegram" : p === "whatsapp" ? "WhatsApp" : p.charAt(0).toUpperCase() + p.slice(1)}</button>
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
                    <span style={{ fontSize: "11px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><Heart size={10} /> {post.likes.toLocaleString()}</span>
                    {post.retweets > 0 && <span style={{ fontSize: "11px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><RefreshCw size={10} /> {post.retweets}</span>}
                    <span style={{ fontSize: "11px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><MessageCircle size={10} /> {post.replies}</span>
                    {post.impressions > 0 && <span style={{ fontSize: "11px", color: C.textMuted }}><Eye size={10} /> {(post.impressions / 1000).toFixed(1)}K</span>}
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
                  <span style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: `${moodColors[entry.mood] || C.textMuted}20`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Circle size={10} color={moodColors[entry.mood] || C.textMuted} /></span>
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
  const tickerItems = [
    { text: "Scalp King +$2,340 (BTC LONG)", type: "trade" },
    { text: "WHALE ALERT: $3.2M BTC LONG opened", type: "whale" },
    { text: "Crypto Ninja +$890 (ETH SHORT)", type: "trade" },
    { text: "$1.2M LIQUIDATED — shorts rekt in 15min", type: "liquidation" },
    { text: "Smart Money +$1,560 (AVAX LONG)", type: "trade" },
    { text: "Phoenix Rise won 6th prediction in a row", type: "achievement" },
    { text: "Rocket Launch +$745 (BTC SHORT)", type: "trade" },
    { text: "Scalp King hit Alpha Score 87 — new season high", type: "achievement" },
    { text: "Bull Master -$420 (SOL LONG)", type: "loss" },
    { text: "DOGE +12.4% in 2h — meme szn is back", type: "moon" },
    { text: "Phoenix Rise +$2,100 (DOGE LONG)", type: "trade" },
    { text: "Diamond Hands: Smart Money held through -5.8% DD", type: "achievement" },
    { text: "Wave Rider +$320 (BTC LONG)", type: "trade" },
    { text: "3 traders entered PEPE before the pump", type: "signal" },
    { text: "Iron Fist -$180 (ETH LONG)", type: "loss" },
    { text: "567 copiers on Scalp King — WAGMI", type: "social" },
  ];
  const tickerTypeIcon = { trade: Zap, whale: Eye, liquidation: AlertTriangle, achievement: Award, loss: TrendingDown, moon: TrendingUp, signal: Lightbulb, social: Users };
  const tickerTypeColor = { trade: C.green, whale: C.cyan, liquidation: C.red, achievement: C.purple, loss: C.red, moon: C.amber, signal: C.blue, social: C.amber };

  const repeatedItems = [...tickerItems, ...tickerItems];

  return (
    <div style={{
      height: 32, backgroundColor: C.bg, borderBottom: `1px solid ${C.border}`,
      overflow: "hidden", display: "flex", alignItems: "center", position: "fixed", top: 0, left: 0, right: 0, zIndex: 400
    }}>
      <style>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div style={{
        display: "flex", whiteSpace: "nowrap", animation: "tickerScroll 60s linear infinite",
        fontSize: "12px", fontWeight: "600", color: C.text, gap: "24px", ...mono
      }}>
        {repeatedItems.map((item, i) => {
          const TIcon = tickerTypeIcon[item.type];
          const tColor = tickerTypeColor[item.type] || C.text;
          return (
            <span key={i} style={{ color: tColor, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <TIcon size={10} /> {item.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════ TAB 3: TRADERS ═══════════════════════ */
const TradersTab = () => {
  const [view, setView] = useState("leaderboard");
  const [compareMetric, setCompareMetric] = useState("equity");
  const [traderFilter, setTraderFilter] = useState("all");
  const [sortField, setSortField] = useState("pnl");
  const { openProfile } = useProfile();
  const { followedTraders, setFollowedTraders, traderAlerts, setTraderAlerts } = useWatchlist();
  const [visibleTraders, setVisibleTraders] = useState(() => {
    const m = {};
    mockTraders.forEach((t, i) => { m[t.name] = i < 3; });
    return m;
  });
  const tierColor = { Diamond: C.cyan, Platinum: C.purple, Gold: C.amber, Silver: C.textMuted };
  const rankColors = [C.amber, C.textMuted, "#cd7f32"]; // gold, silver, bronze
  const toggleTrader = (name) => setVisibleTraders(prev => ({ ...prev, [name]: !prev[name] }));
  const allOn = mockTraders.every(t => visibleTraders[t.name]);
  const toggleAll = () => { const next = {}; mockTraders.forEach(t => { next[t.name] = !allOn; }); setVisibleTraders(next); };

  const seasonEnd = new Date(2026, 3, 1);
  const now = new Date();
  const daysLeft = Math.max(0, Math.floor((seasonEnd - now) / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor(((seasonEnd - now) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  const getFlames = (streak) => {
    if (streak >= 10) return <Flame size={12} color={C.amber} />;
    if (streak >= 5) return <Flame size={10} color={C.textMuted} />;
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Season 1 Battle Pass Banner ── */}
      <div style={{ ...cardStyle, borderLeft: `4px solid ${C.purple}`, background: `linear-gradient(135deg, ${C.card} 0%, ${C.bg} 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Trophy size={22} color={C.amber} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "1px" }}>SEASON 1</span>
                <span style={{ fontSize: "10px", fontWeight: "700", color: C.green, padding: "2px 8px", borderRadius: "4px", backgroundColor: C.greenBg, border: `1px solid ${C.green}30` }}>LIVE</span>
              </div>
              <div style={{ fontSize: "11px", color: C.textMuted }}>MARCH 2026 · {mockTraders.length} traders competing</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: C.amber, ...mono }}>{daysLeft}d {hoursLeft}h</div>
              <div style={{ fontSize: "9px", color: C.textFaint, textTransform: "uppercase" }}>remaining</div>
            </div>
            <div style={{ width: "1px", height: "28px", backgroundColor: C.border }} />
            <div style={{ fontSize: "20px", fontWeight: "900", color: C.amber, ...mono }}>$50K</div>
          </div>
        </div>

        {/* Battle Pass Tiers */}
        <div style={{ display: "flex", gap: "4px", alignItems: "stretch", marginBottom: "12px" }}>
          {[
            { tier: "Silver", range: "Rank 7-8", color: C.textMuted, pct: 100 },
            { tier: "Gold", range: "Rank 5-6", color: C.amber, pct: 100 },
            { tier: "Platinum", range: "Rank 3-4", color: C.purple, pct: 100 },
            { tier: "Diamond", range: "Rank 1-2", color: C.cyan, pct: 100 },
            { tier: "Champion", range: "Rank 1", color: "#ffd700", pct: 50 },
          ].map((bp, i) => (
            <div key={bp.tier} style={{ flex: 1, position: "relative" }}>
              <div style={{ height: "6px", backgroundColor: `${bp.color}25`, borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${bp.pct}%`, height: "100%", backgroundColor: bp.color, borderRadius: "3px" }} />
              </div>
              <div style={{ textAlign: "center", marginTop: "4px" }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: bp.color }}>{bp.tier}</div>
                <div style={{ fontSize: "8px", color: C.textFaint }}>{bp.range}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Prizes row */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
          {[
            ["1", "$25K", "+ Diamond Frame + Lifetime Badge", C.amber],
            ["2", "$15K", "+ Platinum Frame", "#c0c0c0"],
            ["3", "$10K", "+ Gold Frame", "#cd7f32"],
          ].map(([rank, prize, extras, clr]) => (
            <div key={rank} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", color: clr, ...mono }}>{rank}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: clr, ...mono }}>{prize}</div>
                <div style={{ fontSize: "8px", color: C.textFaint }}>{extras}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {[{id:"leaderboard",label:"Leaderboard"},{id:"compare",label:"Compare"},{id:"profiles",label:"Profiles"},{id:"heatmap",label:"Heatmap"},{id:"copy",label:"Copy Trading"}].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: "8px 16px", borderRadius: "6px", border: `1px solid ${view === v.id ? C.purple : C.border}`,
            backgroundColor: view === v.id ? C.purpleBg : "transparent", color: view === v.id ? C.purple : C.textMuted,
            fontSize: "11px", fontWeight: "600", cursor: "pointer"
          }}>{v.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Toolbar: filter by type, sort, add */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {[
            { id: "all", label: "Todos", icon: Users },
            { id: "human", label: "Traders", icon: Activity },
            { id: "bot", label: "Bots", icon: Bot },
            { id: "followed", label: "Siguiendo", icon: Star },
          ].map(cat => (
            <button key={cat.id} onClick={() => setTraderFilter(cat.id)} style={{
              display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
              border: `1px solid ${traderFilter === cat.id ? C.purple : C.border}`,
              backgroundColor: traderFilter === cat.id ? C.purpleBg : "transparent",
              color: traderFilter === cat.id ? C.purple : C.textMuted
            }}>
              <cat.icon size={11} /> {cat.label}
            </button>
          ))}
          <div style={{ width: "1px", height: 20, backgroundColor: C.border, margin: "0 4px" }} />
          <button onClick={() => setSortField(prev => prev === "pnl" ? "winRate" : prev === "winRate" ? "alpha" : "pnl")} title={`Ordenar por ${sortField}`} style={{ display: "flex", alignItems: "center", gap: "3px", padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted }}>
            <ArrowDown size={11} /> {sortField === "pnl" ? "PnL" : sortField === "winRate" ? "Win%" : "Alpha"}
          </button>
        </div>
      </div>

      {view === "leaderboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {[["Rank",null],["Trader",null],["Alpha","alpha"],["Trend",null],["Racha","streak"],["% Ganadoras","winRate"],["PnL",null],["Copiadores","copiers"],["Acción",null]].map(([h,tip]) => <th key={h} style={thStyle}>{tip ? <InfoTip k={tip}><span>{h}</span></InfoTip> : h}</th>)}
              </tr></thead>
              <tbody>
                {(() => {
                  let filtered = [...mockTraders];
                  if (traderFilter === "human") filtered = filtered.filter(t => !t.isBot);
                  else if (traderFilter === "bot") filtered = filtered.filter(t => t.isBot);
                  else if (traderFilter === "followed") filtered = filtered.filter(t => followedTraders[t.name]);
                  filtered.sort((a, b) => {
                    if (sortField === "pnl") return b.pnl - a.pnl;
                    if (sortField === "winRate") return b.winRate - a.winRate;
                    return calcAlphaScore(b) - calcAlphaScore(a);
                  });
                  return filtered;
                })().map((t, i) => {
                  const isTop1 = i === 0;
                  const alpha = calcAlphaScore(t);
                  const aClr = alphaColor(alpha);
                  const isHotStreak = t.streak >= 10;
                  return (
                  <tr key={t.name} style={{ backgroundColor: i % 2 === 0 ? "transparent" : C.cardHover }}>
                    <td style={{ ...tdStyle, fontWeight: "800", fontSize: "14px", borderLeft: isTop1 ? `3px solid ${C.amber}` : "none", color: i < 3 ? rankColors[i] : C.textMuted, ...mono }}>
                      {i + 1}
                    </td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <TraderLink name={t.name} />
                            <BotTag isBot={t.isBot} />
                            <span style={pillStyle(tierColor[t.tier])}>{t.tier}</span>
                            <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>LVL {t.level}</span>
                          </div>
                          {t.badges.length > 0 && (
                            <div style={{ marginTop: "3px" }}>
                              <span style={{ fontSize: "9px", color: C.amber, fontWeight: "600" }}>{t.badges.length} badges</span>
                            </div>
                          )}
                        </div>
                        {t.viewersNow > 20 && <span style={{ fontSize: "9px", color: C.green, fontWeight: "600", marginLeft: "auto" }}><Eye size={9} /> {t.viewersNow}</span>}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "800", color: aClr, ...mono }}>{alpha}</span>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: aClr, padding: "1px 5px", borderRadius: "3px", backgroundColor: `${aClr}18` }}>{alphaLabel(alpha)}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle }}>
                      <MiniSparkline data={t.sparkData} width={56} height={18} />
                    </td>
                    <td style={{ ...tdStyle, fontSize: "13px", fontWeight: "600" }}>
                      <span style={isHotStreak ? { textShadow: `0 0 8px ${C.amber}60` } : undefined}>
                        {getFlames(t.streak)}<span style={{ marginLeft: "4px", color: isHotStreak ? C.amber : C.text }}>{t.streak}</span>
                      </span>
                    </td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ ...mono, color: C.green, fontWeight: "600" }}>{t.winRate}%</span>
                        <div style={{ width: "48px", height: "2px", backgroundColor: C.border, borderRadius: "1px", overflow: "hidden" }}>
                          <div style={{ width: `${t.winRate}%`, height: "100%", backgroundColor: C.green }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(t.pnl / 1000).toFixed(1)}K</td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", ...mono }}>
                        <Users size={12} color={C.textMuted} /> {t.copiers}
                      </div>
                    </td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <button title="Seguir" onClick={e => { e.stopPropagation(); setFollowedTraders(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: followedTraders[t.name] ? C.amber + "20" : "transparent", color: followedTraders[t.name] ? C.amber : C.textFaint }}>
                          <Star size={13} fill={followedTraders[t.name] ? C.amber : "none"} />
                        </button>
                        <button title="Alertas" onClick={e => { e.stopPropagation(); setTraderAlerts(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "none", cursor: "pointer", backgroundColor: traderAlerts[t.name] ? C.blue + "20" : "transparent", color: traderAlerts[t.name] ? C.blue : C.textFaint }}>
                          <BellRing size={13} />
                        </button>
                        <button onClick={() => openProfile(t)} style={{
                          padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                          backgroundColor: C.green, color: C.bg, border: "none", display: "flex", alignItems: "center", gap: "3px"
                        }}><Copy size={10} /> Copy</button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>

          <div style={{ ...cardStyle }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Signal Groups</div>
            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  {["Rank","Group","Members","Win Rate","Monthly PnL","Signals","Accuracy","Hot"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {mockGroups.map((g, i) => (
                  <tr key={g.name} style={{ backgroundColor: i % 2 === 0 ? "transparent" : C.cardHover }}>
                    <td style={{ ...tdStyle, fontWeight: "800", fontSize: "13px", color: i < 3 ? rankColors[i] : C.textMuted, ...mono }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{g.name}</td>
                    <td style={{ ...tdStyle, ...mono }}>{g.members}</td>
                    <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>{g.winRate}%</td>
                    <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "600" }}>+${(g.monthlyPnl / 1000).toFixed(1)}K</td>
                    <td style={{ ...tdStyle, ...mono }}>{g.signals}</td>
                    <td style={{ ...tdStyle, ...mono, color: C.amber, fontWeight: "600" }}>{g.accuracy}%</td>
                    <td style={{ ...tdStyle, fontSize: "13px", fontWeight: "600" }}>{getFlames(Math.max(...mockTraders.map(t => t.streak))) || "—"}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
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
          { id: "equity", label: "Equity" },
          { id: "signals", label: "Señales" },
          { id: "trades", label: "Trades" },
          { id: "predictions", label: "Predictions" },
        ];
        return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...cardStyle, display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
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
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                  border: `1px solid ${on ? color : C.border}`,
                  backgroundColor: on ? color + "18" : "transparent",
                  color: on ? color : C.textFaint, transition: "all 0.15s"
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: on ? color : C.textFaint, transition: "background-color 0.15s" }} />
                  {t.name}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {compareMetrics.map(m => (
              <button key={m.id} onClick={() => setCompareMetric(m.id)} style={{
                padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${compareMetric === m.id ? C.purple : C.border}`,
                backgroundColor: compareMetric === m.id ? C.purpleBg : "transparent",
                color: compareMetric === m.id ? C.purple : C.textMuted,
                display: "flex", alignItems: "center", gap: "6px"
              }}>{m.label}</button>
            ))}
          </div>

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
                      <tr key={t.name} className="hoverable" style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}><TraderLink name={t.name}>{t.name}</TraderLink></td>
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
                      <tr key={t.name} className="hoverable" style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}><TraderLink name={t.name}>{t.name}</TraderLink></td>
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
                      <tr key={t.name} className="hoverable" style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}><TraderLink name={t.name}>{t.name}</TraderLink></td>
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
                      <tr key={t.name} className="hoverable" style={{ cursor: "pointer" }} onClick={() => openProfile(t)}>
                        <td style={{ ...tdStyle, width: "30px" }}><div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: traderColors[i] }} /></td>
                        <td style={{ ...tdStyle, fontWeight: "600" }}><TraderLink name={t.name}>{t.name}</TraderLink></td>
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
            const alpha = calcAlphaScore(t);
            const aClr = alphaColor(alpha);
            const degen = calcDegenScore(t);
            return (
            <div key={t.name} style={{ ...cardStyle, cursor: "pointer", borderLeft: isTopRanked ? `3px solid ${C.amber}` : `1px solid ${C.border}`, transition: "border-color 0.15s" }} onClick={() => openProfile(t)}>
              {/* Header: avatar + name + Alpha Score */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: C.cardHover, border: `2px solid ${tierColor[t.tier]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                  {t.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700" }}>{t.name}</span>
                    {t.viewersNow > 15 && <span style={{ fontSize: "9px", color: C.green, fontWeight: "600" }}><Eye size={9} /> {t.viewersNow} watching</span>}
                  </div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>#{t.rank} · {t.style} · {t.exchange}</div>
                </div>
                {/* Alpha Score Badge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "48px" }}>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: aClr, ...mono, lineHeight: 1 }}>{alpha}</div>
                  <div style={{ fontSize: "8px", fontWeight: "700", color: aClr, textTransform: "uppercase" }}>Alpha {alphaLabel(alpha)}</div>
                </div>
              </div>

              {/* Tier + Level + Sparkline */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <Tag text={t.tier} color={tierColor[t.tier]} />
                <span style={pillStyle(C.purple)}>LVL {t.level}</span>
                <span style={{ fontSize: "9px", color: C.textFaint }}>{title}</span>
                <div style={{ marginLeft: "auto" }}><MiniSparkline data={t.sparkData} width={64} height={20} /></div>
              </div>

              {/* XP Progress */}
              <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "10px", color: C.textMuted }}>XP to Level {t.level + 1}</span>
                  <span style={{ fontSize: "10px", fontWeight: "600", color: C.textMuted, ...mono }}>{t.xp}/{t.xpNext}</span>
                </div>
                <div style={{ width: "100%", height: "2px", backgroundColor: C.border, borderRadius: "1px", overflow: "hidden" }}>
                  <div style={{ width: `${xpPct}%`, height: "100%", backgroundColor: C.blue, borderRadius: "2px", transition: "width 0.3s" }} />
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", paddingBottom: "10px", borderBottom: `1px solid ${C.border}`, marginBottom: "10px" }}>
                {[
                  ["Win Rate", t.winRate + "%", C.green],
                  ["PnL", "+$" + (t.pnl / 1000).toFixed(1) + "K", C.green],
                  ["Sharpe", t.sharpe.toFixed(1), C.blue],
                  ["Max DD", t.maxDD + "%", C.red],
                  ["Copiers", t.copiers, C.purple],
                  ["Trades", t.trades, C.textMuted],
                ].map(([l, v, clr]) => (
                  <div key={l}>
                    <div style={{ fontSize: "9px", color: C.textFaint, textTransform: "uppercase" }}>{l}</div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: clr, ...mono }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Streak + Degen Score */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                  <span>{getFlames(t.streak)}</span>
                  <span style={{ color: C.amber }}>{t.streak}W Streak</span>
                </div>
                <div style={{ fontSize: "9px", fontWeight: "700", color: degen >= 60 ? C.red : degen >= 40 ? C.amber : C.green, padding: "2px 6px", borderRadius: "3px", backgroundColor: degen >= 60 ? C.redBg : degen >= 40 ? C.amberBg : C.greenBg }}>
                  {degenLabel(degen)}
                </div>
              </div>

              {/* Badges count */}
              {t.badges.length > 0 && (
                <div style={{ marginBottom: "10px", fontSize: "10px", color: C.amber, fontWeight: "600" }}>
                  {t.badges.length} badges
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openProfile(t)} style={{
                  flex: 1, padding: "7px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                  border: `1px solid ${C.purple}`, backgroundColor: "transparent", color: C.purple
                }}>View Profile</button>
                <button onClick={() => openProfile(t)} style={{
                  flex: 1, padding: "7px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                  backgroundColor: C.green, color: C.bg, border: "none",
                  boxShadow: "0 0 10px rgba(63,185,80,0.25)"
                }}>Copy Trader</button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {view === "heatmap" && <HeatmapView />}

      {view === "copy" && <CopyTradingView />}
    </div>
  );
};

/* ═══════════════════════ TAB 4: HEATMAP ═══════════════════════ */
const HeatmapView = () => {
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
                  <div style={{ flex: 1, display: "flex", height: "2px", borderRadius: "1px", overflow: "hidden", gap: "1px" }}>
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
const CopyTradingView = () => {
  const [selected, setSelected] = useState(0);
  const [riskMult, setRiskMult] = useState(1.0);
  const [copying, setCopying] = useState({});
  const [allocation, setAllocation] = useState(1000);
  const [showConfirm, setShowConfirm] = useState(false);
  const [maxDDStop, setMaxDDStop] = useState(false);
  const port = copyPortfolios[selected];
  const riskColor = { "Low": C.green, "Medium": C.amber, "Medium-High": C.amber, "High": C.red };

  // Find copiers count from mockTraders by matching name
  const traderData = mockTraders.find(t => t.name === port.name);
  const copiers = traderData ? traderData.copiers : 0;
  const isHot = copiers > 300;
  const projectedMonthly = (allocation * port.monthlyReturn / 100 * riskMult).toFixed(0);
  const projectedFee = (projectedMonthly * port.fee / 100).toFixed(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ fontSize: "18px", fontWeight: "700" }}>Copy Trading</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {copyPortfolios.map((p, i) => {
            const td = mockTraders.find(t => t.name === p.name);
            const ret = p.monthlyReturn;
            return (
              <button key={p.name} onClick={() => setSelected(i)} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${selected === i ? C.purple : C.border}`,
                backgroundColor: selected === i ? C.purpleBg : "transparent",
                color: selected === i ? C.purple : C.textMuted
              }}>{p.name} {ret >= 0 ? "+" : ""}{ret}%</button>
            );
          })}
        </div>
      </div>

      {/* Top Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Retorno Mensual" value={`+${port.monthlyReturn}%`} sub={`Sharpe ${port.sharpe}`} icon={TrendingUp} color={C.green} tip="sharpe" />
        <StatCard label="Seguidores" value={port.followers.toLocaleString()} sub={`$${(port.aum / 1e6).toFixed(1)}M en gestión`} icon={Users} color={C.blue} tip="aum" />
        <StatCard label="Máxima Caída" value={`${port.maxDD}%`} sub={`Riesgo: ${port.riskLevel}`} icon={AlertTriangle} color={riskColor[port.riskLevel] || C.amber} tip="maxDD" />
        <StatCard label="% Ganadoras" value={`${port.winRate}%`} sub={`Duración prom: ${port.avgTrade}`} icon={Trophy} color={C.amber} tip="winRate" />
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
              <div style={{ fontSize: "11px", fontWeight: "700", color: C.green, display: "flex", alignItems: "center", gap: "6px" }}>
                <Circle size={8} fill={C.green} color={C.green} /> {copiers} copiando ahora
                {isHot && <span style={{ fontSize: "10px", fontWeight: "700", color: C.amber, display: "inline-flex", alignItems: "center", gap: "3px", backgroundColor: C.amberBg, padding: "2px 6px", borderRadius: "3px", marginLeft: "6px" }}><Flame size={9} /> Hot</span>}
              </div>
            </div>

            {/* Allocation Input */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Capital a invertir</div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                {[500, 1000, 2500, 5000].map(amt => (
                  <button key={amt} onClick={() => setAllocation(amt)} style={{
                    flex: 1, padding: "6px 2px", borderRadius: "5px", fontSize: "10px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${allocation === amt ? C.green : C.border}`,
                    backgroundColor: allocation === amt ? C.greenBg : "transparent",
                    color: allocation === amt ? C.green : C.textMuted, ...mono
                  }}>${amt >= 1000 ? `${amt/1000}K` : amt}</button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: C.textFaint, fontSize: "13px", fontWeight: "700", ...mono }}>$</span>
                <input type="number" value={allocation} onChange={e => setAllocation(Math.max(0, parseInt(e.target.value) || 0))} style={{
                  width: "100%", padding: "10px 10px 10px 22px", borderRadius: "6px", border: `1px solid ${C.border}`,
                  backgroundColor: C.bg, color: C.text, fontSize: "14px", fontWeight: "700", ...mono, outline: "none",
                  boxSizing: "border-box"
                }} />
              </div>
              {allocation < port.minInvest && <div style={{ fontSize: "10px", color: C.red, marginTop: "4px" }}>Mínimo: ${port.minInvest}</div>}
            </div>

            {/* Risk Multiplier */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "6px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}><InfoTip k="leverage"><span>Multiplicador de riesgo</span></InfoTip></div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0.5, 0.75, 1.0, 1.5, 2.0].map(m => (
                  <button key={m} onClick={() => setRiskMult(m)} style={{
                    flex: 1, padding: "7px 2px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                    border: `1px solid ${riskMult === m ? C.purple : C.border}`,
                    backgroundColor: riskMult === m ? C.purpleBg : "transparent",
                    color: riskMult === m ? C.purple : C.textMuted
                  }}>{m}x</button>
                ))}
              </div>
              {riskMult > 1.0 && <div style={{ fontSize: "10px", color: C.amber, marginTop: "4px" }}>Mayor riesgo = mayores ganancias y pérdidas</div>}
            </div>

            {/* Drawdown Stop Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600" }}><InfoTip k="maxDD"><span>Auto-stop por DD</span></InfoTip></div>
                <div style={{ fontSize: "9px", color: C.textFaint }}>Parar si caída supera {port.maxDD}%</div>
              </div>
              <button onClick={() => setMaxDDStop(!maxDDStop)} style={{ backgroundColor: "transparent", border: "none", cursor: "pointer", color: maxDDStop ? C.green : C.textFaint }}>
                {maxDDStop ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
            </div>

            {/* Projected Returns */}
            <div style={{ marginBottom: "12px", padding: "10px", backgroundColor: `${C.purple}08`, borderRadius: "6px", border: `1px solid ${C.purple}20` }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "6px", fontWeight: "600", textTransform: "uppercase" }}>Proyección mensual</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "20px", fontWeight: "800", color: C.green, ...mono }}>+${projectedMonthly}</span>
                <span style={{ fontSize: "10px", color: C.textFaint }}>- ${projectedFee} comisión</span>
              </div>
              <div style={{ fontSize: "9px", color: C.textFaint, marginTop: "4px" }}>Basado en rendimiento pasado. No garantiza resultados futuros.</div>
            </div>

            {/* Info rows */}
            {[
              ["Comisión", `${port.fee}%`, "perfFee"],
              ["Inversión Mín.", `$${port.minInvest}`, null],
              ["Nivel de Riesgo", port.riskLevel, "riskLevel"],
              ["Duración Prom.", port.avgTrade, null],
            ].map(([l, v, tip]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "11px" }}>
                <span style={{ color: C.textMuted }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</span>
                <span style={{ fontWeight: "600", ...mono }}>{v}</span>
              </div>
            ))}

            {/* Copy Button */}
            {copying[port.name] ? (
              <button onClick={() => setCopying(prev => ({ ...prev, [port.name]: false }))} style={{
                width: "100%", marginTop: "14px", padding: "11px", borderRadius: "8px", border: "none", cursor: "pointer",
                backgroundColor: C.red, color: "#fff",
                fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}>
                <Pause size={14} /> Detener Copia
              </button>
            ) : (
              <button onClick={() => setShowConfirm(true)} disabled={allocation < port.minInvest} style={{
                width: "100%", marginTop: "14px", padding: "11px", borderRadius: "8px", border: "none", cursor: allocation < port.minInvest ? "not-allowed" : "pointer",
                backgroundColor: allocation < port.minInvest ? C.textFaint : C.green,
                color: allocation < port.minInvest ? C.textMuted : "#000",
                fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: allocation >= port.minInvest ? "0 0 12px rgba(63,185,80,0.3)" : "none",
                opacity: allocation < port.minInvest ? 0.5 : 1
              }}>
                <Play size={14} /> Empezar a Copiar
              </button>
            )}

            {/* Confirmation Dialog */}
            {showConfirm && !copying[port.name] && (
              <div style={{ marginTop: "10px", padding: "12px", backgroundColor: C.bg, borderRadius: "8px", border: `1px solid ${C.amber}40` }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: C.amber, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={14} /> Confirmar copia
                </div>
                <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", lineHeight: 1.5 }}>
                  Vas a copiar a <strong style={{ color: C.text }}>{port.name}</strong> con <strong style={{ color: C.text }}>${allocation.toLocaleString()}</strong> a riesgo <strong style={{ color: C.purple }}>{riskMult}x</strong>.
                  {maxDDStop && <> Auto-stop activado al <strong style={{ color: C.red }}>{port.maxDD}%</strong> de caída.</>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setShowConfirm(false)} style={{
                    flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "transparent",
                    color: C.textMuted, fontSize: "11px", fontWeight: "600", cursor: "pointer"
                  }}>Cancelar</button>
                  <button onClick={() => { setCopying(prev => ({ ...prev, [port.name]: true })); setShowConfirm(false); }} style={{
                    flex: 1, padding: "8px", borderRadius: "6px", border: "none", backgroundColor: C.green,
                    color: "#000", fontSize: "11px", fontWeight: "800", cursor: "pointer"
                  }}>Confirmar</button>
                </div>
              </div>
            )}
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
              ["Ratio Sharpe", port.sharpe.toFixed(1), C.blue, "sharpe"],
              ["Máxima Caída", `${port.maxDD}%`, C.red, "maxDD"],
              ["% Ganadoras", `${port.winRate}%`, C.green, "winRate"],
              ["Seguidores", port.followers.toLocaleString(), C.purple, "copiers"],
              ["En Gestión", `$${(port.aum / 1e6).toFixed(1)}M`, C.amber, "aum"],
            ].map(([l, v, clr, tip]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                <span style={{ color: C.textMuted }}><InfoTip k={tip}><span>{l}</span></InfoTip></span>
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
            {[["Trader",null],["Retorno/Mes",null],["Sharpe","sharpe"],["% Ganadoras","winRate"],["Máx. Caída","maxDD"],["Seguidores","copiers"],["En Gestión","aum"],["Comisión","perfFee"],["Riesgo","riskLevel"],["Hot",null],["Estado",null]].map(([h,tip]) => <th key={h} style={thStyle}>{tip ? <InfoTip k={tip}><span>{h}</span></InfoTip> : h}</th>)}
          </tr></thead>
          <tbody>
            {copyPortfolios.map((p, i) => {
              const td = mockTraders.find(t => t.name === p.name);
              const porCopiers = td ? td.copiers : 0;
              const portIsHot = porCopiers > 300;
              return (
              <tr key={p.name} style={{ backgroundColor: i === selected ? C.purpleBg : i % 2 === 0 ? "transparent" : C.cardHover, cursor: "pointer" }} onClick={() => setSelected(i)}>
                <td style={tdStyle}><TraderLink name={p.name}>{p.name}</TraderLink></td>
                <td style={{ ...tdStyle, ...mono, color: C.green, fontWeight: "700" }}>+{p.monthlyReturn}%</td>
                <td style={{ ...tdStyle, ...mono, color: C.blue, fontWeight: "600" }}>{p.sharpe}</td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "600" }}>{p.winRate}%</td>
                <td style={{ ...tdStyle, ...mono, color: C.red }}>{p.maxDD}%</td>
                <td style={{ ...tdStyle, ...mono }}>{p.followers.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono }}>${(p.aum / 1e6).toFixed(1)}M</td>
                <td style={{ ...tdStyle, ...mono }}>{p.fee}%</td>
                <td style={tdStyle}><Tag text={p.riskLevel} color={riskColor[p.riskLevel] || C.amber} /></td>
                <td style={tdStyle}>{portIsHot ? <Flame size={14} color={C.amber} /> : <span style={{ color: C.textFaint }}>—</span>}</td>
                <td style={tdStyle}>
                  {copying[p.name]
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: C.green, fontWeight: "600" }}><CheckCircle size={12} /> Copiando</span>
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
  const avgYesOdds = Math.round(predictionMarkets.reduce((a, m) => a + m.yesOdds, 0) / predictionMarkets.length);
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
        <div style={{ fontSize: "18px", fontWeight: "700" }}>Predicciones del Mercado</div>
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

      {/* Stats with trend sub-text */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Volumen Total" value={`$${(totalVolume / 1000).toFixed(0)}K`} sub="+8.2% semana" icon={DollarSign} color={C.green} tip="pot" />
        <StatCard label="Participantes" value={totalParticipants.toLocaleString()} sub="+240 activos" icon={Users} color={C.blue} />
        <StatCard label="Mercados Activos" value={predictionMarkets.length} sub="2 resueltos" icon={Activity} color={C.purple} />
        <StatCard label="Sentimiento" value={`${avgYesOdds}% YES`} sub="Tendencia alcista" icon={Flame} color={C.amber} tip="odds" />
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {predCategories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding: "7px 18px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
            border: `1px solid ${catFilter === c ? C.purple : C.border}`,
            backgroundColor: catFilter === c ? C.purpleBg : "transparent",
            color: catFilter === c ? C.purple : C.textMuted
          }}>{c}</button>
        ))}
      </div>

      {/* Market Cards - 2 column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {filtered.map(m => {
          const userBet = userBets[m.id];
          return (
            <div key={m.id} style={{ ...cardStyle, border: m.trending ? `2px solid ${C.amber}` : `1px solid ${C.border}`, position: "relative" }}>
              {m.trending && (
                <div style={{ position: "absolute", top: "10px", right: "10px" }}><Flame size={16} color={C.amber} /></div>
              )}

              {/* Question - 16px bold, max 2 lines */}
              <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px", paddingRight: m.trending ? "30px" : 0, lineHeight: "1.4", maxHeight: "3.2em", overflow: "hidden" }}>{m.question}</div>

              {/* Odds tug-of-war bar - 24px height, visual battle */}
              <div style={{ display: "flex", height: "24px", borderRadius: "6px", overflow: "hidden", marginBottom: "14px", gap: "0px", border: `1px solid ${C.border}` }}>
                <div style={{ flex: m.yesOdds, backgroundColor: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#fff" }}>
                  {m.yesOdds > 30 ? `${m.yesOdds}%` : ""}
                </div>
                <div style={{ flex: m.noOdds, backgroundColor: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#fff" }}>
                  {m.noOdds > 30 ? `${m.noOdds}%` : ""}
                </div>
              </div>

              {/* YES / NO buttons - side by side, 50% width each */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button onClick={() => placeBet(m.id, "yes")} style={{
                  flex: 1, padding: "12px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", textTransform: "uppercase",
                  border: userBet === "yes" ? `2px solid ${C.green}` : `2px solid ${C.green}40`,
                  backgroundColor: userBet === "yes" ? C.green : "transparent",
                  color: userBet === "yes" ? "#000" : C.green
                }}>YES</button>
                <button onClick={() => placeBet(m.id, "no")} style={{
                  flex: 1, padding: "12px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", textTransform: "uppercase",
                  border: userBet === "no" ? `2px solid ${C.red}` : `2px solid ${C.red}40`,
                  backgroundColor: userBet === "no" ? C.red : "transparent",
                  color: userBet === "no" ? "#fff" : C.red
                }}>NO</button>
              </div>

              {/* Pot size - centered, purple monospace */}
              <div style={{ textAlign: "center", marginBottom: "12px", fontSize: "14px", fontWeight: "700", color: C.purple, ...mono }}>
                <InfoTip k="pot"><span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><DollarSign size={10} /> Pozo: ${(m.volume / 1000).toFixed(0)}K</span></InfoTip>
              </div>

              {/* Your position indicator */}
              {userBet && (
                <div style={{ marginBottom: "12px", fontSize: "12px", fontWeight: "600", color: userBet === "yes" ? C.green : C.red, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: userBet === "yes" ? C.green : C.red }}>{userBet === "yes" ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}</span> Your bet: {userBet.toUpperCase()}
                </div>
              )}

              {/* Metadata row - category, deadline, participants */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "11px", color: C.textMuted }}>
                <Tag text={m.category} color={C.blue} />
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={11} /> {m.deadline}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Users size={11} /> {m.participants}
                </span>
              </div>
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
          <Gamepad2 size={20} color={C.purple} />
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
              <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}><Gamepad2 size={13} /> Campo de Juego</div>
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
            <div style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><Trophy size={14} /> Scoreboard</div>
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
                  <div style={{ height: "2px", backgroundColor: C.border, borderRadius: "1px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: clr, borderRadius: "2px" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estadísticas */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><BarChart3 size={12} /> Estadísticas</div>
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
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}><Trophy size={10} color={C.amber} /> Mejor Jugador</div>
              <div style={{ fontSize: "14px", fontWeight: "700" }}><TraderLink name={bestPlayer.name}>{bestPlayer.name}</TraderLink></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Jugadores Activos ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}><Users size={14} /> Jugadores Activos</div>
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
                      <span style={{ color: p.status === "Win" ? C.green : C.red }}>{p.status === "Win" ? <CheckCircle size={10} /> : <TrendingDown size={10} />}</span> {p.status}
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
    >{children || trader.name}</span>
  );
};

/* ═══════════════════════ FEED FILTER CONTEXT ═══════════════════════ */
const FeedFilterContext = createContext();
const useFeedFilter = () => useContext(FeedFilterContext);

/* ═══════════════════════ WATCHLIST CONTEXT ═══════════════════════ */
const WatchlistContext = createContext();
const useWatchlist = () => useContext(WatchlistContext);

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
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState("1m");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [profileTrader, setProfileTrader] = useState(null);
  const [feedFilter, setFeedFilter] = useState("all");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlistSearch, setWatchlistSearch] = useState("");
  const [watchlistCategory, setWatchlistCategory] = useState("all");
  const [followedTraders, setFollowedTraders] = useState(() => {
    const initial = {};
    mockTraders.slice(0, 4).forEach(t => { initial[t.name] = true; });
    return initial;
  });
  const [traderAlerts, setTraderAlerts] = useState({});
  const searchRef = useRef(null);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { traders: [], pairs: [], tabs: [] };
    const q = searchQuery.toLowerCase();
    const traders = mockTraders.filter(t => t.name.toLowerCase().includes(q));
    const allPairs = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","AVAX/USDT","DOGE/USDT","ADA/USDT"];
    const pairs = allPairs.filter(p => p.toLowerCase().includes(q));
    const tabList = [
      { id: "arena", label: "Arena", desc: "Feed en vivo de trades, señales y predicciones" },
      { id: "smc", label: "Análisis SMC", desc: "Smart Money Concepts — análisis técnico avanzado" },
      { id: "signals", label: "Señales", desc: "Señales de trading filtradas por coin y tipo" },
      { id: "traders", label: "Traders", desc: "Leaderboard, perfiles y comparación de traders" },
      { id: "heatmap", label: "Heatmap", desc: "Rendimiento por asset y trader" },
      { id: "report", label: "Reporte", desc: "Estadísticas mensuales y leaderboard" },
      { id: "copy", label: "Copy Trading", desc: "Copiar automáticamente a los mejores traders" },
    ];
    const tabs = tabList.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
    return { traders, pairs, tabs };
  }, [searchQuery]);

  // Close search on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") { setShowSearch(false); setShowAlerts(false); setShowSettings(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Mock alerts — patterns, macro, trades, whales
  const alertsList = [
    // Smart pattern alerts
    { id: 1, type: "pattern", text: "3 traders abrieron BTC LONG en los últimos 30min — posible tendencia alcista", time: "1m", read: false, priority: "high" },
    { id: 2, type: "pattern", text: "Convergencia bajista: Scalp King + Crypto Ninja + Smart Money abrieron ETH SHORT", time: "5m", read: false, priority: "high" },
    { id: 3, type: "macro", text: "DXY (Dólar) cayó -0.8% hoy — históricamente bullish para crypto", time: "12m", read: false, priority: "medium" },
    // Trade alerts
    { id: 4, type: "trade", text: "Scalp King abrió BTC LONG a $67,850 (5x)", time: "2m", read: false, priority: "normal" },
    { id: 5, type: "whale", text: "WHALE: $3.2M BTC LONG en Binance", time: "8m", read: false, priority: "high" },
    // Macro indicators
    { id: 6, type: "macro", text: "Fed Funds Rate sin cambios (5.25%) — mercado reacciona neutral", time: "45m", read: true, priority: "medium" },
    { id: 7, type: "macro", text: "Petróleo WTI +2.1% ($78.40) — posible presión inflacionaria", time: "1h", read: true, priority: "low" },
    { id: 8, type: "pattern", text: "4/8 traders están en LONG en SOL — consenso alcista fuerte", time: "1h", read: true, priority: "medium" },
    { id: 9, type: "macro", text: "M2 Money Supply +0.3% MoM — liquidez expandiéndose", time: "2h", read: true, priority: "low" },
    { id: 10, type: "signal", text: "Nueva señal: ETH SHORT por Crypto Ninja (85% confianza)", time: "15m", read: true, priority: "normal" },
    { id: 11, type: "copy", text: "Copy Trading: Scalp King cerró +$2,340", time: "2h", read: true, priority: "normal" },
    { id: 12, type: "macro", text: "BTC Dominance 54.2% (+0.5%) — capital fluyendo a BTC", time: "3h", read: true, priority: "low" },
    { id: 13, type: "achievement", text: "Desbloqueaste: Streak Machine (15W)", time: "3h", read: true, priority: "normal" },
  ];
  const unreadCount = alertsList.filter(a => !a.read).length;

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
    { id: "home", label: "Home", icon: Home },
    { id: "sep0", sep: true },
    { id: "arena", label: "Arena", icon: Radio },
    { id: "arena:trade", label: "Trades", icon: Activity, filter: "trade", accent: C.green },
    { id: "arena:signal", label: "Señales", icon: Lightbulb, filter: "signal", accent: C.blue },
    { id: "arena:prediction", label: "Predicciones", icon: Scale, filter: "prediction", accent: C.amber },
    { id: "sep1", sep: true },
    { id: "smc", label: "Análisis SMC", icon: Crosshair },
    { id: "traders", label: "Traders", icon: Users },
    { id: "report", label: "Reporte", icon: Calendar },
    { id: "sep2", sep: true },
    { id: "football", label: "Football", icon: Gamepad2 },
  ];

  const tabContent = { home: HomeTab, arena: ArenaTab, smc: SMCAnalysis, signals: SignalsTab, traders: TradersTab, report: ReportTab, football: FootballTab };
  // Arena sub-filter tabs resolve to "arena" for content
  const resolveTab = (id) => id.startsWith("arena:") ? "arena" : id;
  const ActiveComponent = tabContent[resolveTab(activeTab)];
  const sideW = sidebarCollapsed ? 56 : 200;
  const rightW = showWatchlist ? 340 : 0;

  // XP state for demo (user's own progress)
  const myXp = 3420;
  const myLevel = 22;
  const myXpNext = 5000;
  const myTitle = titleByLevel(myLevel);

  return (
    <ThemeProvider>
    <ToastProvider>
      <DateContext.Provider value={{ dateRange, setDateRange, dateFrom, dateTo, dateLabel }}>
        <ProfileContext.Provider value={{ openProfile, closeProfile, profileTrader }}>
        <WatchlistContext.Provider value={{ followedTraders, setFollowedTraders, traderAlerts, setTraderAlerts }}>
        <FeedFilterContext.Provider value={{ feedFilter, setFeedFilter, setActiveTab }}>
        <div style={{ backgroundColor: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <style>{`
            @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            tr.hoverable:hover { background-color: ${C.cardHover} !important; }
            .card-hover:hover { border-color: ${C.borderLight} !important; }
            button.btn-hover:hover { filter: brightness(1.15); }
          `}</style>

          {/* ── Top Ticker (fixed, full width, above everything) ── */}
          <LivePnLTicker />
          <div style={{ height: 32, flexShrink: 0 }} /> {/* spacer for fixed ticker */}

          {/* ── Main Layout ── */}
          <div style={{ display: "flex", flex: 1 }}>

          {/* ── Left Sidebar ── */}
          <aside style={{
            width: sideW, minHeight: "calc(100vh - 32px)", backgroundColor: C.card, borderRight: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column", position: "fixed", top: 32, left: 0, zIndex: 200,
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
                if (tab.sep) return <div key={tab.id} style={{ height: "1px", backgroundColor: C.border, margin: "6px 8px" }} />;
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const activeColor = tab.accent || C.purple;
                return (
                  <button key={tab.id} onClick={() => {
                    if (tab.filter) { setActiveTab(tab.id); setFeedFilter(tab.filter); }
                    else { setActiveTab(tab.id); if (tab.id === "arena") setFeedFilter("all"); }
                    setProfileTrader(null);
                  }} title={sidebarCollapsed ? tab.label : undefined} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: sidebarCollapsed ? "10px 0" : "10px 12px",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    backgroundColor: isActive ? `${activeColor}12` : "transparent",
                    border: "none", borderRadius: "6px", cursor: "pointer",
                    color: isActive ? activeColor : C.textMuted,
                    fontSize: "13px",
                    fontWeight: isActive ? "600" : "400",
                    transition: "all 0.15s", width: "100%"
                  }}>
                    <Icon size={18} />
                    {!sidebarCollapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tab.label}</span>}
                  </button>
                );
              })}
            </nav>

            {/* XP Progress */}
            {!sidebarCollapsed && (
              <div style={{ padding: "12px", borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: C.purple }}>LVL {myLevel}</span>
                  <span style={{ fontSize: "9px", color: C.textFaint, ...mono }}>{myXp}/{myXpNext} XP</span>
                </div>
                <div style={{ height: "2px", backgroundColor: C.border, borderRadius: "1px", overflow: "hidden", marginBottom: "4px" }}>
                  <div style={{ width: `${(myXp/myXpNext)*100}%`, height: "100%", background: `linear-gradient(90deg, ${C.purple}, ${C.cyan})`, borderRadius: "2px" }} />
                </div>
                <div style={{ fontSize: "9px", color: C.textFaint, textAlign: "center" }}>{myTitle} · {myXpNext - myXp} XP para LVL {myLevel + 1}</div>
              </div>
            )}
            {sidebarCollapsed && (
              <div style={{ padding: "8px 4px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: C.purple, ...mono }}>{myLevel}</div>
                <div style={{ width: "100%", height: "2px", backgroundColor: C.border, borderRadius: "1px", marginTop: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${(myXp/myXpNext)*100}%`, height: "100%", background: `linear-gradient(90deg, ${C.purple}, ${C.cyan})`, borderRadius: "1px" }} />
                </div>
              </div>
            )}

            {/* Bottom section */}
            <div style={{ padding: "8px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "2px" }}>
              {[{ icon: Bookmark, label: "Watchlist", action: () => setShowWatchlist(true) }, { icon: Settings, label: "Settings", action: () => setShowSettings(true) }, { icon: Bell, label: "Alertas", action: () => setShowAlerts(true) }].map(item => (
                <button key={item.label} onClick={item.action} title={sidebarCollapsed ? item.label : undefined} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: sidebarCollapsed ? "10px 0" : "10px 12px",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  backgroundColor: "transparent", border: "none", borderRadius: "6px",
                  cursor: "pointer", color: C.textMuted, fontSize: "13px", width: "100%",
                  transition: "all 0.15s"
                }}>
                  <item.icon size={18} />
                  {!sidebarCollapsed && item.label}
                </button>
              ))}
            </div>
          </aside>

          {/* ── Main Area ── */}
          <div style={{ flex: 1, marginLeft: sideW, marginRight: rightW, transition: "margin-left 0.2s ease, margin-right 0.2s ease", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 32px)" }}>

            {/* Top Bar */}
            <header style={{ height: 56, position: "sticky", top: 32, zIndex: 100, backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
              {/* Left: Tab title */}
              <div style={{ fontSize: "16px", fontWeight: "700" }}>
                {profileTrader ? profileTrader.name : (tabs.find(t => t.id === activeTab)?.label || "Arena")}
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

                {/* Notifications bell with count */}
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowAlerts(!showAlerts)} style={{ backgroundColor: showAlerts ? C.purpleBg : "transparent", border: "none", color: showAlerts ? C.purple : C.textMuted, cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", borderRadius: "6px" }}>
                    <Bell size={17} />
                  </button>
                  {unreadCount > 0 && <div style={{
                    position: "absolute", top: "2px", right: "2px", width: "14px", height: "14px",
                    borderRadius: "50%", backgroundColor: C.red, color: "#fff",
                    fontSize: "8px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center",
                    pointerEvents: "none"
                  }}>{unreadCount}</div>}
                </div>
                {/* Search */}
                <button onClick={() => setShowSearch(true)} style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", borderRadius: "6px", gap: "6px" }}>
                  <Search size={17} />
                  <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>⌘K</span>
                </button>
              </div>
            </header>

            {/* ── Search Overlay ── */}
            {showSearch && (
              <div onClick={() => setShowSearch(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "120px" }}>
                <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: `1px solid ${C.border}` }}>
                    <Search size={16} color={C.textMuted} />
                    <input ref={searchRef} autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar traders, pares, secciones..." style={{
                      flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: C.text, fontSize: "14px", fontWeight: "500"
                    }} onKeyDown={e => { if (e.key === "Escape") setShowSearch(false); }} />
                    <span style={{ fontSize: "10px", color: C.textFaint, padding: "2px 6px", backgroundColor: C.bg, borderRadius: "4px", ...mono }}>ESC</span>
                  </div>
                  <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
                    {!searchQuery.trim() && <div style={{ padding: "16px", textAlign: "center", color: C.textFaint, fontSize: "12px" }}>Escribe para buscar traders, pares o secciones</div>}
                    {searchResults.traders.length > 0 && (<>
                      <div style={{ padding: "6px 10px", fontSize: "9px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>Traders</div>
                      {searchResults.traders.map(t => (
                        <button key={t.name} onClick={() => { openProfile(t); setShowSearch(false); setSearchQuery(""); }} style={{
                          display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", backgroundColor: "transparent",
                          border: "none", borderRadius: "8px", cursor: "pointer", color: C.text, textAlign: "left"
                        }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{t.avatar}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: "600" }}>{t.name}</div>
                            <div style={{ fontSize: "10px", color: C.textMuted }}>#{t.rank} · {t.style} · WR {t.winRate}%</div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: C.green, ...mono }}>+${(t.pnl/1000).toFixed(0)}K</span>
                        </button>
                      ))}
                    </>)}
                    {searchResults.pairs.length > 0 && (<>
                      <div style={{ padding: "6px 10px", fontSize: "9px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pares</div>
                      {searchResults.pairs.map(p => (
                        <button key={p} onClick={() => { setActiveTab("signals"); setShowSearch(false); setSearchQuery(""); }} style={{
                          display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", backgroundColor: "transparent",
                          border: "none", borderRadius: "8px", cursor: "pointer", color: C.text, textAlign: "left"
                        }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: C.amberBg, display: "flex", alignItems: "center", justifyContent: "center" }}><DollarSign size={14} color={C.amber} /></div>
                          <span style={{ fontSize: "13px", fontWeight: "600" }}>{p}</span>
                          <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "auto" }}>Ver señales</span>
                        </button>
                      ))}
                    </>)}
                    {searchResults.tabs.length > 0 && (<>
                      <div style={{ padding: "6px 10px", fontSize: "9px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>Secciones</div>
                      {searchResults.tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setShowSearch(false); setSearchQuery(""); setProfileTrader(null); }} style={{
                          display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", backgroundColor: "transparent",
                          border: "none", borderRadius: "8px", cursor: "pointer", color: C.text, textAlign: "left"
                        }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: C.purpleBg, display: "flex", alignItems: "center", justifyContent: "center" }}><Search size={14} color={C.purple} /></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: "600" }}>{t.label}</div>
                            <div style={{ fontSize: "10px", color: C.textMuted }}>{t.desc}</div>
                          </div>
                        </button>
                      ))}
                    </>)}
                    {searchQuery.trim() && searchResults.traders.length === 0 && searchResults.pairs.length === 0 && searchResults.tabs.length === 0 && (
                      <div style={{ padding: "20px", textAlign: "center", color: C.textFaint, fontSize: "12px" }}>Sin resultados para "{searchQuery}"</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Alerts Drawer ── */}
            {showAlerts && (
              <div onClick={() => setShowAlerts(false)} style={{ position: "fixed", inset: 0, zIndex: 400, backgroundColor: "rgba(0,0,0,0.3)" }}>
                <div onClick={e => e.stopPropagation()} style={{
                  position: "fixed", top: 0, right: 0, width: "360px", height: "100vh",
                  backgroundColor: C.card, borderLeft: `1px solid ${C.border}`, boxShadow: "-8px 0 24px rgba(0,0,0,0.3)",
                  display: "flex", flexDirection: "column", zIndex: 401
                }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ fontSize: "14px", fontWeight: "700" }}>Alertas</div>
                      {unreadCount > 0 && <span style={{ fontSize: "9px", fontWeight: "700", color: C.red, backgroundColor: C.redBg, padding: "2px 6px", borderRadius: "3px" }}>{unreadCount} nuevas</span>}
                    </div>
                    <button onClick={() => setShowAlerts(false)} style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}><ChevronRight size={18} /></button>
                  </div>

                  {/* Alert type filters */}
                  <div style={{ padding: "8px 12px", display: "flex", gap: "4px", borderBottom: `1px solid ${C.border}` }}>
                    {[["all", "Todas"], ["pattern", "Patrones"], ["macro", "Macro"], ["trade", "Trades"], ["whale", "Whales"]].map(([type, label]) => (
                      <button key={type} style={{
                        padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                        border: "none", backgroundColor: C.bg, color: C.textMuted
                      }}>{label}</button>
                    ))}
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                    {alertsList.map(a => {
                      const alertIcons = { trade: Activity, whale: Eye, signal: Lightbulb, prediction: Scale, copy: Copy, achievement: Award, pattern: GitBranch, macro: BarChart3 };
                      const alertColors = { trade: C.green, whale: C.cyan, signal: C.blue, prediction: C.amber, copy: C.purple, achievement: C.amber, pattern: C.purple, macro: C.blue };
                      const priorityBorder = a.priority === "high" ? "2px" : "1px";
                      const AIcon = alertIcons[a.type] || Bell;
                      const aColor = alertColors[a.type] || C.textMuted;
                      return (
                        <div key={a.id} style={{
                          display: "flex", gap: "12px", padding: "12px", borderRadius: "8px",
                          backgroundColor: a.read ? "transparent" : `${aColor}08`,
                          borderLeft: `${a.read ? "3px solid transparent" : `3px solid ${aColor}`}`,
                          marginBottom: "4px"
                        }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: `${aColor}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <AIcon size={13} color={aColor} />
                          </div>
                          <div style={{ flex: 1 }}>
                            {(a.type === "pattern" || a.type === "macro") && (
                              <div style={{ fontSize: "8px", fontWeight: "800", color: aColor, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>
                                {a.type === "pattern" ? "PATRÓN DETECTADO" : "INDICADOR MACRO"}
                                {a.priority === "high" && <span style={{ marginLeft: "6px", color: C.red }}>IMPORTANTE</span>}
                              </div>
                            )}
                            <div style={{ fontSize: "12px", color: a.read ? C.textMuted : C.text, lineHeight: 1.4 }}>{a.text}</div>
                            <div style={{ fontSize: "10px", color: C.textFaint, marginTop: "4px", ...mono }}>{a.time}</div>
                          </div>
                          {!a.read && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: aColor, flexShrink: 0, marginTop: "6px" }} />}
                        </div>
                      );
                    })}

                    {/* Macro Indicators Dashboard */}
                    <div style={{ marginTop: "12px", padding: "12px", backgroundColor: C.bg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Indicadores Macro</div>
                      {[
                        ["DXY (Dólar)", "104.2", "-0.8%", C.red],
                        ["BTC Dominance", "54.2%", "+0.5%", C.green],
                        ["Petróleo WTI", "$78.40", "+2.1%", C.green],
                        ["Fed Funds Rate", "5.25%", "0%", C.textMuted],
                        ["M2 Supply", "$21.4T", "+0.3%", C.green],
                        ["Fear & Greed", "68", "Greed", C.amber],
                        ["Total Crypto MCap", "$2.8T", "+1.2%", C.green],
                      ].map(([name, val, change, clr]) => (
                        <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: "11px" }}>
                          <span style={{ color: C.textMuted }}>{name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "700", ...mono }}>{val}</span>
                            <span style={{ fontWeight: "600", color: clr, ...mono, fontSize: "10px" }}>{change}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Right Sidebar: Trader Watchlist (persistent, TradingView-style) ── */}
            <aside style={{
              width: 340, position: "fixed", top: 32, right: 0, bottom: 0, zIndex: 200,
              backgroundColor: C.bg, borderLeft: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column",
              transform: showWatchlist ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.2s ease"
            }}>
              {/* Header */}
              <div style={{ height: 56, padding: "0 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={15} color={C.purple} />
                <span style={{ fontSize: "13px", fontWeight: "800", flex: 1 }}>Watchlist</span>
                <span style={{ fontSize: "9px", color: C.textMuted, ...mono }}>{Object.values(followedTraders).filter(Boolean).length} siguiendo</span>
                <button onClick={() => setShowWatchlist(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px" }}><X size={14} /></button>
              </div>
              {/* Search */}
              <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: C.card, borderRadius: "6px", padding: "6px 10px", border: `1px solid ${C.border}` }}>
                  <Search size={12} color={C.textFaint} />
                  <input value={watchlistSearch} onChange={e => setWatchlistSearch(e.target.value)} placeholder="Buscar trader..." style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: "11px", width: "100%", fontFamily: "inherit" }} />
                  {watchlistSearch && <button onClick={() => setWatchlistSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, padding: "2px" }}><X size={10} /></button>}
                </div>
              </div>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: "3px", padding: "6px 10px", borderBottom: `1px solid ${C.border}` }}>
                {[{ id: "all", label: "Todos", icon: Users }, { id: "human", label: "Traders", icon: Activity }, { id: "bot", label: "Bots", icon: Bot }, { id: "followed", label: "Siguiendo", icon: Star }].map(cat => (
                  <button key={cat.id} onClick={() => setWatchlistCategory(cat.id)} style={{
                    display: "flex", alignItems: "center", gap: "3px", padding: "4px 8px", borderRadius: "5px", fontSize: "9px", fontWeight: "600", cursor: "pointer",
                    border: `1px solid ${watchlistCategory === cat.id ? C.purple : C.border}`,
                    backgroundColor: watchlistCategory === cat.id ? C.purpleBg : "transparent",
                    color: watchlistCategory === cat.id ? C.purple : C.textMuted
                  }}>
                    <cat.icon size={10} />
                    {cat.label}
                  </button>
                ))}
              </div>
              {/* Trader list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
                {(() => {
                  let filtered = [...mockTraders];
                  if (watchlistCategory === "human") filtered = filtered.filter(t => !t.isBot);
                  else if (watchlistCategory === "bot") filtered = filtered.filter(t => t.isBot);
                  else if (watchlistCategory === "followed") filtered = filtered.filter(t => followedTraders[t.name]);
                  if (watchlistSearch.trim()) {
                    const q = watchlistSearch.toLowerCase();
                    filtered = filtered.filter(t => t.name.toLowerCase().includes(q) || t.style.toLowerCase().includes(q) || t.favPairs.some(p => p.toLowerCase().includes(q)));
                  }
                  if (filtered.length === 0) return (
                    <div style={{ textAlign: "center", padding: "30px 16px", color: C.textMuted }}>
                      <Users size={20} style={{ marginBottom: "6px", opacity: 0.4 }} />
                      <div style={{ fontSize: "11px", fontWeight: "600" }}>No se encontraron traders</div>
                    </div>
                  );
                  return filtered.map(t => {
                    const isFollowed = followedTraders[t.name];
                    const hasAlert = traderAlerts[t.name];
                    const tierColor = t.tier === "Diamond" ? C.cyan : t.tier === "Platinum" ? "#a78bfa" : t.tier === "Gold" ? C.amber : C.textMuted;
                    return (
                      <div key={t.name} className="card-hover" style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 10px", borderRadius: "6px", border: `1px solid ${isFollowed ? C.purple + "30" : C.border}`, backgroundColor: isFollowed ? C.purpleBg + "40" : C.card, marginBottom: "3px", cursor: "pointer", transition: "all 0.15s" }}>
                        {/* Rank */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "18px", paddingTop: "2px" }}>
                          <span style={{ fontSize: "10px", fontWeight: "800", color: t.rank <= 3 ? C.amber : C.textMuted, ...mono }}>#{t.rank}</span>
                          <div style={{ width: 3, height: 10, borderRadius: "1px", backgroundColor: tierColor }} />
                        </div>
                        {/* Info + actions */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }} onClick={() => openProfile(t)}>
                            <span style={{ fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>{t.name}</span>
                            <BotTag isBot={t.isBot} />
                            <span style={{ fontSize: "7px", fontWeight: "700", color: tierColor, backgroundColor: `${tierColor}15`, padding: "1px 4px", borderRadius: "2px", border: `1px solid ${tierColor}30` }}>{t.tier}</span>
                          </div>
                          <div style={{ display: "flex", gap: "6px", fontSize: "8px", color: C.textMuted, ...mono, marginBottom: "3px" }}>
                            <span style={{ color: C.green }}>{t.winRate}%</span>
                            <span style={{ color: C.green }}>+${(t.pnl / 1000).toFixed(0)}K</span>
                            <span>{t.style}</span>
                          </div>
                          {/* Actions row */}
                          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            <button title={isFollowed ? "Dejar de seguir" : "Seguir"} onClick={e => { e.stopPropagation(); setFollowedTraders(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: isFollowed ? C.amber + "20" : "transparent", color: isFollowed ? C.amber : C.textFaint }}>
                              <Star size={10} fill={isFollowed ? C.amber : "none"} />
                            </button>
                            <button title={hasAlert ? "Quitar alertas" : "Alertas"} onClick={e => { e.stopPropagation(); setTraderAlerts(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: hasAlert ? C.blue + "20" : "transparent", color: hasAlert ? C.blue : C.textFaint }}>
                              <BellRing size={10} />
                            </button>
                            <button title="Copy trade" onClick={e => { e.stopPropagation(); setActiveTab("copy"); }} style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: "transparent", color: C.textFaint }}>
                              <Copy size={10} />
                            </button>
                            <button title="Chat" onClick={e => e.stopPropagation()} style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: "transparent", color: C.textFaint }}>
                              <MessageCircle size={10} />
                            </button>
                            <div style={{ width: "1px", height: 12, backgroundColor: C.border, margin: "0 1px" }} />
                            {(() => {
                              const socials = traderSocials[t.name] || {};
                              const si = { twitter: { l: "X", c: "#1DA1F2" }, discord: { l: "DC", c: "#5865F2" }, telegram: { l: "TG", c: "#0088cc" }, youtube: { l: "YT", c: "#FF0000" } };
                              return Object.keys(socials).filter(p => si[p]).map(p => (
                                <button key={p} title={`${si[p].l}: ${socials[p]}`} onClick={e => e.stopPropagation()} style={{ height: 18, padding: "0 4px", display: "flex", alignItems: "center", borderRadius: "2px", border: "none", cursor: "pointer", backgroundColor: `${si[p].c}15`, color: si[p].c, fontSize: "7px", fontWeight: "700" }}>
                                  {si[p].l}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {/* Footer legend */}
              <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}`, fontSize: "8px", color: C.textFaint, display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Star size={8} fill={C.amber} color={C.amber} /> Seguir</span>
                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><BellRing size={8} color={C.blue} /> Alertas</span>
                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Copy size={8} /> Copy</span>
                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><MessageCircle size={8} /> Chat</span>
              </div>
            </aside>

            {/* ── Settings Panel ── */}
            {showSettings && (
              <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, zIndex: 400, backgroundColor: "rgba(0,0,0,0.3)" }}>
                <div onClick={e => e.stopPropagation()} style={{
                  position: "fixed", top: 0, right: 0, width: "360px", height: "100vh",
                  backgroundColor: C.card, borderLeft: `1px solid ${C.border}`, boxShadow: "-8px 0 24px rgba(0,0,0,0.3)",
                  display: "flex", flexDirection: "column", zIndex: 401
                }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700" }}>Settings</div>
                    <button onClick={() => setShowSettings(false)} style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}><ChevronRight size={18} /></button>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                    {/* Mi Cuenta */}
                    <div style={{ ...cardStyle, marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: C.textFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Mi Cuenta</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: C.purpleBg, border: `2px solid ${C.purple}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Users size={20} color={C.purple} />
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700" }}>Trader Demo</div>
                          <div style={{ fontSize: "10px", color: C.textMuted }}>{myTitle} · LVL {myLevel}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: "11px" }}>
                        <span style={{ color: C.textMuted }}>Balance</span>
                        <span style={{ fontWeight: "700", color: C.green, ...mono }}>$24,680</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: "11px" }}>
                        <span style={{ color: C.textMuted }}>PnL del Mes</span>
                        <span style={{ fontWeight: "700", color: C.green, ...mono }}>+$3,420</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: "11px" }}>
                        <span style={{ color: C.textMuted }}>Copiando a</span>
                        <span style={{ fontWeight: "600", ...mono }}>2 traders</span>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div style={{ ...cardStyle, marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: C.textFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Notificaciones</div>
                      {[
                        ["Trades en vivo", true],
                        ["Whale alerts", true],
                        ["Señales nuevas", true],
                        ["Predicciones resueltas", false],
                        ["Logros desbloqueados", true],
                      ].map(([label, on]) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ fontSize: "12px" }}>{label}</span>
                          <span style={{ color: on ? C.green : C.textFaint }}>{on ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</span>
                        </div>
                      ))}
                    </div>

                    {/* Display */}
                    <div style={{ ...cardStyle }}>
                      <div style={{ fontSize: "10px", color: C.textFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Display</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                        <span>Ticker en vivo</span>
                        <span style={{ color: C.green }}><ToggleRight size={20} /></span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                        <span>Sidebar compacto</span>
                        <span style={{ color: sidebarCollapsed ? C.green : C.textFaint }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", fontSize: "12px" }}>
                        <span>Tema</span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: C.textMuted }}>Dark</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <main style={{ flex: 1, padding: "24px", maxWidth: "1400px", width: "100%" }}>
              {profileTrader ? <TraderProfile trader={profileTrader} onClose={closeProfile} /> : <ActiveComponent />}
            </main>

            {/* Footer - Live Stats Bar */}
            <footer style={{ height: 36, backgroundColor: C.card, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", color: C.text, fontSize: "11px", fontWeight: "600", ...mono, justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.green, display: "inline-block" }} />
                  <span style={{ color: C.green }}>LIVE</span>
                </div>
                <div style={{ width: "1px", height: 18, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Trophy size={10} color={C.amber} /> Season 1</span>
                <div style={{ width: "1px", height: 18, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Users size={10} /> {mockTraders.length} Traders</span>
                <div style={{ width: "1px", height: 18, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><BarChart3 size={10} /> <span style={{ color: C.green }}>$2.4M Vol</span></span>
                <div style={{ width: "1px", height: 18, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Zap size={10} color={C.amber} /> 47 Signals</span>
                <div style={{ width: "1px", height: 18, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Target size={10} /> 78% Avg Win Rate</span>
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Eye size={10} color={C.cyan} /> 3 Whale Alerts</span>
                <div style={{ width: "1px", height: 18, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><AlertTriangle size={10} color={C.red} /> $4.2M Liquidated</span>
                <div style={{ width: "1px", height: 18, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Zap size={10} /> Last: <span style={{ color: C.green }}>12s ago</span></span>
              </div>
            </footer>
          </div>

          </div>{/* close Main Layout wrapper */}
        </div>
        </FeedFilterContext.Provider>
        </WatchlistContext.Provider>
        </ProfileContext.Provider>
      </DateContext.Provider>
    </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
