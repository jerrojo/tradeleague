import { Fragment } from "react";
import { Activity, Check, ChevronDown, Clock, Cpu, X } from "lucide-react";
import { Avatar, BotTag } from "./common";
import { TradeDetail } from "./TradeDetail";
import { C, cardStyle, mono, thStyle, tdStyle } from "../theme";

/* ═══════════════════════ SignalTable — THE canonical dense trade/signal table ═══════════════════════
   One table, used everywhere a list of signals/trades appears (Activity · Markets ·
   Home · profiles · the Executions journal). Rich columns the desk actually scans:
   Pair · Type · Trader · Robotín · Entry · Exit · PnL · R · Duration · Status · Setup · Time.
   Any row expands to the full TradeDetail. Audit columns (fees/match) are opt-in via `audit`. */

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

const SignalTable = ({
  signals, openId, onToggle, onTrader,
  lastCloseFor, candlesFor,
  showTrader = true, audit = false,
}) => {
  const cols = [
    "Pair", "Type", ...(showTrader ? ["Trader"] : []), "Robotín",
    "Entry", "Exit", "PnL", "R", "Duration", "Status", "Setup", "Time",
    ...(audit ? ["Fees", "Match"] : []), "",
  ];
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: audit ? 1240 : 1120 }}>
          <thead><tr>{cols.map((h, i) => <th key={i} style={{ ...thStyle, fontSize: 10 }}>{h}</th>)}</tr></thead>
          <tbody>
            {signals.map((s, ri) => {
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
                    {/* Pair */}
                    <td style={{ ...cell, borderLeft: `3px solid ${accent}`, fontWeight: 800 }}>
                      {s.coin}<span style={{ color: C.textMuted, fontWeight: 400 }}> /{s.pair && s.pair.includes("/") ? s.pair.split("/")[1] : "USDT"}</span>
                    </td>
                    {/* Type */}
                    <td style={cell}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: dirColor, backgroundColor: `${dirColor}18`, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.3px" }}>{s.dir}</span>
                    </td>
                    {/* Trader */}
                    {showTrader && (
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
                    {/* Robotín verdict */}
                    <td style={cell}>
                      {s.approved
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800, color: C.green, ...num }}><Cpu size={10} /> {s.confidence}%</span>
                        : <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800, color: C.textFaint }}><X size={10} /> Rej.</span>}
                    </td>
                    {/* Entry / Exit */}
                    <td style={{ ...cell, ...num, color: C.text }}>{fmtPrice(s.entry)}</td>
                    <td style={{ ...cell, ...num, color: C.text }}>{cr ? fmtPrice(cr.exit) : "—"}</td>
                    {/* PnL */}
                    <td style={{ ...cell, ...num }}>
                      {isClosed
                        ? <span style={{ fontWeight: 800, color: (s.pnl ?? 0) >= 0 ? C.green : C.red }}>{usd(s.pnl ?? 0)}</span>
                        : ur
                          ? <span style={{ fontWeight: 800, color: ur.distPct >= 0 ? C.green : C.red }}>{`${ur.distPct >= 0 ? "+" : "−"}${Math.abs(ur.distPct).toFixed(1)}%`}</span>
                          : <span style={{ color: C.textFaint }}>{s.status === "pending" ? "awaiting" : "—"}</span>}
                    </td>
                    {/* R */}
                    <td style={{ ...cell, ...num, fontWeight: 700, color: cr ? (cr.r >= 0 ? C.green : C.red) : C.textFaint }}>
                      {cr ? `${cr.r >= 0 ? "+" : ""}${cr.r.toFixed(1)}R` : "—"}
                    </td>
                    {/* Duration */}
                    <td style={{ ...cell, ...num, color: C.textMuted }}>{cr ? fmtDuration(cr.dur) : "—"}</td>
                    {/* Status */}
                    <td style={cell}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>
                        {st.Icon ? <st.Icon size={11} /> : null}{st.label}
                      </span>
                    </td>
                    {/* Setup */}
                    <td style={cell}>
                      {tag ? <span style={{ fontSize: 9, fontWeight: 700, color: C.purple, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}30`, padding: "1px 6px", borderRadius: 4, ...num }}>{tag}</span> : <span style={{ color: C.textFaint }}>—</span>}
                    </td>
                    {/* Time */}
                    <td style={{ ...cell, ...num, color: C.textFaint }} title={new Date(s.time * 1000).toLocaleString()}>{relTime(s.time)}</td>
                    {/* Audit columns (opt-in) */}
                    {audit && <td style={{ ...cell, ...num, color: C.textMuted }}>{isClosed ? `−$${fee.toFixed(2)}` : "—"}</td>}
                    {audit && <td style={cell}><span style={{ fontWeight: 700, color: s.approved ? C.green : C.textFaint }}>{s.approved ? "Match" : "—"}</span></td>}
                    {/* Chevron */}
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
            {signals.length === 0 && (
              <tr><td colSpan={cols.length} style={{ ...cell, textAlign: "center", padding: 28, color: C.textMuted }}>No signals match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { SignalTable };
