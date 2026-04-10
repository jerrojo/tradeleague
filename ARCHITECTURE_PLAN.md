# Tradethlon Architecture Plan v2
## "The World Cup of Trading"

---

## The Core Insight

The market is fragmented:
- **TradingView** owns charting & ideas — no execution, no competition, no copy trading
- **Bybit/Bitget/OKX** own execution & metrics — zero social discovery, no narrative
- **X/Twitter** owns distribution & clout — no verified performance, no tools
- **Discord/Telegram** own community — ephemeral, not searchable, not ranked

**Tradethlon fills the gap**: a platform where trading is a *sport*, traders are *athletes*, and every trade is a *play* that gets analyzed, celebrated, and learned from.

**Key differentiator**: No other platform treats trading as a competitive spectator sport.

---

## Design Philosophy

### For Expert Traders (Punk, Dr. Profit, GCR-tier)
**Verified credibility** that replaces "trust me bro" with data. Monetization (copy fees). Discoverability by alpha score, not follower count. Cross-platform social aggregation. The feeling of being celebrated like an athlete, not a spreadsheet row.

### For Beginners
**Clarity in chaos**. See who's actually good (not just loud). Understand every term (InfoTip glossary on ALL jargon). Safely follow the best (copy trading with risk indicators). Learn by watching the Arena without risking money.

### Visual Language
- **Dark theme** (trading = immersive nighttime activity)
- **Sports metaphors**: Arena, Hall of Fame, Awards, Seasons, Rankings
- **Color = meaning**: Green (profit), Red (loss), Gold (achievement), Purple (premium)
- **Progressive disclosure**: Big number → trend arrow → chart → tooltip
- **InfoTip on EVERY technical term**: mouseover → 1-sentence plain explanation
- **Casual/Pro toggle**: Same data, two density levels (ESPN model)

### Gamification Ethics (Robinhood Lesson)
Robinhood paid $7.5M for gamification that encouraged *overtrading*. Our rule:
- **Celebrate SKILL, never frequency.** Awards go to Sharpe ratio, accuracy, consistency — NOT volume or trade count
- **Risk disclaimers integrated into UI**, not buried in EULA
- **Risk level badges on every trader**: 🟢 Conservative 🟡 Moderate 🔴 Aggressive
- A trader who makes 5 perfect trades ranks higher than 500 mediocre ones

---

## Information Architecture

### Layout: 3-Panel + Top Bar

```
┌──────────────────────────────────────────────────────────────┐
│ TOP BAR: [Date Range] [Traders ▼] [Bots ▼] [Tokens ▼]  🔍⌘K│
│ [Casual / Pro toggle]                                        │
├──────┬──────────────────────────────────┬────────────────────┤
│      │                                  │                    │
│ LEFT │       MAIN CONTENT               │  RIGHT PANEL       │
│ NAV  │       (changes per tab)          │  (collapsed default)│
│      │                                  │                    │
│ ▸COMPETE                                │  ★ Favorites       │
│  Arena                                  │  📋 Watchlists     │
│  Hall of Fame                           │  🔔 Alerts         │
│  Awards                                 │  💬 Chat           │
│ ──────                                  │  📊 My Portfolio   │
│ ▸OPERATE                                │                    │
│  Trades                                 │                    │
│  Signals                                │                    │
│  Futures                                │                    │
│ ──────                                  │                    │
│ ▸DISCOVER                               │                    │
│  Socials                                │                    │
│  Tokens                                 │                    │
│                                         │                    │
└──────┴──────────────────────────────────┴────────────────────┘
```

### 3-Zone Grouping (prevents cognitive overload)
Research: 9+ navigation items cause 23% higher churn. Solution: group 8 items into 3 conceptual zones.

- **COMPETE** — Arena, Hall of Fame, Awards (the spectator sport)
- **OPERATE** — Trades, Signals, Futures (the action tools)
- **DISCOVER** — Socials, Tokens (the research layer)

**Right Panel** starts collapsed. Users opt in.
**Arena is the default landing page** — the hook.

### Trader Profile = Universal Modal
Click ANY trader avatar ANYWHERE → full-screen overlay with their profile. Not a tab. Accessible from every section. Like clicking a player name on ESPN.

---

## The First 30 Seconds (Critical Path)

New user opens Tradethlon:
1. **Second 0-3**: See the Arena race chart — multiple colored lines racing. Leader's avatar at front. Instantly understand: "It's a race. That person is winning."
2. **Second 3-10**: See the standings table below. Names, scores, streaks. Think: "I can see who's the best."
3. **Second 10-20**: Notice a "Highlight Moment" pop up — "🔥 Scalp King just hit +$4,200 on BTC LONG". Think: "This is happening LIVE."
4. **Second 20-30**: See the Casual/Pro toggle. Hover an unfamiliar term, get an InfoTip. Think: "I can understand this."

If they've never traded before, they already get it. If they're a pro, they toggle to Pro mode and see Sharpe ratios.

### Onboarding (First Visit Only)
3-step overlay:
1. "Welcome to Tradethlon. Watch the best traders compete live." (pointing to Arena)
2. "Follow your favorites." (pointing to star button)
3. "When you're ready, copy their trades." (pointing to copy button)
Skip option always visible.

---

## Seasons System

Tradethlon runs on formal **Seasons** (like Fortnite, or FIFA World Cup qualifying):
- **Season length**: 3 months (Q1/Q2/Q3/Q4)
- **Each season has**: Its own leaderboard, its own awards ceremony, Hall of Fame inductees
- **Season badge**: All-time profile shows "S1 Champion", "S2 Top 10", etc.
- **End-of-season**: Animated "Awards Ceremony" reveal with pacing (suspense → reveal → celebration)
- **Off-season**: Rankings reset, new season begins. Legacy preserved in Hall of Fame.

This creates urgency, FOMO, and a reason to keep coming back.

---

## Tab Breakdown

### 1. ARENA (The Horse Race) — DEFAULT TAB
**Concept**: F1 live timing for traders. Multiple equity curves racing. Gap visualization. Live highlights.

**Key Components**:
- **Race Chart**: Multi-line equity comparison (cumulative % return). Each trader = colored line. Avatars at line endpoints. Gap indicators showing distance between positions.
- **Standings Table**: Rank, avatar, name, tier, % return, # trades, win rate, streak, risk level
- **Highlight Moments**: Animated cards that appear when big plays happen (>$5K profit, streak milestone, leaderboard change)
- **Season Timer**: "S1 · 47 days remaining" banner
- **Live Ticker**: Scrolling bar of recent trades (already have LivePnLTicker)

**Casual mode**: Race chart with avatars, standings with big numbers, highlight moments
**Pro mode**: Sharpe/Sortino columns, drawdown overlay on chart, correlation matrix, risk-adjusted toggle

**What we HAVE**: HomeTab, LivePnLTicker, traderEquity data, traderColors
**What we REFACTOR**: Replace heatmap grid with race chart, keep leaderboard concept

---

### 2. HALL OF FAME (The Greatest Hits)
**Concept**: Museum of legendary trades, signals, and predictions. All-time. The performances everyone talks about.

**Key Components**:
- **Trophy Case**: Grid of cards with gold/platinum/bronze frames based on performance tier
- **Each Card**: Avatar, asset, entry→exit, ROI% (big), duration, mini candlestick with entry/exit markers (TradeSignalViz pattern)
- **"Replay" Feature**: Click to see candle-by-candle trade story
- **3 Categories**: Top Trades (ROI), Top Signals (accuracy), Top Predictions (conviction)
- **Season Filter**: View by season or all-time

**What we HAVE**: top10 lists in HomeTab, TradeSignalViz component
**What we NEED**: Trophy card design, trade replay viewer, all-time data model

---

### 3. AWARDS (The Oscars)
**Concept**: Formal recognition. Seasonal + yearly. Both humans and bots eligible.

**Categories** (all celebrate SKILL, not volume):
- 🏆 **Trader of the Season** — Highest risk-adjusted returns (Sharpe)
- 🎯 **Sniper** — Best single trade ROI
- 📊 **Signal Master** — Most accurate signal provider (hit rate)
- 🔮 **Oracle** — Best prediction accuracy
- 🤖 **Best Bot** — Top automated strategy (risk-adjusted)
- 🛡️ **Iron Wall** — Lowest max drawdown while profitable
- 🔥 **Streak King** — Longest winning streak
- 🌱 **Rising Star** — Best newcomer (< 1 season)
- 🧠 **Teacher** — Most helpful content (community voted)
- 💎 **Diamond Hands** — Best long-term hold ROI

**Visual**: Award ceremony pacing (Oscars model). Slow reveal. Tension. Celebration. Past winners in timeline.

**What we HAVE**: Achievement badges, tier system
**What we NEED**: Season tracking, ceremony UI, voting system

---

### 4. TRADES (The Live Feed)
**Concept**: Every trade on the platform, as a feed. See it, copy it, discuss it.

**Trade Card**:
- Trader avatar + name + tier + risk level 🟢🟡🔴
- Pair + Side (LONG/SHORT) + Leverage
- Entry price + Current price + Live P&L
- TP/SL levels + Progress bar
- Duration counter
- Actions: Copy, Share, Bookmark, Alert, Discuss

**Top Stats Bar**: Total active trades, aggregate P&L today, win rate today, total volume
**Filters**: Pair, status, trader, P&L range, risk level
**Sort**: Time, P&L, ROI, most copied

**Copy Trading Integrity Layer**:
- Show exact time delay between leader's execution and copy signal
- Display follower fill price vs leader fill price (slippage)
- Flag suspicious patterns: sudden leverage spikes, strategy changes, AUM dumps

**What we HAVE**: Arena trade filter, feed items, TpProgressBar, CommunityVote
**What we REFACTOR**: Dedicated full view, not a sub-filter

---

### 5. SIGNALS (The Calls)
**Concept**: Structured trading ideas with verified outcomes. Not TradingView drawings — tracked to completion.

**Signal Card**:
- Provider avatar + name + accuracy badge for this pair
- Pair + Direction + Leverage suggestion
- Entry zone (range, not single price)
- TP1, TP2, TP3 levels + SL
- RR ratio + Confidence meter (0-100%)
- Analysis summary (setup type, confluence factors)
- Status tracking: Active → TP1 Hit → TP2 Hit → TP3 Hit / SL Hit (timestamps)
- Community: Agree/Disagree vote, comments

**Differentiation**: Every signal is tracked to resolution. Historical accuracy is public. Can't fake it.

**What we HAVE**: Signal feed items, SMC analysis panel, signal stats
**What we NEED**: Multi-TP tracking, structured format, accuracy records

---

### 6. FUTURES (Prediction Markets)
**Concept**: Crypto prediction markets. Shows consensus and who's right.

**Prediction Card**:
- Question + Category tag (Price, Macro, Token, Technical)
- Current odds (Polymarket-style percentage)
- Sentiment gauge: Traders vs Bots split visualization
- Total volume + # participants
- Resolution status: Open → Resolved (with outcome)

**Categories**: Price Targets, Fed/Macro, Token Events, Dominance, Technical Levels
**Trader Leaderboard**: Who has the best prediction track record (Oracle ranking)

**What we HAVE**: Prediction feed, predictionsList, predStats, FootballTab betting concept
**What we REFACTOR**: Absorb FootballTab into Futures. Structured markets, not casual bets.

---

### 7. SOCIALS (Curated Cross-Posts)
**Concept**: NOT a live API aggregator (X API costs $42K+/year, Telegram has no content API). Instead: traders cross-post their best content to Tradethlon, linked to their native platforms.

**How it works**:
- Traders post on Tradethlon with platform tag (X, TG, Discord)
- Each post links back to the original on the native platform
- Engagement metrics from native platforms shown as social proof
- Tradethlon engagement (votes, replies) shown separately

**Incentive to post here**: Content on Tradethlon gets ranked, affects trader score, increases discoverability. Posting here is like posting highlights to your ESPN profile.

**Components**:
- Unified feed with platform badges
- Platform filter (All, X, TG, DC)
- Trader filter (followed traders, all)
- Trending topics / hashtags
- "Highlight of the Day" (most impactful post)

**What we HAVE**: socialPosts data, multi-platform support, socialStats
**What we REFACTOR**: From "aggregator" concept to "cross-post" model

---

### 8. TOKENS (The Deep Dive)
**Concept**: Select a token → see EVERYTHING in one page. Replaces having 10 tabs open.

**Components**:
- **Price Chart**: Candlestick with TradeSignalViz overlay capability
- **Token Stats**: Price, 24h%, market cap, volume, ATH, ATL
- **Who's Trading**: Traders/bots with positions on this token
- **Active Trades**: All open trades on this token
- **Active Signals**: All signals calling this token
- **Predictions**: Futures related to this token
- **Sentiment Score**: Aggregate bullish/bearish (traders + bots + social)
- **Social Buzz**: Recent posts mentioning this token
- **Whale Watch**: Large position openings/closings

**What we HAVE**: Pair selector, allPairs, basePrices
**What we NEED**: Token detail page, cross-data aggregation, sentiment calc

---

## Right Panel (Personal Workspace)

**Starts collapsed by default.** Click to expand. TradingView-style.

1. **Favorites**: Starred traders/bots — quick access
2. **Watchlists**: Custom lists ("My Scalpers", "Safe Bots", "BTC Traders")
3. **Alerts**: Price alerts, trader activity triggers, signal notifications
4. **Chat**: Simple live chat (rooms by topic)
5. **My Portfolio**: Active copies, P&L, allocation breakdown

**What we HAVE**: Watchlist panel, followedTraders, traderAlerts
**What we NEED**: Custom lists, chat, portfolio tracker, richer alerts

---

## Top Bar (Global Filters)

Affect ALL content across ALL tabs:
- **Date Range**: 24h, 7d, 1m, 3m, 6m, 1y, YTD, All, Custom
- **Traders**: Multi-select dropdown
- **Bots**: Toggle show/hide, or filter to specific bots
- **Tokens**: Multi-select to focus on specific tokens
- **Casual/Pro Toggle**: Switches metric density across all views
- **Search** (⌘K): Global search — traders, tokens, signals, trades

---

## Implementation Phases (by user value)

### Phase 1: The Hook + Core Utility
- New 3-panel layout (left nav, main, right panel)
- Top bar with global filters + Casual/Pro toggle
- **Arena** tab (race chart + standings + highlights)
- **Trades** tab (dedicated trade feed with copy integrity)
- Trader Profile modal (accessible from anywhere)
- InfoTip glossary (comprehensive)
- Onboarding overlay (first visit)
- Season timer display

### Phase 2: Deepen the Utility
- **Signals** tab (structured signal cards, multi-TP tracking)
- **Tokens** tab (deep dive with aggregated data)
- Enhanced search (⌘K with full results)
- Right panel: Favorites + Watchlists + Alerts

### Phase 3: The Competitive Soul
- **Hall of Fame** (trophy cards, trade replay)
- **Awards** (ceremony UI, categories, season tracking)
- **Futures** (prediction markets, sentiment visualization)
- Season end ceremony animation

### Phase 4: The Social Layer
- **Socials** (curated cross-posts, trending)
- Chat system
- Portfolio tracker
- Share/embed features

### Phase 5: Polish
- Full animations + transitions
- Mobile responsive
- Performance optimization
- Expanded glossary
- Accessibility audit

---

## Key Data Cards (Universal Units)

### Trader Card:
Avatar + Name + Tier badge + Bot tag + Risk level (🟢🟡🔴)
Alpha Score (/100) · Win Rate · ROI% · Sharpe · Max DD · Streak · Copiers · Style tag

### Trade Card:
Trader info + Pair + Side + Leverage
Entry + Current + Live P&L + TP/SL progress
Duration · Copy button + count · Share · Discuss

### Signal Card:
Provider + accuracy badge + Pair + Direction + Leverage
Entry zone + TP1/2/3 + SL + RR + Confidence meter
Status tracking + Community vote

### Prediction Card:
Question + Category + Odds + Volume + Participants
Sentiment gauge (traders vs bots) + Resolution status

---

## The "10/10" Checklist

### For Experts:
- [x] Verified track record that builds real credibility
- [x] Sophisticated metrics (Sharpe, Sortino, drawdown, risk-adjusted)
- [x] Monetization through copy fees
- [x] Cross-platform content aggregation
- [x] Awards that celebrate skill (not volume)
- [x] Feel like an athlete being celebrated
- [x] Pro mode with dense data + advanced overlays

### For Beginners:
- [x] Understand every term (InfoTip on everything)
- [x] Immediately clear who the best traders are (Arena race)
- [x] Risk level visible at a glance (🟢🟡🔴)
- [x] Copy in one click with integrity transparency
- [x] Casual mode — exciting, not overwhelming
- [x] Learn by watching without risking money
- [x] 3-step onboarding that takes 10 seconds

### Regulatory Safety:
- [x] Gamification rewards skill, not frequency
- [x] Risk disclaimers integrated into UI
- [x] Copy trading transparency (slippage, timing, anomaly detection)
- [x] No confetti or celebration of trade volume
- [x] Clear risk level indicators
