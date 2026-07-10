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

/* rich-dropdown formatters (Fav · Coin · Price · 1h · 1d · 1w · Mkt Cap · Buy/Sell) */
const numColor = (v) => (v == null ? C.textMuted : v >= 0 ? C.green : C.red);
const pctNum = (v) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`);
const capFmt = (v) => {
  if (v == null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString()}`;
};
const DD_GRID = "24px 1.45fr 1.05fr 0.72fr 0.72fr 0.72fr 0.95fr 0.82fr";
const ddHead = { fontSize: 9, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase", color: C.textFaint };

/* tiny sparkline for the quick cards */
const MiniSpark = ({ closes, color }) => {
  if (!closes || closes.length < 2) return null;
  const w = 54, h = 16;
  const min = Math.min(...closes), max = Math.max(...closes), rng = max - min || 1;
  const step = w / (closes.length - 1);
  const pts = closes.map((c, i) => `${(i * step).toFixed(1)},${(h - ((c - min) / rng) * (h - 2) - 1).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
    </svg>
  );
};

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
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", width: "780px", maxWidth: "94vw", boxShadow: C.shadowLg, overflow: "hidden" }}>
            <div style={{ padding: "12px 12px 8px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 22, top: 22, color: C.textMuted }} />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search coins…  ·  ★ to pin to quick access" style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: C.bg, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            {categories.length > 0 && (
              <div style={{ display: "flex", gap: 2, padding: "0 12px 8px" }}>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCat(c)} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: cat === c ? C.purpleBg : "transparent", color: cat === c ? C.purple : C.textMuted }}>{c}</button>
                ))}
              </div>
            )}
            {/* column header */}
            <div style={{ display: "grid", gridTemplateColumns: DD_GRID, gap: 8, alignItems: "center", padding: "6px 12px", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
              <span />
              <span style={ddHead}>Coin</span>
              <span style={{ ...ddHead, textAlign: "right" }}>Price</span>
              <span style={{ ...ddHead, textAlign: "right" }}>1h</span>
              <span style={{ ...ddHead, textAlign: "right" }}>1d</span>
              <span style={{ ...ddHead, textAlign: "right" }}>1w</span>
              <span style={{ ...ddHead, textAlign: "right" }}>Mkt Cap</span>
              <span style={{ ...ddHead, textAlign: "center" }}>Signal</span>
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {filtered.map((c) => {
                const cm = meta[c] || {};
                const isSel = selected === c;
                const isFav = favs.includes(c);
                const call = cm.bias === "BULLISH" ? "BUY" : cm.bias === "BEARISH" ? "SELL" : ((cm.chg1d ?? 0) >= 0 ? "BUY" : "SELL");
                const buy = call === "BUY";
                const num = { fontSize: 11.5, fontWeight: 700, ...mono, textAlign: "right" };
                return (
                  <div key={c} className="cs-row" role="button" tabIndex={0}
                    onClick={() => { onSelect(c); setOpen(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c); setOpen(false); } }}
                    style={{ display: "grid", gridTemplateColumns: DD_GRID, gap: 8, alignItems: "center", padding: "8px 12px", cursor: "pointer", borderLeft: `3px solid ${isSel ? C.purple : "transparent"}`, backgroundColor: isSel ? C.purpleBg : "transparent", borderBottom: `1px solid ${C.border}` }}>
                    <button title={isFav ? "Unpin from quick access" : "Pin to quick access"} onClick={(e) => { e.stopPropagation(); toggleFav(c); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: isFav ? C.amber : C.textFaint, display: "flex", alignItems: "center" }}>
                      <Star size={13} fill={isFav ? C.amber : "none"} />
                    </button>
                    <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: isSel ? C.purple : C.text }}>{c}</span>
                      {cm.category && <span style={{ fontSize: 9.5, color: C.textFaint, marginLeft: 6 }}>{cm.category}</span>}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text, ...mono, textAlign: "right" }}>{cm.price ?? "—"}</span>
                    <span style={{ ...num, color: numColor(cm.chg1h) }}>{pctNum(cm.chg1h)}</span>
                    <span style={{ ...num, color: numColor(cm.chg1d) }}>{pctNum(cm.chg1d)}</span>
                    <span style={{ ...num, color: numColor(cm.chg1w) }}>{pctNum(cm.chg1w)}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: C.textMuted, ...mono, textAlign: "right" }}>{capFmt(cm.marketCap)}</span>
                    <span style={{ justifySelf: "center", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.4px", color: buy ? C.green : C.red, backgroundColor: `${buy ? C.green : C.red}1c`, padding: "3px 9px", borderRadius: 5 }}>{call}</span>
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
        {/* Quick cards — the "market overview strip": one glance per major
            (coin · model bias · price · Δ% · shape). Same editable favorites,
            promoted from bare chips to informative mini-cards. */}
        {favCoins.map((c) => {
          const cm = meta[c] || {};
          const isActive = selected === c;
          const chC = changeColor(cm.change);
          const biasC = cm.bias === "BULLISH" ? C.green : cm.bias === "BEARISH" ? C.red : C.textMuted;
          return (
            <div key={c} className="fav-chip" role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c); } }}
              style={{ position: "relative", display: "flex", flexDirection: "column", gap: 3, padding: "8px 11px", minWidth: 128, borderRadius: 8, cursor: "pointer", ...mono, border: `1px solid ${isActive ? C.purple : C.border}`, backgroundColor: isActive ? C.purpleBg : C.card }} onClick={() => onSelect(c)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: isActive ? C.purple : C.text }}>{c}<span style={{ color: C.textFaint, fontWeight: 400 }}>/{cm.pair || "USDT"}</span></span>
                {cm.bias && <span title={`Model bias: ${cm.bias}`} style={{ marginLeft: "auto", fontSize: 8, fontWeight: 800, letterSpacing: "0.3px", color: biasC, backgroundColor: `${biasC}1a`, padding: "1px 5px", borderRadius: 3 }}>{cm.bias === "BULLISH" ? "▲ BULL" : "▼ BEAR"}</span>}
                <button title="Unpin" onClick={(e) => { e.stopPropagation(); toggleFav(c); }} className="fav-x" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.textFaint, display: "flex", opacity: 0, transition: "opacity 0.15s" }}><X size={11} /></button>
              </div>
              {cm.price != null && <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>${cm.price}</span>}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {cm.change != null && <span style={{ fontSize: 10.5, fontWeight: 700, color: chC }}>{cm.change}</span>}
                <span style={{ marginLeft: "auto" }}><MiniSpark closes={cm.closes} color={chC} /></span>
              </div>
            </div>
          );
        })}
        {favCoins.length === 0 && <span style={{ fontSize: 10, color: C.textFaint }}>★ a coin in the menu to pin it here</span>}
      </div>
      <style>{`.fav-chip:hover .fav-x { opacity: 1 !important; } .cs-row:hover { background-color: ${C.cardHover} !important; }`}</style>
    </div>
  );
};

export { CoinSelector };
