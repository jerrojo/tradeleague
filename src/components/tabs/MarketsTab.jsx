import { Fragment, useMemo, useState } from "react";
import { Activity, Flame, Radio, TrendingDown, TrendingUp } from "lucide-react";
import { C, cardStyle, mono } from "../../theme";
import { Tag } from "../common";
import { TraderLink, useProfile, useProMode } from "../../contexts";
import { feedItems, mockTraders, smcCoins, traderDeepData } from "../../data/mockData";
import { coinSentiment, coinOf } from "../../lib/tradeInsights";

/* ═══════════════════════════════════════════════════════════════════════════
   MARKETS — the command center for "why is each coin moving and how are
   traders playing it." Aggregates positioning, win rate and P&L per coin from
   every trader's history, enriched with SMC bias, and surfaces live signals.
   ═══════════════════════════════════════════════════════════════════════════ */

const SentimentBar = ({ sentiment }) => {
  // map −100..100 to 0..100 fill from center
  const pos = (sentiment + 100) / 2;
  const color = sentiment >= 12 ? C.green : sentiment <= -12 ? C.red : C.textMuted;
  return (
    <div style={{ position: "relative", height: 6, backgroundColor: C.border, borderRadius: 3 }}>
      <div style={{ position: "absolute", left: "50%", top: -2, width: 1, height: 10, backgroundColor: C.textFaint }} />
      <div style={{ position: "absolute", top: 0, height: "100%", borderRadius: 3, backgroundColor: color,
        left: sentiment >= 0 ? "50%" : `${pos}%`, width: `${Math.abs(sentiment) / 2}%` }} />
    </div>
  );
};

const MarketsTab = () => {
  const { openProfile } = useProfile();
  const proMode = useProMode(); // Simple hides Net PnL + SMC Bias columns
  const [sortBy, setSortBy] = useState("trades");
  const [selected, setSelected] = useState(null);

  const allTrades = useMemo(
    () => mockTraders.flatMap((t) => (traderDeepData[t.name]?.history || []).map((h) => ({ ...h, trader: t.name }))),
    []
  );
  const smcMap = useMemo(() => {
    const m = {};
    Object.keys(smcCoins).forEach((k) => { m[k] = smcCoins[k]; });
    return m;
  }, []);

  const coins = useMemo(() => {
    const rows = coinSentiment(allTrades, smcMap);
    const sorters = {
      trades: (a, b) => b.trades - a.trades,
      sentiment: (a, b) => b.sentiment - a.sentiment,
      pnl: (a, b) => b.pnl - a.pnl,
      winRate: (a, b) => b.winRate - a.winRate,
    };
    return [...rows].sort(sorters[sortBy] || sorters.trades);
  }, [allTrades, smcMap, sortBy]);

  // live signals per coin (from the aggregated feed)
  const signalsByCoin = useMemo(() => {
    const m = {};
    feedItems.filter((f) => f.kind === "signal").forEach((s) => {
      const c = coinOf(s.pair);
      (m[c] = m[c] || []).push(s);
    });
    return m;
  }, []);

  const market = useMemo(() => {
    const bull = coins.filter((c) => c.sentiment >= 12).length;
    const bear = coins.filter((c) => c.sentiment <= -12).length;
    const net = coins.reduce((a, c) => a + c.sentiment, 0) / Math.max(1, coins.length);
    return { bull, bear, neutral: coins.length - bull - bear, net: Math.round(net) };
  }, [coins]);

  const sentColor = (s) => (s >= 12 ? C.green : s <= -12 ? C.red : C.textMuted);
  const sortTabs = [["trades", "Most traded"], ["sentiment", "Most bullish"], ["pnl", "Most profitable"], ["winRate", "Best win rate"]];
  const sel = selected ? coins.find((c) => c.coin === selected) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* market mood banner */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${sentColor(market.net)}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {market.net >= 0 ? <TrendingUp size={20} color={sentColor(market.net)} /> : <TrendingDown size={20} color={sentColor(market.net)} />}
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Overall market sentiment</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: sentColor(market.net), ...mono }}>
              {market.net >= 40 ? "Bullish" : market.net >= 12 ? "Lean Bull" : market.net <= -40 ? "Bearish" : market.net <= -12 ? "Lean Bear" : "Neutral"} <span style={{ fontSize: 12, color: C.textMuted }}>({market.net >= 0 ? "+" : ""}{market.net})</span>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", gap: 2 }}>
            <div title={`${market.bull} bullish`} style={{ flex: market.bull || 0.001, backgroundColor: C.green }} />
            <div title={`${market.neutral} neutral`} style={{ flex: market.neutral || 0.001, backgroundColor: C.textFaint }} />
            <div title={`${market.bear} bearish`} style={{ flex: market.bear || 0.001, backgroundColor: C.red }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: C.textMuted }}>
            <span style={{ color: C.green }}>● {market.bull} bullish</span>
            <span>● {market.neutral} neutral</span>
            <span style={{ color: C.red }}>{market.bear} bearish ●</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.textFaint, maxWidth: 200 }}>
          Sentiment blends how traders are positioned (long vs short), their win rate on the coin, and the SMC structural bias.
        </div>
      </div>

      {/* sort */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {sortTabs.map(([id, label]) => (
          <button key={id} onClick={() => setSortBy(id)} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${sortBy === id ? C.purple : C.border}`,
            backgroundColor: sortBy === id ? C.purpleBg : "transparent",
            color: sortBy === id ? C.purple : C.textMuted,
          }}>{label}</button>
        ))}
      </div>

      {/* coin board */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Coin", "Price", "Trader Sentiment", "Long / Short", "Trades", "Win Rate", "Net PnL", "SMC Bias"].filter(h => proMode || (h !== "Net PnL" && h !== "SMC Bias")).map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: h === "Coin" ? "left" : "center", color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coins.map((c) => {
              const open = selected === c.coin;
              return (
                <Fragment key={c.coin}>
                  <tr className="hoverable" onClick={() => setSelected(open ? null : c.coin)} style={{ cursor: "pointer", backgroundColor: open ? C.cardHover : "transparent" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 13, borderBottom: `1px solid ${C.border}` }}>{c.coin}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", ...mono, fontSize: 11, borderBottom: `1px solid ${C.border}` }}>
                      {c.price || "—"}{c.change && <span style={{ color: c.change.startsWith("-") ? C.red : C.green, marginLeft: 4, fontSize: 10 }}>{c.change}</span>}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, minWidth: 140 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1 }}><SentimentBar sentiment={c.sentiment} /></div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: sentColor(c.sentiment), ...mono, whiteSpace: "nowrap", minWidth: 56, textAlign: "right" }}>{c.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, minWidth: 90 }}>
                      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${c.longPct}%`, backgroundColor: C.green }} />
                        <div style={{ width: `${c.shortPct}%`, backgroundColor: C.red }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, ...mono, marginTop: 2 }}><span style={{ color: C.green }}>{c.longPct}%L</span><span style={{ color: C.red }}>{c.shortPct}%S</span></div>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", ...mono, fontSize: 12, borderBottom: `1px solid ${C.border}` }}>{c.trades}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}><span style={{ ...mono, fontSize: 12, fontWeight: 700, color: c.winRate >= 50 ? C.green : C.red }}>{c.winRate}%</span></td>
                    {proMode && <td style={{ padding: "10px 12px", textAlign: "center", ...mono, fontSize: 12, fontWeight: 700, color: c.pnl >= 0 ? C.green : C.red, borderBottom: `1px solid ${C.border}` }}>{c.pnl >= 0 ? "+" : ""}${(c.pnl / 1000).toFixed(1)}K</td>}
                    {proMode && (
                    <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
                      {c.bias ? <Tag text={c.bias} color={c.bias === "BULLISH" ? C.green : C.red} /> : <span style={{ fontSize: 10, color: C.textFaint }}>—</span>}
                    </td>
                    )}
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={8} style={{ padding: "0 12px 14px", backgroundColor: `${C.bg}80`, borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Structure & risk</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {[["Confluence", c.confluence != null ? `${c.confluence}/10` : "—"], ["Risk", c.risk || "—"], ["Top trader on coin", c.topTrader ? `${c.topTrader.name} (${c.topTrader.pnl >= 0 ? "+" : ""}$${c.topTrader.pnl.toLocaleString()})` : "—"]].map(([l, v]) => (
                                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>
                                  <span style={{ color: C.textMuted }}>{l}</span>
                                  <span style={{ ...mono, fontWeight: 600 }}>{c.topTrader && l === "Top trader on coin" ? <TraderLink name={c.topTrader.name}>{v}</TraderLink> : v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><Radio size={11} color={C.blue} /> Live signals</div>
                            {(signalsByCoin[c.coin] || []).length === 0 && <div style={{ fontSize: 11, color: C.textFaint }}>No active signals on {c.coin}.</div>}
                            {(signalsByCoin[c.coin] || []).slice(0, 3).map((s) => (
                              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                                <Tag text={s.bias} color={s.bias === "LONG" ? C.green : C.red} />
                                <TraderLink name={s.trader}><span style={{ fontWeight: 600 }}>{s.trader}</span></TraderLink>
                                <span style={{ color: C.textMuted, fontSize: 10 }}>{s.confidence}% conf · {s.timeframe}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 10, color: C.textFaint, display: "flex", alignItems: "center", gap: 6 }}>
        <Activity size={11} /> Click a coin for structure, the top trader on it, and live signals. Sentiment and positioning are computed from {allTrades.length} real trades.
      </div>
    </div>
  );
};

export { MarketsTab };
