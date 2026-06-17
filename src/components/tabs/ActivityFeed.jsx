import { useMemo, useState } from "react";
import { Activity, Check, X, Clock, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { TradeDetail } from "../TradeDetail";
import { Avatar, BotTag } from "../common";
import { useProfile, useWatchlist } from "../../contexts";
import { coinCandles, coinSignals, ROBOTIN_COINS } from "../../data/robotin";
import { mockTraders } from "../../data/mockData";
import { C, cardStyle, mono } from "../../theme";

/* ═══════════════════════ ACTIVITY FEED ═══════════════════════
   The GLOBAL LIVE TAPE of Robotín's signal → trade lifecycle across ALL coins.
   One chronological stream (newest first), terminal-style, scannable. Distinct
   from the per-coin Robotín view: this is every asset, the platform's heartbeat. */

/* ── status → label + color + icon (mirrors the per-coin view's vocabulary) ── */
const STATUS = {
  pending: { label: "Pending", color: C.amber, Icon: Clock },
  active: { label: "Active", color: C.blue, Icon: Activity },
  closed_TP: { label: "Take Profit", color: C.green, Icon: null },
  closed_SL: { label: "Stop Loss", color: C.red, Icon: null },
  expired: { label: "No entry", color: C.textFaint, Icon: null },
  rejected: { label: "Rejected", color: C.textFaint, Icon: null },
};
const statusKey = (s) => (s.status === "closed" ? `closed_${s.hit}` : s.status);

/* ── relative timestamp from unix seconds (deterministic vs Date.now()) ── */
const relTime = (sec) => {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - sec);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  return `${w}w`;
};

/* ── format a candle-count duration (1h candles) into "14h" / "2.1d" ── */
const fmtDuration = (candles) => {
  const h = Math.max(0, Math.round(candles));
  if (h < 24) return `${h}h`;
  const d = h / 24;
  return `${d < 10 ? d.toFixed(1) : Math.round(d)}d`;
};

/* ── realized R multiple + duration for a CLOSED signal ── */
const closedResult = (s) => {
  const sign = s.dir === "LONG" ? 1 : -1;
  const exit = s.exit ?? (s.hit === "TP" ? s.tp1 : s.sl);
  const risk = s.entry - s.sl; // signed by direction (long: +, short: −)
  const r = risk !== 0 ? (sign * (exit - s.entry)) / Math.abs(risk) : 0;
  const dur = s.exitIdx != null && s.entryIdx != null ? s.exitIdx - s.entryIdx : null;
  return { r, dur };
};

/* ── unrealized read for an ACTIVE signal vs latest candle close ── */
const unrealized = (s, lastClose) => {
  const sign = s.dir === "LONG" ? 1 : -1;
  const distPct = sign * ((lastClose - s.entry) / s.entry) * 100;
  const toTpPct = Math.abs(((s.tp1 - s.entry) / s.entry) * 100);
  return { distPct, toTpPct };
};

/* ── filter chip definitions (id, label, predicate) ── */
const CHIPS = [
  { id: "all", label: "All", test: () => true },
  { id: "approved", label: "Approved", test: (s) => s.approved === true },
  { id: "rejected", label: "Rejected", test: (s) => s.approved === false },
  { id: "active", label: "Active", test: (s) => s.status === "active" },
  { id: "pending", label: "Pending", test: (s) => s.status === "pending" },
  { id: "tp", label: "Closed (TP)", test: (s) => s.status === "closed" && s.hit === "TP" },
  { id: "sl", label: "Closed (SL)", test: (s) => s.status === "closed" && s.hit === "SL" },
];

const ActivityFeed = () => {
  const { openProfile } = useProfile();
  const watchlist = useWatchlist();
  const followedTraders = watchlist?.followedTraders || null;
  const hasFollowing = followedTraders != null;

  const [filter, setFilter] = useState("all");
  const [coinFilter, setCoinFilter] = useState("all");
  const [followingOnly, setFollowingOnly] = useState(false);
  const [open, setOpen] = useState(null); // expanded signal id

  /* ── memoized per-coin candle lookups (built once; reused for unrealized calc) ── */
  const candlesByCoin = useMemo(() => {
    const map = {};
    ROBOTIN_COINS.forEach((c) => { map[c] = coinCandles(c); });
    return map;
  }, []);
  const lastClose = (coin) => {
    const cs = candlesByCoin[coin];
    return cs && cs.length ? cs[cs.length - 1].close : null;
  };

  /* ── single flat tape: every signal across every coin, newest first ── */
  const allSignals = useMemo(
    () =>
      ROBOTIN_COINS.flatMap((c) => coinSignals(c, candlesByCoin[c])).sort((a, b) => b.time - a.time),
    [candlesByCoin]
  );

  /* ── distinct coins present in the tape (for the asset filter) ── */
  const coinOptions = useMemo(() => {
    const seen = [];
    allSignals.forEach((s) => { if (!seen.includes(s.coin)) seen.push(s.coin); });
    return seen;
  }, [allSignals]);

  const chip = CHIPS.find((x) => x.id === filter) || CHIPS[0];
  const visible = useMemo(() => {
    let list = allSignals.filter(chip.test);
    if (coinFilter !== "all") list = list.filter((s) => s.coin === coinFilter);
    if (followingOnly && hasFollowing) list = list.filter((s) => followedTraders[s.trader]);
    return list;
  }, [allSignals, chip, coinFilter, followingOnly, hasFollowing, followedTraders]);

  /* ── header summary counts (over the full tape, not the filtered view) ── */
  const totalN = allSignals.length;
  const approvedN = useMemo(() => allSignals.filter((s) => s.approved).length, [allSignals]);
  const activeN = useMemo(() => allSignals.filter((s) => s.status === "active").length, [allSignals]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ─────────── HEADER ─────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: C.green, opacity: 0.45, animation: "pulse 1.8s ease-in-out infinite" }} />
            <span style={{ position: "absolute", inset: 1.5, borderRadius: "50%", backgroundColor: C.green }} />
          </span>
          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.3px" }}>Live activity</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.green, backgroundColor: C.greenBg, border: `1px solid ${C.green}40`, padding: "1px 7px", borderRadius: 999, letterSpacing: "0.6px" }}>LIVE</span>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, ...mono }}>
          <b style={{ color: C.text }}>{totalN}</b> events
          <span style={{ color: C.textFaint }}> · </span>
          <b style={{ color: C.green }}>{approvedN}</b> approved
          <span style={{ color: C.textFaint }}> · </span>
          <b style={{ color: C.blue }}>{activeN}</b> active
        </div>
      </div>

      {/* ─────────── STICKY FILTER ROW ─────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 5, display: "flex", alignItems: "center", gap: 7,
        flexWrap: "wrap", padding: "8px 0", backgroundColor: C.bg, borderBottom: `1px solid ${C.border}`,
      }}>
        {CHIPS.map((c) => {
          const on = filter === c.id;
          return (
            <button key={c.id} onClick={() => { setFilter(c.id); setOpen(null); }} style={{
              padding: "5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${on ? C.purple : C.border}`,
              backgroundColor: on ? C.purpleBg : "transparent",
              color: on ? C.purple : C.textMuted, ...mono, whiteSpace: "nowrap",
            }}>{c.label}</button>
          );
        })}

        {/* asset filter — distinct coins present in the tape + "All assets" */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, letterSpacing: "0.4px", ...mono }}>ASSET</span>
          <select
            value={coinFilter}
            onChange={(e) => { setCoinFilter(e.target.value); setOpen(null); }}
            style={{
              padding: "5px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${coinFilter !== "all" ? C.purple : C.border}`,
              backgroundColor: coinFilter !== "all" ? C.purpleBg : "transparent",
              color: coinFilter !== "all" ? C.purple : C.textMuted, ...mono, outline: "none",
            }}
          >
            <option value="all" style={{ backgroundColor: C.bg, color: C.text }}>All assets</option>
            {coinOptions.map((c) => (
              <option key={c} value={c} style={{ backgroundColor: C.bg, color: C.text }}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─────────── EVENT TAPE ─────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.length === 0 && (
          <div style={{ ...cardStyle, textAlign: "center", padding: "32px", color: C.textMuted }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No events match this filter</div>
            <div style={{ fontSize: 11 }}>Try a different chip{followingOnly ? " or turn off Following" : ""}.</div>
          </div>
        )}

        {visible.map((s) => {
          const st = STATUS[statusKey(s)] || STATUS.pending;
          const isOpen = open === s.id;
          const isLong = s.dir === "LONG";
          const dirColor = isLong ? C.green : C.red;
          const DirIcon = isLong ? TrendingUp : TrendingDown;
          return (
            <div key={s.id} className="card-hover" style={{ ...cardStyle, padding: 0, overflow: "hidden", borderLeft: `3px solid ${s.approved ? dirColor : C.textFaint}` }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen(isOpen ? null : s.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(isOpen ? null : s.id); } }}
                style={{ width: "100%", cursor: "pointer", padding: "10px 13px", display: "flex", alignItems: "center", gap: 11 }}
              >
                {/* actor */}
                <Avatar name={s.trader} size={28} />
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span
                    onClick={(e) => { e.stopPropagation(); const tr = mockTraders.find((x) => x.name === s.trader); if (tr) openProfile(tr); }}
                    style={{ fontSize: 12.5, fontWeight: 700, cursor: "pointer", borderBottom: `1px dashed ${C.purple}40` }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.purple; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.text; }}
                  >{s.trader}</span>
                  <BotTag isBot={s.isBot} size={14} />
                </div>

                {/* event line — dense, institutional: DIR · COIN · setup tag */}
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800, color: dirColor, ...mono }}>
                    <DirIcon size={12} />{s.dir}
                  </span>
                  <span style={{ fontWeight: 800, color: C.text, ...mono }}>{s.coin}</span>
                  {s.tag && <span style={{ fontSize: 9, fontWeight: 700, color: C.purple, backgroundColor: C.purpleBg, border: `1px solid ${C.purple}30`, padding: "1px 6px", borderRadius: 4, ...mono }}>{s.tag.split("_").slice(0, 3).join("·")}</span>}
                </div>

                {/* Robotín verdict */}
                <div style={{ flexShrink: 0 }}>
                  {s.approved
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800, color: C.green, backgroundColor: C.greenBg, border: `1px solid ${C.green}40`, padding: "2px 8px", borderRadius: 5, ...mono }}><Check size={11} /> {s.confidence}%</span>
                    : <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800, color: C.textFaint, backgroundColor: `${C.textFaint}14`, border: `1px solid ${C.textFaint}40`, padding: "2px 8px", borderRadius: 5 }}><X size={11} /> Rejected</span>}
                </div>

                {/* status pill */}
                <div style={{ flexShrink: 0, minWidth: 96, textAlign: "right" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: st.color }}>
                    {st.Icon ? <st.Icon size={11} /> : null}{st.label}
                  </span>
                </div>

                {/* right zone: realized result (closed) · unrealized (active) · awaiting (pending) */}
                <div style={{ flexShrink: 0, minWidth: 116, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                  {(() => {
                    if (s.status === "closed") {
                      const { r, dur } = closedResult(s);
                      const pos = (s.pnl ?? 0) >= 0;
                      return (
                        <>
                          <span style={{ fontSize: 12, fontWeight: 800, color: pos ? C.green : C.red, ...mono }}>{pos ? "+" : "−"}${Math.abs(s.pnl ?? 0).toFixed(2)}</span>
                          <span style={{ fontSize: 10, color: C.textFaint, ...mono }}>
                            {`${r >= 0 ? "+" : ""}${r.toFixed(1)}R`}{dur != null ? ` · ${fmtDuration(dur)}` : ""}
                          </span>
                        </>
                      );
                    }
                    if (s.status === "active") {
                      const lc = lastClose(s.coin);
                      if (lc == null) return <span style={{ fontSize: 11, color: C.textFaint, ...mono }}>—</span>;
                      const { distPct, toTpPct } = unrealized(s, lc);
                      const pos = distPct >= 0;
                      return (
                        <>
                          <span style={{ fontSize: 12, fontWeight: 800, color: pos ? C.green : C.red, ...mono }}>{`${pos ? "+" : "−"}${Math.abs(distPct).toFixed(1)}%`}</span>
                          <span style={{ fontSize: 10, color: C.textFaint, ...mono }}>{`to TP ${toTpPct.toFixed(1)}%`}</span>
                        </>
                      );
                    }
                    if (s.status === "pending") {
                      return <span style={{ fontSize: 10, color: C.textFaint, ...mono }}>awaiting entry</span>;
                    }
                    return <span style={{ fontSize: 11, color: C.textFaint, ...mono }}>—</span>;
                  })()}
                </div>

                {/* relative time + chevron */}
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 7 }}>
                  <span title={new Date(s.time * 1000).toLocaleString()} style={{ fontSize: 11, color: C.textFaint, ...mono, minWidth: 28, textAlign: "right" }}>{relTime(s.time)}</span>
                  <ChevronDown size={15} color={C.textFaint} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: 14 }}>
                  {!s.approved && (
                    <div style={{ marginBottom: 12, fontSize: 12, color: C.red, display: "flex", alignItems: "center", gap: 6 }}>
                      <X size={13} /> Robotín rejected this signal — {s.rejectReason}. Not executed.
                    </div>
                  )}
                  <TradeDetail trade={s} />
                  <button onClick={() => { const tr = mockTraders.find((x) => x.name === s.trader); if (tr) openProfile(tr); }} style={{ marginTop: 10, fontSize: 11, color: C.purple, background: "none", border: "none", cursor: "pointer", padding: 0 }}>View {s.trader}'s profile →</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { ActivityFeed };
