import { Bot, ThumbsDown, ThumbsUp, User, Users } from "lucide-react";
import { srand } from "../lib/scoring";
import { C, cardStyle, mono, pillStyle } from "../theme";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
/* Renders the value as-is. (Previously counted up from 0, which briefly showed
   misleading numbers — e.g. an 81% win rate flashing "16%" or a $68K price flashing
   "$12K" mid-animation. Credibility beats the flourish: show the real number instantly.) */
const AnimatedValue = ({ value }) => <span>{value}</span>;

/* StatCard v2 — one clear primary value, muted label, semantic accent bar (LukeW: one metric per card) */
const StatCard = ({ label, value, sub, icon: Icon, color = C.blue, tip }) => (
  <div className="card-hover" style={{ ...cardStyle, display: "flex", alignItems: "flex-start", gap: "12px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color, opacity: 0.55 }} />
    <div style={{ width: 34, height: 34, borderRadius: "9px", backgroundColor: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={17} color={color} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: "600" }}>
        {tip ? <InfoTip k={tip}><span>{label}</span></InfoTip> : label}
      </div>
      <div style={{ fontSize: "21px", fontWeight: "800", letterSpacing: "-0.3px", ...mono }}><AnimatedValue value={value} /></div>
      {sub && <div style={{ fontSize: "11px", color: typeof sub === "string" && sub.startsWith("+") ? C.green : typeof sub === "string" && sub.startsWith("-") ? C.red : C.textMuted, marginTop: "2px" }}>{sub}</div>}
    </div>
  </div>
);

const Tag = ({ text, color = C.purple }) => <span style={pillStyle(color)}>{text}</span>;

/* ── SectionHeader — ONE pattern for every section title across the app
   (icon · title · subtitle on the left, optional controls on the right). Keeps
   typographic hierarchy and spacing identical everywhere a section begins. ── */
const SectionHeader = ({ icon: Icon, title, subtitle, right, color = C.purple }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "14px", fontWeight: 800, letterSpacing: "-0.2px", color: C.text }}>
        {Icon ? <Icon size={15} color={color} /> : null}{title}
      </div>
      {subtitle && <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>{subtitle}</div>}
    </div>
    {right != null && <div style={{ flexShrink: 0 }}>{right}</div>}
  </div>
);

/* ── InfoTip: hover tooltip explaining jargon in plain language ── */
const GLOSSARY = {
  // SMC Analysis
  bias:           "Market direction. BULLISH = price going up, BEARISH = price going down",
  confluence:     "Signal strength: how many indicators agree (more = more reliable)",
  riskLevel:      "How risky it is to trade right now. LOW = safe, HIGH = dangerous",
  stopDistance:   "Average distance from entry to stop-loss across this asset's approved signals, in %. Tighter = less capital at risk per trade",
  bos:            "Break of Structure — price broke a key level, signaling trend continuation",
  choch:          "Change of Character — price reversed direction, possible trend shift",
  fvg:            "Fair Value Gap — a price gap that tends to get filled. Filled = already closed",
  ob:             "Order Block — zone where big players placed orders. Price tends to revisit these",
  liquidity:      "Liquidity — zones with many pending orders that the market targets",
  killZone:       "Time windows when the market moves hardest. Best time to trade",
  entryZone:      "Ideal price range for entering the trade",
  rr:             "Risk:Reward — for every $1 you risk, how much you can gain. 1:2.8 = win $2.80 per $1 risked",
  tp:             "Take Profit — price target where you close the trade to lock in gains",
  sl:             "Stop Loss — price where you close to cut losses. Your insurance against disaster",
  fundingRate:    "Rate paid by leveraged traders. If very high, the market may reverse",
  openInterest:   "Total money bet in contracts. Sharp rise = big move incoming",
  // Trader metrics
  alpha:          "Overall performance score (0-100). Combines win rate, consistency and risk management",
  sharpe:         "Sharpe Ratio — risk-adjusted returns. Above 2.0 = excellent, below 1.0 = mediocre",
  sortino:        "Sortino Ratio — like Sharpe but only penalises downside volatility. Above 2.0 = strong loss-adjusted return",
  maxDD:          "Max Drawdown — worst losing streak in percentage. Lower = better",
  profitFactor:   "For every $1 lost, how much was gained. 2.0 = earned double what was lost",
  winRate:        "Percentage of winning trades. 70%+ = very good",
  streak:         "Win streaks — consecutive winning trades. Longer = hotter",
  copiers:        "People automatically copying this trader's positions",
  aum:            "Assets Under Management — total capital others trust to this trader",
  perfFee:        "Performance fee charged on your profits. 15% = for every $100 you earn, pay $15",
  leverage:       "Leverage — multiplies gains AND losses. 5x = 5 times more powerful (and riskier)",
  degen:          "Aggressiveness level. Degen = risky & fast. Safe = conservative & steady",
  expectancy:     "Expected profit per trade on average. Positive = profitable system",
  calmar:         "Calmar Ratio — annual return / max drawdown. Higher = better risk-adjusted performance",
  // Signals
  signalActive:   "Signal still active — the trader still has this position open",
  tpHit:          "Take Profit hit — the trade closed in profit",
  slHit:          "Stop Loss hit — the trade closed at a loss",
  // Trade anatomy (VARIV)
  mae:            "Maximum Adverse Excursion — how far price went AGAINST the trade before resolving. High MAE on a win = low-quality entry",
  mfe:            "Maximum Favorable Excursion — how far price went IN FAVOR before closing. High MFE on a loss = profit left on the table",
  setupTag:       "Machine-readable label of the setup: source_style_pattern_timeframe_assetclass. Trades without a tag can't train the AI",
  session:        "Market session when the trade was opened: ASIA / LONDON / NY",
  marketRegime:   "Market conditions during the trade: trending, ranging or volatile. Edge often depends on regime",
  tfDominant:     "Dominant timeframe the setup was read on: H1 / H4 / D1",
  assetClass:     "Asset class of the instrument: CRYPTO / FX / INDEX",
  source:         "Where the signal came from: TG (Telegram) / TV (TradingView) / AI (model)",
  styleConfidence:"How sure the ML classifier is about the assigned style (0–1). Low = ambiguous trade",
  latency:        "Lag between signal emission and execution. High latency erodes the edge of a good call",
  positionSizePct:"Share of account capital committed to the trade — context for what a % gain really means",
  rrGross:        "Planned Risk:Reward from price geometry alone, before fees",
  rrNet:          "Risk:Reward after fees — the real ratio the trader actually captured",
  compoundRoi:    "Compounded return of the trade sequence — interest on interest. Differs from simply adding each trade's %",
  totalRoi:       "Simple sum of every trade's % return (no compounding)",
  calmarRatio:    "Calmar Ratio — compound return ÷ worst drawdown. Higher = more return per unit of pain",
  actionability:  "Share of emitted signals that actually reached their entry zone and could be traded",
  avgTpTime:      "Average time for a signal to reach its first Take Profit",
  expectancyR:    "Average profit per trade measured in R (risk units). +0.42R = each trade earns 0.42× the risked amount on average",
  // Predictions
  odds:           "Market probability. 38% YES = most believe it won't happen",
  pot:            "Total money staked on this prediction. Split among the winners",
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

/* ── BotTag: bot vs human as a pure icon (no text) — quiet for beginners, instant for pros ── */
const tagBase = { display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: "700", padding: "1px 6px", borderRadius: "3px" };
const BotTag = ({ isBot, size = 15 }) => {
  if (isBot == null) return null;
  const Icon = isBot ? Bot : User;
  const clr = isBot ? C.cyan : C.green;
  return (
    <span title={isBot ? "Bot — automated strategy" : "Human trader"} aria-label={isBot ? "Bot" : "Human"} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      backgroundColor: `${clr}1c`, color: clr,
    }}><Icon size={Math.round(size * 0.62)} /></span>
  );
};

/* ── TP Progress Bar: thin inline bar ── */
const TpProgressBar = ({ entry, tp, sl, status }) => {
  if (status !== "active") return null;
  const isLong = tp > entry;
  const progress = 0.3 + srand(entry * 7 + tp * 13 + sl * 17) * 0.5; // deterministic per-trade progress (stable across re-renders)
  const currentPrice = isLong ? entry + (tp - entry) * progress : entry - (entry - tp) * progress;
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
  const seed = typeof itemId === "number" ? itemId : String(itemId).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const v = votesState[itemId] || { up: Math.floor(srand(seed * 7 + 3) * 40 + 10), down: Math.floor(srand(seed * 13 + 5) * 15 + 2), myVote: null };
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
  const timersRef = useRef([]);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { id, msg, type }]);
    timersRef.current.push(setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000));
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

/* ═══════════════════════ AVATAR (placeholder until real X/Telegram photos) ═══════════════════════
   Deterministic initials avatar: same name → same colors everywhere. Swap the
   inner render for an <img src={photoUrl}> once profile photos are connected. */
const avatarHue = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
};
const avatarInitials = (name = "") =>
  name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

const Avatar = ({ name = "", size = 32, photoUrl = null, ring = null, style = {} }) => {
  const h = avatarHue(name);
  return (
    <div title={name} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: photoUrl ? "transparent" : `linear-gradient(135deg, hsl(${h} 58% 48%), hsl(${(h + 40) % 360} 55% 38%))`,
      color: "#fff", fontWeight: 800, letterSpacing: "-0.5px",
      fontSize: Math.max(9, Math.round(size * 0.4)),
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      border: ring ? `2px solid ${ring}` : "none",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
      ...style,
    }}>
      {photoUrl
        ? <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : avatarInitials(name)}
    </div>
  );
};

export {
  AnimatedValue,
  Avatar,
  StatCard,
  SectionHeader,
  Tag,
  GLOSSARY,
  InfoTip,
  MiniSparkline,
  tagBase,
  BotTag,
  TpProgressBar,
  CommunityVote,
  ToastContext,
  useToast,
  ToastProvider
};
