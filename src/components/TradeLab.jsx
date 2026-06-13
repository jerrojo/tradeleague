import { useMemo, useState } from "react";
import {
  Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Beaker, Download, RotateCcw, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { C, cardStyle, mono } from "../theme";
import {
  applyScenario, computeMetrics, mergedEquity, describeScenario, isModified,
  DEFAULT_SCENARIO, SESSIONS, STYLES,
} from "../lib/tradeSim";
import { exportTrades } from "../lib/exportData";

/* ═══════════════════════════════════════════════════════════════════════════
   TRADE LAB — counterfactual attribution sandbox (VARIV "what-if" engine)
   Turn a trader's behaviors on/off and watch their real track record recompute.
   ═══════════════════════════════════════════════════════════════════════════ */

const clone = (s) => ({ ...s, sessions: { ...s.sessions }, styles: { ...s.styles } });

const Chip = ({ on, color, children, onClick }) => (
  <button onClick={onClick} style={{
    padding: "5px 11px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", cursor: "pointer", ...mono,
    border: `1px solid ${on ? color : C.border}`,
    backgroundColor: on ? `${color}18` : "transparent",
    color: on ? color : C.textFaint,
    textDecoration: on ? "none" : "line-through",
    transition: "all 0.15s",
  }}>{children}</button>
);

const Slider = ({ label, value, min, max, step, onChange, format, hint, color = C.purple }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
      <span style={{ fontSize: "11px", color: C.text, fontWeight: "600" }}>{label}</span>
      <span style={{ fontSize: "11px", color, fontWeight: "700", ...mono }}>{format(value)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
    {hint && <div style={{ fontSize: "9px", color: C.textFaint, marginTop: "2px" }}>{hint}</div>}
  </div>
);

const Toggle = ({ label, on, onClick, hint }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", padding: "4px 0" }}>
    <div style={{
      width: 32, height: 18, borderRadius: 9, flexShrink: 0, marginTop: "1px", position: "relative",
      backgroundColor: on ? C.purple : C.border, transition: "background-color 0.15s",
    }}>
      <div style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.15s" }} />
    </div>
    <div>
      <div style={{ fontSize: "11px", fontWeight: "600", color: C.text }}>{label}</div>
      {hint && <div style={{ fontSize: "9px", color: C.textFaint }}>{hint}</div>}
    </div>
  </div>
);

const Delta = ({ base, sim, fmt, better = "up", suffix = "" }) => {
  const d = sim - base;
  const eps = Math.abs(base) * 0.001;
  const dir = d > eps ? "up" : d < -eps ? "down" : "flat";
  const good = dir === "flat" ? C.textMuted : (dir === better ? C.green : C.red);
  const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
  if (dir === "flat") return <span style={{ fontSize: "10px", color: C.textFaint, ...mono }}>—</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "10px", fontWeight: "700", color: good, ...mono }}>
      <Icon size={10} />{d >= 0 ? "+" : ""}{fmt(d)}{suffix}
    </span>
  );
};

const KpiCompare = ({ label, base, sim, fmt, better }) => (
  <div style={{ ...cardStyle, padding: "10px 12px" }}>
    <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "17px", fontWeight: "800", ...mono }}>{fmt(sim)}</span>
      <Delta base={base} sim={sim} fmt={fmt} better={better} />
    </div>
    <div style={{ fontSize: "9px", color: C.textFaint, marginTop: "2px", ...mono }}>baseline {fmt(base)}</div>
  </div>
);

const TradeLab = ({ trader, history }) => {
  const [scenario, setScenario] = useState(() => clone(DEFAULT_SCENARIO));
  const [exportFormat, setExportFormat] = useState("csv");

  const baseTrades = useMemo(() => applyScenario(history, DEFAULT_SCENARIO), [history]);
  const simTrades = useMemo(() => applyScenario(history, scenario), [history, scenario]);
  const base = useMemo(() => computeMetrics(baseTrades), [baseTrades]);
  const sim = useMemo(() => computeMetrics(simTrades), [simTrades]);
  const curve = useMemo(() => mergedEquity(baseTrades, simTrades), [baseTrades, simTrades]);
  const insights = useMemo(() => describeScenario(base, sim, scenario), [base, sim, scenario]);
  const modified = isModified(scenario);

  const set = (patch) => setScenario((prev) => ({ ...clone(prev), ...patch }));
  const toggleSession = (s) => setScenario((p) => { const n = clone(p); n.sessions[s] = !n.sessions[s]; return n; });
  const toggleStyle = (s) => setScenario((p) => { const n = clone(p); n.styles[s] = !n.styles[s]; return n; });
  const reset = () => setScenario(clone(DEFAULT_SCENARIO));

  const pf = (v) => (v === Infinity ? "∞" : v.toFixed(2));
  const usd = (v) => `${v >= 0 ? "+" : "−"}$${Math.abs(v).toLocaleString()}`;
  const pct = (v) => `${v.toFixed(1)}%`;
  const r2 = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}R`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Intro */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "12px", borderLeft: `3px solid ${C.purple}` }}>
        <Beaker size={20} color={C.purple} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: "700" }}>Trade Lab — counterfactual attribution</div>
          <div style={{ fontSize: "11px", color: C.textMuted }}>Turn {trader.name}'s behaviors on and off. Every number is recomputed from their real {history.length} trades — no guesses, fully auditable.</div>
        </div>
        {modified && (
          <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", alignItems: "start" }}>
        {/* ── Control panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={cardStyle}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Sessions traded</div>
            <div style={{ display: "flex", gap: "5px" }}>
              {SESSIONS.map((s) => <Chip key={s} on={scenario.sessions[s]} color={C.blue} onClick={() => toggleSession(s)}>{s}</Chip>)}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Trade styles</div>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {STYLES.map((s) => <Chip key={s} on={scenario.styles[s]} color={C.cyan} onClick={() => toggleStyle(s)}>{s}</Chip>)}
            </div>
          </div>

          <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "14px" }}>
            <Slider label="Leverage cap" value={scenario.leverageCap ?? 11} min={1} max={11} step={1}
              onChange={(v) => set({ leverageCap: v >= 11 ? null : v })}
              format={(v) => (v >= 11 ? "off" : `${v}×`)} color={C.amber}
              hint="Re-scale every trade's P&L as if leverage were capped here." />
            <Slider label="Isolate best trades" value={scenario.isolateTopPct} min={5} max={100} step={5}
              onChange={(v) => set({ isolateTopPct: v })}
              format={(v) => (v >= 100 ? "off" : `top ${v}%`)} color={C.green}
              hint="Keep only the strongest trades by R-multiple — the ceiling of the edge." />
            <Slider label="Drop best trades" value={scenario.removeBestN} min={0} max={10} step={1}
              onChange={(v) => set({ removeBestN: v })}
              format={(v) => (v === 0 ? "off" : `−${v}`)} color={C.red}
              hint="Fragility test: how much P&L rides on a few outliers?" />
            <Slider label="Min planned R:R" value={scenario.minRR} min={0} max={4} step={0.5}
              onChange={(v) => set({ minRR: v })}
              format={(v) => (v === 0 ? "off" : `≥ ${v.toFixed(1)}`)} color={C.purple}
              hint="Only trades whose target paid at least this multiple of risk." />
            <Slider label="Skip low-quality entries" value={scenario.maxAdversePct ?? 0} min={0} max={3} step={0.25}
              onChange={(v) => set({ maxAdversePct: v === 0 ? null : v })}
              format={(v) => (v === 0 ? "off" : `MAE ≤ ${v}%`)} color={C.blue}
              hint="Drop trades that ran far against the entry before resolving." />
            <Toggle label="Exclude ML-unlabeled trades" on={scenario.excludeUnlabeled}
              onClick={() => set({ excludeUnlabeled: !scenario.excludeUnlabeled })}
              hint="Only trades with a valid setup tag — the auditable subset." />
          </div>
        </div>

        {/* ── Results ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* KPI comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            <KpiCompare label="Net P&L" base={base.totalPnl} sim={sim.totalPnl} fmt={usd} better="up" />
            <KpiCompare label="Win Rate" base={base.winRate} sim={sim.winRate} fmt={pct} better="up" />
            <KpiCompare label="Profit Factor" base={base.profitFactor} sim={sim.profitFactor} fmt={pf} better="up" />
            <KpiCompare label="Expectancy" base={base.expectancyR} sim={sim.expectancyR} fmt={r2} better="up" />
            <KpiCompare label="Max Drawdown" base={base.maxDrawdownPct} sim={sim.maxDrawdownPct} fmt={pct} better="up" />
            <KpiCompare label="Trades kept" base={base.count} sim={sim.count} fmt={(v) => String(Math.round(v))} better="up" />
          </div>

          {/* Equity overlay */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600" }}>Equity Curve — baseline vs scenario</div>
              <div style={{ display: "flex", gap: "12px", fontSize: "9px", color: C.textMuted }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 0, borderTop: `2px dashed ${C.textFaint}` }} /> Baseline</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 3, backgroundColor: sim.totalPnl >= base.totalPnl ? C.green : C.red, borderRadius: 1 }} /> Scenario</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={curve}>
                <defs>
                  <linearGradient id="labEq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sim.totalPnl >= base.totalPnl ? C.green : C.red} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={sim.totalPnl >= base.totalPnl ? C.green : C.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
                <XAxis dataKey="i" stroke={C.textMuted} fontSize={10} tickFormatter={(v) => `#${v}`} />
                <YAxis stroke={C.textMuted} fontSize={10} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }}
                  formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n === "baseline" ? "Baseline" : "Scenario"]} labelFormatter={(l) => `Trade #${l}`} />
                <Line type="monotone" dataKey="baseline" stroke={C.textFaint} strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                <Area type="monotone" dataKey="scenario" stroke={sim.totalPnl >= base.totalPnl ? C.green : C.red} strokeWidth={2.5} fill="url(#labEq)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Auto insight */}
          <div style={{ ...cardStyle, borderLeft: `3px solid ${C.amber}` }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: C.amber, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>What the numbers say</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {insights.map((line, i) => (
                <div key={i} style={{ fontSize: "12px", color: C.text, lineHeight: 1.5, display: "flex", gap: "8px" }}>
                  <span style={{ color: C.amber, flexShrink: 0 }}>›</span><span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700" }}>Export this trade set</div>
              <div style={{ fontSize: "10px", color: C.textMuted }}>{simTrades.length} trades · full ML schema (MAE/MFE, tags, sessions, fees)</div>
            </div>
            <div style={{ display: "flex", gap: "3px" }}>
              {["csv", "json"].map((f) => (
                <button key={f} onClick={() => setExportFormat(f)} style={{
                  padding: "6px 12px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", cursor: "pointer", ...mono, textTransform: "uppercase",
                  border: `1px solid ${exportFormat === f ? C.purple : C.border}`,
                  backgroundColor: exportFormat === f ? C.purpleBg : "transparent",
                  color: exportFormat === f ? C.purple : C.textMuted,
                }}>{f}</button>
              ))}
            </div>
            <button onClick={() => exportTrades(simTrades, { name: `${trader.name}${modified ? "-scenario" : ""}`, format: exportFormat })}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: C.purple, color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              <Download size={14} /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TradeLab };
