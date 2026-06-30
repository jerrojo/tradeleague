import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity, BarChart3, CheckCircle, ChevronDown, Clock, Cpu, DollarSign,
  Download, Gauge, Layers, Percent, RefreshCw, Scale, ShieldX, Sparkles, TrendingDown, TrendingUp, Wallet, Crosshair,
} from "lucide-react";
import { CandleChart } from "../CandleChart";
import { EmptyState, SectionHeader } from "../common";
import { coinCandles } from "../../data/robotin";
import { simulate, DEFAULT_CONFIG, legKeysFor } from "../../data/execEngine";
import { usd, pct, ratio, signColor } from "../../lib/format";
import { C, cardStyle, mono } from "../../theme";

const ASSETS = ["All", "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "AVAX", "LINK", "ADA", "ARB", "OP", "SUI", "TON", "NEAR", "INJ"];
const DIRECTIONS = ["All", "LONG", "SHORT"];
const OUTCOME_OPTS = ["Win", "Loss", "Breakeven", "No entry", "Invalid", "Open"];
const SORTS = ["Newest First", "Oldest First", "Best PnL", "Worst PnL"];
const px = (p) => (p == null ? "—" : p >= 1 ? p.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p >= 0.01 ? p.toFixed(4) : p.toFixed(6));
const fmtDT = (t) => (t == null ? "—" : new Date(t * 1000).toLocaleString(undefined, { month: "numeric", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }));
const fmtDur = (h) => (h == null ? "—" : h < 1 ? `${Math.round(h * 60)}m` : `${h.toFixed(1)}h`);

/* compact dark field */
const Field = ({ label, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
    {children}
  </label>
);
const CTRL_H = 38;
const inputStyle = { backgroundColor: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontWeight: 600, padding: "0 11px", height: CTRL_H, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
/* select with a single custom chevron (matches the Outcome multi-select) */
const Sel = ({ value, onChange, options }) => (
  <div style={{ position: "relative" }}>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", paddingRight: 30 }}>
      {options.map((o) => <option key={o} value={o} style={{ backgroundColor: C.card }}>{o}</option>)}
    </select>
    <ChevronDown size={14} color={C.textMuted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
  </div>
);
const Num = ({ value, onChange, step = 1, min, max, w }) => (
  <input className="tl-num" type="number" value={value} step={step} min={min} max={max} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} style={{ ...inputStyle, width: w, ...mono }} />
);
/* segmented toggle — one consistent style for every binary/mode switch */
const Seg = ({ value, onChange, options }) => (
  <div style={{ display: "inline-flex", borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden", height: CTRL_H }}>
    {options.map((o) => {
      const on = value === o.v;
      return (
        <button key={o.v} onClick={() => onChange(o.v)} aria-pressed={on} style={{ padding: "0 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: on ? C.blue : "transparent", color: on ? "#fff" : C.textMuted, fontFamily: "inherit" }}>{o.label}</button>
      );
    })}
  </div>
);
/* multi-select dropdown with checkboxes (Outcome filter) */
const MultiSel = ({ selected, options, onToggle, onAll }) => {
  const [open, setOpen] = useState(false);
  const allOn = options.every((o) => selected.includes(o));
  const label = allOn ? "All" : selected.length === 0 ? "None" : `${selected.length} selected`;
  const row = { display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: C.text };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span>{label}</span><ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0, color: C.textMuted }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 190, zIndex: 41, backgroundColor: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: C.shadowLg, padding: 6 }}>
            <label style={{ ...row, borderBottom: `1px solid ${C.border}`, marginBottom: 4, paddingBottom: 9 }}>
              <input type="checkbox" checked={allOn} onChange={onAll} /> <span style={{ fontWeight: 700 }}>Select all</span>
            </label>
            {options.map((o) => (
              <label key={o} style={row}>
                <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} /> <span>{o}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* KPI card */
const K = ({ label, icon: Icon, value, valueColor = C.text, sub, accent = C.textFaint }) => (
  <div className="tl-card" style={{ ...cardStyle, padding: "13px 15px", display: "flex", flexDirection: "column", gap: 5 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 11.5, color: C.textMuted, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>{Icon && <Icon size={12} color={accent} />}{label}</span>
    </div>
    <div style={{ fontSize: 20, fontWeight: 800, color: valueColor, ...mono, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.textFaint }}>{sub}</div>}
  </div>
);

/* tier divider label (matches the Overview's tiering) */
const TLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "4px 2px -4px" }}>{children}</div>
);

/* ── one expandable signal in the detail list ── */
const SignalCard = ({ r, open, onToggle }) => {
  const dirColor = r.dir === "LONG" ? C.green : C.red;
  const OC = { WIN: { c: C.green, t: "WIN" }, LOSS: { c: C.red, t: "LOSS" }, OPEN: { c: C.blue, t: "OPEN" }, BE: { c: C.textMuted, t: "BE" }, "NO ENTRY": { c: C.textMuted, t: "NO ENTRY" } };
  const oc = OC[r.outcome] || OC["NO ENTRY"];
  const reached = r.reachedL.filter(Boolean).length;

  const chart = useMemo(() => {
    if (!open) return null;
    const candles = coinCandles(r.coin);
    const a = Math.max(0, r.fromIdx - 28), b = Math.min(candles.length, (r.exitIdx ?? r.fromIdx) + 12);
    const data = candles.slice(a, b);
    const priceLines = [
      { price: r.entry, color: C.blue, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "Entry" },
      { price: r.sl, color: C.red, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "SL" },
      { price: r.levels[0], color: C.textMuted, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "L1" },
      { price: r.levels[1], color: C.textMuted, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "L2" },
      { price: r.levels[2], color: C.textMuted, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "L3" },
      { price: r.levels[3], color: C.green, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: "TP (L4)" },
    ];
    const markers = [];
    if (candles[r.entryIdx]) markers.push({ time: candles[r.entryIdx].time, position: "aboveBar", color: C.amber, shape: "circle", text: "Signal" });
    if (candles[r.fromIdx]) markers.push({ time: candles[r.fromIdx].time, position: "belowBar", color: C.blue, shape: "arrowUp", text: "Entry" });
    if (r.exitIdx != null && candles[r.exitIdx]) markers.push({ time: candles[r.exitIdx].time, position: r.dir === "LONG" ? "belowBar" : "aboveBar", color: oc.c, shape: "arrowDown", text: oc.t });
    return { data, priceLines, markers };
  }, [open, r.id]);

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
      {/* header */}
      <div onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}>
        <ChevronDown size={16} color={C.textMuted} style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform .15s", flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800, ...mono }}>{r.coin} <span style={{ color: C.textMuted, fontSize: 11 }}>/USDT</span></span>
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.4px", color: dirColor, backgroundColor: `${dirColor}1c`, border: `1px solid ${dirColor}30`, padding: "1px 7px", borderRadius: 4 }}>{r.dir}</span>
          </div>
          <span style={{ fontSize: 10.5, color: C.textFaint, display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {fmtDT(r.time)}</span>
        </div>
        <div style={{ textAlign: "right", marginRight: 10 }}>
          <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px" }}>Net PnL</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: oc.c, ...mono }}>{r.noEntry ? "—" : usd(r.netPnl, { signed: true })}</div>
          {!r.noEntry && <div style={{ fontSize: 10, color: oc.c, ...mono }}>{pct(r.grossPct, { signed: true })}</div>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: oc.c, backgroundColor: `${oc.c}1c`, border: `1px solid ${oc.c}30`, padding: "3px 9px", borderRadius: 5 }}>{oc.t}</span>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Señal Original */}
          <div style={{ ...cardStyle, backgroundColor: C.cardElev }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Original signal</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
              {[["Direction", r.dir, dirColor], ["Entry", px(r.entry), C.text], ["Stop Loss", px(r.sl), C.red], ["Take Profit", px(r.tpFinal), C.green]].map(([l, v, c]) => (
                <div key={l}><div style={{ fontSize: 9.5, color: C.textMuted, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 14, fontWeight: 700, color: c, ...mono }}>{v}</div></div>
              ))}
            </div>
          </div>

          {/* AI analysis */}
          <div style={{ ...cardStyle, borderColor: `${C.purple}40`, backgroundColor: `${C.purple}0d` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <Sparkles size={14} color={C.purple} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.4px" }}>AI SIGNAL ANALYSIS</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: C.purple, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}30`, padding: "2px 8px", borderRadius: 5, ...mono }}>{r.tag}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {[["Setup", r.setup], ["TF", r.tf], ["Style", "SCALP"], ["Confidence", `${r.confidence}%`]].map(([l, v]) => (
                <span key={l} style={{ fontSize: 10, color: C.textMuted, backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "3px 9px", borderRadius: 5 }}>{l}: <span style={{ color: C.text, fontWeight: 700 }}>{v}</span></span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, fontStyle: "italic", borderLeft: `2px solid ${C.purple}55`, paddingLeft: 12 }}>{r.reasoning}</div>
          </div>

          {/* Setup + legs */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 0.9fr) minmax(0, 2.2fr)", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Setup</div>
              {[["Best entry", px(r.entry)], ["Entry time", fmtDT(r.time)], ["Initial SL", px(r.sl)], ["Final TP (RUN)", px(r.tpFinal)], ["TPs reached", `${reached} / ${r.reachedL.length}`], ["Duration", fmtDur(r.durationH)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.textMuted }}>{l}</span><span style={{ color: C.text, fontWeight: 600, ...mono }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Partials + Runner</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {[["Leg", "left"], ["Target", "right"], ["Exit", "right"], ["Reason", "right"], ["PnL %", "right"], ["PnL $", "right"]].map(([h, al]) => <th key={h} style={{ textAlign: al, padding: "6px 8px", fontSize: 9, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {r.legs.map((l) => {
                      const mc = l.hit === "TP" ? C.green : l.hit === "SL" ? C.red : C.textMuted;
                      return (
                        <tr key={l.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "7px 8px", fontWeight: 700, color: C.text }}>{l.name} <span style={{ color: C.textFaint, fontWeight: 400 }}>({Math.round(l.pct * 100)}%)</span></td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: C.textMuted, ...mono }}>{px(l.target)}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: C.text, ...mono }}>{px(l.exit)}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right" }}><span style={{ fontSize: 10, fontWeight: 700, color: mc }}>{l.hit}</span></td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: signColor(l.pnlPct, C), ...mono }}>{r.noEntry ? "—" : pct(l.pnlPct, { signed: true })}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: signColor(l.pnl, C), ...mono }}>{r.noEntry ? "—" : usd(l.pnl, { signed: true })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: C.textMuted }}>
                <span>Gross {pct(r.grossPct)} · fees included · pos. {usd(r.notional, { signed: false })}</span>
                <span style={{ fontWeight: 800, color: oc.c, ...mono }}>Net {usd(r.netPnl, { signed: true })} ({pct(r.grossPct, { signed: true })})</span>
              </div>
            </div>
          </div>

          {/* execution chart */}
          {chart && chart.data.length > 1 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Chart — execution engine</div>
              <CandleChart data={chart.data} mode="candles" markers={chart.markers} priceLines={chart.priceLines} height={320} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExecutionEngine = () => {
  const [cfg, setCfg] = useState({ ...DEFAULT_CONFIG, startDate: "2026-06-01", endDate: "2026-06-30" });
  const [openId, setOpenId] = useState(null);
  const [tick, setTick] = useState(0);
  const set = (patch) => setCfg((c) => ({ ...c, ...patch }));
  const setLeg = (k, v) => setCfg((c) => ({ ...c, legsPct: { ...c.legsPct, [k]: v === "" ? 0 : Number(v) } }));
  // changing # TPs rebuilds the leg set with an even split that sums to 100%
  const setTps = (v) => {
    const n = Math.max(2, Math.min(6, Math.round(Number(v) || 4)));
    const keys = legKeysFor(n);
    const base = Math.floor(100 / keys.length);
    const pct = {}; keys.forEach((kk, i) => { pct[kk] = base; }); pct[keys[keys.length - 1]] += 100 - base * keys.length;
    setCfg((c) => ({ ...c, tps: n, legsPct: pct }));
  };
  const toggleOutcome = (label) => setCfg((c) => {
    const cur = Array.isArray(c.outcome) ? c.outcome : OUTCOME_OPTS.slice();
    return { ...c, outcome: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label] };
  });

  const sim = useMemo(() => simulate(cfg), [cfg, tick]);
  const k = sim.kpi;
  const legKeys = legKeysFor(cfg.tps || 4);
  const legSum = legKeys.reduce((a, kk) => a + (cfg.legsPct[kk] ?? 0), 0);

  const exportCsv = () => {
    const head = ["coin", "dir", "time", "outcome", "netPnl", "grossPct", "entry", "sl", "tpFinal", "duration_h"];
    const lines = [head.join(",")].concat(sim.rows.map((r) => [r.coin, r.dir, new Date(r.time * 1000).toISOString(), r.outcome, r.netPnl, r.grossPct, r.entry, r.sl, r.tpFinal, r.durationH ?? ""].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "tradethlon-execution-engine.csv"; a.click();
  };

  const btn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.border}`, backgroundColor: C.cardElev, color: C.textMuted, fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* header */}
      <SectionHeader
        icon={Cpu}
        title="Execution engine"
        subtitle="Re-simulates execution with partials, sizing and costs over historical signals · simulated"
        right={(
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportCsv} style={{ ...btn, color: C.green, borderColor: `${C.green}40`, backgroundColor: C.greenBg }}><Download size={13} /> CSV</button>
            <button onClick={() => setTick((t) => t + 1)} style={btn}><RefreshCw size={13} /> Refresh</button>
          </div>
        )}
      />

      {/* filters */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}><Layers size={13} color={C.purple} /> Filters</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
          <Field label="Start date"><input type="date" value={cfg.startDate} onChange={(e) => set({ startDate: e.target.value })} style={{ ...inputStyle, colorScheme: "dark", ...mono }} /></Field>
          <Field label="End date"><input type="date" value={cfg.endDate} onChange={(e) => set({ endDate: e.target.value })} style={{ ...inputStyle, colorScheme: "dark", ...mono }} /></Field>
          <Field label="Asset"><Sel value={cfg.asset} onChange={(v) => set({ asset: v })} options={ASSETS} /></Field>
          <Field label="Direction"><Sel value={cfg.direction} onChange={(v) => set({ direction: v })} options={DIRECTIONS} /></Field>
          <Field label="Outcome"><MultiSel selected={Array.isArray(cfg.outcome) ? cfg.outcome : OUTCOME_OPTS} options={OUTCOME_OPTS} onToggle={toggleOutcome} onAll={() => set({ outcome: (Array.isArray(cfg.outcome) && cfg.outcome.length === OUTCOME_OPTS.length) ? [] : OUTCOME_OPTS.slice() })} /></Field>
          <Field label="Sort by"><Sel value={cfg.sort} onChange={(v) => set({ sort: v })} options={SORTS} /></Field>
        </div>
      </div>

      {/* config */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}><Cpu size={13} color={C.purple} /> Execution configuration</span>
          <span style={{ fontSize: 10, color: C.textFaint }}>Re-simulates instantly · no refetch</span>
        </div>

        {/* parciales */}
        <div style={{ ...cardStyle, backgroundColor: C.cardElev, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.5px" }}><Layers size={12} /> Partials</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: legSum === 100 ? C.green : C.amber, backgroundColor: `${legSum === 100 ? C.green : C.amber}1c`, border: `1px solid ${(legSum === 100 ? C.green : C.amber)}40`, padding: "2px 9px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 4 }}>{legSum === 100 ? <CheckCircle size={11} /> : null} Σ {legSum}%</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <Field label="# partial TPs"><Num value={cfg.tps || 4} onChange={setTps} min={2} max={6} step={1} w={70} /></Field>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>% per TP</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {legKeys.map((leg) => (
                  <label key={leg} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: leg === "RUN" ? C.green : C.textMuted, textAlign: "center" }}>{leg}</span>
                    <Num value={cfg.legsPct[leg] ?? 0} onChange={(v) => setLeg(leg, v)} min={0} max={100} step={5} w={64} />
                  </label>
                ))}
              </div>
            </div>
            <Field label="Trailing">
              <Seg value={cfg.trailing ? "on" : "off"} onChange={(v) => set({ trailing: v === "on" })} options={[{ v: "on", label: "On" }, { v: "off", label: "Off" }]} />
            </Field>
          </div>
        </div>

        {/* sizing + account */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ ...cardStyle, backgroundColor: C.cardElev }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}><DollarSign size={12} /> Sizing & costs</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <Field label="Sizing">
                <Seg value={cfg.sizing} onChange={(v) => set({ sizing: v })} options={[{ v: "margin", label: "Margin" }, { v: "risk", label: "Risk" }]} />
              </Field>
              {cfg.sizing === "risk"
                ? <Field label="Risk / trade (%)"><Num value={cfg.riskPct} onChange={(v) => set({ riskPct: v })} step={0.05} min={0} /></Field>
                : <Field label="Margin ($)"><Num value={cfg.margin} onChange={(v) => set({ margin: v })} step={100} min={0} /></Field>}
              <Field label="Leverage (x)"><Num value={cfg.leverage} onChange={(v) => set({ leverage: v })} step={1} min={1} /></Field>
              <Field label="Fee per side (%)"><Num value={cfg.fee} onChange={(v) => set({ fee: v })} step={0.01} min={0} /></Field>
            </div>
          </div>
          <div style={{ ...cardStyle, backgroundColor: C.cardElev }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}><Wallet size={12} /> Account & capital</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <Field label="Starting capital ($)"><Num value={cfg.capital} onChange={(v) => set({ capital: v })} step={1000} min={0} /></Field>
              <Field label="Capital mode">
                <Seg value={cfg.capitalMode} onChange={(v) => set({ capitalMode: v })} options={[{ v: "fixed", label: "Fixed" }, { v: "compound", label: "Compound" }]} />
              </Field>
              <Field label="Max concurrent"><Num value={cfg.maxConcurrent} onChange={(v) => set({ maxConcurrent: v })} step={1} min={1} /></Field>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid — tiered like the Overview */}
      <TLabel>Headline</TLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <K label="Net PnL" icon={DollarSign} accent={C.green} value={usd(k.netPnl, { signed: true })} valueColor={signColor(k.netPnl, C)} sub={`${pct(k.totalReturnPct, { signed: true })} · ${usd(k.perTrade, { signed: true })}/trade`} />
        <K label="Win Rate" icon={Percent} accent={C.blue} value={`${k.winRate.toFixed(1)}%`} valueColor={k.winRate >= 50 ? C.green : C.red} sub={`${k.wins}W / ${k.losses}L / ${k.be}BE`} />
        <K label="Profit Factor" icon={Scale} accent={C.purple} value={ratio(k.profitFactor)} valueColor={k.profitFactor >= 1 ? C.green : C.red} sub={`avg W ${pct(k.avgWinPct, { signed: true })} · L ${pct(k.avgLossPct, { signed: true })}`} />
        <K label="Signals" icon={Activity} value={k.signals} sub={`${k.entries} entries · ${k.noEntry} no entry`} />
      </div>
      <TLabel>Targets reached</TLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
        {(k.reach || []).map((v, i) => (
          <K key={i} label={`Reached L${i + 1}`} icon={Crosshair} value={`${v.toFixed(0)}%`} sub={`${Math.round(k.entries * v / 100)}`} />
        ))}
        <K label="Runner trailing" icon={Layers} value={`${k.runnerRate.toFixed(0)}%`} sub={`${Math.round(k.entries * k.runnerRate / 100)}`} />
        <K label="Expectancy" icon={TrendingUp} accent={C.green} value={pct(k.expectancyPct, { signed: true })} valueColor={signColor(k.expectancyPct, C)} sub={`${usd(k.perTrade, { signed: true })}/trade`} />
        <K label="Sharpe (trade)" icon={Gauge} value={k.sharpe.toFixed(2)} sub="mean/σ net" />
      </div>
      <TLabel>Risk &amp; return</TLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
        <K label="Total Return" icon={BarChart3} accent={C.green} value={pct(k.totalReturnPct, { signed: true })} valueColor={signColor(k.totalReturnPct, C)} sub={`${usd(k.finalBal, { signed: false })} final`} />
        <K label="Max Drawdown" icon={TrendingDown} accent={C.red} value={`${k.maxDDpct.toFixed(1)}%`} valueColor={C.red} sub={usd(k.maxDD, { signed: true })} />
        <K label="CAGR" icon={TrendingUp} accent={C.green} value={pct(k.cagr, { signed: true })} valueColor={signColor(k.cagr, C)} sub="annualized" />
        <K label="Loss streak" icon={TrendingDown} value={k.maxLossRun} sub="max consecutive" />
        <K label="Avg R" icon={Scale} value={k.avgR ? `${k.avgR >= 0 ? "+" : ""}${k.avgR.toFixed(2)}` : "—"} valueColor={signColor(k.avgR, C)} sub="return/risk" />
        <K label="Peak concurrency" icon={Layers} value={k.peakConc} sub={`avg ${Number(k.avgConc).toFixed(1)}`} />
      </div>
      <TLabel>Execution</TLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12 }}>
        <K label="Exposure" icon={Activity} value={`${k.exposure.toFixed(0)}%`} sub="time in market" />
        <K label="Rejected" icon={ShieldX} value={k.rejected} sub="filtered by Robotín" />
        <K label="Avg duration" icon={Clock} value={fmtDur(k.avgDur)} sub="per trade" />
        <K label="Open" icon={Activity} value={k.open} sub="still running" />
      </div>

      {/* capital curve */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, marginBottom: 10 }}><BarChart3 size={14} color={C.green} /> Capital curve — {cfg.capitalMode === "fixed" ? "Fixed" : "Compound"}</div>
        {sim.curve.length > 1 ? (
          <ResponsiveCurve curve={sim.curve} />
        ) : <EmptyState icon={BarChart3} title="No signals in range" hint="Widen the date range or relax the filters." compact />}
      </div>

      {/* detail list */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Per-signal detail</span>
            <span style={{ fontSize: 11, color: C.textMuted, backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: 999 }}>{sim.rows.length} signals</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setOpenId("ALL")} style={btn}>Expand all</button>
            <button onClick={() => setOpenId(null)} style={btn}>Collapse all</button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sim.rows.length === 0 && <EmptyState icon={Activity} title="No signals match" hint="Adjust the filters above to see executions here." />}
          {sim.rows.map((r) => (
            <SignalCard key={r.id} r={r} open={openId === "ALL" || openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* capital curve */
const ResponsiveCurve = ({ curve }) => {
  const vals = curve.map((p) => p.balance);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(1, (hi - lo) * 0.15);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={curve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs><linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.32} /><stop offset="100%" stopColor={C.green} stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} vertical={false} />
        <XAxis dataKey="i" stroke={C.textMuted} fontSize={9} tickFormatter={(v) => `#${v}`} />
        <YAxis stroke={C.textMuted} fontSize={10} domain={[lo - pad, hi + pad]} width={64} tickFormatter={(v) => `$${Math.round(v).toLocaleString()}`} />
        <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} labelFormatter={(v) => `Trade #${v}`} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Balance"]} />
        <Area type="monotone" dataKey="balance" stroke={C.green} strokeWidth={2} fill="url(#capGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export { ExecutionEngine };
