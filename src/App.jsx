import { TraderProfile } from "./components/TraderProfile";
import { Activity, AlertTriangle, Award, BarChart3, Beaker, Bell, BellRing, Bookmark, Bot, Briefcase, Calendar, ChevronDown, ChevronRight, Copy, DollarSign, Eye, Flame, GitBranch, Globe, HelpCircle, Layers, Lightbulb, MessageCircle, Radio, Scale, Search, Settings, Sparkles, Star, Target, ToggleLeft, ToggleRight, Trophy, Users, Wallet, X, Zap } from "lucide-react";
import { Avatar, BotTag, ToastProvider } from "./components/common";
import { LivePnLTicker } from "./components/widgets";
import { DateContext, FeedFilterContext, ProfileContext, ProContext, WatchlistContext } from "./contexts";
import { ThemeProvider } from "./theme";
import { SocialsTab } from "./components/tabs/SocialsTab";
import { MarketsSection, ActivitySection, TradersSection, RobotinSection } from "./components/sections";
import { mockTraders, traderSocials } from "./data/mockData";
import { titleByLevel } from "./lib/scoring";
import { C, cardStyle, mono } from "./theme";
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

/* ═══════════════════════ MAIN APP ═══════════════════════ */
const App = () => {
  const [activeTab, setActiveTab] = useState("traders");
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
  const proMode = true; // Casual/Pro split removed — always show full Pro detail
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState(null);
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
      { id: "pulse", label: "Pulse", desc: "The live overview — who's winning and the market mood" },
      { id: "markets", label: "Markets", desc: "One coin at a time — signals, trades, structure, positioning" },
      { id: "robotin", label: "Robotín Wallet", desc: "Every trade the bot executed from approved signals" },
      { id: "robotin", label: "Robotín Analytics", desc: "System fund-level KPIs, equity curve, drawdown and segmentation" },
      { id: "activity", label: "Activity", desc: "Trades and signals across all traders — one live stream" },
      { id: "traders", label: "Traders", desc: "Leaderboard, profiles, copy trading" },
      { id: "traders", label: "Top Trades", desc: "Best and worst plays across all traders, explained" },
      { id: "traders", label: "Legends & Awards", desc: "Hall of Fame and season awards" },
      { id: "socials", label: "Socials", desc: "What traders post across X, Telegram, Discord" },
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
    { id: 1, type: "pattern", text: "3 traders opened BTC LONG in the last 30min — possible bullish trend", time: "1m", read: false, priority: "high" },
    { id: 2, type: "pattern", text: "Bearish convergence: Scalp King + Crypto Ninja + Smart Money opened ETH SHORT", time: "5m", read: false, priority: "high" },
    { id: 3, type: "macro", text: "DXY (Dollar) dropped -0.8% today — historically bullish for crypto", time: "12m", read: false, priority: "medium" },
    // Trade alerts
    { id: 4, type: "trade", text: "Scalp King opened BTC LONG at $67,850 (5x)", time: "2m", read: false, priority: "normal" },
    { id: 5, type: "whale", text: "WHALE: $3.2M BTC LONG on Binance", time: "8m", read: false, priority: "high" },
    // Macro indicators
    { id: 6, type: "macro", text: "Fed Funds Rate unchanged (5.25%) — market reacts neutral", time: "45m", read: true, priority: "medium" },
    { id: 7, type: "macro", text: "WTI Crude Oil +2.1% ($78.40) — possible inflationary pressure", time: "1h", read: true, priority: "low" },
    { id: 8, type: "pattern", text: "4/8 traders are LONG on SOL — strong bullish consensus", time: "1h", read: true, priority: "medium" },
    { id: 9, type: "macro", text: "M2 Money Supply +0.3% MoM — liquidity expanding", time: "2h", read: true, priority: "low" },
    { id: 10, type: "signal", text: "New signal: ETH SHORT by Crypto Ninja (85% confidence)", time: "15m", read: true, priority: "normal" },
    { id: 11, type: "copy", text: "Copy Trading: Scalp King closed +$2,340", time: "2h", read: true, priority: "normal" },
    { id: 12, type: "macro", text: "BTC Dominance 54.2% (+0.5%) — capital flowing to BTC", time: "3h", read: true, priority: "low" },
    { id: 13, type: "achievement", text: "Unlocked: Streak Machine (15W)", time: "3h", read: true, priority: "normal" },
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

  // v3 IA — six job-based sections. Each groups its destinations behind one nav item.
  // "Analyze" is the Pro workbench and only appears in Pro mode.
  const tabs = [
    { id: "traders", label: "Traders", icon: Users, accent: C.blue },
    { id: "markets", label: "Markets", icon: Globe, accent: C.cyan },
    { id: "activity", label: "Activity", icon: Activity, accent: C.green },
    { id: "robotin", label: "Robotín", icon: Wallet, accent: C.green },
    { id: "socials", label: "Socials", icon: MessageCircle, accent: C.cyan },
  ];

  // One-line orientation per section (LukeW: every screen should say what it's for).
  const tabMeta = {
    traders: "Who's winning, and everyone you can follow — the live race plus the searchable directory",
    markets: "One coin, everything at once — chart, signals, the trades they became, structure and positioning",
    activity: "The live tape — every signal and what Robotín did with it, newest first, across all coins",
    robotin: "Robotín's wallet and analytics — every trade the bot executed and how the system performs",
    socials: "What traders are posting across X, Telegram, Discord and more",
  };

  // Section → component mapping
  const tabContent = {
    traders: TradersSection,   // Traders = the home: live overview/race + searchable directory + profiles
    markets: MarketsSection,   // Markets = one coin, everything on one page
    activity: ActivitySection, // Activity = the global Robotín lifecycle tape
    robotin: RobotinSection,   // Robotín = the bot's Wallet + system Analytics
    socials: SocialsTab,       // Socials = cross-platform curated feed
  };
  const ActiveComponent = tabContent[activeTab] || TradersSection;
  const sideW = sidebarCollapsed ? 56 : 200;
  const rightPanelW = rightPanelCollapsed ? 48 : 220;
  const rightW = (showWatchlist ? 340 : 0) + rightPanelW;

  // Account level/title (shown in Settings)
  const myLevel = 22;
  const myTitle = titleByLevel(myLevel);

  return (
    <ThemeProvider>
    <ToastProvider>
      <ProContext.Provider value={{ proMode }}>
      <DateContext.Provider value={{ dateRange, setDateRange, dateFrom, dateTo, dateLabel }}>
        <ProfileContext.Provider value={{ openProfile, closeProfile, profileTrader }}>
        <WatchlistContext.Provider value={{ followedTraders, setFollowedTraders, traderAlerts, setTraderAlerts }}>
        <FeedFilterContext.Provider value={{ feedFilter, setFeedFilter, setActiveTab }}>
        <div style={{ backgroundColor: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <style>{`
            @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            tr.hoverable:hover { background-color: ${C.cardHover} !important; }
            .card-hover:hover { border-color: ${C.borderLight} !important; }
            .card-glow:hover { box-shadow: 0 0 20px rgba(139,92,246,0.08) !important; }
            button.btn-hover:hover { filter: brightness(1.15); }
            .grid-2col { display: grid; grid-template-columns: 1fr 320px; gap: 12px; }
            .grid-2col-16 { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
            @media (max-width: 900px) {
              .grid-2col, .grid-2col-16 { grid-template-columns: 1fr !important; }
            }
            @media (max-width: 700px) {
              .grid-3col { grid-template-columns: 1fr !important; }
            }
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
            transition: "width 0.2s ease", overflow: "hidden"
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

            {/* Nav items — 3-zone grouping */}
            <nav style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: "1px", overflowY: "auto" }}>
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
                  <button key={tab.id} onClick={() => {
                    setActiveTab(tab.id);
                    setFeedFilter("all");
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

            {/* Bottom section */}
            <div style={{ padding: "8px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "2px" }}>
              {[{ icon: Bookmark, label: "Watchlist", action: () => setShowWatchlist(true) }, { icon: Settings, label: "Settings", action: () => setShowSettings(true) }, { icon: Bell, label: "Alerts", action: () => setShowAlerts(true) }].map(item => (
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
              {/* Left: Tab title + one-line orientation (LukeW: say what the screen is for) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px", fontWeight: "700" }}>
                    {profileTrader ? profileTrader.name : (tabs.find(t => t.id === activeTab)?.label || "Arena")}
                  </span>
                  <span style={{ fontSize: "9px", fontWeight: "700", padding: "3px 8px", borderRadius: "4px", backgroundColor: C.purpleBg, color: C.purple, border: `1px solid ${C.purple}30`, ...mono }}>
                    S1 · 47d left
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
                      An intelligence terminal for traders. Six areas, one job each — start anywhere, every screen tells you what it's for.
                    </div>
                  </div>
                  <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {[
                      { icon: Radio, color: C.purple, t: "Pulse", d: "The live pulse — who's winning right now and the market mood.", go: "pulse" },
                      { icon: Globe, color: C.cyan, t: "Markets", d: "Where the crowd is positioned on every coin, and the structure behind it.", go: "markets" },
                      { icon: Wallet, color: C.amber, t: "Robotín", d: "The bot's execution wallet and the system's performance analytics.", go: "robotin" },
                      { icon: Activity, color: C.green, t: "Activity", d: "Trades and signals across all traders — one live stream.", go: "activity" },
                      { icon: Users, color: C.blue, t: "Traders", d: "Leaderboard, best/worst plays, profiles, legends and awards.", go: "traders" },
                      { icon: MessageCircle, color: C.cyan, t: "Socials", d: "What traders are posting across X, Telegram, Discord and more.", go: "socials" },
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
                      <Sparkles size={12} color={C.amber} /> Hover any “?” for a plain-language explainer. Press ⌘K to jump anywhere.
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
                    }} onKeyDown={e => { if (e.key === "Escape") setShowSearch(false); }} />
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
                      {unreadCount > 0 && <span style={{ fontSize: "9px", fontWeight: "700", color: C.red, backgroundColor: C.redBg, padding: "2px 6px", borderRadius: "3px" }}>{unreadCount} new</span>}
                    </div>
                    <button onClick={() => setShowAlerts(false)} style={{ backgroundColor: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}><ChevronRight size={18} /></button>
                  </div>

                  {/* Alert type filters */}
                  <div style={{ padding: "8px 12px", display: "flex", gap: "4px", borderBottom: `1px solid ${C.border}` }}>
                    {[["all", "All"], ["pattern", "Patterns"], ["macro", "Macro"], ["trade", "Trades"], ["whale", "Whales"]].map(([type, label]) => (
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
                                {a.type === "pattern" ? "PATTERN DETECTED" : "MACRO INDICATOR"}
                                {a.priority === "high" && <span style={{ marginLeft: "6px", color: C.red }}>IMPORTANT</span>}
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
                      <div style={{ fontSize: "10px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Macro Indicators</div>
                      {[
                        ["DXY (Dollar)", "104.2", "-0.8%", C.red],
                        ["BTC Dominance", "54.2%", "+0.5%", C.green],
                        ["WTI Crude Oil", "$78.40", "+2.1%", C.green],
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

            {/* ── Right Utility Panel ── */}
            <aside style={{
              width: rightPanelW, position: "fixed", top: 32, right: 0, bottom: 0, zIndex: 201,
              backgroundColor: C.card, borderLeft: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column",
              transition: "width 0.2s ease", overflow: "hidden"
            }}>
              {/* Top icons */}
              <div style={{ height: 56, display: "flex", alignItems: rightPanelCollapsed ? "center" : "center", justifyContent: rightPanelCollapsed ? "center" : "space-between", padding: rightPanelCollapsed ? "0" : "0 12px", borderBottom: `1px solid ${C.border}`, gap: "6px" }}>
                {rightPanelCollapsed ? (
                  <button onClick={() => setRightPanelCollapsed(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px", display: "flex", alignItems: "center" }}>
                    <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
                  </button>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Star size={14} color={C.amber} />
                      <span style={{ fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>Quick Access</span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => setRightPanelCollapsed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px", display: "flex" }}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Nav items */}
              <nav style={{ flex: 1, padding: "8px 4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                {[
                  { id: "traders", label: "Traders", icon: Users, color: C.purple, action: () => { setShowWatchlist(true); setRightPanelTab("traders"); } },
                  { id: "bots", label: "Bots", icon: Bot, color: C.cyan, action: () => { setShowWatchlist(true); setWatchlistCategory("bot"); setRightPanelTab("bots"); } },
                  { id: "chat", label: "Chat", icon: MessageCircle, color: C.blue, action: () => setRightPanelTab(rightPanelTab === "chat" ? null : "chat") },
                  { id: "alarms", label: "Alarms", icon: Bell, color: C.amber, action: () => { setShowAlerts(true); setRightPanelTab("alarms"); } },
                  { id: "lists", label: "Lists", icon: Layers, color: C.green, action: () => setRightPanelTab(rightPanelTab === "lists" ? null : "lists") },
                ].map(item => {
                  const isActive = rightPanelTab === item.id;
                  return (
                    <button key={item.id} onClick={item.action} title={rightPanelCollapsed ? item.label : undefined} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: rightPanelCollapsed ? "10px 0" : "10px 12px",
                      justifyContent: rightPanelCollapsed ? "center" : "flex-start",
                      backgroundColor: isActive ? `${item.color}12` : "transparent",
                      border: "none", borderRadius: "6px", cursor: "pointer",
                      color: isActive ? item.color : C.textMuted,
                      fontSize: "12px", fontWeight: isActive ? "600" : "400",
                      transition: "all 0.15s", width: "100%"
                    }}>
                      <item.icon size={16} />
                      {!rightPanelCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
                    </button>
                  );
                })}
              </nav>

              {/* Mini content area when expanded */}
              {!rightPanelCollapsed && rightPanelTab === "chat" && (
                <div style={{ flex: 1, padding: "8px", borderTop: `1px solid ${C.border}`, overflow: "auto" }}>
                  <div style={{ fontSize: "10px", color: C.textFaint, textAlign: "center", padding: "20px 8px" }}>
                    <MessageCircle size={16} style={{ marginBottom: "6px", opacity: 0.4 }} />
                    <div style={{ fontWeight: "600" }}>Chat coming soon</div>
                    <div style={{ marginTop: "4px", fontSize: "9px" }}>Connect with traders in real-time</div>
                  </div>
                </div>
              )}
              {!rightPanelCollapsed && rightPanelTab === "lists" && (
                <div style={{ flex: 1, padding: "8px", borderTop: `1px solid ${C.border}`, overflow: "auto" }}>
                  <div style={{ fontSize: "10px", color: C.textFaint, textAlign: "center", padding: "20px 8px" }}>
                    <Layers size={16} style={{ marginBottom: "6px", opacity: 0.4 }} />
                    <div style={{ fontWeight: "600" }}>Custom Lists</div>
                    <div style={{ marginTop: "4px", fontSize: "9px" }}>Create watchlists and groups</div>
                  </div>
                </div>
              )}
            </aside>

            {/* ── Right Sidebar: Trader Watchlist (persistent, TradingView-style) ── */}
            <aside style={{
              width: 340, position: "fixed", top: 32, right: rightPanelW, bottom: 0, zIndex: 200,
              backgroundColor: C.bg, borderLeft: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column",
              transform: showWatchlist ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.2s ease"
            }}>
              {/* Header */}
              <div style={{ height: 56, padding: "0 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={15} color={C.purple} />
                <span style={{ fontSize: "13px", fontWeight: "800", flex: 1 }}>Watchlist</span>
                <span style={{ fontSize: "9px", color: C.textMuted, ...mono }}>{Object.values(followedTraders).filter(Boolean).length} following</span>
                <button onClick={() => setShowWatchlist(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px" }}><X size={14} /></button>
              </div>
              {/* Search */}
              <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: C.card, borderRadius: "6px", padding: "6px 10px", border: `1px solid ${C.border}` }}>
                  <Search size={12} color={C.textFaint} />
                  <input value={watchlistSearch} onChange={e => setWatchlistSearch(e.target.value)} placeholder="Search trader..." aria-label="Search trader in watchlist" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: "11px", width: "100%", fontFamily: "inherit" }} />
                  {watchlistSearch && <button onClick={() => setWatchlistSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, padding: "2px" }}><X size={10} /></button>}
                </div>
              </div>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: "3px", padding: "6px 10px", borderBottom: `1px solid ${C.border}` }}>
                {[{ id: "all", label: "All", icon: Users }, { id: "human", label: "Traders", icon: Activity }, { id: "bot", label: "Bots", icon: Bot }, { id: "followed", label: "Following", icon: Star }].map(cat => (
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
                      <div style={{ fontSize: "11px", fontWeight: "600" }}>No traders found</div>
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
                            <button title={isFollowed ? "Unfollow" : "Follow"} onClick={e => { e.stopPropagation(); setFollowedTraders(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: isFollowed ? C.amber + "20" : "transparent", color: isFollowed ? C.amber : C.textFaint }}>
                              <Star size={10} fill={isFollowed ? C.amber : "none"} />
                            </button>
                            <button title={hasAlert ? "Remove alerts" : "Alerts"} onClick={e => { e.stopPropagation(); setTraderAlerts(prev => ({ ...prev, [t.name]: !prev[t.name] })); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: hasAlert ? C.blue + "20" : "transparent", color: hasAlert ? C.blue : C.textFaint }}>
                              <BellRing size={10} />
                            </button>
                            <button title="Copy trade" onClick={e => { e.stopPropagation(); setActiveTab("traders"); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: "transparent", color: C.textFaint }}>
                              <Copy size={10} />
                            </button>
                            <button title="Chat (coming soon)" onClick={e => { e.stopPropagation(); }} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: "none", cursor: "not-allowed", backgroundColor: "transparent", color: C.textFaint, opacity: 0.5 }}>
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
                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Star size={8} fill={C.amber} color={C.amber} /> Follow</span>
                <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><BellRing size={8} color={C.blue} /> Alerts</span>
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
                    {/* My Account */}
                    <div style={{ ...cardStyle, marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: C.textFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>My Account</div>
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
                        <span style={{ color: C.textMuted }}>Monthly PnL</span>
                        <span style={{ fontWeight: "700", color: C.green, ...mono }}>+$3,420</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontSize: "11px" }}>
                        <span style={{ color: C.textMuted }}>Copying to</span>
                        <span style={{ fontWeight: "600", ...mono }}>2 traders</span>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div style={{ ...cardStyle, marginBottom: "12px" }}>
                      <div style={{ fontSize: "10px", color: C.textFaint, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Notifications</div>
                      {[
                        ["Live Trades", true],
                        ["Whale alerts", true],
                        ["New Signals", true],
                        ["Robotín executions", true],
                        ["Unlocked Achievements", true],
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
                        <span>Live ticker</span>
                        <span style={{ color: C.green }}><ToggleRight size={20} /></span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                        <span>Compact sidebar</span>
                        <span style={{ color: sidebarCollapsed ? C.green : C.textFaint }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", fontSize: "12px" }}>
                        <span>Theme</span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: C.textMuted }}>Dark</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <main key={profileTrader ? `profile-${profileTrader.name}` : activeTab} style={{ flex: 1, padding: "24px", maxWidth: "1400px", width: "100%", animation: "fadeInUp 0.2s ease" }}>
              {profileTrader ? <TraderProfile trader={profileTrader} onClose={closeProfile} /> : <ActiveComponent />}
            </main>

            {/* Footer - Live Stats Bar */}
            <footer style={{ height: 36, backgroundColor: C.card, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", color: C.text, fontSize: "11px", fontWeight: "600", ...mono, justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.green, display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />
                  <span style={{ color: C.green }}>LIVE</span>
                </div>
                <div style={{ width: "1px", height: 16, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: C.textMuted }}><Trophy size={11} color={C.amber} /> Season 1 · 47d left</span>
                <div style={{ width: "1px", height: 16, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: C.textMuted }}><Users size={11} /> {mockTraders.length} traders</span>
                <div style={{ width: "1px", height: 16, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: C.textMuted }}><BarChart3 size={11} /> $2.4M volume</span>
              </div>
              <div style={{ display: "flex", gap: "14px", alignItems: "center", color: C.textMuted }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><AlertTriangle size={11} color={C.red} /> $4.2M liquidated</span>
                <div style={{ width: "1px", height: 16, backgroundColor: C.border }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>Updated <span style={{ color: C.green }}>12s ago</span></span>
              </div>
            </footer>
          </div>

          </div>{/* close Main Layout wrapper */}
        </div>
        </FeedFilterContext.Provider>
        </WatchlistContext.Provider>
        </ProfileContext.Provider>
      </DateContext.Provider>
      </ProContext.Provider>
    </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
