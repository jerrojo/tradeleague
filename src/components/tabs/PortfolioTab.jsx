import { useMemo, useState } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, AlertTriangle, Download, Scale, Target, TrendingDown, TrendingUp } from "lucide-react";
import { C, cardStyle, mono, tdStyle, thStyle } from "../../theme";
import { Avatar, InfoTip, StatCard, Tag } from "../common";
import { btcBenchmark, mockTraders, traderColors, traderDeepData, traderEquity } from "../../data/mockData";
import { exportTrades } from "../../lib/exportData";
import { computeMetrics, delever } from "../../lib/tradeSim";

/* ═══════════════════════ TAB: PORTFOLIO / SYSTEM (VARIV Vista C) ═══════════════════════
   Level-1 institutional view: aggregated fund performance.
   Per the brief: Win Rate does NOT appear in the KPI header — at system level what
   matters is Profit Factor and Expectancy. WR only lives in trader profiles. */

const INITIAL_CAPITAL_PER_TRADER = 10000;

const PortfolioTab = () => {
  const [overlay, setOverlay] = useState({});
  const [ddScope, setDdScope] = useState("System");
  const [leveraged, setLeveraged] = useState(true);   // ROI apalancado vs ROI normal (metrics catalog)
  const [granularity, setGranularity] = useState("daily"); // time as a combinable axis

  /* ── Aggregate every trade from every trader (single source: Vista D schema) ── */
  const allTrades = useMemo(
    () => mockTraders.flatMap(t => (traderDeepData[t.name]?.history || []).map(h => ({ ...h, trader: t.name }))),
    []
  );

  /* ── System equity in % of initial capital, + per-trader % and BTC benchmark ── */
  const systemSeries = useMemo(() => {
    const totalCapital = mockTraders.length * INITIAL_CAPITAL_PER_TRADER;
    let peak = -Infinity;
    return traderEquity.map((pt, i) => {
      const row = { day: pt.day, btc: btcBenchmark[i]?.pct ?? null };
      let sum = 0;
      mockTraders.forEach(t => {
        const v = pt[t.name];
        if (v != null) { sum += v; row[t.name] = Math.round((v / INITIAL_CAPITAL_PER_TRADER) * 1000) / 10; }
      });
      row.system = Math.round((sum / totalCapital) * 1000) / 10;
      peak = Math.max(peak, row.system);
      row.drawdown = Math.round((row.system - peak) * 10) / 10; // ≤ 0
      return row;
    });
  }, []);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const grossWin = allTrades.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0);
    const grossLoss = Math.abs(allTrades.filter(t => t.pnl < 0).reduce((a, t) => a + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : Infinity;
    const expectancyR = allTrades.reduce((a, t) => a + t.rMultiple, 0) / Math.max(1, allTrades.length);
    const totalTrades = mockTraders.reduce((a, t) => a + t.trades, 0);
    const sharpe = mockTraders.reduce((a, t) => a + (t.sharpe || 0) * t.trades, 0) / Math.max(1, totalTrades);
    // Real fund drawdown from the per-trade equity path (the aggregate daily curve barely
    // dips because traders' drawdowns happen at different times and net out).
    const maxDD = computeMetrics(allTrades, mockTraders.length * INITIAL_CAPITAL_PER_TRADER).maxDrawdownPct;
    return { profitFactor, expectancyR, totalTrades, sharpe, maxDD };
  }, [allTrades, systemSeries]);

  /* ── Segmentations (anti-pattern rule: global WR says nothing — force style split) ── */
  const byStyle = useMemo(() => {
    const styles = ["SCALP", "INTRA", "SWING", "POSITION"];
    return styles.map(style => {
      const trades = allTrades.filter(t => t.style === style);
      const closed = trades.filter(t => t.outcome !== "BREAKEVEN");
      const wins = closed.filter(t => t.outcome === "WIN").length;
      const avgR = trades.length ? trades.reduce((a, t) => a + t.rMultiple, 0) / trades.length : 0;
      return {
        style, trades: trades.length,
        winRate: closed.length ? Math.round((wins / closed.length) * 100) : 0,
        avgR: Math.round(avgR * 100) / 100,
      };
    });
  }, [allTrades]);

  const bySetup = useMemo(() => {
    const counts = {};
    let unlabeled = 0;
    allTrades.forEach(t => {
      if (!t.setupTag) { unlabeled++; return; }
      const pattern = t.setupTag.split("_")[2] || "OTHER";
      counts[pattern] = (counts[pattern] || 0) + 1;
    });
    const rows = Object.entries(counts).map(([k, v]) => ({ name: k, count: v, fill: C.purple }));
    rows.sort((a, b) => b.count - a.count);
    if (unlabeled > 0) rows.push({ name: "UNLABELED", count: unlabeled, fill: C.amber });
    return rows;
  }, [allTrades]);

  const byPair = useMemo(() => {
    const map = {};
    allTrades.forEach(t => {
      const m = map[t.pair] || (map[t.pair] = { pair: t.pair, trades: 0, wins: 0, closed: 0, rSum: 0, pnl: 0 });
      m.trades++; m.rSum += t.rMultiple; m.pnl += t.pnl;
      if (t.outcome !== "BREAKEVEN") { m.closed++; if (t.outcome === "WIN") m.wins++; }
    });
    return Object.values(map)
      .map(m => ({ ...m, winRate: m.closed ? Math.round((m.wins / m.closed) * 100) : 0, expR: Math.round((m.rSum / m.trades) * 100) / 100 }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 8);
  }, [allTrades]);

  /* ── Drawdown timeline (system or single trader) ── */
  const ddSeries = useMemo(() => {
    if (ddScope === "System") return systemSeries.map(d => ({ day: d.day, dd: d.drawdown }));
    let peak = -Infinity;
    return traderEquity.map(pt => {
      const v = pt[ddScope];
      if (v == null) return { day: pt.day, dd: null };
      const pct = (v / INITIAL_CAPITAL_PER_TRADER) * 100;
      peak = Math.max(peak, pct);
      return { day: pt.day, dd: Math.round((pct - peak) * 10) / 10 };
    });
  }, [ddScope, systemSeries]);

  /* ── Return metrics on chosen leverage basis (catalog: every return metric has both variants) ── */
  const returns = useMemo(
    () => computeMetrics(leveraged ? allTrades : delever(allTrades), mockTraders.length * INITIAL_CAPITAL_PER_TRADER),
    [allTrades, leveraged]
  );

  /* ── Time as a combinable axis: bucket the equity series by granularity ── */
  const displaySeries = useMemo(() => {
    const size = { daily: 1, weekly: 7, monthly: 30, quarterly: 90 }[granularity] || 1;
    if (size <= 1) return systemSeries;
    const out = [];
    for (let i = 0; i < systemSeries.length; i += size) {
      const chunk = systemSeries.slice(i, i + size);
      out.push(chunk[chunk.length - 1]); // last point in the bucket — equity is cumulative
    }
    return out;
  }, [systemSeries, granularity]);

  const tooltipStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" };
  const pfFmt = (v) => (v === Infinity ? "∞" : v.toFixed(2));
  const calFmt = (v) => (v === Infinity ? "∞" : v.toFixed(2));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── C.1 System KPIs — five core metrics, no Win Rate at this level ── */}
      {/* Title + global export */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "800" }}>Fund / System Performance</div>
          <div style={{ fontSize: "11px", color: C.textMuted }}>Aggregated across {mockTraders.length} traders · {allTrades.length} trades · {allTrades.filter(t => !t.setupTag).length} unlabeled</div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => exportTrades(allTrades, { name: "tradethlon-fund", format: "csv" })}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.text, fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => exportTrades(allTrades, { name: "tradethlon-fund", format: "json" })}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.text, fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
            <Download size={13} /> JSON
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        <StatCard label="Profit Factor" value={kpis.profitFactor === Infinity ? "∞" : kpis.profitFactor.toFixed(2)} icon={Scale} color={C.amber} tip="profitFactor" />
        <StatCard label="Sharpe Ratio" value={kpis.sharpe.toFixed(2)} icon={Activity} color={C.blue} tip="sharpe" />
        <StatCard label="Max Drawdown" value={`${kpis.maxDD.toFixed(1)}%`} icon={TrendingDown} color={C.red} tip="maxDD" />
        <StatCard label="Expectancy" value={`${kpis.expectancyR >= 0 ? "+" : ""}${kpis.expectancyR.toFixed(2)}R`} icon={Target} color={kpis.expectancyR >= 0 ? C.green : C.red} tip="expectancyR" />
        <StatCard label="Total Trades" value={kpis.totalTrades.toLocaleString()} icon={TrendingUp} color={C.purple} />
      </div>

      {/* ── Return metrics — ROI basis toggle (catalog: normal vs leveraged variants) ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600" }}>Return Metrics</div>
            <div style={{ fontSize: "10px", color: C.textFaint }}>Compounded performance of the signal sequence — switch the leverage basis to see how much of the edge is leverage.</div>
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {[[true, "Leveraged ROI"], [false, "Normal ROI"]].map(([v, label]) => (
              <button key={label} onClick={() => setLeveraged(v)} style={{
                padding: "5px 12px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", cursor: "pointer", ...mono,
                border: `1px solid ${leveraged === v ? C.blue : C.border}`,
                backgroundColor: leveraged === v ? C.blueBg : "transparent",
                color: leveraged === v ? C.blue : C.textMuted,
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {[
            ["Compound ROI", `${returns.compoundRoiPct >= 0 ? "+" : ""}${returns.compoundRoiPct}%`, returns.compoundRoiPct >= 0 ? C.green : C.red, "compoundRoi"],
            ["Total ROI", `${returns.totalRoiPct >= 0 ? "+" : ""}${returns.totalRoiPct}%`, returns.totalRoiPct >= 0 ? C.green : C.red, "totalRoi"],
            ["Calmar Ratio", calFmt(returns.calmar), returns.calmar >= 3 ? C.green : returns.calmar >= 1 ? C.amber : C.red, "calmarRatio"],
            ["Profit Factor", pfFmt(returns.profitFactor), returns.profitFactor >= 1 ? C.green : C.red, "profitFactor"],
            ["Max Drawdown", `${returns.maxDrawdownPct}%`, C.red, "maxDD"],
          ].map(([l, v, clr, tip]) => (
            <div key={l} style={{ ...cardStyle, padding: "10px 12px" }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: clr, ...mono }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── C.2 System equity curve + trader overlays + BTC benchmark ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "13px", fontWeight: "600" }}>Fund Equity Curve — % return on initial capital</div>
            <div style={{ display: "flex", gap: "3px" }}>
              {[["daily", "D"], ["weekly", "W"], ["monthly", "M"], ["quarterly", "Q"]].map(([g, label]) => (
                <button key={g} onClick={() => setGranularity(g)} title={`${g} buckets`} style={{
                  padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer", ...mono,
                  border: `1px solid ${granularity === g ? C.cyan : C.border}`,
                  backgroundColor: granularity === g ? `${C.cyan}15` : "transparent",
                  color: granularity === g ? C.cyan : C.textMuted,
                }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {mockTraders.map((t, i) => (
              <button key={t.name} onClick={() => setOverlay(prev => ({ ...prev, [t.name]: !prev[t.name] }))} style={{
                display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "4px",
                fontSize: "9px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${overlay[t.name] ? traderColors[i] : C.border}`,
                backgroundColor: overlay[t.name] ? `${traderColors[i]}15` : "transparent",
                color: overlay[t.name] ? traderColors[i] : C.textMuted,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: traderColors[i] }} />
                <Avatar name={t.name} size={14} /> {t.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={displaySeries}>
            <defs>
              <linearGradient id="sysEq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.purple} stopOpacity={0.3} /><stop offset="95%" stopColor={C.purple} stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
            <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} tickFormatter={v => `D${v}`} />
            <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${Number(v).toFixed(1)}%`, name === "system" ? "Fund" : name === "btc" ? "BTC hold" : name === "drawdown" ? "Drawdown" : name]} />
            <ReferenceLine y={0} stroke={C.textFaint} strokeDasharray="4 4" strokeOpacity={0.7} label={{ value: "breakeven", position: "insideTopLeft", fill: C.textFaint, fontSize: 9 }} />
            <Area type="monotone" dataKey="system" stroke={C.purple} strokeWidth={2.5} fill="url(#sysEq)" dot={false} name="system" isAnimationActive={false} />
            <Line type="monotone" dataKey="btc" stroke={C.textMuted} strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="btc" isAnimationActive={false} />
            {mockTraders.map((t, i) => overlay[t.name] && (
              <Line key={t.name} type="monotone" dataKey={t.name} stroke={traderColors[i]} strokeWidth={1.5} dot={false} connectNulls={false} isAnimationActive={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: "16px", fontSize: "9px", color: C.textMuted, marginTop: "4px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 3, backgroundColor: C.purple, borderRadius: 1 }} /> Fund (aggregate)</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 0, borderTop: `2px dashed ${C.textMuted}` }} /> BTC buy-and-hold benchmark</span>
        </div>
      </div>

      {/* ── C.3 Distribution by style + setup ── */}
      <div className="grid-2col-16">
        <div style={cardStyle}>
          <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Win Rate by Style</div>
          <div style={{ fontSize: "10px", color: C.textFaint, marginBottom: "10px" }}>A 65% SCALP and a 40% SWING at 3.5R are completely different risk profiles — never read win rate without its style.</div>
          {byStyle.map(r => (
            <div key={r.style} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
                <span style={{ fontWeight: "700", color: C.text, ...mono }}>{r.style} <span style={{ color: C.textFaint, fontWeight: "400" }}>· {r.trades} trades</span></span>
                <span style={{ ...mono }}><span style={{ color: r.winRate >= 50 ? C.green : C.red, fontWeight: "700" }}>{r.winRate}%</span> <span style={{ color: r.avgR >= 0 ? C.green : C.red }}>({r.avgR >= 0 ? "+" : ""}{r.avgR}R avg)</span></span>
              </div>
              <div style={{ height: "8px", backgroundColor: C.border, borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${r.winRate}%`, height: "100%", backgroundColor: r.winRate >= 50 ? C.green : C.red, borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Setup Distribution</div>
          <div style={{ fontSize: "10px", color: C.textFaint, marginBottom: "6px" }}>
            <InfoTip k="setupTag" inline><span>Concentration risk by setup pattern</span></InfoTip>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={bySetup} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" stroke={C.textMuted} fontSize={9} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke={C.textMuted} fontSize={9} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [v, "trades"]} cursor={{ fill: `${C.border}40` }} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={12} isAnimationActive={false}>
                {bySetup.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {bySetup.some(r => r.name === "UNLABELED") && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "9px", color: C.amber, marginTop: "4px" }}>
              <AlertTriangle size={10} /> Unlabeled trades are invisible to the ML pipeline — label them to recover training data.
            </div>
          )}
        </div>
      </div>

      {/* ── C.3b Expectancy by pair ── */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Expectancy by Pair — Top {byPair.length}</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Pair", "Trades", "Win Rate", "Expectancy (R)", "Total PnL"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {byPair.map(r => (
              <tr key={r.pair} className="hoverable">
                <td style={{ ...tdStyle, fontWeight: "600" }}>{r.pair}</td>
                <td style={{ ...tdStyle, ...mono }}>{r.trades}</td>
                <td style={{ ...tdStyle }}><Tag text={`${r.winRate}%`} color={r.winRate >= 50 ? C.green : C.red} /></td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: r.expR >= 0 ? C.green : C.red }}>{r.expR >= 0 ? "+" : ""}{r.expR}R</td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: r.pnl >= 0 ? C.green : C.red }}>{r.pnl >= 0 ? "+" : ""}${r.pnl.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── C.4 Drawdown timeline ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: "600" }}>Drawdown Timeline</div>
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
            {["System", ...mockTraders.map(t => t.name)].map(scope => (
              <button key={scope} onClick={() => setDdScope(scope)} style={{
                padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${ddScope === scope ? C.red : C.border}`,
                backgroundColor: ddScope === scope ? C.redBg : "transparent",
                color: ddScope === scope ? C.red : C.textMuted,
              }}>{scope === "System" ? "System" : scope.split(" ")[0]}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={ddSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} vertical={false} />
            <XAxis dataKey="day" stroke={C.textMuted} fontSize={10} tickFormatter={v => `D${v}`} />
            <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${Number(v).toFixed(1)}%`, "Drawdown"]} cursor={{ fill: `${C.border}40` }} />
            <Bar dataKey="dd" fill={C.red} radius={[0, 0, 2, 2]} barSize={6} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: "9px", color: C.textFaint, marginTop: "2px" }}>
          Max drawdown in scope: <span style={{ color: C.red, fontWeight: "700", ...mono }}>{Math.min(...ddSeries.filter(d => d.dd != null).map(d => d.dd)).toFixed(1)}%</span> — periods of underperformance to correlate with market conditions.
        </div>
      </div>
    </div>
  );
};

export { PortfolioTab };
