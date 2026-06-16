import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Star, X, Users, Check } from "lucide-react";
import { BotTag } from "./common";
import { C, mono } from "../theme";

/* ═══════════════════════ TRADER SELECTOR (shared) ═══════════════════════
   Multi-select sibling of CoinSelector: a searchable dropdown to add/remove
   traders from a comparison set, plus an editable row of quick-access
   "favorite" chips. Star a trader to pin it; favorites persist in localStorage
   and are shared across every screen that compares traders (Pulse, Arena…). */

const KEY = "tl_fav_traders";
const loadFavs = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
};

const TraderSelector = ({ traders = [], selected = [], onToggle, colorOf = () => C.purple, label = "Compare traders" }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState(loadFavs);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const setAndSave = (next) => { setFavs(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } };
  const toggleFav = (name) => setAndSave(favs.includes(name) ? favs.filter((x) => x !== name) : [...favs, name]);

  const byName = useMemo(() => { const m = {}; traders.forEach((t) => { m[t.name] = t; }); return m; }, [traders]);
  const favTraders = favs.filter((n) => byName[n]);
  const isSel = (n) => selected.includes(n);

  const filtered = useMemo(
    () => traders.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
    [traders, query]
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
      {/* ── Primary "comparing N" dropdown ── */}
      <div ref={ref} style={{ position: "relative" }}>
        <button onClick={() => { setOpen(!open); setQuery(""); }} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "8px 13px",
          backgroundColor: C.card, border: `1px solid ${open ? C.purple : C.border}`, borderRadius: "8px", cursor: "pointer", transition: "border-color 0.15s",
        }}>
          <Users size={14} color={C.purple} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{label}</span>
          <span style={{ fontSize: "11px", fontWeight: 800, color: C.purple, ...mono, backgroundColor: C.purpleBg, padding: "1px 7px", borderRadius: 10 }}>{selected.length}</span>
          <ChevronDown size={15} color={C.textMuted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", width: "380px", boxShadow: C.shadowLg, overflow: "hidden" }}>
            <div style={{ padding: "12px 12px 8px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 22, top: 22, color: C.textMuted }} />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search traders…  ·  ★ to pin to quick access" style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: C.bg, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filtered.map((t) => {
                const on = isSel(t.name);
                const isFav = favs.includes(t.name);
                const color = colorOf(t.name);
                return (
                  <div key={t.name} style={{ display: "flex", alignItems: "center", borderLeft: on ? `3px solid ${color}` : "3px solid transparent", backgroundColor: on ? `${color}12` : "transparent" }}>
                    <button title={isFav ? "Unpin from quick access" : "Pin to quick access"} onClick={(e) => { e.stopPropagation(); toggleFav(t.name); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 6px 9px 12px", color: isFav ? C.amber : C.textFaint, display: "flex", alignItems: "center" }}>
                      <Star size={13} fill={isFav ? C.amber : "none"} />
                    </button>
                    <button onClick={() => onToggle(t.name)} style={{ flex: 1, display: "flex", alignItems: "center", padding: "9px 12px 9px 4px", border: "none", cursor: "pointer", gap: 9, background: "none", textAlign: "left" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: on ? color : C.textFaint, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: on ? C.text : C.textMuted }}>{t.name}</span>
                      <BotTag isBot={t.isBot} size={13} />
                      <span style={{ flex: 1 }} />
                      {t.winRate != null && <span style={{ fontSize: 11, fontWeight: 700, color: C.green, ...mono }}>{t.winRate}%</span>}
                      {on && <Check size={14} color={color} />}
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.textMuted, fontSize: 12 }}>No traders found</div>}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick-access favorite chips (editable) ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {favTraders.map((name) => {
          const t = byName[name];
          const on = isSel(name);
          const color = colorOf(name);
          return (
            <div key={name} className="fav-chip" style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 16, cursor: "pointer", border: `1px solid ${on ? color : C.border}`, backgroundColor: on ? `${color}15` : "transparent", color: on ? C.text : C.textFaint, transition: "all 0.15s" }} onClick={() => onToggle(name)}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: on ? color : C.textFaint }} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>{name}</span>
              {on && t.winRate != null && <span style={{ fontSize: 9, fontWeight: 700, color, ...mono }}>{t.winRate}%</span>}
              <button title="Unpin" onClick={(e) => { e.stopPropagation(); toggleFav(name); }} className="fav-x" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.textFaint, display: "flex", opacity: 0, transition: "opacity 0.15s" }}><X size={11} /></button>
            </div>
          );
        })}
        {favTraders.length === 0 && <span style={{ fontSize: 10, color: C.textFaint }}>★ a trader in the menu to pin it here</span>}
      </div>
      <style>{`.fav-chip:hover .fav-x { opacity: 1 !important; }`}</style>
    </div>
  );
};

export { TraderSelector };
