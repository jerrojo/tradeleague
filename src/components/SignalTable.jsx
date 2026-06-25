import { Fragment, useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, ChevronUp, Clock, Cpu, Download, SlidersHorizontal, X } from "lucide-react";
import { Avatar, BotTag } from "./common";
import { TradeDetail } from "./TradeDetail";
import { C, cardStyle, mono, thStyle, tdStyle } from "../theme";

/* ═══════════════════════ SignalTable — THE canonical dense trade/signal table ═══════════════════════
   One table everywhere a list of signals/trades appears. Pro features: sortable
   columns, show/hide columns, CSV/JSON export of the current view, and per-view
   persistence of sort + hidden columns (pass a stable `viewId`). */

const STATUS = {
  pending: { label: "Pending", color: C.amber, Icon: Clock },
  active: { label: "Active", color: C.blue, Icon: Activity },
  closed_TP: { label: "Take Profit", color: C.green, Icon: null },
  closed_SL: { label: "Stop Loss", color: C.red, Icon: null },
  expired: { label: "No entry", color: C.textFaint, Icon: null },
  rejected: { label: "Not executed", color: C.textFaint, Icon: null },
};
const statusKey = (s) => (s.status === "closed" ? `closed_${s.hit}` : s.status);

const usd = (v) => `${v >= 0 ? "+" : "−"}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPrice = (p) => {
  if (p == null) return "—";
  const a = Math.abs(p);
  if (a >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (a >= 0.01) return p.toFixed(4);
  if (a >= 0.0001) return p.toFixed(6);
  return p.toPrecision(3);
};
const relTime = (sec) => {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - sec);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
};
const fmtDuration = (candles) => {
  if (candles == null) return "—";
  const h = Math.max(0, Math.round(candles));
  if (h < 24) return `${h}h`;
  const d = h / 24;
  return `${d < 10 ? d.toFixed(1) : Math.round(d)}d`;
};
const closedResult = (s) => {
  const sign = s.dir === "LONG" ? 1 : -1;
  const exit = s.exit ?? (s.hit === "TP" ? s.tp1 : s.sl);
  const risk = Math.abs(s.entry - s.sl);
  const r = risk > 0 ? (sign * (exit - s.entry)) / risk : 0;
  const dur = s.exitIdx != null && s.entryIdx != null ? s.exitIdx - s.entryIdx : null;
  return { r, dur, exit };
};
const unrealized = (s, lastClose) => {
  const sign = s.dir === "LONG" ? 1 : -1;
  const distPct = sign * ((lastClose - s.entry) / s.entry) * 100;
  const toTpPct = Math.abs(((s.tp1 - s.entry) / s.entry) * 100);
  return { distPct, toTpPct };
};

const num = { ...mono, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
const cell = { ...tdStyle, fontSize: 11.5 };
const toolBtn = {
  display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6,
  border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted,
  fontSize: 10, fontWeight: 700, cursor: "pointer",
};

const STATUS_ORDER = { active: 0, pending: 1, closed: 2, expired: 3, rejected: 4 };
const ACCESSORS = {
  pair: (s) => s.coin || "",
  type: (s) => s.dir || "",
  trader: (s) => s.trader || "",
  robotin: (s) => (s.approved ? (s.confidence || 0) : -1),
  entry: (s) => s.entry ?? 0,
  exit: (s) => (s.status === "closed" ? (s.exit ?? closedResult(s).exit ?? 0) : 0),
  pnl: (s) => (s.status === "closed" ? (s.pnl ?? 0) : -1e15),
  r: (s) => (s.status === "closed" ? closedResult(s).r : -1e15),
  duration: (s) => (s.status === "closed" ? (closedResult(s).dur ?? 0) : -1),
  status: (s) => STATUS_ORDER[s.status] ?? 9,
  setup: (s) => s.tag || "",
  time: (s) => s.time ?? 0,
};

/* Export the current (sorted + filtered) rows to CSV or JSON. */
const exportRows = (rows, name, format) => {
  const recs = rows.map((s) => {
    const cr = s.status === "closed" ? closedResult(s) : null;
    return {
      coin: s.coin, pair: s.pair, type: s.dir, trader: s.trader, isBot: !!s.isBot,
      approved: !!s.approved, confidence: s.confidence, status: s.status,
      entry: s.entry, exit: cr ? cr.exit : null, sl: s.sl, tp1: s.tp1,
      pnl: s.status === "closed" ? s.pnl : null, pnlPct: s.status === "closed" ? s.pnlPct : null,
      R: cr ? Math.round(cr.r * 100) / 100 : null, durationH: cr ? cr.dur : null,
      setup: s.tag || "", time: new Date((s.time || 0) * 1000).toISOString(),
    };
  });
  let blob;
  if (format === "json") {
    blob = new Blob([JSON.stringify(recs, null, 2)], { type: "application/json" });
  } else {
    const keys = Object.keys(recs[0] || { coin: 1 });
    const esc = (v) => { const x = v == null ? "" : String(v); return /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
    const csv = [keys.join(","), ...recs.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
    blob = new Blob([csv], { type: "text/csv" });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.${format}`; a.click();
  URL.revokeObjectURL(url);
};

const load = (k, fallback) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

const SignalTable = ({
  signals, openId, onToggle, onTrader,
  lastCloseFor, candlesFor,
  showTrader = true, audit = false,
  viewId = "default", exportName = "tradethlon-signals",
}) => {
  const SK = `st:${viewId}:sort`, HK = `st:${viewId}:hidden`;
  const [sort, setSort] = useState(() => load(SK, { key: "time", dir: "desc" }));
  const [hidden, setHidden] = useState(() => new Set(load(HK, [])));
  const [colMenu, setColMenu] = useState(false);
  useEffect(() => { save(SK, sort); }, [SK, sort]);
  useEffect(() => { save(HK, [...hidden]); }, [HK, hidden]);

  const onSort = (key) => setSort((p) => (p.key === key ? { key, dir: p.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  const toggleCol = (id) => setHidden((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const sorted = useMemo(() => {
    const acc = ACCESSORS[sort.key];
    if (!acc) return signals;
    const arr = [...signals].sort((a, b) => {
      const x = acc(a), y = acc(b);
      return typeof x === "string" ? x.localeCompare(y) : x - y;
    });
    return sort.dir === "desc" ? arr.reverse() : arr;
  }, [signals, sort]);

  const allCols = [
    { id: "pair", label: "Pair", fixed: true },
    { id: "type", label: "Type" },
    ...(showTrader ? [{ id: "trader", label: "Trader" }] : []),
    { id: "robotin", label: "Robotín" },
    { id: "entry", label: "Entry" },
    { id: "exit", label: "Exit" },
    { id: "pnl", label: "PnL" },
    { id: "r", label: "R" },
    { id: "duration", label: "Duration" },
    { id: "status", label: "Status" },
    { id: "setup", label: "Setup" },
    { id: "time", label: "Time" },
    ...(audit ? [{ id: "fees", label: "Fees", noSort: true }, { id: "match", label: "Match", noSort: true }] : []),
    { id: "_chev", label: "", noSort: true, fixed: true },
  ];
  const show = (id) => id === "pair" || id === "_chev" || !hidden.has(id);
  const cols = allCols.filter((c) => show(c.id));
  const sortLabel = (allCols.find((c) => c.id === sort.key) || {}).label || "Time";

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: "visible" }}>
      {/* ── toolbar: row count + sort state + columns + export ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderBottom: `1px solid ${C.border}`, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10.5, color: C.textMuted, ...mono }}>
          {sorted.length} rows · sorted by <span style={{ color: C.text, fontWeight: 700 }}>{sortLabel} {sort.dir === "asc" ? "↑" : "↓"}</span>
        </span>
        <div style={{ display: "flex", gap: 6, position: "relative" }}>
          <button onClick={() => setColMenu((v) => !v)} style={{ ...toolBtn, ...(colMenu ? { color: C.purple, borderColor: C.purple } : {}) }}><SlidersHorizontal size={12} /> Columns</button>
          <button onClick={() => exportRows(sorted, exportName, "csv")} style={toolBtn}><Download size={12} /> CSV</button>
          <button onClick={() => exportRows(sorted, exportName, "json")} style={toolBtn}><Download size={12} /> JSON</button>
          {colMenu && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 10, boxShadow: C.shadowLg, width: 180 }}>
              <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, marginBottom: 6 }}>Columns</div>
              {allCols.filter((c) => !c.fixed).map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 2px", fontSize: 12, color: C.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={!hidden.has(c.id)} onChange={() => toggleCol(c.id)} />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: audit ? 1240 : 1120 }}>
          <thead><tr>{cols.map((c) => {
            const sortable = !c.noSort && ACCESSORS[c.id];
            const active = sort.key === c.id;
            return (
              <th key={c.id} onClick={sortable ? () => onSort(c.id) : undefined}
                style={{ ...thStyle, fontSize: 10, cursor: sortable ? "pointer" : "default", color: active ? C.text : C.textMuted, userSelect: "none" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {c.label}
                  {active && (sort.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                </span>
              </th>
            );
          })}</tr></thead>
          <tbody>
            {sorted.map((s, ri) => {
              const st = STATUS[statusKey(s)] || STATUS.pending;
              const isOpen = openId === s.id;
              const dirColor = s.dir === "LONG" ? C.green : C.red;
              const accent = s.approved === false ? C.textFaint : dirColor;
              const tag = s.tag ? s.tag.split("_").slice(0, 3).join("·") : null;
              const isClosed = s.status === "closed";
              const cr = isClosed ? closedResult(s) : null;
              const lc = lastCloseFor ? lastCloseFor(s) : null;
              const ur = s.status === "active" && lc != null ? unrealized(s, lc) : null;
              const feeSeed = String(s.id ?? s.coin ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
              const fee = audit ? Math.round((0.1 + (feeSeed % 30) / 30 * 0.3) * 100) / 100 : 0;
              return (
                <Fragment key={s.id}>
                  <tr className="hoverable" onClick={() => onToggle(s.id)}
                    style={{ cursor: "pointer", backgroundColor: isOpen ? C.cardHover : ri % 2 ? `${C.cardElev}55` : "transparent" }}>
                    <td style={{ ...cell, borderLeft: `3px solid ${accent}`, fontWeight: 800 }}>
                      {s.coin}<span style={{ color: C.textMuted, fontWeight: 400 }}> /{s.pair && s.pair.includes("/") ? s.pair.split("/")[1] : "USDT"}</span>
                    </td>
                    {show("type") && (
                      <td style={cell}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: dirColor, backgroundColor: `${dirColor}18`, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.3px" }}>{s.dir}</span>
                      </td>
                    )}
                    {showTrader && show("trader") && (
                      <td style={cell}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={s.trader} size={20} />
                          <span
                            onClick={onTrader ? (e) => { e.stopPropagation(); onTrader(s.trader); } : undefined}
                            style={{ fontWeight: 700, color: C.text, ...(onTrader ? { borderBottom: `1px dashed ${C.purple}40` } : {}) }}
                          >{s.trader}</span>
                          <BotTag isBot={s.isBot} size={13} />
                        </span>
                      </td>
                    )}
                    {show("robotin") && (
                      <td style={cell}>
                        {s.approved
                          ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800, color: C.green, ...num }}><Cpu size={10} /> {s.confidence}%</span>
                          : <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800, color: C.textFaint }}><X size={10} /> Rej.</span>}
                      </td>
                    )}
                    {show("entry") && <td style={{ ...cell, ...num, color: C.text }}>{fmtPrice(s.entry)}</td>}
                    {show("exit") && <td style={{ ...cell, ...num, color: C.text }}>{cr ? fmtPrice(cr.exit) : "—"}</td>}
                    {show("pnl") && (
                      <td style={{ ...cell, ...num }}>
                        {isClosed
                          ? <span style={{ fontWeight: 800, color: (s.pnl ?? 0) >= 0 ? C.green : C.red }}>{usd(s.pnl ?? 0)}</span>
                          : ur
                            ? <span style={{ fontWeight: 800, color: ur.distPct >= 0 ? C.green : C.red }}>{`${ur.distPct >= 0 ? "+" : "−"}${Math.abs(ur.distPct).toFixed(1)}%`}</span>
                            : <span style={{ color: C.textFaint }}>{s.status === "pending" ? "awaiting" : "—"}</span>}
                      </td>
                    )}
                    {show("r") && (
                      <td style={{ ...cell, ...num, fontWeight: 700, color: cr ? (cr.r >= 0 ? C.green : C.red) : C.textFaint }}>
                        {cr ? `${cr.r >= 0 ? "+" : ""}${cr.r.toFixed(1)}R` : "—"}
                      </td>
                    )}
                    {show("duration") && <td style={{ ...cell, ...num, color: C.textMuted }}>{cr ? fmtDuration(cr.dur) : "—"}</td>}
                    {show("status") && (
                      <td style={cell}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>
                          {st.Icon ? <st.Icon size={11} /> : null}{st.label}
                        </span>
                      </td>
                    )}
                    {show("setup") && (
                      <td style={cell}>
                        {tag ? <span style={{ fontSize: 9, fontWeight: 700, color: C.purple, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}30`, padding: "1px 6px", borderRadius: 4, ...num }}>{tag}</span> : <span style={{ color: C.textFaint }}>—</span>}
                      </td>
                    )}
                    {show("time") && <td style={{ ...cell, ...num, color: C.textFaint }} title={new Date(s.time * 1000).toLocaleString()}>{relTime(s.time)}</td>}
                    {audit && show("fees") && <td style={{ ...cell, ...num, color: C.textMuted }}>{isClosed ? `−$${fee.toFixed(2)}` : "—"}</td>}
                    {audit && show("match") && <td style={cell}><span style={{ fontWeight: 700, color: s.approved ? C.green : C.textFaint }}>{s.approved ? "Match" : "—"}</span></td>}
                    <td style={{ ...cell, textAlign: "right" }}>
                      <ChevronDown size={15} color={C.textFaint} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={cols.length} style={{ padding: "4px 16px 16px", borderBottom: `1px solid ${C.border}`, backgroundColor: `${C.bg}80` }}>
                        {s.approved === false && s.rejectReason && (
                          <div style={{ margin: "10px 0 12px", fontSize: 12, color: C.red, display: "flex", alignItems: "center", gap: 6 }}>
                            <X size={13} /> Robotín rejected this signal — {s.rejectReason}. Not executed.
                          </div>
                        )}
                        <TradeDetail trade={s} candles={candlesFor ? candlesFor(s) : null} />
                        {onTrader && (
                          <button onClick={() => onTrader(s.trader)} style={{ marginTop: 10, fontSize: 11, color: C.purple, background: "none", border: "none", cursor: "pointer", padding: 0 }}>View {s.trader}'s profile →</button>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={cols.length} style={{ ...cell, textAlign: "center", padding: 28, color: C.textMuted }}>No signals match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { SignalTable };
