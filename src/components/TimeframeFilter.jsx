import { useEffect, useState } from "react";
import { CalendarRange, ChevronDown, Clock, Star, X } from "lucide-react";
import { useTimeframe } from "../contexts";
import { C, mono } from "../theme";

/* Global header time filter — TradingView-style: pin any range to the quick bar
   (star), pick the rest from a grouped "Range" dropdown (Minutes/Hours/Days/…),
   favorite custom ranges as chips, and the resolved window is always visible. */
const toLocalInput = (ms) => {
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};
const GROUPS = ["Minutes", "Hours", "Days", "Weeks", "Months", "Other"];

const TimeframeFilter = () => {
  const { key, label, presets, pinned, pinnedRanges, togglePin, setRange, setCustomRange, isFiltered, fromMs, toMs, favorites, addFavorite, removeFavorite, activeFavId } = useTimeframe();
  const [open, setOpen] = useState(false);       // custom range popover
  const [menu, setMenu] = useState(false);       // grouped range dropdown
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saveFav, setSaveFav] = useState(false);

  // [ and ] cycle the PINNED ranges (pro speed). Ignored while typing.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "[" && e.key !== "]") return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
      const keys = pinnedRanges.map((p) => p.key);
      if (!keys.length) return;
      let idx = keys.indexOf(key); if (idx < 0) idx = keys.length - 1;
      idx = e.key === "]" ? Math.min(keys.length - 1, idx + 1) : Math.max(0, idx - 1);
      setRange(keys[idx]);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [key, pinnedRanges, setRange]);

  const openCustom = () => {
    setFrom(toLocalInput(Number.isFinite(fromMs) ? fromMs : Date.now() - 24 * 3600e3));
    setTo(toLocalInput(Number.isFinite(toMs) ? toMs : Date.now()));
    setSaveFav(false); setMenu(false); setOpen((v) => !v);
  };
  const apply = () => {
    const f = new Date(from).getTime(), t = new Date(to).getTime();
    if (f && t && f < t) { setCustomRange(f, t); if (saveFav) addFavorite(f, t); setOpen(false); }
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
      {/* resolved window (always visible) */}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: isFiltered ? C.purple : C.textMuted, ...mono, whiteSpace: "nowrap" }}>
        <Clock size={12} /> {label}
      </span>

      {/* favorited custom ranges — quick chips */}
      {favorites.map((f) => {
        const on = activeFavId === f.id;
        return (
          <span key={f.id} style={{
            display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 6px 4px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, ...mono, whiteSpace: "nowrap",
            border: `1px solid ${on ? C.amber : C.border}`, backgroundColor: on ? `${C.amber}1c` : "transparent", color: on ? C.amber : C.textMuted,
          }}>
            <Star size={10} fill={C.amber} color={C.amber} style={{ cursor: "pointer" }} onClick={() => setCustomRange(f.from, f.to)} />
            <span style={{ cursor: "pointer" }} onClick={() => setCustomRange(f.from, f.to)}>{f.label}</span>
            <X size={11} style={{ cursor: "pointer", opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); removeFavorite(f.id); }} />
          </span>
        );
      })}

      {/* pinned preset quick-bar */}
      <div style={{ display: "inline-flex", borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {pinnedRanges.map((p) => {
          const on = key === p.key;
          return (
            <button key={p.key} onClick={() => { setRange(p.key); setMenu(false); }} style={{
              padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
              borderRight: `1px solid ${C.border}`, ...mono,
              backgroundColor: on ? C.purple : "transparent",
              color: on ? "#fff" : C.textMuted,
            }}>{p.label}</button>
          );
        })}
        {/* grouped "Range" dropdown trigger */}
        <button onClick={() => { setMenu((v) => !v); setOpen(false); }} title="All ranges" style={{
          padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none", borderRight: `1px solid ${C.border}`, display: "inline-flex", alignItems: "center", gap: 2,
          backgroundColor: menu ? C.cardElev : "transparent", color: menu ? C.text : C.textMuted,
        }}><ChevronDown size={13} /></button>
        {/* custom range trigger */}
        <button onClick={openCustom} title="Custom range" style={{
          padding: "5px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 4,
          backgroundColor: key === "custom" ? C.purple : "transparent",
          color: key === "custom" ? "#fff" : C.textMuted,
        }}><CalendarRange size={13} /></button>
      </div>

      {/* grouped range dropdown — pick any range, star to pin to the quick-bar */}
      {menu && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 8, boxShadow: C.shadowLg, width: 230, maxHeight: 380, overflowY: "auto" }}>
          {GROUPS.map((g) => {
            const rows = presets.filter((p) => p.group === g);
            if (!rows.length) return null;
            return (
              <div key={g} style={{ marginBottom: 4 }}>
                {g !== "Other" && <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700, padding: "6px 6px 3px" }}>{g}</div>}
                {rows.map((p) => {
                  const on = key === p.key;
                  const isPinned = pinned.includes(p.key);
                  return (
                    <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", borderRadius: 6, backgroundColor: on ? C.purpleBg : "transparent" }}>
                      <span onClick={() => { setRange(p.key); setMenu(false); }} style={{ flex: 1, cursor: "pointer", fontSize: 12, fontWeight: on ? 700 : 500, color: on ? C.purple : C.text, ...mono }}>
                        {p.key === "all" ? "All time" : `Last ${p.label}`}
                      </span>
                      <Star size={13} fill={isPinned ? C.amber : "transparent"} color={isPinned ? C.amber : C.textFaint}
                        style={{ cursor: "pointer" }} title={isPinned ? "Unpin from quick-bar" : "Pin to quick-bar"}
                        onClick={(e) => { e.stopPropagation(); togglePin(p.key); }} />
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 6 }}>
            <button onClick={openCustom} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "6px", borderRadius: 6, border: "none", backgroundColor: "transparent", color: C.purple, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <CalendarRange size={13} /> Custom range…
            </button>
          </div>
        </div>
      )}

      {/* custom range popover */}
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 14, boxShadow: C.shadowLg, width: 260 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 10, letterSpacing: "0.3px" }}>Custom range</div>
          <label style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>From</label>
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, marginTop: 8, display: "block" }}>To</label>
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
          <label style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 11, color: C.text, cursor: "pointer" }}>
            <input type="checkbox" checked={saveFav} onChange={(e) => setSaveFav(e.target.checked)} />
            <Star size={12} color={C.amber} /> Save as a favorite chip
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setOpen(false)} style={{ flex: 1, padding: "7px", borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={apply} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "none", backgroundColor: C.purple, color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: "100%", marginTop: 4, padding: "7px 9px", borderRadius: 6, border: `1px solid ${C.border}`,
  backgroundColor: C.bg, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

export { TimeframeFilter };
