import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Infinity as InfinityIcon } from "lucide-react";
import { C, mono } from "../theme";

/* ═══════════════════════ RANGE CALENDAR ═══════════════════════
   Best-practice date-range picker (NN/G · USWDS · UXmatters):
   • Presets-with-custom pattern — the common ranges (incl. All time) are one
     click in the left rail; the dual calendar is there when you need a precise
     custom span.
   • Two months side by side, range highlighted, live hover preview of the end.
   • Today is marked; future days are disabled (error prevention).
   • Type the dates directly too; Apply stays disabled until the range is valid,
     and the resolved duration is always shown. */

const WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x.getTime(); };
const addDays = (ms, n) => ms + n * 86400000;
const startOfWeek = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x.getTime(); };
const startOfMonth = (y, m) => new Date(y, m, 1).getTime();
const endOfMonth = (y, m) => endOfDay(new Date(y, m + 1, 0));
const toInput = (ms) => { const d = new Date(ms); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const fmtLong = (ms) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const fmtDur = (ms) => {
  const days = Math.round(ms / 86400000);
  if (days <= 0) { const h = Math.max(1, Math.round(ms / 3600000)); return `${h}h`; }
  if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  if (days < 730) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
};

const monthCells = (y, m) => {
  const first = new Date(y, m, 1).getDay();
  const count = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= count; d++) cells.push(startOfDay(new Date(y, m, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const RangeCalendar = ({ fromMs, toMs, onApplyRange, onApplyAll, onClose }) => {
  const now = Date.now();
  const todaySOD = startOfDay(now);
  const ref = useRef(null);

  const [from, setFrom] = useState(Number.isFinite(fromMs) ? startOfDay(fromMs) : null);
  const [to, setTo] = useState(Number.isFinite(toMs) ? startOfDay(toMs) : null);
  const [hover, setHover] = useState(null);
  const [saveFav, setSaveFav] = useState(false);

  // left calendar month (right is the next one); default to the month of `to`/now
  const seed = new Date(Number.isFinite(toMs) ? toMs : now);
  const [view, setView] = useState({ y: seed.getFullYear(), m: seed.getMonth() });

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    const esc = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", esc); };
  }, [onClose]);

  // ── presets: the fast path, one click each (UXmatters "presets + custom") ──
  const presets = useMemo(() => {
    const lastWeekStart = startOfWeek(now) - 7 * 86400000;
    const pm = new Date(now); pm.setDate(0); // last day of previous month
    const py = new Date(now).getFullYear() - 1;
    return [
      { label: "All time", all: true, icon: true },
      { label: "Today", from: todaySOD, to: now },
      { label: "Yesterday", from: addDays(todaySOD, -1), to: endOfDay(addDays(todaySOD, -1)) },
      { label: "Last 7 days", from: addDays(todaySOD, -6), to: now },
      { label: "Last 30 days", from: addDays(todaySOD, -29), to: now },
      { label: "Last 90 days", from: addDays(todaySOD, -89), to: now },
      { label: "This week", from: startOfWeek(now), to: now },
      { label: "Last week", from: lastWeekStart, to: endOfDay(lastWeekStart + 6 * 86400000) },
      { label: "This month", from: startOfMonth(seed.getFullYear(), new Date(now).getMonth()), to: now },
      { label: "Last month", from: startOfMonth(pm.getFullYear(), pm.getMonth()), to: endOfMonth(pm.getFullYear(), pm.getMonth()) },
      { label: "This year", from: startOfMonth(new Date(now).getFullYear(), 0), to: now },
      { label: "Last year", from: startOfMonth(py, 0), to: endOfMonth(py, 11) },
    ];
  }, []);

  // which preset (if any) matches the current selection — to highlight it
  const activePreset = useMemo(() => {
    if (from == null || to == null) return null;
    return presets.findIndex((p) => !p.all && startOfDay(p.from) === from && startOfDay(p.to) === startOfDay(to));
  }, [from, to, presets]);

  const pickPreset = (p) => {
    if (p.all) { onApplyAll?.(); return; }
    onApplyRange?.(p.from, p.to, false);
  };

  // ── day click: first click sets start, second sets end (auto-orders) ──
  const onDay = (ms) => {
    if (ms > todaySOD) return; // no future
    if (from == null || to != null) { setFrom(ms); setTo(null); setHover(null); }
    else if (ms < from) { setTo(from); setFrom(ms); }
    else setTo(ms);
  };

  // resolved bounds for highlighting (use hover as a provisional end)
  const provEnd = to ?? (from != null ? hover : null);
  const lo = from != null && provEnd != null ? Math.min(from, provEnd) : from;
  const hi = from != null && provEnd != null ? Math.max(from, provEnd) : null;

  const valid = from != null && to != null && from <= to && to <= endOfDay(now);
  const span = valid ? fmtDur(endOfDay(to) - from) : null;

  const onType = (which, str) => {
    if (!str) { which === "from" ? setFrom(null) : setTo(null); return; }
    const ms = startOfDay(new Date(str + "T00:00:00").getTime());
    if (!Number.isFinite(ms) || ms > todaySOD) return;
    if (which === "from") { setFrom(ms); if (to != null && ms > to) setTo(null); }
    else { if (from != null && ms < from) { setTo(from); setFrom(ms); } else setTo(ms); }
  };

  const apply = () => { if (valid) onApplyRange?.(from, endOfDay(to), saveFav); };

  const rightMonth = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 };
  const canNext = startOfMonth(rightMonth.y, rightMonth.m) <= startOfMonth(new Date(now).getFullYear(), new Date(now).getMonth());
  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => { if (canNext) setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })); };

  const Month = ({ y, m }) => {
    const cells = monthCells(y, m);
    return (
      <div style={{ width: 224 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
          {WD.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: C.textFaint, padding: "2px 0" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {cells.map((ms, i) => {
            if (ms == null) return <div key={i} />;
            const future = ms > todaySOD;
            const isStart = lo != null && ms === lo;
            const isEnd = hi != null && ms === hi;
            const single = from != null && to == null && ms === from; // only start chosen so far
            const inRange = lo != null && hi != null && ms > lo && ms < hi;
            const isToday = ms === todaySOD;
            const edge = isStart || isEnd || single;
            return (
              <button
                key={i}
                onClick={() => onDay(ms)}
                onMouseEnter={() => !future && from != null && to == null && setHover(ms)}
                disabled={future}
                style={{
                  position: "relative", height: 30, borderRadius: edge ? 7 : inRange ? 0 : 7,
                  border: isToday && !edge ? `1px solid ${C.purple}77` : "1px solid transparent",
                  cursor: future ? "default" : "pointer",
                  fontSize: 12, fontWeight: edge ? 800 : 500, ...mono,
                  backgroundColor: edge ? C.purple : inRange ? C.purpleBg : "transparent",
                  color: future ? C.textFaint : edge ? "#fff" : C.text,
                  opacity: future ? 0.35 : 1,
                }}
              >
                {new Date(ms).getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const railBtn = (active) => ({
    display: "flex", alignItems: "center", gap: 7, width: "100%", textAlign: "left",
    padding: "8px 12px", border: "none", borderRadius: 7, cursor: "pointer",
    fontSize: 12, fontWeight: active ? 800 : 600, fontFamily: "inherit",
    backgroundColor: active ? C.purpleBg : "transparent",
    color: active ? C.purple : C.textMuted,
  });

  return (
    <div ref={ref} style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 60, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, boxShadow: C.shadowLg, display: "flex", overflow: "hidden", maxWidth: "92vw" }}>
      {/* preset rail */}
      <div style={{ width: 150, borderRight: `1px solid ${C.border}`, padding: 8, display: "flex", flexDirection: "column", gap: 1, backgroundColor: C.bg }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textFaint, padding: "4px 12px 6px" }}>Quick ranges</div>
        {presets.map((p, i) => (
          <button key={p.label} onClick={() => pickPreset(p)} style={railBtn(activePreset === i)} className="rc-rail">
            {p.icon && <InfinityIcon size={13} />}{p.label}
          </button>
        ))}
      </div>

      {/* calendars + footer */}
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 22 }}>
          {/* left */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <button onClick={prevMonth} style={navBtn} title="Previous month"><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{MO[view.m]} {view.y}</span>
              <span style={{ width: 26 }} />
            </div>
            <Month y={view.y} m={view.m} />
          </div>
          {/* right */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ width: 26 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{MO[rightMonth.m]} {rightMonth.y}</span>
              <button onClick={nextMonth} disabled={!canNext} style={{ ...navBtn, opacity: canNext ? 1 : 0.3, cursor: canNext ? "pointer" : "default" }} title="Next month"><ChevronRight size={16} /></button>
            </div>
            <Month y={rightMonth.y} m={rightMonth.m} />
          </div>
        </div>

        {/* footer: typed inputs + duration + actions */}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <div>
              <label style={labelStyle}>From</label>
              <input type="date" max={toInput(now)} value={from != null ? toInput(from) : ""} onChange={(e) => onType("from", e.target.value)} style={dateInput} />
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <input type="date" min={from != null ? toInput(from) : undefined} max={toInput(now)} value={to != null ? toInput(to) : ""} onChange={(e) => onType("to", e.target.value)} style={dateInput} />
            </div>
            <div style={{ flex: 1, minWidth: 110, paddingBottom: 6, fontSize: 11, ...mono, color: C.textMuted, whiteSpace: "nowrap" }}>
              {valid
                ? <>{fmtLong(from)} – {fmtLong(to)} · <span style={{ color: C.purple, fontWeight: 700 }}>{span}</span></>
                : <span style={{ color: C.textFaint }}>{from != null && to == null ? "Pick the end date" : "Pick a start and end date"}</span>}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: C.text, cursor: "pointer", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={saveFav} onChange={(e) => setSaveFav(e.target.checked)} />
              <Star size={12} color={C.amber} /> Save as favorite chip
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 7, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={apply} disabled={!valid} style={{ padding: "8px 20px", borderRadius: 7, border: "none", backgroundColor: valid ? C.purple : C.border, color: valid ? "#fff" : C.textFaint, fontSize: 12, fontWeight: 800, cursor: valid ? "pointer" : "not-allowed", fontFamily: "inherit" }}>Apply</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`.rc-rail:hover { background-color: ${C.cardHover} !important; color: ${C.text} !important; }`}</style>
    </div>
  );
};

const navBtn = { display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, cursor: "pointer" };
const labelStyle = { display: "block", fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, marginBottom: 4 };
const dateInput = { padding: "7px 9px", borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: C.bg, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", colorScheme: "dark" };

export { RangeCalendar };
