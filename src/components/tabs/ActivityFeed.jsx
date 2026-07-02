import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Radio } from "lucide-react";
import { SectionHeader } from "../common";
import { SignalTable } from "../SignalTable";
import { useProfile, useTimeframe } from "../../contexts";
import { ALL_SIGNALS, lastCloseByCoin } from "../../data/robotin";
import { mockTraders } from "../../data/mockData";
import { C, cardStyle, mono } from "../../theme";

/* ═══════════════════════ ACTIVITY FEED ═══════════════════════
   The GLOBAL LIVE TAPE of Robotín's signal → trade lifecycle across ALL coins.
   One chronological stream (newest first), scannable. Rows render through the
   shared SignalRow so the tape matches Markets and the Wallet exactly. */

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

  // filters persist so the analyst's view sticks across sessions
  const [filter, setFilter] = useState(() => { try { return localStorage.getItem("af:chip") || "all"; } catch { return "all"; } });
  const [coinFilter, setCoinFilter] = useState(() => { try { return localStorage.getItem("af:coin") || "all"; } catch { return "all"; } });
  const [open, setOpen] = useState(null); // expanded signal id
  useEffect(() => { try { localStorage.setItem("af:chip", filter); } catch { /* ignore */ } }, [filter]);
  useEffect(() => { try { localStorage.setItem("af:coin", coinFilter); } catch { /* ignore */ } }, [coinFilter]);

  const lastClose = (coin) => lastCloseByCoin[coin] ?? null;

  /* ── single flat tape from the memoized store: every signal, newest first ── */
  const allSignals = useMemo(() => [...ALL_SIGNALS].sort((a, b) => b.time - a.time), []);

  /* ── distinct coins present in the tape (for the asset filter) ── */
  const coinOptions = useMemo(() => {
    const seen = [];
    allSignals.forEach((s) => { if (!seen.includes(s.coin)) seen.push(s.coin); });
    return seen;
  }, [allSignals]);

  const chip = CHIPS.find((x) => x.id === filter) || CHIPS[0];
  /* ── global timeframe filter (header) applies to the whole tape ── */
  const { within } = useTimeframe();
  const tfSignals = useMemo(() => allSignals.filter((s) => within(s.time)), [allSignals, within]);

  const visible = useMemo(() => {
    let list = tfSignals.filter(chip.test);
    if (coinFilter !== "all") list = list.filter((s) => s.coin === coinFilter);
    return list;
  }, [tfSignals, chip, coinFilter]);

  /* ── header summary counts (over the timeframe-filtered tape) ── */
  const totalN = tfSignals.length;
  const approvedN = useMemo(() => tfSignals.filter((s) => s.approved).length, [tfSignals]);
  const activeN = useMemo(() => tfSignals.filter((s) => s.status === "active").length, [tfSignals]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ─────────── HEADER ─────────── */}
      <SectionHeader
        icon={Radio}
        title="Live activity"
        subtitle="Every signal and what Robotín did with it — newest first, across all coins"
        right={(
          <span style={{ fontSize: 11, color: C.textMuted, ...mono }}>
            <b style={{ color: C.text }}>{totalN}</b> events <span style={{ color: C.textFaint }}>·</span> <b style={{ color: C.green }}>{approvedN}</b> approved <span style={{ color: C.textFaint }}>·</span> <b style={{ color: C.blue }}>{activeN}</b> active
          </span>
        )}
      />

      {/* ─────────── STICKY FILTER ROW (offset = app header height, or it hides under it) ─────────── */}
      <div style={{
        position: "sticky", top: 56, zIndex: 5, display: "flex", alignItems: "center", gap: 7,
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
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <select
              value={coinFilter}
              onChange={(e) => { setCoinFilter(e.target.value); setOpen(null); }}
              style={{
                appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                padding: "5px 26px 5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${coinFilter !== "all" ? C.purple : C.border}`,
                backgroundColor: coinFilter !== "all" ? C.purpleBg : "transparent",
                color: coinFilter !== "all" ? C.purple : C.textMuted, ...mono, outline: "none",
              }}
            >
              <option value="all" style={{ backgroundColor: C.card, color: C.text }}>All assets</option>
              {coinOptions.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: C.card, color: C.text }}>{c}</option>
              ))}
            </select>
            <ChevronDown size={13} color={coinFilter !== "all" ? C.purple : C.textMuted} style={{ position: "absolute", right: 8, pointerEvents: "none" }} />
          </div>
        </div>
      </div>

      {/* ─────────── EVENT TAPE (dense table) ─────────── */}
      <SignalTable
        signals={visible}
        openId={open}
        onToggle={(id) => setOpen(open === id ? null : id)}
        onTrader={(name) => { const tr = mockTraders.find((x) => x.name === name); if (tr) openProfile(tr); }}
        lastCloseFor={(s) => lastClose(s.coin)}
        viewId="activity"
        exportName="tradethlon-activity"
        maxHeight="calc(100vh - 250px)"
      />
    </div>
  );
};

export { ActivityFeed };
