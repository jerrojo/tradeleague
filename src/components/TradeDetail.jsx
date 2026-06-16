import { useMemo, useState } from "react";
import { Clock, Cpu, Bot, Check } from "lucide-react";
import { CandleChart } from "./CandleChart";
import { coinCandles } from "../data/robotin";
import { C, cardStyle, mono } from "../theme";

/* ═══════════════════════ TRADE DETAIL ═══════════════════════
   Institutional, audit-grade view of a single Robotín-approved trade: the
   claimed signal vs. what actually happened, full execution accounting, the
   model's reasoning, and a resampleable execution chart with entry/SL/TP lines. */

const round2 = (x) => (x == null ? null : x < 1 ? Math.round(x * 1e5) / 1e5 : Math.round(x * 100) / 100);
const fmt = (p) => (p == null ? "—" : p < 1 ? p.toFixed(4) : p.toLocaleString(undefined, { maximumFractionDigits: 2 }));
const fmtUsd = (v) => (v == null ? "—" : `${v >= 0 ? "+" : "−"}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);

/* unix seconds → "Jun 16, 14:32" */
const fmtTime = (t) =>
  t == null ? "—" : new Date(t * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/* deterministic pseudo-random in [0,1) from a string seed (matches data/robotin srand) */
const seedFrom = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1e9; const x = Math.sin(h) * 10000; return x - Math.floor(x); };

/* faint uppercase letterspaced section label, like the rest of the app */
const sectionLabel = { fontSize: 9, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.7px" };

/* ── Audit status: what actually happened on this trade ── */
const auditStatus = (trade) => {
  if (trade.status === "closed") return trade.hit === "TP" ? { label: "Take Profit", color: C.green } : { label: "Stop Loss", color: C.red };
  if (trade.status === "active") return { label: "Active", color: C.blue };
  if (trade.status === "pending") return { label: "Pending", color: C.amber };
  if (trade.status === "expired") return { label: "No Entry", color: C.textFaint };
  return { label: "Rejected", color: C.textFaint };
};

/* ── small label/value column used in the header (right side) ── */
const HeaderStat = ({ label, value, color }) => (
  <div style={{ minWidth: 96 }}>
    <div style={{ ...sectionLabel, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 800, color: color || C.text, ...mono }}>{value}</div>
  </div>
);

/* ── a titled column inside the four-column detail grid ── */
const DetailColumn = ({ title, children }) => (
  <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 9 }}>
    <div style={{ ...sectionLabel, marginBottom: 2 }}>{title}</div>
    {children}
  </div>
);

/* ── a label → value row ── */
const Row = ({ label, value, color, bold }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, fontSize: 11 }}>
    <span style={{ color: C.textMuted }}>{label}</span>
    <span style={{ color: color || C.text, fontWeight: bold ? 800 : 600, ...mono, textAlign: "right" }}>{value}</span>
  </div>
);

const pill = (label, color) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color, backgroundColor: `${color}18`, border: `1px solid ${color}40`, padding: "2px 8px", borderRadius: 5 }}>{label}</span>
);

const TradeDetail = ({ trade, candles }) => {
  const [tf, setTf] = useState("H1");

  const series = useMemo(() => candles || coinCandles(trade.coin), [candles, trade.coin]);

  const isLong = trade.dir === "LONG";
  const dirColor = isLong ? C.green : C.red;

  /* ── derived audit / match logic ── */
  const audit = auditStatus(trade);
  // a published signal always claims TP; "Exact Match" only when the audit also resolved to TP
  const exactMatch = trade.signalOutcome === "TP" && trade.status === "closed" && trade.hit === "TP";
  const match = exactMatch
    ? { label: "Exact Match", color: C.green, prefix: "✓ " }
    : { label: "Mismatch", color: C.amber, prefix: "" };

  /* ── two-leg entry zone + execution prices ── */
  const entry2 = round2(trade.entry * 0.994);
  const tickDown = trade.entry < 1 ? 0.00002 : trade.entry * 0.0003;
  const entryVwap = round2(trade.entry - tickDown);
  const lastClose = series.length ? series[series.length - 1].close : trade.entry;
  const exitVwap = round2(trade.exit != null ? trade.exit : lastClose);

  /* ── execution timestamps ── */
  const entryExecTime = trade.activeIdx != null && series[trade.activeIdx] ? series[trade.activeIdx].time : trade.time + 120;
  const exitTime = trade.exitIdx != null && series[trade.exitIdx] ? series[trade.exitIdx].time : null;

  /* ── performance accounting ── */
  const fees = round2(0.1 + seedFrom(trade.id || trade.coin) * 0.3);
  const realized = trade.pnl != null ? round2(trade.pnl + fees) : null;

  /* ── audit issues ── */
  const issues = trade.status === "closed" && trade.hit === "SL"
    ? ["exitType=unknown (MARKET close); audit exitType inferred from ROI → sl"]
    : [];

  /* ── Robotín serial (deterministic) ── */
  const serial = useMemo(() => {
    const base = trade.id || trade.coin || "R1";
    let h = 0; for (let i = 0; i < base.length; i++) h = (h * 33 + base.charCodeAt(i)) >>> 0;
    return `R1-${h.toString(16).toUpperCase().padStart(8, "0").slice(0, 8)}`;
  }, [trade.id, trade.coin]);

  /* ── resample the 1h candles to the selected timeframe (always non-empty) ── */
  const tfData = useMemo(() => {
    const src = series && series.length ? series : [];
    if (!src.length) return [];
    if (tf === "H1") return src;

    // coarser frames: aggregate every N 1h candles
    if (tf === "H4" || tf === "D1") {
      const n = tf === "H4" ? 4 : 24;
      const out = [];
      for (let i = 0; i < src.length; i += n) {
        const grp = src.slice(i, i + n);
        if (!grp.length) continue;
        out.push({
          time: grp[0].time,
          open: grp[0].open,
          high: Math.max(...grp.map((c) => c.high)),
          low: Math.min(...grp.map((c) => c.low)),
          close: grp[grp.length - 1].close,
        });
      }
      return out.length ? out : src;
    }

    // finer frames (M5 / M15): synthesize a deterministic denser walk between 1h closes
    const sub = tf === "M15" ? 4 : 12; // 1h → 4×15m or 12×5m
    const step = 3600 / sub;
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      const next = src[i + 1] || c;
      const span = next.close - c.open;
      for (let j = 0; j < sub; j++) {
        const r = seedFrom(`${c.time}:${j}:${tf}`);
        const t0 = c.open + (span * j) / sub;
        const t1 = c.open + (span * (j + 1)) / sub;
        const o = round2(t0);
        const cl = round2(t1 + (r - 0.5) * (c.high - c.low) * 0.12);
        const hi = round2(Math.max(o, cl) + r * (c.high - c.low) * 0.18);
        const lo = round2(Math.min(o, cl) - (1 - r) * (c.high - c.low) * 0.18);
        out.push({ time: Math.round(c.time + j * step), open: o, high: hi, low: lo, close: cl });
      }
    }
    return out.length ? out : src;
  }, [series, tf]);

  /* ── price lines: Entry 1/2, SL, TP1 ── */
  const priceLines = useMemo(() => [
    { price: trade.entry, color: C.blue, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "Entry 1" },
    { price: entry2, color: C.blue, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "Entry 2" },
    { price: trade.sl, color: C.red, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "SL" },
    { price: trade.tp1, color: C.green, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "TP1" },
  ], [trade.entry, trade.sl, trade.tp1, entry2]);

  /* ── markers: signal + outcome arrow (sorted by time, snapped to tf grid) ── */
  const markers = useMemo(() => {
    const grid = tfData.length ? tfData : series;
    const snap = (t) => {
      if (!grid.length) return t;
      let best = grid[0].time;
      for (const c of grid) { if (c.time <= t) best = c.time; else break; }
      return best;
    };
    const m = [{ time: snap(trade.time), position: isLong ? "belowBar" : "aboveBar", color: C.purple, shape: isLong ? "arrowUp" : "arrowDown", text: "Signal" }];
    if (trade.status === "closed" && exitTime != null) {
      const won = trade.hit === "TP";
      m.push({ time: snap(exitTime), position: won ? "aboveBar" : "belowBar", color: won ? C.green : C.red, shape: won ? "arrowDown" : "arrowUp", text: won ? "TP" : "SL" });
    } else if (trade.activeIdx != null && series[trade.activeIdx]) {
      m.push({ time: snap(series[trade.activeIdx].time), position: "belowBar", color: C.blue, shape: "circle", text: "Entry" });
    }
    return m.sort((a, b) => a.time - b.time);
  }, [tfData, series, trade.time, trade.status, trade.hit, trade.activeIdx, exitTime, isLong]);

  const pnlColor = (trade.pnl ?? 0) >= 0 ? C.green : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ─────────── 1) HEADER ─────────── */}
      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px" }}>{trade.coin}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.textMuted }}>/USDT</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: dirColor, backgroundColor: `${dirColor}18`, border: `1px solid ${dirColor}40`, padding: "2px 9px", borderRadius: 999, letterSpacing: "0.5px" }}>{trade.dir}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.textMuted, marginTop: 6, ...mono, flexWrap: "wrap" }}>
            <span>{fmtTime(trade.time)}</span>
            <span style={{ color: C.textFaint }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {fmtTime(exitTime)}</span>
          </div>
          <div style={{ fontSize: 11, marginTop: 6, ...mono }}>
            <span style={{ color: C.textMuted }}>EP: </span><span style={{ color: C.text, fontWeight: 700 }}>{fmt(trade.entry)}</span>
            <span style={{ color: C.textFaint }}> · </span>
            <span style={{ color: C.textMuted }}>SL: </span><span style={{ color: C.red, fontWeight: 700 }}>{fmt(trade.sl)}</span>
            <span style={{ color: C.textFaint }}> · </span>
            <span style={{ color: C.textMuted }}>TP: </span><span style={{ color: C.green, fontWeight: 700 }}>{fmt(trade.tp1)}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          <HeaderStat label="Signal Status" value="Take Profit" color={C.green} />
          <HeaderStat label="Audit Status" value={audit.label} color={audit.color} />
          <HeaderStat label="Match" value={`${match.prefix}${match.label}`} color={match.color} />
          <HeaderStat label="Net PNL" value={fmtUsd(trade.pnl)} color={pnlColor} />
        </div>
      </div>

      {/* ─────────── 2) FOUR-COLUMN DETAIL GRID ─────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {/* TIMINGS */}
        <DetailColumn title="Timings">
          <Row label="Signal" value={fmtTime(trade.time)} />
          <Row label="Entry Execution" value={fmtTime(entryExecTime)} />
          <Row label="Exit" value={fmtTime(exitTime)} />
        </DetailColumn>

        {/* TARGETS */}
        <DetailColumn title="Targets">
          <Row label="Entry" value={`${fmt(trade.entry)} / ${fmt(entry2)}`} />
          <Row label="Stop Loss" value={fmt(trade.sl)} color={C.red} />
          <Row label="Take Profits" value={fmt(trade.tp1)} color={C.green} />
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "3px 0 1px" }} />
          <div style={{ ...sectionLabel, fontSize: 8 }}>Execution</div>
          <Row label="Entry VWAP" value={fmt(entryVwap)} />
          <Row label="Exit VWAP" value={fmt(exitVwap)} />
        </DetailColumn>

        {/* PERFORMANCE */}
        <DetailColumn title="Performance">
          <Row label="Realized PNL" value={fmtUsd(realized)} color={(realized ?? 0) >= 0 ? C.green : C.red} />
          <Row label="Total Fees" value={`−$${fees.toFixed(2)}`} color={C.textMuted} />
          <Row label="Net PNL" value={fmtUsd(trade.pnl)} color={pnlColor} bold />
          <Row label="ROI Notional" value={`${(trade.pnlPct ?? 0) >= 0 ? "+" : ""}${(trade.pnlPct ?? 0).toFixed(2)}%`} color={(trade.pnlPct ?? 0) >= 0 ? C.green : C.red} />
        </DetailColumn>

        {/* AUDIT */}
        <DetailColumn title="Audit">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 11 }}>
            <span style={{ color: C.textMuted }}>Match Quality</span>
            {exactMatch ? pill("FULL", C.green) : pill("PARTIAL", C.amber)}
          </div>
          <div style={{ ...sectionLabel, fontSize: 8, marginTop: 2 }}>Issues</div>
          {issues.length ? (
            <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {issues.map((iss, i) => (
                <li key={i} style={{ fontSize: 10, color: C.red, lineHeight: 1.45, ...mono }}>{iss}</li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 11, color: C.textMuted }}>None</div>
          )}
        </DetailColumn>
      </div>

      {/* ─────────── 3) ROBOTÍN BLOCK ─────────── */}
      <div style={{ borderTop: `1px solid ${C.border}` }} />
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={17} color={C.purple} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Robotín R1</div>
              <div style={{ fontSize: 9, color: C.textFaint, ...mono }}>SN: {serial}</div>
            </div>
          </div>
          {/* Confidence pill with a proportional fill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 999, border: `1px solid ${C.blue}40`, backgroundColor: C.blueBg }}>
            <Cpu size={12} color={C.blue} />
            <div style={{ width: 70, height: 4, borderRadius: 2, backgroundColor: `${C.blue}22`, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, Math.max(0, trade.confidence || 0))}%`, height: "100%", backgroundColor: C.blue }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.blue, ...mono }}>{trade.confidence}%</span>
          </div>
        </div>

        {/* Diagnostic tag */}
        <div>
          <div style={{ ...sectionLabel, marginBottom: 5 }}>Diagnostic Tag</div>
          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: C.purple, ...mono, border: `1px solid ${C.purple}40`, backgroundColor: C.purpleBg, padding: "4px 10px", borderRadius: 6, letterSpacing: "0.4px" }}>{trade.tag}</span>
        </div>

        {/* Reasoning */}
        <div>
          <div style={{ ...sectionLabel, marginBottom: 5 }}>Reasoning</div>
          <div style={{ border: `1px solid ${C.border}`, backgroundColor: C.cardElev, borderRadius: 8, padding: "11px 14px", borderLeft: `3px solid ${C.purple}` }}>
            <span style={{ fontSize: 12, color: C.text, fontStyle: "italic", lineHeight: 1.55 }}>“{trade.reasoning}”</span>
          </div>
        </div>
      </div>

      {/* ─────────── 4) EXECUTION CHART ─────────── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={sectionLabel}>Execution Chart</div>
          <div style={{ display: "flex", gap: 3 }}>
            {["M5", "M15", "H1", "H4", "D1"].map((t) => (
              <button key={t} onClick={() => setTf(t)} style={{
                padding: "4px 11px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${tf === t ? C.purple : C.border}`,
                backgroundColor: tf === t ? C.purpleBg : "transparent",
                color: tf === t ? C.purple : C.textMuted, ...mono,
              }}>{t}</button>
            ))}
          </div>
        </div>
        <CandleChart data={tfData} mode="candles" markers={markers} priceLines={priceLines} height={360} />
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 9, color: C.textMuted, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 0, borderTop: `1px dashed ${C.blue}` }} /> Entry zone</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 0, borderTop: `1px dashed ${C.green}` }} /> TP1</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 0, borderTop: `1px dashed ${C.red}` }} /> SL</span>
          {exactMatch && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.green }}><Check size={11} /> Exact match</span>}
        </div>
      </div>
    </div>
  );
};

export { TradeDetail };
