import { ACHIEVEMENTS, srand } from "../lib/scoring";
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

const mockTraders = [
  { name: "Scalp King", avatar: "👑", winRate: 81, pnl: 156200, trades: 823, streak: 15, rank: 1, tier: "Diamond", isBot: false,
    badges: ["streakMachine","copyKing","sharpShooter","alphaLeaker","profitPrinter"], level: 48, xp: 8200, xpNext: 10000,
    radarData: [{s:"Attack",v:94},{s:"Risk Ctrl",v:89},{s:"Precision",v:96},{s:"Speed",v:91},{s:"Consistency",v:93},{s:"Discipline",v:92}],
    sparkData: [12,15,14,18,22,19,25,28,24,31,29,35,33,38,36,42], viewersNow: 47,
    bio: "Full-time crypto trader since 2019. Specializing in BTC/ETH scalps with SMC methodology. Previously quant analyst at a prop firm.", location: "Miami, FL", joined: "Jan 2024", followers: 1842, following: 23, copiers: 567, sharpe: 2.1, maxDD: -8.2, avgRR: "1:1.5", avgHold: "4h", bestMonth: "+$42,300", worstMonth: "-$8,100", profitFactor: 3.8, favPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"], style: "Scalping", exchange: "Binance" },
  { name: "Crypto Ninja", avatar: "🥷", winRate: 78, pnl: 125400, trades: 456, streak: 12, rank: 2, tier: "Diamond", isBot: false,
    badges: ["diamondHands","wagmi","sharpShooter","liqHunter"], level: 45, xp: 6500, xpNext: 10000,
    radarData: [{s:"Attack",v:92},{s:"Risk Ctrl",v:88},{s:"Precision",v:95},{s:"Speed",v:85},{s:"Consistency",v:91},{s:"Discipline",v:89}],
    sparkData: [10,8,12,15,13,18,16,22,20,26,24,28,27,30,29,33], viewersNow: 32,
    bio: "Swing trader focused on altcoins. I use order flow analysis and smart money concepts to find high-probability setups.", location: "Tokyo, Japan", joined: "Mar 2024", followers: 1234, following: 45, copiers: 389, sharpe: 1.9, maxDD: -11.5, avgRR: "1:2.0", avgHold: "8h", bestMonth: "+$38,500", worstMonth: "-$12,400", profitFactor: 3.2, favPairs: ["BTC/USDT", "XRP/USDT", "BNB/USDT"], style: "Swing", exchange: "Bybit" },
  { name: "Smart Money", avatar: "💼", winRate: 76, pnl: 112300, trades: 567, streak: 10, rank: 3, tier: "Platinum", isBot: true,
    badges: ["ironNerves","riskDjinn","profitPrinter","diamondHands"], level: 42, xp: 5100, xpNext: 10000,
    radarData: [{s:"Attack",v:89},{s:"Risk Ctrl",v:86},{s:"Precision",v:91},{s:"Speed",v:88},{s:"Consistency",v:87},{s:"Discipline",v:85}],
    sparkData: [8,10,11,14,16,15,18,20,19,22,24,23,26,28,27,30], viewersNow: 28,
    bio: "Conservative position trader. Low drawdown, consistent returns. Former hedge fund analyst. Risk management is everything.", location: "London, UK", joined: "Feb 2024", followers: 892, following: 12, copiers: 234, sharpe: 2.4, maxDD: -5.8, avgRR: "1:1.8", avgHold: "1d", bestMonth: "+$28,900", worstMonth: "-$5,200", profitFactor: 3.4, favPairs: ["BTC/USDT", "ETH/USDT", "AVAX/USDT"], style: "Position", exchange: "Binance" },
  { name: "Phoenix Rise", avatar: "🔥", winRate: 73, pnl: 104200, trades: 523, streak: 11, rank: 4, tier: "Platinum", isBot: false,
    badges: ["moonShot","degenGod","earlyApe"], level: 39, xp: 4200, xpNext: 10000,
    radarData: [{s:"Attack",v:86},{s:"Risk Ctrl",v:83},{s:"Precision",v:89},{s:"Speed",v:85},{s:"Consistency",v:86},{s:"Discipline",v:84}],
    sparkData: [5,12,8,20,15,28,22,35,18,40,30,25,38,45,32,48], viewersNow: 19,
    bio: "Aggressive intraday trader. High risk, high reward. Specializing in momentum plays during NY session.", location: "New York, NY", joined: "Apr 2024", followers: 567, following: 34, copiers: 178, sharpe: 1.6, maxDD: -18.4, avgRR: "1:2.4", avgHold: "2h", bestMonth: "+$52,100", worstMonth: "-$19,800", profitFactor: 2.6, favPairs: ["SOL/USDT", "BTC/USDT", "DOGE/USDT"], style: "Day Trading", exchange: "Bitget" },
  { name: "Bull Master", avatar: "🐂", winRate: 72, pnl: 98500, trades: 342, streak: 8, rank: 5, tier: "Gold", isBot: true,
    badges: ["diamondHands","wagmi"], level: 35, xp: 3800, xpNext: 10000,
    radarData: [{s:"Attack",v:85},{s:"Risk Ctrl",v:80},{s:"Precision",v:88},{s:"Speed",v:82},{s:"Consistency",v:84},{s:"Discipline",v:81}],
    sparkData: [6,8,7,11,10,14,13,16,15,18,17,20,19,22,21,24], viewersNow: 14,
    bio: "Long-only conviction trader. I find the trend and ride it. Patient entries, wide stops, massive targets.", location: "Dubai, UAE", joined: "May 2024", followers: 456, following: 28, copiers: 145, sharpe: 1.8, maxDD: -12.1, avgRR: "1:2.2", avgHold: "3d", bestMonth: "+$31,200", worstMonth: "-$11,500", profitFactor: 2.5, favPairs: ["BTC/USDT", "ETH/USDT"], style: "Swing", exchange: "Binance" },
  { name: "Rocket Launch", avatar: "🚀", winRate: 70, pnl: 89600, trades: 445, streak: 9, rank: 6, tier: "Gold", isBot: false,
    badges: ["earlyApe","whaleSpotter"], level: 32, xp: 2900, xpNext: 10000,
    radarData: [{s:"Attack",v:82},{s:"Risk Ctrl",v:78},{s:"Precision",v:85},{s:"Speed",v:80},{s:"Consistency",v:81},{s:"Discipline",v:79}],
    sparkData: [4,7,5,10,8,14,11,18,13,20,16,22,19,24,21,26], viewersNow: 11,
    bio: "Breakout specialist. Scanning for volume surges and structural breaks. Trading crypto full-time since the 2021 bull run.", location: "Berlin, Germany", joined: "Jun 2024", followers: 345, following: 56, copiers: 98, sharpe: 1.5, maxDD: -14.8, avgRR: "1:1.8", avgHold: "6h", bestMonth: "+$24,800", worstMonth: "-$13,200", profitFactor: 2.1, favPairs: ["BTC/USDT", "SOL/USDT", "AVAX/USDT"], style: "Breakout", exchange: "Bybit" },
  { name: "Iron Fist", avatar: "👊", winRate: 68, pnl: 72400, trades: 389, streak: 7, rank: 7, tier: "Silver", isBot: true,
    badges: ["liqHunter"], level: 28, xp: 1800, xpNext: 10000,
    radarData: [{s:"Attack",v:75},{s:"Risk Ctrl",v:70},{s:"Precision",v:77},{s:"Speed",v:72},{s:"Consistency",v:73},{s:"Discipline",v:71}],
    sparkData: [3,5,4,6,5,8,7,10,8,12,9,11,10,13,11,14], viewersNow: 6,
    bio: "Grinding every day. Learning from the best. Focused on improving my discipline and risk management.", location: "Bogota, Colombia", joined: "Jul 2024", followers: 189, following: 67, copiers: 42, sharpe: 1.3, maxDD: -16.5, avgRR: "1:1.5", avgHold: "5h", bestMonth: "+$18,400", worstMonth: "-$9,800", profitFactor: 1.6, favPairs: ["BTC/USDT", "ETH/USDT", "XRP/USDT"], style: "Scalping", exchange: "Binance" },
  { name: "Wave Rider", avatar: "🏄", winRate: 65, pnl: 45800, trades: 234, streak: 5, rank: 8, tier: "Silver", isBot: false,
    badges: ["ctInfluencer"], level: 18, xp: 4200, xpNext: 10000,
    radarData: [{s:"Attack",v:78},{s:"Risk Ctrl",v:72},{s:"Precision",v:80},{s:"Speed",v:75},{s:"Consistency",v:76},{s:"Discipline",v:74}],
    sparkData: [2,4,3,5,4,3,5,7,6,8,5,7,6,9,7,10], viewersNow: 3,
    bio: "Part-time trader, full-time surfer. Catching waves in the market like I catch them in the ocean. Chill entries only.", location: "Bali, Indonesia", joined: "Aug 2024", followers: 123, following: 89, copiers: 28, sharpe: 1.1, maxDD: -20.2, avgRR: "1:1.4", avgHold: "12h", bestMonth: "+$14,600", worstMonth: "-$11,200", profitFactor: 1.3, favPairs: ["BTC/USDT", "SOL/USDT"], style: "Swing", exchange: "Bitget" },
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
        rr: isWin ? `1:${(1.5 + Math.random() * 2.5).toFixed(1)}` : `-1R`,
        notes: isWin ? ["Clean entry on OB retest","FVG filled perfectly","Momentum confirmation strong","Liquidity sweep before entry"][i%4] : ["Stopped out on fakeout","Missed the displacement","Entered too early","Should have waited for NY"][i%4]
      });
    }
    // Monthly P&L (last 6 months)
    const months = ["Oct","Nov","Dec","Jan","Feb","Mar"];
    const monthlyPnl = months.map((m, mi) => {
      const wr = Math.round(t.winRate + (srand(ti * 100 + mi * 13) - 0.5) * 12);
      const wrRatio = wr / t.winRate;
      const isLossMonth = wr < 50;
      return {
        month: m,
        pnl: Math.round((t.pnl / 6) * (0.6 + srand(ti * 200 + mi * 7) * 0.8) * (isLossMonth ? -0.3 : 1)),
        trades: Math.round(t.trades / 6 * (0.7 + srand(ti * 300 + mi * 11) * 0.6)),
        winRate: Math.min(95, Math.max(35, wr))
      };
    });
    // Daily equity curve (last 30 days)
    const dailyEquity = [];
    let eq = 10000 + ti * 5000;
    for (let d = 1; d <= 30; d++) { eq += (Math.random() - 0.35) * (800 + ti * 200); dailyEquity.push({ day: d, equity: Math.round(eq) }); }

    // ── PREDICTIONS (individual bets on prediction markets) ──
    const predictionsList = [
      { id: ti*20+1, question: "BTC > $80K before June?", bet: "YES", odds: 38, stake: 250 + ti * 50, status: "open", date: "Mar 20", potential: Math.round((250+ti*50) * (100/38)) },
      { id: ti*20+2, question: "ETH +10% this week?", bet: "NO", odds: 56, stake: 180 + ti * 30, status: "open", date: "Mar 19", potential: Math.round((180+ti*30) * (100/56)) },
      { id: ti*20+3, question: "Fed cuts rates in May?", bet: "YES", odds: 72, stake: 400 + ti * 80, status: "open", date: "Mar 18", potential: Math.round((400+ti*80) * (100/72)) },
      { id: ti*20+4, question: "SOL flips BNB Q2?", bet: ti%2===0 ? "YES" : "NO", odds: 61, stake: 150, status: "won", date: "Mar 10", potential: 246, pnl: 96 },
      { id: ti*20+5, question: "BTC dominance > 58% in Feb?", bet: "YES", odds: 65, stake: 200, status: "won", date: "Feb 28", potential: 308, pnl: 108 },
      { id: ti*20+6, question: "DOGE > $0.40 in Feb?", bet: "NO", odds: 75, stake: 300, status: "lost", date: "Feb 15", potential: 400, pnl: -300 },
      { id: ti*20+7, question: "ETH major upgrade Q1?", bet: "YES", odds: 45, stake: 100, status: "won", date: "Jan 20", potential: 222, pnl: 122 },
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
        rr: isWin ? `1:${(2.0 + Math.random() * 2).toFixed(1)}` : `-1R`,
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
      { id: ti*50+5, platform: "whatsapp", handle: t.name, text: `Good morning crew 🙌\n\nQuick market analysis:\n- BTC consolidating at $67K-$68K\n- ETH showing relative strength\n- SOL with bullish structure on 4H\n\nLooking for entries in London session. Will update when I enter. 💪`, time: "4h ago", likes: 28 + ti * 5, retweets: 0, replies: 12 + ti * 2, impressions: 0, channel: "VIP Trading Group" },
      { id: ti*50+6, platform: "reddit", handle: `u/${t.name.replace(" ","_")}`, text: `DD: Why I think SOL is the play for Q2 2026. The ecosystem growth is insane, DeFi TVL up 340% YoY, and the chart shows a massive cup and handle on the weekly. My position: Long from $142 with a $200 target.`, time: "8h ago", likes: 456 + ti * 50, retweets: 0, replies: 123 + ti * 15, impressions: 0, subreddit: "r/CryptoMarkets" },
      { id: ti*50+7, platform: "tradehub", handle: t.name, text: `Closed my ETH long at TP2. +$${(1200 + ti * 300).toLocaleString()} profit. The FVG at $3,420 held perfectly. Key takeaway: patience on entries saves you from fake breakouts.`, time: "12h ago", likes: 89 + ti * 12, retweets: 0, replies: 34 + ti * 4, impressions: 0 },
      { id: ti*50+8, platform: "telegram", handle: t.name, text: `📊 Position update:\n\n✅ BTC LONG — TP1 hit (+$1,350)\n🔄 ETH LONG — in profit, moving SL to BE\n❌ SOL SHORT — closed at SL (-$420)\n\nDaily balance: +$930\nKeep building 💎`, time: "6h ago", likes: 89 + ti * 15, retweets: 0, replies: 34 + ti * 5, impressions: 0, channel: "Trading Updates" },
      { id: ti*50+9, platform: "discord", handle: t.name, text: `Quick market update: Funding rates just flipped negative on BTC. This usually means shorts are overcrowded and we might see a squeeze. Stay alert, don't get caught offside. 👀`, time: "1d ago", likes: 45 + ti * 8, retweets: 0, replies: 18 + ti * 2, impressions: 0, channel: "#market-chat" },
      { id: ti*50+10, platform: "whatsapp", handle: t.name, text: `🎯 Daily recap:\n\n3 trades taken\n2 wins / 1 loss\nPnL: +$${(1800 + ti * 400).toLocaleString()}\n\nBest trade: BTC long from $67,850\nWorst trade: SOL short (SL hit)\n\nFed rate decision tomorrow. Reducing exposure. 🧠`, time: "1d ago", likes: 42 + ti * 8, retweets: 0, replies: 18 + ti * 3, impressions: 0, channel: "VIP Trading Group" },
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
  const finalPnL = [156200, 125400, 112300, 104200, 98500, 89600, 72400, 45800];
  const startDay = [1, 1, 3, 1, 5, 8, 1, 12];
  // Daily volatility (σ) as fraction of current equity — skilled traders are smoother
  const dailyVol = [0.06, 0.08, 0.05, 0.09, 0.10, 0.08, 0.12, 0.14];
  // Drawdown events: [traderIdx, startDay, endDay, severity (fraction of equity lost)]
  const drawdowns = [
    [4, 14, 18, 0.18], // Bull Master: -18% drawdown days 14-18
    [7, 20, 24, 0.22], // Wave Rider: -22% drawdown days 20-24
    [6, 8, 11, 0.12],  // Iron Fist: -12% drawdown days 8-11
    [5, 15, 17, 0.10], // Rocket Launch: -10% drawdown days 15-17
  ];
  // Seeded pseudo-random for deterministic results
  const srand = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
  const data = [];
  // Pre-compute equity paths with geometric growth
  const paths = names.map((_, i) => {
    const totalDays = 30 - startDay[i] + 1;
    // Daily compound rate to reach finalPnL from ~0 over totalDays
    // Model: equity[d] = initialCapital * (1 + dailyRate)^d + noise
    const initialCapital = 10000; // starting capital reference
    const dailyRate = Math.pow((initialCapital + finalPnL[i]) / initialCapital, 1 / totalDays) - 1;
    const path = [];
    let equity = initialCapital;
    for (let d = 0; d < totalDays; d++) {
      const globalDay = startDay[i] + d;
      // Base geometric growth
      equity *= (1 + dailyRate);
      // Add volatility noise (mean-reverting)
      const noise = (srand(i * 1000 + d * 37) - 0.5) * 2 * dailyVol[i] * equity;
      let dayEquity = equity + noise;
      // Apply drawdown events
      for (const [ti, ds, de, severity] of drawdowns) {
        if (ti === i && globalDay >= ds && globalDay <= de) {
          const ddProgress = (globalDay - ds) / (de - ds);
          // V-shaped: deepest at midpoint, recovering toward end
          const ddFactor = ddProgress < 0.5
            ? severity * (ddProgress / 0.5)
            : severity * (1 - (ddProgress - 0.5) / 0.5);
          dayEquity *= (1 - ddFactor);
        }
      }
      path.push(Math.round(dayEquity - initialCapital)); // PnL relative to start
    }
    return path;
  });
  for (let d = 1; d <= 30; d++) {
    const point = { day: d };
    names.forEach((name, i) => {
      if (d < startDay[i]) { point[name] = null; return; }
      const idx = d - startDay[i];
      point[name] = paths[i][idx];
    });
    data.push(point);
  }
  return data;
})();

const heatAssets = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX"];
// Heatmap: per-asset PnL breakdown. Each row sums to the trader's total PnL.
const mockHeatmap = (() => {
  const traders = [
    { t: "Scalp King", pnl: 156200, w: [0.32, 0.24, 0.15, 0.10, 0.06, 0.04, 0.03, 0.06] },
    { t: "Crypto Ninja", pnl: 125400, w: [0.28, 0.22, 0.16, 0.12, 0.08, 0.05, 0.03, 0.06] },
    { t: "Smart Money", pnl: 112300, w: [0.30, 0.25, 0.14, 0.11, 0.07, 0.05, 0.03, 0.05] },
    { t: "Bull Master", pnl: 98500, w: [0.35, 0.25, 0.12, 0.10, 0.08, -0.02, -0.01, 0.13] },
    { t: "Rocket Launch", pnl: 89600, w: [0.30, 0.22, 0.15, 0.12, 0.08, -0.02, -0.01, 0.16] },
    { t: "Wave Rider", pnl: 45800, w: [0.28, 0.20, 0.14, -0.04, -0.08, -0.10, 0.08, 0.52] },
  ];
  return traders.map(({ t, pnl, w }) => ({
    t,
    d: w.map(weight => Math.round(pnl * weight))
  }));
})();

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
  { id: 1, question: "BTC > $80,000 before June 2026?", category: "Price", yesOdds: 38, noOdds: 62, volume: 245800, participants: 1842, deadline: "May 31, 2026", trending: true, resolution: "pending", yesBets: 702, noBets: 1140, priceHistory: [22, 28, 35, 31, 42, 38] },
  { id: 2, question: "ETH +10% this week?", category: "Price", yesOdds: 44, noOdds: 56, volume: 128400, participants: 923, deadline: "Mar 29, 2026", trending: true, resolution: "pending", yesBets: 406, noBets: 517, priceHistory: [55, 48, 52, 40, 46, 44] },
  { id: 3, question: "SOL flips BNB in market cap Q2?", category: "Macro", yesOdds: 61, noOdds: 39, volume: 89200, participants: 645, deadline: "Jun 30, 2026", trending: false, resolution: "pending", yesBets: 394, noBets: 251, priceHistory: [45, 52, 58, 55, 63, 61] },
  { id: 4, question: "Fed cuts rates at May meeting?", category: "Macro", yesOdds: 72, noOdds: 28, volume: 312500, participants: 2341, deadline: "May 7, 2026", trending: true, resolution: "pending", yesBets: 1686, noBets: 655, priceHistory: [58, 62, 68, 65, 70, 72] },
  { id: 5, question: "BTC dominance > 60% in April?", category: "Dominance", yesOdds: 55, noOdds: 45, volume: 67300, participants: 478, deadline: "Apr 30, 2026", trending: false, resolution: "pending", yesBets: 263, noBets: 215, priceHistory: [48, 50, 53, 58, 54, 55] },
  { id: 6, question: "DOGE above $0.50 in 2026?", category: "Price", yesOdds: 21, noOdds: 79, volume: 156700, participants: 1567, deadline: "Dec 31, 2026", trending: false, resolution: "pending", yesBets: 329, noBets: 1238, priceHistory: [30, 26, 22, 24, 19, 21] },
  { id: 7, question: "Scalp King holds #1 rank this month?", category: "Traders", yesOdds: 68, noOdds: 32, volume: 34200, participants: 234, deadline: "Mar 31, 2026", trending: true, resolution: "pending", yesBets: 159, noBets: 75, priceHistory: [72, 70, 65, 68, 71, 68] },
  { id: 8, question: "ETH/BTC ratio > 0.06 before Q3?", category: "Price", yesOdds: 29, noOdds: 71, volume: 78900, participants: 534, deadline: "Jun 30, 2026", trending: false, resolution: "pending", yesBets: 155, noBets: 379, priceHistory: [35, 32, 28, 30, 27, 29] },
];

const predCategories = ["All", "Price", "Macro", "Dominance", "Traders"];


/* ── Live Feed Data (the social heart) ── */
const feedItems = (() => {
  const items = [];
  let id = 1;
  // Trade events from all traders
  // Base prices for realistic entry generation
  const basePrices = { "BTC/USDT": 67500, "ETH/USDT": 3450, "SOL/USDT": 145, "BNB/USDT": 580, "XRP/USDT": 0.62 };
  // TP/SL distances vary by trader skill (better traders = tighter SL, wider TP)
  const tpDistances = [0.025, 0.030, 0.022, 0.035, 0.040, 0.028, 0.020, 0.018]; // % move to TP
  const slDistances = [0.010, 0.012, 0.009, 0.015, 0.018, 0.014, 0.013, 0.012]; // % move to SL
  mockTraders.forEach((t, ti) => {
    const pairs = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT"];
    for (let i = 0; i < 3; i++) {
      const isWin = Math.random() < (t.winRate / 100);
      const type = Math.random() > 0.45 ? "LONG" : "SHORT";
      const pair = pairs[(ti + i) % pairs.length];
      const basePrice = basePrices[pair];
      const spread = basePrice * 0.015; // 1.5% price spread for variety
      const entry = Math.round((basePrice + (Math.random() - 0.5) * spread * 2) * 100) / 100;
      const tpDist = tpDistances[ti] || 0.025;
      const slDist = slDistances[ti] || 0.012;
      const tp = Math.round((entry * (type === "LONG" ? (1 + tpDist) : (1 - tpDist))) * 100) / 100;
      const sl = Math.round((entry * (type === "LONG" ? (1 - slDist) : (1 + slDist))) * 100) / 100;
      const leverageNum = [3, 5, 10, 2, 4][(ti + i) % 5];
      const leverageStr = `${leverageNum}x`;
      // PnL = entry × leverage × %move (TP hit or SL hit)
      const status = i === 0 ? "active" : isWin ? "tp_hit" : "sl_hit";
      let pnl;
      if (status === "active") {
        // Active trades: partial P&L (random 10-60% of the way to TP or SL)
        const partial = 0.1 + Math.random() * 0.5;
        const direction = Math.random() > 0.4 ? 1 : -1;
        const movePercent = direction > 0 ? tpDist * partial : slDist * partial;
        pnl = Math.round(entry * leverageNum * movePercent * direction);
      } else if (status === "tp_hit") {
        // Won: PnL = entry × leverage × tpDist (always positive)
        pnl = Math.round(entry * leverageNum * tpDist);
      } else {
        // Lost: PnL = -entry × leverage × slDist (always negative)
        pnl = -Math.round(entry * leverageNum * slDist);
      }
      const minsAgo = ti * 12 + i * 25 + Math.floor(Math.random() * 15);
      items.push({
        id: id++, kind: "trade", trader: t.name, avatar: t.avatar, isBot: t.isBot, tier: t.tier,
        pair, type, entry, tp, sl, pnl, status, leverage: leverageStr,
        analysis: isWin
          ? ["OB + FVG confluence at key zone. Clean entry.", "Liquidity swept + strong displacement. High confluence.", "BOS confirmed on 1H with volume. Momentum in favor.", "Order Block retest + structure intact. A+ setup."][((ti*3+i)*7)%4]
          : ["Fakeout above resistance. Choppy market.", "PA choppy, no clear direction. Entered without confirmation.", "Entered against higher timeframe bias.", "Missed the kill zone, low volume."][((ti*3+i)*7)%4],
        time: minsAgo < 60 ? `${minsAgo}m` : `${Math.floor(minsAgo/60)}h`,
        timestamp: Date.now() - minsAgo * 60000, copiers: Math.floor(Math.random() * 50 + 5),
      });
    }
  });
  // Prediction events — multiple traders predict on same questions, ordered by who called it first
  const predQuestions = [
    { q: "BTC > $80K before June?", participants: [0, 2, 1, 4] },
    { q: "Fed cuts rates in May?", participants: [1, 3, 0] },
    { q: "SOL flips BNB Q2?", participants: [2, 0, 5] },
    { q: "ETH +10% this week?", participants: [3, 1, 6] },
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
    { pair: "BTC/USDT", bias: "LONG", idea: "Daily OB at $66.8K with unmitigated FVG. Waiting for liquidity sweep for entry.", conf: 92, tf: "4H" },
    { pair: "ETH/USDT", bias: "SHORT", idea: "Bearish RSI divergence + rejection at premium zone. Possible drop to $3.2K.", conf: 68, tf: "1H" },
    { pair: "SOL/USDT", bias: "LONG", idea: "Wyckoff accumulation in range. Spring confirmed, looking for markup.", conf: 81, tf: "1D" },
    { pair: "BNB/USDT", bias: "SHORT", idea: "Distribution on HTF. Bearish BOS on 4H with declining volume.", conf: 45, tf: "4H" },
    { pair: "XRP/USDT", bias: "LONG", idea: "Institutional demand zone + MA200 confluence. High probability setup.", conf: 95, tf: "1D" },
    { pair: "BTC/USDT", bias: "SHORT", idea: "Weekly resistance + overbought on multiple TFs. Expecting correction.", conf: 55, tf: "1W" },
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
    { id: id++, kind: "whale", text: "$3.2M BTC LONG opened on Binance", time: "8m", timestamp: Date.now() - 480000 },
    { id: id++, kind: "liquidation", text: "$1.2M in SHORTS liquidated — bears rekt", time: "22m", timestamp: Date.now() - 1320000 },
  );
  return items.sort((a, b) => b.timestamp - a.timestamp);
})();

/* ── Copy Trading Data ── */
// Recent trades are scaled to AUM — 3 recent trades represent ~15-25% of monthly gains
const copyPortfolios = [
  {
    name: "Scalp King", avatar: "👑", tier: "Diamond", followers: 1842, aum: 2450000,
    monthlyReturn: 12.4, sharpe: 2.1, maxDD: -8.2, winRate: 81, avgTrade: "4h",
    fee: 15, minInvest: 500, riskLevel: "Medium",
    equity: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 100000 + i * 3200 + Math.sin(i * 0.8) * 5000 })),
    recentTrades: [
      { pair: "BTC/USDT", type: "LONG", pnl: 38200, date: "Mar 22" },
      { pair: "ETH/USDT", type: "LONG", pnl: 22400, date: "Mar 21" },
      { pair: "SOL/USDT", type: "SHORT", pnl: -8600, date: "Mar 21" },
    ],
    allocation: [{ asset: "BTC", pct: 45 }, { asset: "ETH", pct: 25 }, { asset: "SOL", pct: 15 }, { asset: "Others", pct: 15 }]
  },
  {
    name: "Crypto Ninja", avatar: "🥷", tier: "Diamond", followers: 1234, aum: 1890000,
    monthlyReturn: 9.8, sharpe: 1.9, maxDD: -11.5, winRate: 78, avgTrade: "8h",
    fee: 12, minInvest: 300, riskLevel: "Medium-High",
    equity: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 80000 + i * 2800 + Math.cos(i * 0.6) * 4000 })),
    recentTrades: [
      { pair: "BTC/USDT", type: "SHORT", pnl: 24800, date: "Mar 22" },
      { pair: "XRP/USDT", type: "LONG", pnl: 11200, date: "Mar 22" },
      { pair: "BNB/USDT", type: "LONG", pnl: -5400, date: "Mar 20" },
    ],
    allocation: [{ asset: "BTC", pct: 35 }, { asset: "ETH", pct: 30 }, { asset: "XRP", pct: 20 }, { asset: "Others", pct: 15 }]
  },
  {
    name: "Smart Money", avatar: "💼", tier: "Platinum", followers: 892, aum: 1340000,
    monthlyReturn: 7.2, sharpe: 2.4, maxDD: -5.8, winRate: 76, avgTrade: "1d",
    fee: 18, minInvest: 1000, riskLevel: "Low",
    equity: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 120000 + i * 2400 + Math.sin(i * 0.5) * 3000 })),
    recentTrades: [
      { pair: "BTC/USDT", type: "LONG", pnl: 18500, date: "Mar 22" },
      { pair: "ETH/USDT", type: "LONG", pnl: 9800, date: "Mar 21" },
      { pair: "AVAX/USDT", type: "SHORT", pnl: -3200, date: "Mar 19" },
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

export {
  mockChartData,
  mockSignals,
  mockTraders,
  traderSocials,
  traderDeepData,
  mockGroups,
  traderColors,
  traderEquity,
  heatAssets,
  mockHeatmap,
  marchData,
  cumData,
  predictionMarkets,
  predCategories,
  feedItems,
  copyPortfolios,
  ftgPair,
  ftgCurrentPrice,
  ftgPriceRange,
  ftgRedZoneWidth,
  ftgPlayers,
  ftgTimeframes,
  ftgSessions,
  smcCoins,
  smcCoinList
};
