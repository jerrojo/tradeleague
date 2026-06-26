import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Star, X } from "lucide-react";
import { C, mono } from "../theme";

/* ═══════════════════════ COIN SELECTOR (shared) ═══════════════════════
   Primary coin display + searchable dropdown, with an editable row of
   quick-access "favorite" chips. Star a coin in the dropdown (or the ☆ on a
   chip) to pin/unpin it. Favorites persist in localStorage and are shared
   across every screen that uses this selector. */

const DEFAULT_FAVS = ["BTC", "ETH", "SOL", "BNB", "XRP"];
const KEY = "tl_fav_coins";

const loadFavs = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : DEFAULT_FAVS; }
  catch { return DEFAULT_FAVS; }
};

const changeColor = (ch) => (ch == null ? C.textMuted : String(ch).trim().startsWith("-") ? C.red : C.green);

const CoinSelector = ({ coins = [], selected, onSelect, meta = {}, categories = [] }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(categories[0] || "All");
  const [favs, setFavs] = useState(loadFavs);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const setAndSave = (next) => { setFavs(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } };
  const toggleFav = (c) => setAndSave(favs.includes(c) ? favs.filter((x) => x !== c) : [...favs, c]);

  const m = meta[selected] || {};
  const favCoins = favs.filter((c) => coins.includes(c));

  const filtered = useMemo(() => coins.filter((c) => {
    const okQ = c.toLowerCase().includes(query.toLowerCase());
    const okC = !categories.length || cat === "All" || meta[c]?.category === cat;
    return okQ && okC;
  }), [coins, query, cat, categories, meta]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      {/* ── Primary display + dropdown ── */}
      <div ref={ref} style={{ position: "relative" }}>
        <button onClick={() => { setOpen(!open); setQuery(""); }} style={{
          display: "flex", alignItems: "center", gap: "12px", padding: "9px 14px",
          backgroundColor: C.card, border: `1px solid ${open ? C.purple : C.border}`, borderRadius: "8px", cursor: "pointer", transition: "border-color 0.15s",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
            <span style={{ fontSize: "20px", fontWeight: "800", color: C.text, ...mono }}>{selected}</span>
            <span style={{ fontSize: "12px", color: C.textMuted }}>/{m.pair || "USDT"}</span>
          </div>
          {m.price != null && <><div style={{ width: 1, height: 22, backgroundColor: C.border }} />
            <span style={{ fontSize: "16px", fontWeight: "700", color: C.text, ...mono }}>{m.price}</span></>}
          {m.change != null && <span style={{ fontSize: "13px", fontWeight: "700", color: changeColor(m.change), ...mono }}>{m.change}</span>}
          {m.bias && <><div style={{ width: 1, height: 22, backgroundColor: C.border }} />
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
              <span style={{ fontSize: "7px", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.4px" }}>Model bias</span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: m.bias === "BULLISH" ? C.green : C.red, textTransform: "uppercase" }}>{m.bias}</span>
            </span></>}
          <ChevronDown size={16} color={C.textMuted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginLeft: 2 }} />
        </button>

        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", width: "520px", maxWidth: "92vw", boxShadow: C.shadowLg, overflow: "hidden" }}>
            <div style={{ padding: "12px 12px 8px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 22, top: 22, color: C.textMuted }} />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search coins…  ·  ★ to pin to quick access" style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: C.bg, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            </div>
            {categories.length > 0 && (
              <div style={{ display: "flex", gap: 2, padding: "0 12px 8px", borderBottom: `1px solid ${C.border}` }}>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCat(c)} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: cat === c ? C.purpleBg : "transparent", color: cat === c ? C.purple : C.textMuted }}>{c}</button>
                ))}
              </div>
            )}
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {filtered.map((c) => {
                const cm = meta[c] || {};
                const isSel = selected === c;
                const isFav = favs.includes(c);
                return (
                  <div key={c} style={{ display: "flex", alignItems: "center", borderLeft: isSel ? `3px solid ${C.purple}` : "3px solid transparent", backgroundColor: isSel ? C.purpleBg : "transparent" }}>
                    <button title={isFav ? "Unpin from quick access" : "Pin to quick access"} onClick={(e) => { e.stopPropagation(); toggleFav(c); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 6px 8px 12px", color: isFav ? C.amber : C.textFaint, display: "flex", alignItems: "center" }}>
                      <Star size={13} fill={isFav ? C.amber : "none"} />
                    </button>
                    <button onClick={() => { onSelect(c); setOpen(false); }} style={{ flex: 1, display: "flex", alignItems: "center", padding: "8px 14px 8px 4px", border: "none", cursor: "pointer", gap: 10, background: "none", textAlign: "left" }}>
                      <span style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSel ? C.purple : C.text }}>{c}</span>
                        {cm.category && <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 8 }}>{cm.category}</span>}
                      </span>
                      {cm.longPct != null && (
                        <span title={`${cm.longPct}% long / ${100 - cm.longPct}% short`} style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 78, justifyContent: "flex-end" }}>
                          <span style={{ width: 32, height: 5, borderRadius: 3, overflow: "hidden", display: "flex", backgroundColor: C.bg }}>
                            <span style={{ width: `${cm.longPct}%`, backgroundColor: C.green }} />
                            <span style={{ width: `${100 - cm.longPct}%`, backgroundColor: C.red }} />
                          </span>
                          <span style={{ fontSize: 9.5, color: C.textMuted, ...mono }}>{cm.active ? `${cm.active}•` : ""}{cm.signals}s</span>
                        </span>
                      )}
                      {cm.bias && <span title={`Model bias: ${cm.bias}`} style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: cm.bias === "BULLISH" ? C.green : C.red, flexShrink: 0 }} />}
                      {cm.price != null && <span style={{ fontSize: 12, fontWeight: 600, color: C.text, ...mono, minWidth: 72, textAlign: "right" }}>{cm.price}</span>}
                      {cm.change != null && <span style={{ fontSize: 11, fontWeight: 700, ...mono, minWidth: 50, textAlign: "right", color: changeColor(cm.change) }}>{cm.change}</span>}
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: C.textMuted, fontSize: 12 }}>No coins found</div>}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick-access favorite chips (editable) ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {favCoins.map((c) => {
          const cm = meta[c] || {};
          const isActive = selected === c;
          return (
            <div key={c} className="fav-chip" style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, cursor: "pointer", ...mono, border: `1px solid ${isActive ? C.purple : C.border}`, backgroundColor: isActive ? C.purpleBg : "transparent", color: isActive ? C.purple : C.text }} onClick={() => onSelect(c)}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{c}</span>
              {cm.change != null && <span style={{ fontSize: 9, fontWeight: 700, color: changeColor(cm.change), backgroundColor: `${changeColor(cm.change)}1c`, padding: "1px 4px", borderRadius: 3 }}>{cm.change}</span>}
              <button title="Unpin" onClick={(e) => { e.stopPropagation(); toggleFav(c); }} className="fav-x" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.textFaint, display: "flex", opacity: 0, transition: "opacity 0.15s" }}><X size={11} /></button>
            </div>
          );
        })}
        {favCoins.length === 0 && <span style={{ fontSize: 10, color: C.textFaint }}>★ a coin in the menu to pin it here</span>}
      </div>
      <style>{`.fav-chip:hover .fav-x { opacity: 1 !important; }`}</style>
    </div>
  );
};

export { CoinSelector };
