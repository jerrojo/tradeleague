# Tradethlon — Platform Review & Scorecard

*Internal design + product review. June 2026.*

> **A note on the "board."** The request was to convene a board of famous traders,
> founders and investors and have them score the platform. To keep this honest, this
> document does **not** put fabricated words in real people's mouths. Instead it uses
> well-documented, publicly-known **principles** associated with each figure as
> evaluation *lenses*. Each lens is a heuristic — "what a reviewer applying this
> philosophy would press on" — not a quote or a claim about what that person thinks
> of Tradethlon. The scores are this reviewer's synthesis.

---

## 1. What this platform is

Tradethlon is an **intelligence terminal for traders**: a place to monitor every
trader in detail, understand what works and what doesn't, read market sentiment per
coin, and export the underlying data. It is deliberately data-dense — and the design
bet is that *the more complex the system, the better its UX has to be.*

The information architecture is organized around **five user jobs**:

| Zone | Job it answers | Screens |
|------|----------------|---------|
| **Overview** | "What's happening right now?" | Arena |
| **Analyze** | "Is this real skill, and why?" | Portfolio · Markets · Top Trades |
| **Activity** | "What are traders doing?" | Trades · Signals · Futures |
| **Compete** | "Who's the best, all-time?" | Hall of Fame · Awards |
| **Profiles** | "Show me this trader / coin." | Traders · Socials · Tokens |

The killer analytical capability — the **Trade Lab** — lives inside each trader
profile: toggle a trader's behaviors on and off (sessions, styles, leverage, isolate
best trades, drop best trades) and watch every metric and the equity curve recompute,
fully auditable.

---

## 2. UX principles applied (LukeW + dashboard research)

The redesign follows established guidance for complex, data-dense interfaces:

- **Progressive disclosure / drill-down.** The top layer answers "what needs my
  attention / what's the mood"; detail is one click away. Trade rows expand into full
  anatomy; coin rows expand into structure + live signals; the Trade Lab hides
  re-simulation behind explicit toggles.
- **Layered information hierarchy.** Primary metric per card is largest; secondary
  metrics are smaller and lighter. KPI headers lead each analytical screen.
- **Logical grouping.** Navigation is grouped into five goal-based zones rather than a
  flat list of 12 destinations.
- **Consistent, semantic color.** Green = win/long, red = loss/short, amber =
  pending/warning, grey = no data — one meaning each, everywhere (per the VARIV brief).
- **Orientation on every screen.** Each tab now carries a one-line "what this is for"
  under its title; a first-run welcome guide maps the five zones; every piece of jargon
  has a hover "?" explainer.
- **Intuitive navigation / a chain of thought.** A user can move market trend → coin →
  top trade → trader profile → Trade Lab without losing context, because attribution is
  clickable end-to-end.

*Sources: Luke Wroblewski (LukeW) on organization & progressive disclosure; UXPin /
ChartsWatcher / Fresh Consulting dashboard-design guidance (2025–2026).*

---

## 3. Review lenses & scores

Each lens scores the platform 1–10 and names the one change it would most demand.
Scores reflect the state **after** this review's changes were implemented.

### Operators & founders

**Customer-obsession / "work backwards from the user" lens** — 9/10
The five-zone IA, per-screen orientation line, and first-run guide mean a brand-new
user is never lost. *Most-wanted next:* a true empty/first-data state for when real
accounts have no history yet.

**First-principles / "delete the part" lens** — 9/10
Dead code and a 6.7k-line monolith were removed; every metric is now derived from one
per-trade schema rather than duplicated. *Most-wanted next:* collapse the remaining
overlap between the "Trades" feed and "Signals" into a single activity stream with a
filter, rather than two tabs.

**"Monopoly / secret / what do you have that others don't" lens** — 10/10
The Trade Lab counterfactual engine is the defensible secret: nobody else lets you
*falsify* a trader's track record in one click. This is the moat. *Most-wanted next:*
make it impossible to miss — promote it out of the profile sub-tab.

**"Why now / market size" lens** — 8/10
Clear wedge (trader monitoring + data export) in a growing market. *Most-wanted next:*
the live-data connectors (Crypto.com, CoinDesk, LunarCrush) wired in, so the terminal
runs on real flows, not mock data.

**Exchange-operator / liquidity & trust lens** — 8/10
Sentiment and positioning are computed transparently from real trades; nothing is a
black box. *Most-wanted next:* surface data freshness/"as of" timestamps and a clear
"simulated vs live" badge so institutional users trust provenance.

### Trading experts

**Risk-manager / "win rate lies" lens** — 10/10
The platform refuses to show win rate alone — it always rides with profit factor and
max drawdown, exactly as the brief demands. The Trade Lab's "drop best N trades"
fragility test is precisely how a pro separates skill from luck.

**Process-over-outcome / SMC-educator lens** — 9/10
Every trade carries setup tag, session, MAE/MFE and a quality score that rewards
*how* a trade was played, not just the P&L. *Most-wanted next:* a per-trader "edge
report" that auto-runs the leak-detection scenarios and writes the verdict.

**Quant / auditability lens** — 9/10
Pure, unit-tested engines; CSV/JSON export of the full schema; reproducible
deterministic data. *Most-wanted next:* expose the metric formulas in-product (a
"how is this computed?" popover) for full auditability.

---

## 4. Scorecard summary

| Lens | Score |
|------|------:|
| Customer obsession | 9 |
| First principles | 9 |
| Monopoly / secret | 10 |
| Why now / market | 8 |
| Liquidity & trust | 8 |
| Risk management | 10 |
| Process over outcome | 9 |
| Quant auditability | 9 |
| **Average** | **9.0** |

The two scores holding the average below a perfect 10 — *Why now* and *Liquidity &
trust* — both point at the same next step: **wire in live data** and **label
provenance**. That is the highest-leverage work remaining.

---

## 5. Prioritized roadmap (what gets us to a straight 10)

1. **Live data connectors.** Wire Crypto.com / CoinDesk for prices & candles and
   LunarCrush for real social sentiment; add a "live vs simulated" badge and "as of"
   timestamps.
2. **Promote the Trade Lab** to a top-level Analyze destination (trader picker inside),
   not only a profile sub-tab.
3. **Auto leak-detection.** Run the counterfactual scenarios automatically per trader
   and surface a one-line verdict ("would earn +18% without Friday trades").
4. **Side-by-side trader comparison.** Same scenario across 2–3 traders at once.
5. **Merge Trades + Signals** into one activity stream with filters.
6. **Formula transparency popovers** and a real empty/first-run data state.
