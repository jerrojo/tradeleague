import { useState } from "react";
import { CalendarRange, Clock } from "lucide-react";
import { useTimeframe } from "../contexts";
import { C, mono } from "../theme";

/* Global header time filter — presets + custom range, with the resolved window
   always visible so the user knows exactly what's being shown (LukeW). */
const toLocalInput = (ms) => {
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

const TimeframeFilter = () => {
  const { key, label, presets, setRange, setCustomRange, isFiltered, fromMs, toMs } = useTimeframe();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const openCustom = () => {
    setFrom(toLocalInput(Number.isFinite(fromMs) ? fromMs : Date.now() - 24 * 3600e3));
    setTo(toLocalInput(Number.isFinite(toMs) ? toMs : Date.now()));
    setOpen((v) => !v);
  };
  const apply = () => {
    const f = new Date(from).getTime(), t = new Date(to).getTime();
    if (f && t && f < t) { setCustomRange(f, t); setOpen(false); }
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
      {/* resolved window (always visible) */}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: isFiltered ? C.purple : C.textMuted, ...mono, whiteSpace: "nowrap" }}>
        <Clock size={12} /> {label}
      </span>
      {/* segmented presets */}
      <div style={{ display: "inline-flex", borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {presets.map((p) => {
          const on = key === p.key;
          return (
            <button key={p.key} onClick={() => { setRange(p.key); setOpen(false); }} style={{
              padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
              borderRight: `1px solid ${C.border}`, ...mono,
              backgroundColor: on ? C.purple : "transparent",
              color: on ? "#fff" : C.textMuted,
            }}>{p.label}</button>
          );
        })}
        <button onClick={openCustom} title="Custom range" style={{
          padding: "5px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 4,
          backgroundColor: key === "custom" ? C.purple : "transparent",
          color: key === "custom" ? "#fff" : C.textMuted,
        }}><CalendarRange size={13} /></button>
      </div>

      {/* custom range popover */}
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50, backgroundColor: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: 14, boxShadow: C.shadowLg, width: 260 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.text, marginBottom: 10, letterSpacing: "0.3px" }}>Custom range</div>
          <label style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>From</label>
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, marginTop: 8, display: "block" }}>To</label>
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
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
