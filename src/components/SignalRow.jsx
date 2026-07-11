import { Activity, Check, ChevronDown, Clock, Cpu, X } from "lucide-react";
import { Avatar, BotTag } from "./common";
import { TradeDetail } from "./TradeDetail";
import { SourceButton } from "./TelegramSignal";
import { C, cardStyle, mono } from "../theme";

/* ═══════════════════════ SignalRow — THE canonical trade/signal row ═══════════════════════
   One row, used everywhere (Markets · Wallet · Activity · Home). Fixed-width column
   slots so every list aligns to the same grid no matter what data each context has:

   [accent] Avatar · Instrument(coin/pair + dir) · Trader(+bot, setup) · Robotín · Status · Result · [time] · chevron

   Anything trade-shaped renders identically. Differences between tabs are limited to
   the optional `showTime` flag and the `lastClose` needed to read an active position. */

/* ── lifecycle status → label · color · icon ── */
const STATUS = {
  pending: { label: "Pending", color: C.amber, Icon: Clock },
  active: { label: "Active", color: C.blue, Icon: Activity },
  closed_TP: { label: "Take Profit", color: C.green, Icon: null },
  closed_SL: { label: "Stop Loss", color: C.red, Icon: null },
  expired: { label: "No entry", color: C.textFaint, Icon: null },
  rejected: { label: "Not executed", color: C.textFaint, Icon: null },
};
const statusKey = (s) => (s.status === "closed" ? `closed_${s.hit}` : s.status);

/* ── money: always sign + 2 decimals + typographic minus (platform-wide convention) ── */
const usd = (v) =>
  `${v >= 0 ? "+" : "−"}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ── price: adaptive precision so meme/sub-cent coins don't collapse to "$0.00" ── */
const fmtPrice = (p) => {
  if (p == null) return "—";
  const a = Math.abs(p);
  if (a >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (a >= 0.01) return p.toFixed(4);
  if (a >= 0.0001) return p.toFixed(6);
  return p.toPrecision(3);
};

/* ── relative timestamp from unix seconds (deterministic) ── */
const relTime = (sec) => {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - sec);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
};

/* ── candle-count duration (1h candles) → "14h" / "2.1d" ── */
const fmtDuration = (candles) => {
  const h = Math.max(0, Math.round(candles));
  if (h < 24) return `${h}h`;
  const d = h / 24;
  return `${d < 10 ? d.toFixed(1) : Math.round(d)}d`;
};

/* ── realized R + duration for a closed signal ── */
const closedResult = (s) => {
  const sign = s.dir === "LONG" ? 1 : -1;
  const exit = s.exit ?? (s.hit === "TP" ? s.tp1 : s.sl);
  const risk = s.entry - s.sl;
  const r = risk !== 0 ? (sign * (exit - s.entry)) / Math.abs(risk) : 0;
  const dur = s.exitIdx != null && s.entryIdx != null ? s.exitIdx - s.entryIdx : null;
  return { r, dur };
};

/* ── unrealized read for an active signal vs latest close ── */
const unrealized = (s, lastClose) => {
  const sign = s.dir === "LONG" ? 1 : -1;
  const distPct = sign * ((lastClose - s.entry) / s.entry) * 100;
  const toTpPct = Math.abs(((s.tp1 - s.entry) / s.entry) * 100);
  return { distPct, toTpPct };
};

/* ── shared column-slot styles (the alignment grid) ── */
const COL = {
  instrument: { width: 132, flexShrink: 0 },
  robotin: { width: 96, flexShrink: 0, textAlign: "center" },
  status: { width: 96, flexShrink: 0, textAlign: "right" },
  result: { width: 120, flexShrink: 0, textAlign: "right" },
  time: { width: 30, flexShrink: 0, textAlign: "right" },
};
const microLabel = { fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 };

/* ── the Result slot: closed → P&L + R·dur · active → unrealized · pending → awaiting ── */
const ResultCell = ({ s, lastClose }) => {
  if (s.status === "closed") {
    const { r, dur } = closedResult(s);
    const pos = (s.pnl ?? 0) >= 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: pos ? C.green : C.red, ...mono }}>{usd(s.pnl ?? 0)}</span>
        <span style={{ fontSize: 9.5, color: C.textFaint, ...mono }}>
          {`${r >= 0 ? "+" : ""}${r.toFixed(1)}R`}{dur != null ? ` · ${fmtDuration(dur)}` : ""}
        </span>
      </div>
    );
  }
  if (s.status === "active") {
    if (lastClose == null) return <span style={{ fontSize: 11, color: C.textFaint, ...mono }}>—</span>;
    const { distPct, toTpPct } = unrealized(s, lastClose);
    const pos = distPct >= 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: pos ? C.green : C.red, ...mono }}>{`${pos ? "+" : "−"}${Math.abs(distPct).toFixed(1)}%`}</span>
        <span style={{ fontSize: 9.5, color: C.textFaint, ...mono }}>{`to TP ${toTpPct.toFixed(1)}%`}</span>
      </div>
    );
  }
  if (s.status === "pending") return <span style={{ fontSize: 10, color: C.textFaint, ...mono }}>awaiting entry</span>;
  return <span style={{ fontSize: 11, color: C.textFaint, ...mono }}>—</span>;
};

const SignalRow = ({ signal: s, isOpen, onToggle, onTrader, showTime = false, lastClose = null, candles = null }) => {
  const st = STATUS[statusKey(s)] || STATUS.pending;
  const isLong = s.dir === "LONG";
  const dirColor = isLong ? C.green : C.red;
  const accent = s.approved === false ? C.textFaint : dirColor;
  const tag = s.tag ? s.tag.split("_").slice(0, 3).join("·") : null;

  return (
    <div className="card-hover" style={{ ...cardStyle, padding: 0, overflow: "hidden", borderLeft: `3px solid ${accent}` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        style={{ width: "100%", cursor: "pointer", padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}
      >
        {/* Avatar */}
        <Avatar name={s.trader} size={30} />

        {/* Instrument: coin / quote + direction pill */}
        <div style={COL.instrument}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{s.coin}</span>
            <span style={{ fontSize: 10, color: C.textMuted, ...mono }}>/{s.pair && s.pair.includes("/") ? s.pair.split("/")[1] : (s.pair || "USDT")}</span>
          </div>
          <span style={{ display: "inline-block", marginTop: 4, fontSize: 9, fontWeight: 800, color: dirColor, backgroundColor: `${dirColor}18`, padding: "1px 6px", borderRadius: 3, letterSpacing: "0.3px" }}>{s.dir}</span>
        </div>

        {/* Trader + bot + setup tag */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span
              onClick={onTrader ? (e) => { e.stopPropagation(); onTrader(s.trader); } : undefined}
              style={{
                fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                ...(onTrader ? { cursor: "pointer", borderBottom: `1px dashed ${C.purple}40` } : {}),
              }}
              onMouseEnter={onTrader ? (e) => { e.currentTarget.style.color = C.purple; } : undefined}
              onMouseLeave={onTrader ? (e) => { e.currentTarget.style.color = C.text; } : undefined}
            >{s.trader}</span>
            <BotTag isBot={s.isBot} size={14} />
            {/* the original post as it arrived (Telegram / X) — sits beside the trader */}
            <SourceButton signal={s} size={16} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            {tag && (
              <span style={{ fontSize: 9, fontWeight: 700, color: C.purple, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}30`, padding: "1px 6px", borderRadius: 4, ...mono }}>{tag}</span>
            )}
            <span style={{ fontSize: 10, color: C.textMuted, ...mono, whiteSpace: "nowrap" }}>
              E <b style={{ color: C.text }}>{fmtPrice(s.entry)}</b> <span style={{ color: C.textFaint }}>·</span> TP <b style={{ color: C.green }}>{fmtPrice(s.tp1)}</b> <span style={{ color: C.textFaint }}>·</span> SL <b style={{ color: C.red }}>{fmtPrice(s.sl)}</b>
            </span>
          </div>
        </div>

        {/* Robotín verdict */}
        <div style={COL.robotin}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, ...microLabel, marginBottom: 3 }}><Cpu size={9} /> Robotín</div>
          {s.approved
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800, color: C.green, backgroundColor: C.greenBg, border: `1px solid ${C.green}40`, padding: "2px 8px", borderRadius: 5, ...mono }}><Check size={11} /> {s.confidence}%</span>
            : <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800, color: C.textFaint, backgroundColor: `${C.textFaint}14`, border: `1px solid ${C.textFaint}40`, padding: "2px 8px", borderRadius: 5 }}><X size={11} /> Rejected</span>}
        </div>

        {/* Lifecycle status */}
        <div style={COL.status}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: st.color }}>
            {st.Icon ? <st.Icon size={11} /> : null}{st.label}
          </span>
        </div>

        {/* Result */}
        <div style={COL.result}>
          <ResultCell s={s} lastClose={lastClose} />
        </div>

        {/* Relative time (optional) */}
        {showTime && (
          <span title={new Date(s.time * 1000).toLocaleString()} style={{ ...COL.time, fontSize: 11, color: C.textFaint, ...mono }}>{relTime(s.time)}</span>
        )}

        {/* Chevron */}
        <ChevronDown size={16} color={C.textFaint} style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </div>

      {isOpen && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: 14 }}>
          {s.approved === false && s.rejectReason && (
            <div style={{ marginBottom: 12, fontSize: 12, color: C.red, display: "flex", alignItems: "center", gap: 6 }}>
              <X size={13} /> Robotín rejected this signal — {s.rejectReason}. Not executed.
            </div>
          )}
          <TradeDetail trade={s} candles={candles} />
          {onTrader && (
            <button onClick={() => onTrader(s.trader)} style={{ marginTop: 10, fontSize: 11, color: C.purple, background: "none", border: "none", cursor: "pointer", padding: 0 }}>View {s.trader}'s profile →</button>
          )}
        </div>
      )}
    </div>
  );
};

export { SignalRow };
