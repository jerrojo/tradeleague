import { useEffect, useState } from "react";
import { CalendarRange, ChevronDown, Clock, Star, X } from "lucide-react";
import { useTimeframe } from "../contexts";
import { RangeCalendar } from "./RangeCalendar";
import { C, mono } from "../theme";

/* Global header time filter — TradingView-style: pin any range to the quick bar
   (star), pick the rest from a grouped "Range" dropdown (Minutes/Hours/Days/…),
   favorite custom ranges as chips, and the resolved window is always visible.
   The custom range opens a best-practice dual-calendar picker (RangeCalendar). */
const GROUPS = ["Minutes", "Hours", "Days", "Weeks", "Months", "Other"];

const TimeframeFilter = () => {
  const { key, label, presets, pinned, pinnedRanges, togglePin, setRange, setCustomRange, isFiltered, fromMs, toMs, favorites, addFavorite, removeFavorite, activeFavId } = useTimeframe();
  const [open, setOpen] = useState(false);       // custom range popover
  const [menu, setMenu] = useState(false);       // grouped range dropdown

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

  const openCustom = () => { setMenu(false); setOpen((v) => !v); };

  const customActive = key === "custom";

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
      {/* ONE consolidated control: quick presets + a menu that holds favorites, all ranges and custom */}
      <div style={{ display: "inline-flex", borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {pinnedRanges.map((p) => {
          const on = key === p.key;
          return (
            <button key={p.key} onClick={() => { setRange(p.key); setMenu(false); }} style={{
              padding: "6px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
              borderRight: `1px solid ${C.border}`, ...mono,
              backgroundColor: on ? C.purple : "transparent",
              color: on ? "#fff" : C.textMuted,
            }}>{p.label}</button>
          );
        })}
        {/* menu trigger — shows the active custom window inline when one is set */}
        <button onClick={() => { setMenu((v) => !v); setOpen(false); }} title="All ranges & custom" style={{
          padding: "6px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 5, ...mono,
          backgroundColor: customActive || menu ? (customActive ? C.purple : C.cardElev) : "transparent",
          color: customActive ? "#fff" : menu ? C.text : C.textMuted, whiteSpace: "nowrap",
        }}>{customActive && <><Clock size={11} /> {label}</>}<ChevronDown size={13} style={{ transform: menu ? "rotate(180deg)" : "none", transition: "transform .15s" }} /></button>
      </div>

      {/* dropdown — favorites, all ranges (star to pin), and custom */}
      {menu && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 8, boxShadow: C.shadowLg, width: 240, maxHeight: 420, overflowY: "auto" }}>
          {favorites.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700, padding: "6px 6px 3px" }}>Favorites</div>
              {favorites.map((f) => {
                const on = activeFavId === f.id;
                return (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", borderRadius: 6, backgroundColor: on ? `${C.amber}1c` : "transparent" }}>
                    <Star size={13} fill={C.amber} color={C.amber} />
                    <span onClick={() => { setCustomRange(f.from, f.to); setMenu(false); }} style={{ flex: 1, cursor: "pointer", fontSize: 12, fontWeight: on ? 700 : 500, color: on ? C.amber : C.text, ...mono }}>{f.label}</span>
                    <X size={12} style={{ cursor: "pointer", opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); removeFavorite(f.id); }} />
                  </div>
                );
              })}
              <div style={{ borderTop: `1px solid ${C.border}`, margin: "6px 0 2px" }} />
            </div>
          )}
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

      {/* custom range — best-practice dual-calendar picker with preset rail */}
      {open && (
        <RangeCalendar
          fromMs={Number.isFinite(fromMs) ? fromMs : null}
          toMs={Number.isFinite(toMs) ? toMs : null}
          onApplyRange={(f, t, fav) => { setCustomRange(f, t); if (fav) addFavorite(f, t); setOpen(false); }}
          onApplyAll={() => { setRange("all"); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export { TimeframeFilter };
