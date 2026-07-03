import { Bot, ChevronDown, ThumbsDown, ThumbsUp, User, Users } from "lucide-react";
import { createPortal } from "react-dom";
import { srand } from "../lib/scoring";
import { C, cardStyle, mono, pillStyle } from "../theme";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
/* Renders the value as-is. (Previously counted up from 0, which briefly showed
   misleading numbers — e.g. an 81% win rate flashing "16%" or a $68K price flashing
   "$12K" mid-animation. Credibility beats the flourish: show the real number instantly.) */
const AnimatedValue = ({ value }) => <span>{value}</span>;

/* IconChip — the tinted rounded-square icon badge (one visual voice for every
   KPI card platform-wide: semantic color at low opacity behind the icon). */
const IconChip = ({ icon: Icon, color = C.blue, size = 40 }) => (
  <span aria-hidden style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), backgroundColor: `${color}1a`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    {Icon && <Icon size={Math.round(size * 0.45)} color={color} />}
  </span>
);

/* StatCard v3 — sentence-case label, big value, IconChip on the right.
   (v2's left accent bar + tiny uppercase label retired in favor of the calmer,
   more legible card language used across the platform.) */
const StatCard = ({ label, value, sub, icon: Icon, color = C.blue, tip }) => (
  <div className="card-hover" style={{ ...cardStyle, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "12.5px", color: C.textMuted, fontWeight: "600", marginBottom: "7px" }}>
        {tip ? <InfoTip k={tip}><span>{label}</span></InfoTip> : label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: "800", letterSpacing: "-0.3px", lineHeight: 1.05, ...mono }}><AnimatedValue value={value} /></div>
      {sub && <div style={{ fontSize: "11px", color: typeof sub === "string" && sub.startsWith("+") ? C.green : typeof sub === "string" && sub.startsWith("-") ? C.red : C.textMuted, marginTop: "5px" }}>{sub}</div>}
    </div>
    <IconChip icon={Icon} color={color} />
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
  // Execution Engine (re-simulation)
  engNetPnl:      "Net P&L of the re-simulation — sum of every partial leg's realized P&L, after fees, across all entered signals at your sizing and cost settings",
  engSignals:     "Approved signals in scope. Entries = those whose limit price filled; no-entry = price never returned to the entry zone",
  reachedLevel:   "Share of entered trades where price reached this partial take-profit (Ln). A higher level being hit implies the lower ones were too",
  runnerTrailing: "Share of trades where the trailing Runner leg rode all the way to the furthest target",
  expectancyPct:  "Average % return per trade (gross of leverage) across every entered signal",
  sharpeTrade:    "Per-trade Sharpe = mean ÷ std-dev of net returns × √n. Higher = a steadier edge",
  totalReturn:    "Final balance vs starting capital, as a percent",
  cagr:           "Compound annual growth rate implied by the period's return",
  lossStreak:     "Longest run of consecutive losing trades in the sequence",
  avgREng:        "Average R-multiple = return ÷ risk per trade. +1R means the trade made what it risked",
  peakConcurrency:"Most positions open at the same instant (and the average), given your max-concurrent cap",
  exposure:       "Share of the period with at least one position open — time in market",
  rejectedEng:    "Signals Robotín rejected — excluded from this re-simulation",
  avgDuration:    "Average time a trade stayed open, from entry to final exit",
  openEng:        "Trades still running (no final exit) at the end of the window",
  partialTps:     "Number of take-profit legs (n−1 partials + a trailing Runner). The position is split across them",
  pctPerTp:       "Share of the position closed at each take-profit leg. Must sum to 100%",
  trailing:       "Trailing Runner — the last leg rides the trend to the furthest target instead of a fixed level",
  sizingMode:     "Margin = fixed notional (margin × leverage). Risk = size each trade so a stop-out loses a set % of capital",
  riskTrade:      "Percent of capital risked per trade in Risk sizing — the loss if the stop is hit",
  marginField:    "Fixed dollar margin per trade; notional = margin × leverage",
  feeSide:        "Trading fee per side (charged on both entry and exit), as a % of notional",
  capitalMode:    "Fixed = every trade sized off the starting capital. Compound = sized off the running balance (interest on interest)",
  maxConcurrent:  "Cap on how many trades can be open at the same time",
  excursion:      "Excursion (no leverage) — how far price ran for/against the trade while it was open, vs entry",
  // Trade Report (broker ledger)
  initialBalance: "Starting capital of the VARIV broker accounts at the beginning of the month. Note: this is the BROKER ledger — a different book from the signal-book equity on Overview. The two are separate universes by design (account history vs the current signal window) and will reconcile once live connectors ship.",
  currentBalance: "Running broker-account balance = initial balance + realized net P&L for the month. Distinct from Overview's signal-book equity — that one tracks executed signals in the current window; this one tracks the accounts' monthly history.",
  monthRoi:       "Return on the month = realized net P&L ÷ initial balance",
  netPnlReport:   "Net realized profit or loss after commissions for the period",
  feesPos:        "Total broker commissions paid on the period's positions",
  positionsClosed:"Number of positions closed in the period",
  rrrReport:      "Realized risk:reward — average winning trade ÷ average losing trade (∞ when there were no losers)",
  capitalVol:     "Capital volume — sum of the margin committed across all positions",
  leveragedVol:   "Leveraged (notional) volume — sum of position sizes (margin × leverage)",
  commissionReport:"Broker commission charged on this position",
  // Execution Audit (TCA + verification)
  totalSignalsAudit:"Every Robotín-approved signal in scope — closed, active and pending",
  theoWinRate:    "Theoretical win rate — share of closed trades whose gross outcome hit Take Profit, before fees",
  execWinRate:    "Executed win rate — share of closed trades with a positive net P&L after fees",
  totalFees:      "Sum of per-trade execution fees across closed trades",
  matchRate:      "How often the gross outcome (TP/SL) agreed with the net result (profit/loss) — disagreements flag fee drag",
  avgSlippage:    "Average arrival slippage — realized fill vs the price when Robotín approved, in basis points. Negative = beat arrival",
  beatArrival:    "Share of fills that executed better than the approval price",
  bestFill:       "Best single arrival slippage in the period (most favorable fill, in bps)",
  worstFill:      "Worst single arrival slippage in the period (most adverse fill, in bps)",
  confCalibration:"Realized win rate bucketed by Robotín's approval confidence — a calibrated filter wins more as confidence rises",
  bestTrade:      "Largest single winning trade (net P&L) in the period",
  worstTrade:     "Largest single losing trade (net P&L) in the period",
  avgWinTrade:    "Average net profit across winning trades",
  avgLossTrade:   "Average net loss across losing trades",
  feeNotional:    "Average fee as a share of position notional — the cost drag per trade",
  longWinRate:    "Win rate on LONG trades only",
  shortWinRate:   "Win rate on SHORT trades only",
};

const InfoTip = ({ k, children, inline = false }) => {
  // The tooltip is rendered in a portal to <body> with fixed positioning so it can
  // NEVER be clipped by an ancestor's overflow:hidden (cards, tables, sticky headers).
  const [pos, setPos] = useState(null); // { x, y, below } in viewport coords
  const ref = useRef(null);
  const text = GLOSSARY[k];
  if (!text) return children || null;
  const place = () => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150);
    const below = r.top < 130; // not enough room above → flip below
    setPos({ x, y: below ? r.bottom + 8 : r.top - 8, below });
  };
  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "3px", cursor: "help" }}
      onMouseEnter={place}
      onMouseLeave={() => setPos(null)}
      tabIndex={0}
      role="button"
      aria-label={`Explain: ${text}`}
      onFocus={place}
      onBlur={() => setPos(null)}
      onKeyDown={(e) => { if (e.key === "Escape") setPos(null); }}
    >
      {children}
      <span style={{
        width: 14, height: 14, borderRadius: "50%", backgroundColor: C.border, color: C.textMuted,
        fontSize: "9px", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0
      }}>?</span>
      {pos && createPortal(
        <span style={{
          position: "fixed", left: pos.x, top: pos.y,
          transform: `translate(-50%, ${pos.below ? "0" : "-100%"})`,
          backgroundColor: "#1c2129", border: `1px solid ${C.borderLight}`, borderRadius: "8px",
          padding: "10px 14px", fontSize: "12px", color: C.text, lineHeight: "1.5",
          width: "260px", maxWidth: "calc(100vw - 24px)", zIndex: 100000, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          pointerEvents: "none", fontWeight: "400", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          textTransform: "none", letterSpacing: "0", whiteSpace: "normal",
        }}>{text}</span>,
        document.body
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

/* EmptyState — a friendly dead-end that points to the next action (Geist/Linear
   rule: an empty view should explain why it's empty and what to do, never blank). */
const EmptyState = ({ icon: Icon, title = "Nothing here yet", hint, compact = false }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
    gap: 8, padding: compact ? "28px 16px" : "48px 16px", color: C.textMuted,
  }}>
    {Icon && (
      <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>
        <Icon size={20} color={C.textFaint} />
      </div>
    )}
    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</div>
    {hint && <div style={{ fontSize: 11.5, color: C.textMuted, maxWidth: 320, lineHeight: 1.5 }}>{hint}</div>}
  </div>
);

/* CollapsibleSection — a self-contained panel that (a) folds to a one-line header
   with a live summary, and (b) optionally caps its body height with internal scroll
   (terminal pattern: the panel scrolls inside instead of growing the whole page).
   Open/closed state persists per `persistKey`. The header `right` controls don't
   toggle the panel. */
const CollapsibleSection = ({ icon: Icon, title, summary, right, defaultOpen = true, persistKey, maxBody, accent = C.purple, children }) => {
  const [open, setOpen] = useState(() => {
    if (!persistKey) return defaultOpen;
    try { const v = localStorage.getItem(`collapse:${persistKey}`); return v === null ? defaultOpen : v === "1"; } catch { return defaultOpen; }
  });
  const toggle = () => setOpen((o) => {
    const n = !o;
    if (persistKey) { try { localStorage.setItem(`collapse:${persistKey}`, n ? "1" : "0"); } catch { /* ignore */ } }
    return n;
  });
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
      <div onClick={toggle} role="button" tabIndex={0} aria-expanded={open}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", borderBottom: open ? `1px solid ${C.border}` : "none" }}>
        <ChevronDown size={16} style={{ color: C.textMuted, transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.15s", flexShrink: 0 }} />
        {Icon && <Icon size={15} color={accent} style={{ flexShrink: 0 }} />}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</span>
          {summary && <span style={{ fontSize: 10.5, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{summary}</span>}
        </div>
        {right && <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>{right}</div>}
      </div>
      {open && <div style={maxBody ? { maxHeight: maxBody, overflowY: "auto" } : undefined}>{children}</div>}
    </div>
  );
};

export {
  AnimatedValue,
  Avatar,
  CollapsibleSection,
  EmptyState,
  IconChip,
  StatCard,
  SectionHeader,
  Tag,
  GLOSSARY,
  InfoTip,
  MiniSparkline,
  tagBase,
  BotTag,
  ToastContext,
  useToast,
  ToastProvider
};
