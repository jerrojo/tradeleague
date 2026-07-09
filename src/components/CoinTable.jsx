import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { CANDLES_BY_COIN, MARKET_META } from "../data/robotin";
import { smcCoins } from "../data/mockData";
import { useLivePrices } from "../contexts";
import { C, mono } from "../theme";

/* ═══════════════════════ COIN TABLE (chart-side selector) ═══════════════════════
   The richer coin picker that lives with the chart: one row per coin with price and
   1h / 1d / 1w moves, market cap, and the model's BUY/SELL call. Star a coin to pin
   it to the top (favorites persist and are shared with the rest of the app). Click a
   row to load that coin into the chart. Prices/Δ go live when the tape is reachable;
   1h / 1w and market cap are the deterministic SIM book. */

const KEY = "tl_fav_coins";
const DEFAULT_FAVS = ["BTC", "ETH", "SOL", "BNB", "XRP"];
const loadFavs = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : DEFAULT_FAVS; } catch { return DEFAULT_FAVS; } };

const fmtPx = (p) => {
  if (p == null) return "—";
  const a = Math.abs(p);
  if (a >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (a >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (a >= 0.01) return p.toFixed(4);
  return p.toPrecision(3);
};
const capFmt = (v) => {
  if (v == null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString()}`;
};
const pct = (v) => `${v >= 0 ? "+" : ""}${(v ?? 0).toFixed(1)}%`;

const GRID = "26px 1.25fr 1fr 0.72fr 0.72fr 0.72fr 0.95fr 0.85fr";

const CoinTable = ({ coins = [], selected, onSelect }) => {
  const tape = useLivePrices();
  const live = tape.status === "live" ? tape.prices : null;
  const [favs, setFavs] = useState(loadFavs);
  const [query, setQuery] = useState("");
  const save = (next) => { setFavs(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } };
  const toggleFav = (c) => save(favs.includes(c) ? favs.filter((x) => x !== c) : [...favs, c]);

  const rows = useMemo(() => coins.map((coin) => {
    const candles = CANDLES_BY_COIN[coin] || [];
    const closes = candles.map((c) => c.close);
    const simLast = closes.length ? closes[closes.length - 1] : null;
    const first = closes.length ? closes[0] : null;
    const simChg = first ? ((simLast - first) / first) * 100 : 0;
    const lv = live?.[coin];
    const price = lv?.px ?? simLast;
    const chg1d = lv?.chg24h ?? simChg;
    const mm = MARKET_META[coin] || {};
    const meta = smcCoins[coin] || {};
    // BUY/SELL: model bias first, else fall back to the crowd's lean (neutral if flat)
    const call = meta.bias === "BULLISH" ? "BUY" : meta.bias === "BEARISH" ? "SELL" : (chg1d >= 0 ? "BUY" : "SELL");
    return { coin, price, chg1h: mm.chg1h ?? 0, chg1d, chg1w: mm.chg1w ?? 0, marketCap: mm.marketCap, call };
  }), [coins, live]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? rows.filter((r) => r.coin.toLowerCase().includes(q)) : rows;
    // favorites pinned on top, then by market cap descending
    return [...list].sort((a, b) => {
      const fa = favs.includes(a.coin) ? 1 : 0, fb = favs.includes(b.coin) ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return (b.marketCap || 0) - (a.marketCap || 0);
    });
  }, [rows, query, favs]);

  const Head = ({ children, align = "left" }) => (
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.4px", textTransform: "uppercase", color: C.textFaint, textAlign: align, justifySelf: align === "right" ? "end" : align === "center" ? "center" : "start" }}>{children}</span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* search */}
      <div style={{ position: "relative", padding: "2px 2px 10px" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: 9, color: C.textMuted }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search coin…"
          style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 7, border: `1px solid ${C.border}`, backgroundColor: C.bg, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      </div>
      {/* header */}
      <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 8, alignItems: "center", padding: "6px 10px", borderBottom: `1px solid ${C.border}` }}>
        <span />
        <Head>Coin</Head>
        <Head align="right">Price</Head>
        <Head align="right">1h</Head>
        <Head align="right">1d</Head>
        <Head align="right">1w</Head>
        <Head align="right">Mkt Cap</Head>
        <Head align="center">Signal</Head>
      </div>
      {/* rows */}
      <div style={{ overflowY: "auto", maxHeight: 360 }}>
        {filtered.map((r) => {
          const isSel = r.coin === selected;
          const isFav = favs.includes(r.coin);
          const buy = r.call === "BUY";
          const cell = (v) => ({ fontSize: 11.5, fontWeight: 700, ...mono, textAlign: "right", color: v >= 0 ? C.green : C.red });
          return (
            <div key={r.coin} className="ctbl-row" role="button" tabIndex={0}
              onClick={() => onSelect(r.coin)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.coin); } }}
              style={{ display: "grid", gridTemplateColumns: GRID, gap: 8, alignItems: "center", padding: "8px 10px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${isSel ? C.purple : "transparent"}`, backgroundColor: isSel ? C.purpleBg : "transparent" }}>
              <button title={isFav ? "Unpin" : "Pin to top"} onClick={(e) => { e.stopPropagation(); toggleFav(r.coin); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: isFav ? C.amber : C.textFaint, display: "flex", alignItems: "center" }}>
                <Star size={13} fill={isFav ? C.amber : "none"} />
              </button>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: isSel ? C.purple : C.text, ...mono, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.coin}<span style={{ color: C.textFaint, fontWeight: 400 }}>/USDT</span></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text, ...mono, textAlign: "right" }}>{fmtPx(r.price)}</span>
              <span style={cell(r.chg1h)}>{pct(r.chg1h)}</span>
              <span style={cell(r.chg1d)}>{pct(r.chg1d)}</span>
              <span style={cell(r.chg1w)}>{pct(r.chg1w)}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.textMuted, ...mono, textAlign: "right" }}>{capFmt(r.marketCap)}</span>
              <span style={{ justifySelf: "center", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.4px", color: buy ? C.green : C.red, backgroundColor: `${buy ? C.green : C.red}1c`, padding: "3px 9px", borderRadius: 5 }}>{r.call}</span>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: 18, textAlign: "center", color: C.textMuted, fontSize: 12 }}>No coins found</div>}
      </div>
      <style>{`.ctbl-row:hover { background-color: ${C.cardHover} !important; }`}</style>
    </div>
  );
};

export { CoinTable };
