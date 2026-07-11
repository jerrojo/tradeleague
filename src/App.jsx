import { TraderProfile } from "./components/TraderProfile";
import { Activity, AlertTriangle, Award, BarChart3, Beaker, Bell, BellRing, Bookmark, Bot, Briefcase, Calendar, Check, CheckCircle2, ChevronDown, ChevronRight, Copy, Cpu, Link2, DollarSign, Eye, FileText, Flame, GitBranch, Globe, HelpCircle, Layers, LayoutDashboard, Lightbulb, MessageCircle, Radio, Scale, Search, Settings, Sparkles, Star, Target, ToggleLeft, ToggleRight, TrendingDown, TrendingUp, Trophy, Users, Wallet, X, Zap } from "lucide-react";
import { Avatar, BotTag, ToastProvider } from "./components/common";
import { PrintTearSheet } from "./components/PrintTearSheet";
import { DateContext, FeedFilterContext, ProfileContext, ProContext, TimeframeProvider, NavContext, LivePriceProvider, useLivePrices } from "./contexts";
import { LiveFooterQuote } from "./components/LiveTape";
import { TimeframeFilter } from "./components/TimeframeFilter";
import { ThemeProvider } from "./theme";
import { FundOverview } from "./components/tabs/FundOverview";
import { TradeReport } from "./components/tabs/TradeReport";
import { ExecutionEngine } from "./components/tabs/ExecutionEngine";
import { MarketsSection, ActivitySection, TradersSection, AuditSection } from "./components/sections";
import { mockTraders } from "./data/mockData";
import { ALL_SIGNALS } from "./data/robotin";
import { START_CAPITAL } from "./data/fund";
import { usd, fmtTime } from "./lib/format";
import { readUrl, patchUrl, currentShareUrl } from "./lib/urlState";
import { C, T, cardStyle, mono } from "./theme";
import { useEffect, useMemo, useRef, useState } from "react";
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

/* ── New-version notifier: an open SPA tab keeps running the bundle it loaded,
   so freshly deployed changes are invisible until a reload. Poll the served
   index.html every minute, compare its bundle hash with the one this tab runs,
   and offer a one-click refresh when they differ. ── */
const UpdateNotifier = () => {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const current = document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute("src");
    if (!current) return; // dev server — nothing to compare
    const check = async () => {
      try {
        const html = await fetch(`/?v=${Date.now()}`, { cache: "no-store" }).then((r) => r.text());
        const m = html.match(/\/assets\/index-[\w-]+\.js/);
        if (m && m[0] !== current) setStale(true);
      } catch { /* offline / fetch blocked — check again next tick */ }
    };
    const id = setInterval(check, 60000);
    check();
    return () => clearInterval(id);
  }, []);
  if (!stale) return null;
  return (
    <div style={{ position: "fixed", bottom: 48, right: 20, zIndex: 700, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, backgroundColor: C.card, border: `1px solid ${C.purple}50`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", animation: "toastSlideIn 0.25s ease" }}>
      <Sparkles size={15} color={C.purple} />
      <span style={{ fontSize: 12.5, color: C.text }}>A new version was deployed.</span>
      <button onClick={() => window.location.reload()} style={{ padding: "7px 14px", borderRadius: 7, border: "none", backgroundColor: C.purple, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        Refresh
      </button>
    </div>
  );
};

/* ── Footer feed status: honest two-book chip. When a real exchange tape is
   flowing it shows LIVE TAPE (source + provenance tooltip) *alongside* an amber
   SIM BOOK chip — prices are real, the ledger is simulated, and the UI never
   blurs that line. With no reachable source it stays the plain amber SIM FEED. ── */
const FeedStatus = () => {
  const { status, source, asOf } = useLivePrices();
  if (status === "live") {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }} title={`Real spot prices from the ${source} public API — as of ${fmtTime(asOf)}, refreshed every 30s.`}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.green, display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />
          <span style={{ color: C.green }}>LIVE TAPE</span>
          <span style={{ color: C.textFaint }}>{source}</span>
        </div>
        <div style={{ width: "1px", height: 16, backgroundColor: C.border }} />
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }} title="Trades, P&L and analytics run on the deterministic simulated book — never re-marked against the live tape.">
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.amber, display: "inline-block" }} />
          <span style={{ color: C.amber }}>SIM BOOK</span>
        </div>
      </>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }} title="Deterministic simulated feed — flips to LIVE TAPE automatically when a public exchange API is reachable.">
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.amber, display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />
      <span style={{ color: C.amber }}>SIM FEED</span>
    </div>
  );
};

/* ═══════════════════════ MAIN APP ═══════════════════════ */
const TAB_IDS = ["overview", "activity", "report", "audit", "engine", "traders", "markets"];

/* A view is a URL. On boot the query string WINS over localStorage — that's what makes
   a link someone sent you actually open what they were looking at — and it seeds the
   per-section filter inboxes before those sections mount and read them. */
const bootFromUrl = () => {
  const u = readUrl();
  try {
    if (u.book || u.status || u.dir || u.coin) {
      localStorage.setItem("af:book", u.book || "all");
      localStorage.setItem("af:status", u.status || "all");
      localStorage.setItem("af:dir", u.dir || "all");
      localStorage.setItem("af:coin", u.coin || "all");
    }
    if (u.tab === "markets" && u.coin) localStorage.setItem("mk:coin", u.coin);
    if (u.trader && u.tp) {
      localStorage.setItem("tp:tab", u.tp);
      localStorage.setItem("tp:book", u.tpbook || "all");
    }
  } catch { /* ignore */ }
  return u;
};

const App = () => {
  const boot = useRef(bootFromUrl()).current;
  // The URL is the source of truth for a shared view; localStorage only remembers where
  // YOU were last, for a plain revisit.
  const [activeTab, setActiveTab] = useState(() => {
    if (TAB_IDS.includes(boot.tab)) return boot.tab;
    try { const t = localStorage.getItem("tl_active_tab"); return TAB_IDS.includes(t) ? t : "overview"; } catch { return "overview"; }
  });
  // Audit anchor (deep-linkable from KPI cards). Deliberately NOT persisted:
  // Audit is one page now, so a stored value would only make a fresh visit land
  // mid-scroll — every session starts at the top.
  const [auditView, setAuditView] = useState(boot.audit || "execution");
  useEffect(() => { try { localStorage.setItem("tl_active_tab", activeTab); } catch { /* ignore */ } }, [activeTab]);
  // Scroll policy: EVERY view change lands at the top, no exceptions and no
  // per-callsite bookkeeping. The browser's own scroll restoration is disabled
  // so reloads can't resurrect an old position either. (The only downward
  // scrolls left are explicit in-page anchors: Audit's jump-nav deep links and
  // Markets' coin-detail glide — those are destinations, not restored state.)
  useEffect(() => { if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual"; window.scrollTo({ top: 0 }); }, []);
  const go = (tab, opts = {}) => {
    // Deep-link inbox. Every aggregate number in the product should be able to say
    // "here are the rows behind me" — we write the target view's filters here, before
    // the section remounts (main is keyed on activeTab), and the section reads them on
    // mount. Activity: BOOK + STATUS + DIR + COIN. Markets: COIN.
    try {
      if (tab === "activity") {
        // A deep-link must produce EXACTLY the rows the clicked number counted, so it
        // writes every dimension — unspecified ones are reset to "all". Otherwise a
        // filter left over from a previous visit (Activity persists them) silently
        // narrows the result and the number you clicked no longer matches the row count.
        // A bare go("activity") (plain nav) is left alone: it keeps the user's own view.
        const deep = opts.book || opts.status || opts.dir || opts.coin;
        if (deep) {
          localStorage.setItem("af:book", opts.book || "all");
          localStorage.setItem("af:status", opts.status || "all");
          localStorage.setItem("af:dir", opts.dir || "all");
          localStorage.setItem("af:coin", opts.coin || "all");
        }
      }
      if (tab === "markets" && opts.coin) localStorage.setItem("mk:coin", opts.coin);
    } catch { /* ignore */ }
    // ...and put the whole view in the address bar, so this exact screen can be sent
    // to a colleague. Filters that don't belong to the destination are cleared.
    patchUrl({
      tab,
      trader: null, tp: null, tpbook: null,
      audit: tab === "audit" ? (opts.auditView || null) : null,
      book: tab === "activity" ? (opts.book || null) : null,
      status: tab === "activity" ? (opts.status || null) : null,
      dir: tab === "activity" ? (opts.dir || null) : null,
      coin: (tab === "activity" || tab === "markets") ? (opts.coin || null) : null,
    }, { push: true });
    setActiveTab(tab); setProfileTrader(null);
    if (tab === "audit" && opts.auditView) setAuditView(opts.auditView);
    window.scrollTo({ top: 0 });
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(max-width: 900px)").matches : false));
  // Narrow screens get the compact sidebar automatically (and re-expand when widened)
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = (e) => setSidebarCollapsed(e.matches);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange); };
  }, []);
  const [dateRange, setDateRange] = useState("1m");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [profileTrader, setProfileTrader] = useState(null);
  // central catch-all: switching section OR opening/closing a profile → top.
  // Covers sidebar, keyboard 1–7, search results, welcome cards, alerts, every
  // trader-name click across the app, and the profile back button.
  // The second, delayed reset beats late layout: chart-heavy sections mount
  // ResponsiveContainers asynchronously and the browser's scroll anchoring can
  // drag the position back down after the first scrollTo.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => window.scrollTo({ top: 0 }), 150);
    return () => clearTimeout(t);
  }, [activeTab, profileTrader]);
  // ─── Browser history sync ───────────────────────────────────────────────
  // Every view (section, open trader profile, audit anchor) becomes a history
  // entry so the browser's Back/Forward buttons move between them. We watch the
  // nav state itself, so ALL entry points — sidebar, keyboard 1–7, search,
  // welcome cards, deep links, trader-name clicks — are covered without wrapping
  // each callsite. popstate reapplies the stored view; a guard ref stops the
  // reapply from pushing a fresh entry (which would break Forward).
  const historyPopRef = useRef(false);
  const historyMountRef = useRef(false);
  useEffect(() => {
    // keep the address bar honest for entry points that bypass go() (sidebar, keyboard
    // 1–7, search, welcome cards). Replace, not push — go()/openProfile already pushed.
    if (!historyMountRef.current) {
      historyMountRef.current = true;
      patchUrl({ tab: activeTab, trader: profileTrader?.name || null });
      return;
    }
    if (historyPopRef.current) { historyPopRef.current = false; return; }
    patchUrl({ tab: activeTab, trader: profileTrader?.name || null }, { push: true });
  }, [activeTab, profileTrader, auditView]);
  useEffect(() => {
    const onPop = () => {
      // Read the URL, NOT history.state: a link someone pasted in cold has no state
      // object, and that's exactly the case we built this for.
      const u = readUrl();
      historyPopRef.current = true;
      setActiveTab(TAB_IDS.includes(u.tab) ? u.tab : "overview");
      setAuditView(u.audit || "execution");
      setProfileTrader(u.trader ? (mockTraders.find((t) => t.name === u.trader) || null) : null);
      try {
        localStorage.setItem("af:book", u.book || "all");
        localStorage.setItem("af:status", u.status || "all");
        localStorage.setItem("af:dir", u.dir || "all");
        localStorage.setItem("af:coin", u.coin || "all");
        if (u.tp) { localStorage.setItem("tp:tab", u.tp); localStorage.setItem("tp:book", u.tpbook || "all"); }
      } catch { /* ignore */ }
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [feedFilter, setFeedFilter] = useState("all");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertFilter, setAlertFilter] = useState("all");
  const [notif, setNotif] = useState({});
  const [showTearSheet, setShowTearSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const proMode = true; // Casual/Pro split removed — always show full Pro detail
  const searchRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // First-run onboarding: show the welcome guide once (remembered across visits)
  useEffect(() => {
    try {
      if (!localStorage.getItem("tl_onboarded")) setShowWelcome(true);
    } catch { /* storage unavailable — skip */ }
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    try { localStorage.setItem("tl_onboarded", "1"); } catch { /* ignore */ }
  };

  // Cmd+K keyboard shortcut for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { traders: [], pairs: [], tabs: [] };
    const q = searchQuery.toLowerCase();
    const traders = mockTraders.filter(t => t.name.toLowerCase().includes(q));
    const allPairs = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","AVAX/USDT","DOGE/USDT","ADA/USDT"];
    const pairs = allPairs.filter(p => p.toLowerCase().includes(q));
    const tabList = [
      { id: "overview", label: "Overview", desc: "The investor tear-sheet — capital, return, risk and system state" },
      { id: "activity", label: "Activity", desc: "The live tape — every signal and what Robotín did with it" },
      { id: "report", label: "Trade Report", desc: "Executed positions by day — per-position breakdown across the VARIV accounts" },
      { id: "audit", label: "Execution Audit", desc: "Order fills, slippage, fees and real vs theoretical net PnL" },
      { id: "audit", label: "Analytics", desc: "Signal-provider edge — KPIs, equity, win rate by style, expectancy by pair" },
      { id: "engine", label: "Execution Engine", desc: "Re-simulate execution with partials, sizing & costs over historical signals" },
      { id: "traders", label: "Traders", desc: "Signal-provider leaderboard, profiles and attribution" },
      { id: "markets", label: "Markets", desc: "The cross-coin panorama, then drill into any coin's detail" },
    ];
    const tabs = tabList.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
    return { traders, pairs, tabs };
  }, [searchQuery]);

  // Close search on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") { setShowSearch(false); setShowAlerts(false); setShowSettings(false); setShowTearSheet(false); dismissWelcome(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Keyboard nav — 1–6 jump between sections in sidebar order (pro speed). Ignored while typing.
  useEffect(() => {
    const SECTIONS = { "1": "overview", "2": "activity", "3": "report", "4": "audit", "5": "engine", "6": "traders", "7": "markets" };
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
      if (SECTIONS[e.key]) { setActiveTab(SECTIONS[e.key]); setProfileTrader(null); if (SECTIONS[e.key] === "audit") setAuditView("execution"); window.scrollTo({ top: 0 }); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Every signal across all coins — from the memoized store (computed once)
  const signalsAll = ALL_SIGNALS;

  // Fund identity (VARIV) — derived from the approved/executed book, never hardcoded
  const fundStats = useMemo(() => {
    const approved = signalsAll.filter((s) => s.approved);
    const closed = approved.filter((s) => s.status === "closed");
    const net = closed.reduce((a, s) => a + s.pnl, 0);
    return {
      total: signalsAll.length, approved: approved.length,
      active: approved.filter((s) => s.status === "active").length,
      net, balance: START_CAPITAL + net,
    };
  }, [signalsAll]);

  // Real alerts — Robotín's recent approve/reject/TP/SL events from the signal tape
  const alertsList = useMemo(() => {
    const ago = (t) => { const m = Math.max(1, Math.round(Date.now() / 1000 / 60 - t / 60)); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; };
    // Structured alerts: the datum that changes (pair + direction) leads in bold;
    // the repeated sentence becomes a verb chip + a short detail line.
    return [...signalsAll].sort((a, b) => b.time - a.time).slice(0, 16).map((s, i) => {
      const read = i >= 5;
      const base = { id: s.id, pair: s.coin, dir: s.dir, trader: s.trader, time: ago(s.time), read };
      if (!s.approved) return { ...base, type: "rejected", verb: "Rejected", detail: s.rejectReason || "below threshold", priority: "low" };
      if (s.status === "closed" && s.hit === "TP") return { ...base, type: "win", verb: "Target hit", detail: usd(s.pnl, { signed: true }), priority: "normal" };
      if (s.status === "closed" && s.hit === "SL") return { ...base, type: "loss", verb: "Stopped out", detail: usd(s.pnl, { signed: true }), priority: "normal" };
      return { ...base, type: "approved", verb: "Approved", detail: `by Robotín`, conf: s.confidence, priority: s.confidence >= 90 ? "high" : "normal" };
    });
  }, [signalsAll]);
  const visibleAlerts = alertFilter === "all" ? alertsList : alertsList.filter((a) => a.type === alertFilter);
  const unreadCount = alertsList.filter((a) => !a.read).length;

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

  const openProfile = (trader) => {
    // a profile is a destination: its own history entry AND its own URL, including the
    // sub-tab/book a deep-link asked for — so "Gonza's rejected book" becomes a link
    // you can send, not just a click you can make.
    let tp = null, tpbook = null;
    try { tp = localStorage.getItem("tp:tab"); tpbook = localStorage.getItem("tp:book"); } catch { /* ignore */ }
    patchUrl({ trader: trader?.name || null, tp, tpbook, book: null, status: null, dir: null, coin: null }, { push: true });
    setProfileTrader(trader);
  };
  const closeProfile = () => { patchUrl({ trader: null, tp: null, tpbook: null }, { push: true }); setProfileTrader(null); };

  // v3 IA — six job-based sections. Each groups its destinations behind one nav item.
  // "Analyze" is the Pro workbench and only appears in Pro mode.
  // Two groups: "Fund" = the fund's own performance & operations (summary → live →
  // ledger → verification); "Research" = the inputs behind the edge (people + assets).
  const tabs = [
    { zone: true, id: "z-fund", label: "Fund" },
    { id: "overview", label: "Overview", icon: LayoutDashboard, accent: C.purple },
    { id: "activity", label: "Activity", icon: Activity, accent: C.green },
    { id: "report", label: "Trade Report", icon: Calendar, accent: C.cyan },
    { id: "audit", label: "Audit", icon: Scale, accent: C.amber },
    { id: "engine", label: "Execution Engine", icon: Beaker, accent: C.purple },
    { zone: true, id: "z-research", label: "Research" },
    { id: "traders", label: "Traders", icon: Users, accent: C.blue },
    { id: "markets", label: "Markets", icon: Globe, accent: C.cyan },
  ];

  // One-line orientation per section (LukeW: every screen should say what it's for).
  const tabMeta = {
    overview: "The fund at a glance — capital, return, risk and system state on one page",
    traders: "Who's winning, and everyone you can follow — the live race plus the searchable directory",
    markets: "The whole board at a glance, then drill into any coin — chart, signals, positioning and the consensus call",
    activity: "The live tape — every signal and what Robotín did with it, newest first, across all coins",
    audit: "The verification layer — execution audit (fills, fees, real vs theoretical) + signal-provider analytics",
    engine: "Re-simulate execution over historical signals — partials, sizing, fees and a fixed/compounding account, with a per-signal breakdown",
    report: "Executed positions by day — pick a date for the full position-by-position breakdown across the VARIV accounts",
  };

  // Section → component mapping
  const tabContent = {
    overview: FundOverview,    // Overview = the investor tear-sheet (synthesis only)
    traders: TradersSection,   // Traders = live race + searchable directory + profiles
    markets: MarketsSection,   // Markets = one coin, everything on one page
    activity: ActivitySection, // Activity = the global Robotín lifecycle tape
    audit: AuditSection,       // Audit = Execution Audit + Analytics (verification layer)
    engine: ExecutionEngine,   // Execution Engine = configurable re-simulation
    report: TradeReport,       // Trade Report = per-day executed-positions ledger
  };
  const ActiveComponent = tabContent[activeTab] || FundOverview;
  const sideW = sidebarCollapsed ? 56 : 200;

  return (
    <ThemeProvider>
    <ToastProvider>
    <LivePriceProvider>
      <TimeframeProvider>
      <ProContext.Provider value={{ proMode }}>
      <DateContext.Provider value={{ dateRange, setDateRange, dateFrom, dateTo, dateLabel }}>
        <ProfileContext.Provider value={{ openProfile, closeProfile, profileTrader }}>
        <FeedFilterContext.Provider value={{ feedFilter, setFeedFilter, setActiveTab }}>
        <NavContext.Provider value={{ go, auditView, setAuditView }}>
        <div style={{ backgroundColor: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <style>{`
            @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            tr.hoverable:hover { background-color: ${C.cardHover} !important; }
            /* interactive surfaces never show text-selection highlights (stray purple
               boxes when clicking names/rows); data stays copyable via CSV/JSON export */
            button, [role="button"], tr.hoverable, .fav-chip { -webkit-user-select: none; user-select: none; }
            /* browser scroll anchoring fights our scroll-to-top when async charts resize the page */
            html { overflow-anchor: none; }
            .card-hover:hover { border-color: ${C.borderLight} !important; }
            .card-glow:hover { box-shadow: 0 0 20px rgba(139,92,246,0.08) !important; }
            button.btn-hover:hover { filter: brightness(1.15); }
            .grid-2col { display: grid; grid-template-columns: 1fr 320px; gap: 12px; }
            .grid-2col-16 { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
            @media (max-width: 900px) {
              .grid-2col, .grid-2col-16 { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 820px) {
              .grid-cal { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 860px) {
              .grid-consensus { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 1100px) {
              .dash-grid { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 700px) {
              .grid-3col { grid-template-columns: 1fr !important; }
            }
          `}</style>


          {/* ── Main Layout ── */}
          <div style={{ display: "flex", flex: 1 }}>

          {/* ── Left Sidebar ── */}
          <aside style={{
            width: sideW, minHeight: "100vh", backgroundColor: C.card, borderRight: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 200,
            transition: "width 0.2s ease", overflow: "hidden"
          }}>
            {/* Logo + collapse toggle */}
            <div style={{ height: 56, display: "flex", alignItems: "center", padding: sidebarCollapsed ? "0 12px" : "0 16px", borderBottom: `1px solid ${C.border}`, justifyContent: sidebarCollapsed ? "center" : "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                <div style={{ width: 12, height: 12, backgroundColor: C.purple, borderRadius: "50%", flexShrink: 0 }} />
                {!sidebarCollapsed && <span style={{ fontWeight: "800", fontSize: "16px", letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>Tradethlon</span>}
              </div>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <ChevronRight size={16} style={{ transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }} />
              </button>
            </div>

            {/* Nav items — 3-zone grouping */}
            <nav role="tablist" aria-label="Main sections" style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: "1px", overflowY: "auto" }}>
              {tabs.map(tab => {
                if (tab.zone) return (
                  <div key={tab.id} style={{ padding: sidebarCollapsed ? "8px 0 4px" : "12px 12px 4px", overflow: "hidden" }}>
                    {!sidebarCollapsed && <span style={{ fontSize: "10px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>{tab.label}</span>}
                    {sidebarCollapsed && <div style={{ height: "1px", backgroundColor: C.border, margin: "0 8px" }} />}
                  </div>
                );
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const activeColor = tab.accent || C.purple;
                return (
                  <button key={tab.id} role="tab" aria-selected={isActive} aria-label={tab.label} onClick={() => {
                    setActiveTab(tab.id);
                    setFeedFilter("all");
                    setProfileTrader(null);
                    if (tab.id === "audit") setAuditView("execution"); // plain nav lands at the top, not at a stale deep-link section
                    window.scrollTo({ top: 0 }); // never inherit another section's scroll position
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

            {/* Bottom section */}
            <div style={{ padding: "8px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "2px" }}>
              {[{ icon: Settings, label: "Settings", action: () => setShowSettings(true) }, { icon: Bell, label: "Alerts", action: () => setShowAlerts(true) }].map(item => (
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
          <div style={{ flex: 1, minWidth: 0, marginLeft: sideW, transition: "margin-left 0.2s ease", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

            {/* Top Bar */}
            <header style={{ height: 56, position: "sticky", top: 0, zIndex: 100, backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
              {/* Left: Tab title + one-line orientation (LukeW: say what the screen is for) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* top of the ladder: page 18/800 > section 15/700 > card 13/600 */}
                  <span style={{ ...T.pageTitle, color: C.text }}>
                    {profileTrader ? profileTrader.name : (tabs.find(t => t.id === activeTab)?.label || "Arena")}
                  </span>
                  {/* Data provenance — honest about simulated vs live (flips to LIVE when connectors are wired) */}
                  <span title="All data on this preview is simulated. Will switch to LIVE once exchange/social connectors are wired." style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: "700", padding: "3px 8px", borderRadius: "4px", backgroundColor: C.amberBg, color: C.amber, border: `1px solid ${C.amber}30`, ...mono }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: C.amber, display: "inline-block" }} /> SIMULATED
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profileTrader ? `${profileTrader.style} trader · rank #${profileTrader.rank} · ${profileTrader.winRate}% win rate` : (tabMeta[activeTab] || "")}
                </span>
              </div>

              {/* Right: global time filter + utility icons. Trade Report and the
                  Execution Engine carry their own date controls — showing the global
                  filter there implies it applies when it doesn't, so it steps aside. */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {["report", "engine"].includes(activeTab) && !profileTrader ? (
                  <span title="This section has its own date controls — the global timeframe doesn't apply here." style={{ fontSize: 10.5, color: C.textFaint, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "6px 10px", whiteSpace: "nowrap", ...mono }}>
                    Own date range
                  </span>
                ) : (
                  <TimeframeFilter />
                )}
                {/* Send this exact view — the whole point of putting the view in the URL */}
                <button onClick={async () => {
                  try { await navigator.clipboard.writeText(currentShareUrl()); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
                }} aria-label="Copy a link to this exact view" title="Copy a link to this exact view — filters included"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "transparent", border: `1px solid ${copied ? C.green : C.border}`, color: copied ? C.green : C.textMuted, cursor: "pointer", padding: "6px 10px", borderRadius: "6px", fontSize: 11, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? "Copied" : "Share view"}
                </button>
                {/* Committee tear-sheet export */}
                <button onClick={() => setShowTearSheet(true)} aria-label="Export committee tear sheet" title="Export committee tear sheet (PDF)" style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", padding: "6px 10px", borderRadius: "6px", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>
                  <FileText size={14} /> Tear sheet
                </button>
                {/* Notifications bell with count */}
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowAlerts(!showAlerts)} style={{ backgroundColor: showAlerts ? C.purpleBg : "transparent", border: "none", color: showAlerts ? C.purple : C.textMuted, cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", borderRadius: "6px" }}>
                    <Bell size={17} />
                  </button>
                  {unreadCount > 0 && <div style={{
                    position: "absolute", top: "2px", right: "2px", width: "14px", height: "14px",
                    borderRadius: "50%", backgroundColor: C.purple, color: "#fff",
                    fontSize: "8px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center",
                    pointerEvents: "none"
                  }}>{unreadCount}</div>}
                </div>
                {/* Search */}
                <button onClick={() => setShowSearch(true)} aria-label="Search (Command-K)" style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", borderRadius: "6px", gap: "6px" }}>
                  <Search size={17} />
                  <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>⌘K</span>
                </button>
                {/* Help — reopen the welcome guide */}
                <button onClick={() => setShowWelcome(true)} title="What is this? — platform guide" aria-label="Open platform guide" style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", borderRadius: "6px" }}>
                  <HelpCircle size={17} />
                </button>
              </div>
            </header>

            {/* ── Welcome / Onboarding Guide ── */}
            {showWelcome && (
              <div onClick={dismissWelcome} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "640px", maxHeight: "85vh", overflowY: "auto", backgroundColor: C.card, border: `1px solid ${C.borderLight}`, borderRadius: "16px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
                  <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: C.purple }} />
                      <span style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "-0.5px" }}>Welcome to Tradethlon</span>
                    </div>
                    <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.5 }}>
                      An intelligence terminal for traders. Seven areas, one job each — start anywhere, every screen tells you what it's for.
                    </div>
                  </div>
                  {/* THE differentiator leads — the counterfactual is what no other tool has */}
                  <div style={{ margin: "16px 28px 0", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${C.purple}35`, backgroundColor: `${C.purple}0d`, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <GitBranch size={15} color={C.purple} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.5 }}>
                      <b style={{ color: C.text }}>What no other tool has:</b> Tradethlon tracks the counterfactual. Every signal Robotín <i>rejects</i> keeps living as a simulated position — so you can <b style={{ color: C.purple }}>prove</b> what the filter's judgment is worth, not just assert it.
                    </span>
                  </div>
                  <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {[
                      { icon: LayoutDashboard, color: C.purple, t: "Overview", d: "The fund at a glance — capital, return, risk and system state.", go: "overview" },
                      { icon: Activity, color: C.green, t: "Activity", d: "Every signal and what Robotín did with it — the live tape.", go: "activity" },
                      { icon: Calendar, color: C.cyan, t: "Trade Report", d: "Executed positions by day — pick a date for the full breakdown.", go: "report" },
                      { icon: Scale, color: C.amber, t: "Audit", d: "Execution audit (fills, fees, real vs theoretical) + signal analytics.", go: "audit" },
                      { icon: Beaker, color: C.purple, t: "Execution Engine", d: "Re-simulate execution with partials, sizing & costs over signals.", go: "engine" },
                      { icon: Users, color: C.blue, t: "Traders", d: "Leaderboard, best/worst plays, profiles.", go: "traders" },
                      { icon: Globe, color: C.cyan, t: "Markets", d: "The whole board at a glance, then drill into any coin's detail.", go: "markets" },
                    ].map(card => (
                      <button key={card.t} onClick={() => { if (card.go) { setActiveTab(card.go); setProfileTrader(null); } dismissWelcome(); }} style={{
                        textAlign: "left", display: "flex", gap: "10px", padding: "14px", borderRadius: "10px", cursor: "pointer",
                        backgroundColor: C.bg, border: `1px solid ${C.border}`, transition: "border-color 0.15s",
                      }} className="card-hover">
                        <div style={{ width: 30, height: 30, borderRadius: "8px", backgroundColor: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <card.icon size={16} color={card.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "2px" }}>{card.t}</div>
                          <div style={{ fontSize: "11px", color: C.textMuted, lineHeight: 1.4 }}>{card.d}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: "8px 28px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ fontSize: "11px", color: C.textFaint, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={12} color={C.amber} /> Hover any “?” for an explainer · ⌘K search · 1–7 switch sections · [ ] cycle timeframes
                    </span>
                    <button onClick={dismissWelcome} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: C.purple, color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                      Start exploring
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Search Overlay ── */}
            {showSearch && (
              <div onClick={() => setShowSearch(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "120px" }}>
                <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: `1px solid ${C.border}` }}>
                    <Search size={16} color={C.textMuted} />
                    <input ref={searchRef} autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search traders, pairs, sections..." aria-label="Search traders, pairs, sections" style={{
                      flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: C.text, fontSize: "14px", fontWeight: "500"
                    }} onKeyDown={e => {
                      if (e.key === "Escape") { setShowSearch(false); return; }
                      if (e.key === "Enter") {
                        // jump to the top result: traders → pairs → sections
                        if (searchResults.traders[0]) { openProfile(searchResults.traders[0]); }
                        else if (searchResults.pairs[0]) { setActiveTab("activity"); setFeedFilter("all"); }
                        else if (searchResults.tabs[0]) { setActiveTab(searchResults.tabs[0].id); setProfileTrader(null); }
                        else return;
                        setShowSearch(false); setSearchQuery("");
                      }
                    }} />
                    <span style={{ fontSize: "10px", color: C.textFaint, padding: "2px 6px", backgroundColor: C.bg, borderRadius: "4px", ...mono }}>↵ open top</span>
                    <span style={{ fontSize: "10px", color: C.textFaint, padding: "2px 6px", backgroundColor: C.bg, borderRadius: "4px", ...mono }}>ESC</span>
                  </div>
                  <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
                    {!searchQuery.trim() && <div style={{ padding: "16px", textAlign: "center", color: C.textFaint, fontSize: "12px" }}>Type to search traders, pairs or sections</div>}
                    {searchResults.traders.length > 0 && (<>
                      <div style={{ padding: "6px 10px", fontSize: "9px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>Traders</div>
                      {searchResults.traders.map(t => (
                        <button key={t.name} onClick={() => { openProfile(t); setShowSearch(false); setSearchQuery(""); }} style={{
                          display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", backgroundColor: "transparent",
                          border: "none", borderRadius: "8px", cursor: "pointer", color: C.text, textAlign: "left"
                        }}>
                          <Avatar name={t.name} size={32} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: "600" }}>{t.name}</div>
                            <div style={{ fontSize: "10px", color: C.textMuted }}>#{t.rank} · {t.style} · WR {t.winRate}%</div>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: C.green, ...mono }}>+${(t.pnl/1000).toFixed(0)}K</span>
                        </button>
                      ))}
                    </>)}
                    {searchResults.pairs.length > 0 && (<>
                      <div style={{ padding: "6px 10px", fontSize: "9px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pairs</div>
                      {searchResults.pairs.map(p => (
                        <button key={p} onClick={() => { setActiveTab("activity"); setFeedFilter("all"); setShowSearch(false); setSearchQuery(""); }} style={{
                          display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px", backgroundColor: "transparent",
                          border: "none", borderRadius: "8px", cursor: "pointer", color: C.text, textAlign: "left"
                        }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: C.amberBg, display: "flex", alignItems: "center", justifyContent: "center" }}><DollarSign size={14} color={C.amber} /></div>
                          <span style={{ fontSize: "13px", fontWeight: "600" }}>{p}</span>
                          <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "auto" }}>View signals</span>
                        </button>
                      ))}
                    </>)}
                    {searchResults.tabs.length > 0 && (<>
                      <div style={{ padding: "6px 10px", fontSize: "9px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sections</div>
                      {searchResults.tabs.map(t => (
                        <button key={`${t.id}-${t.label}`} onClick={() => { setActiveTab(t.id); setShowSearch(false); setSearchQuery(""); setProfileTrader(null); }} style={{
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
                      <div style={{ padding: "20px", textAlign: "center", color: C.textFaint, fontSize: "12px" }}>No results for "{searchQuery}"</div>
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
                      <div style={{ fontSize: "14px", fontWeight: "700" }}>Alerts</div>
                      {unreadCount > 0 && <span style={{ fontSize: "9px", fontWeight: "700", color: C.purple, backgroundColor: C.purpleBg, padding: "2px 6px", borderRadius: "3px" }}>{unreadCount} new</span>}
                    </div>
                    <button onClick={() => setShowAlerts(false)} style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}><ChevronRight size={18} /></button>
                  </div>

                  {/* Alert type filters — real Robotín event categories */}
                  <div style={{ padding: "8px 12px", display: "flex", gap: "4px", borderBottom: `1px solid ${C.border}` }}>
                    {[["all", "All"], ["approved", "Approved"], ["rejected", "Rejected"], ["win", "Wins"], ["loss", "Losses"]].map(([type, label]) => {
                      const on = alertFilter === type;
                      return (
                        <button key={type} onClick={() => setAlertFilter(type)} style={{
                          padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                          border: `1px solid ${on ? C.purple : "transparent"}`, backgroundColor: on ? C.purpleBg : C.bg, color: on ? C.purple : C.textMuted
                        }}>{label}</button>
                      );
                    })}
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                    {visibleAlerts.map(a => {
                      const alertIcons = { approved: CheckCircle2, rejected: GitBranch, win: TrendingUp, loss: TrendingDown };
                      const alertColors = { approved: C.cyan, rejected: C.amber, win: C.green, loss: C.red };
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
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: "12.5px", fontWeight: 800, color: a.read ? C.textMuted : C.text, ...mono }}>{a.pair} <span style={{ color: a.dir === "LONG" ? C.green : C.red, fontSize: "10px" }}>{a.dir}</span></span>
                              <span style={{ fontSize: "9px", fontWeight: 700, color: aColor, backgroundColor: `${aColor}15`, padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{a.verb}</span>
                              {a.conf != null && <span style={{ fontSize: "9px", fontWeight: 700, color: a.priority === "high" ? aColor : C.textMuted, ...mono }}>{a.conf}%</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "11px", color: a.read ? C.textFaint : C.textMuted, lineHeight: 1.4, marginTop: "3px" }}>
                              <Avatar name={a.trader} size={14} /> {a.trader} · {a.detail}
                            </div>
                            <div style={{ fontSize: "10px", color: C.textFaint, marginTop: "3px", ...mono }}>{a.time} ago</div>
                          </div>
                          {!a.read && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: aColor, flexShrink: 0, marginTop: "6px" }} />}
                        </div>
                      );
                    })}
                    {visibleAlerts.length === 0 && (
                      <div style={{ padding: "30px 16px", textAlign: "center", color: C.textMuted, fontSize: "12px" }}>No {alertFilter} events recently.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Committee / LP tear sheet (print → PDF) ── */}
            {showTearSheet && <PrintTearSheet onClose={() => setShowTearSheet(false)} />}

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
                    {/* Fund */}
                    <div style={{ ...cardStyle, marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: C.textFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Fund</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: C.purpleBg, border: `2px solid ${C.purple}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Cpu size={20} color={C.purple} />
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700" }}>VARIV</div>
                          <div style={{ fontSize: "10px", color: C.textMuted }}>Allocator · {mockTraders.length} signal providers monitored</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: "11px" }}>
                        <span style={{ color: C.textMuted }}>Balance</span>
                        <span style={{ fontWeight: "700", ...mono }}>{usd(fundStats.balance)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: "11px" }}>
                        <span style={{ color: C.textMuted }}>Net P&L</span>
                        <span style={{ fontWeight: "700", color: fundStats.net >= 0 ? C.green : C.red, ...mono }}>{usd(fundStats.net, { signed: true })}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: "11px" }}>
                        <span style={{ color: C.textMuted }}>Open positions</span>
                        <span style={{ fontWeight: "600", ...mono }}>{fundStats.active}</span>
                      </div>
                    </div>

                    {/* Notifications — real Robotín event categories */}
                    <div style={{ ...cardStyle, marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: C.textFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Notifications</div>
                      {["Signal approvals", "Signal rejections", "Targets hit (TP)", "Stops hit (SL)"].map((label) => {
                        const on = notif[label] !== false;
                        return (
                          <div key={label} onClick={() => setNotif((p) => ({ ...p, [label]: !(p[label] !== false) }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                            <span style={{ fontSize: "12px" }}>{label}</span>
                            <span style={{ color: on ? C.green : C.textFaint }}>{on ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Display */}
                    <div style={{ ...cardStyle }}>
                      <div style={{ fontSize: "10px", color: C.textFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Display</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px", cursor: "pointer" }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                        <span>Compact sidebar</span>
                        <span style={{ color: sidebarCollapsed ? C.green : C.textFaint }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</span>
                      </div>
                      {/* inert "Theme: Dark" row removed — a setting that can't change is noise */}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <main key={profileTrader ? `profile-${profileTrader.name}` : activeTab} style={{ flex: 1, minWidth: 0, padding: "24px", width: "100%", boxSizing: "border-box", animation: "fadeInUp 0.2s ease" }}>
              {profileTrader ? <TraderProfile trader={profileTrader} onClose={closeProfile} /> : <ActiveComponent />}
            </main>

            {/* Footer — status bar. HONEST: a fake "LIVE · updated 3s ago" ticker on
                simulated data is theater a professional spots instantly, and it costs
                credibility everywhere else. Amber SIM state until real connectors ship. */}
            <footer style={{ height: 36, backgroundColor: C.card, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", color: C.text, fontSize: "11px", fontWeight: "600", ...mono, justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <FeedStatus />
                <div style={{ width: "1px", height: 16, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: C.textMuted }}><Users size={11} /> {mockTraders.length} providers</span>
                <div style={{ width: "1px", height: 16, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: C.textMuted }}><BarChart3 size={11} /> {fundStats.total} signals</span>
              </div>
              <div style={{ display: "flex", gap: "14px", alignItems: "center", color: C.textMuted }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Activity size={11} color={C.cyan} /> {fundStats.active} open positions</span>
                <div style={{ width: "1px", height: 16, backgroundColor: C.border }} />
                <LiveFooterQuote />
                <span style={{ color: C.textFaint }}>sim ledger · deterministic</span>
              </div>
            </footer>

            {/* one-click refresh when a newer build is live */}
            <UpdateNotifier />
          </div>

          </div>{/* close Main Layout wrapper */}
        </div>
        </NavContext.Provider>
        </FeedFilterContext.Provider>
        </ProfileContext.Provider>
      </DateContext.Provider>
      </ProContext.Provider>
      </TimeframeProvider>
    </LivePriceProvider>
    </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
