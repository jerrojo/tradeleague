import { useMemo, useState } from "react";
import { Globe, ChevronUp, ChevronDown } from "lucide-react";
import { coinCandles, coinSignals, ROBOTIN_COINS } from "../../data/robotin";
import { smcCoins } from "../../data/mockData";
import { SectionHeader } from "../common";
import { useTimeframe } from "../../contexts";
import { C, cardStyle, mono } from "../../theme";

/* ═══════════════════════ MARKET PANORAMA ═══════════════════════
   The cross-coin lead for Markets: one scannable grid of every coin so you see
   the whole landscape at once — trend, price, move, how the crowd is leaning,
   how many signals are live, and where Robotín's model bias sits. Click any row
   to drop into that coin's full detail below. Respects the global timeframe. */

const fmtPx = (p) => {
  if (p == null) return "—";
  const a = Math.abs(p);
  if (a >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (a >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (a >= 0.01) return p.toFixed(4);
  return p.toPrecision(3);
};

/* tiny inline trend line for the row */
const Spark = ({ closes, color }) => {
  const w = 76, h = 22;
  const min = Math.min(...closes), max = Math.max(...closes), rng = max - min || 1;
  const step = w / (closes.length - 1);
  const pts = closes.map((c, i) => `${(i * step).toFixed(1)},${(h - ((c - min) / rng) * (h - 3) - 1.5).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
    </svg>
  );
};

const HeaderCell = ({ label, k, sortKey, sortDir, onSort, align = "left" }) => {
  const active = sortKey === k;
  return (
    <button
      onClick={() => onSort(k)}
      style={{
        display: "flex", alignItems: "center", gap: 3, justifyContent: align === "right" ? "flex-end" : "flex-start",
        background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%",
        fontSize: 9.5, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase",
        color: active ? C.text : C.textFaint, fontFamily: "inherit",
      }}
    >
      {label}
      {active && (sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
    </button>
  );
};

const GRID = "1.5fr 0.95fr 1.05fr 0.75fr 1.7fr 1.05fr 0.95fr";

const MarketPanorama = ({ selected, onSelect }) => {
  const { within, isFiltered } = useTimeframe();
  const [sortKey, setSortKey] = useState(null); // null = catalog order (majors first)
  const [sortDir, setSortDir] = useState("desc");

  const rows = useMemo(() => ROBOTIN_COINS.map((coin) => {
    const candles = coinCandles(coin);
    const closes = candles.map((c) => c.close);
    const last = closes[closes.length - 1], first = closes[0];
    const change = ((last - first) / first) * 100;
    const sigs = coinSignals(coin, candles).filter((s) => within(s.time));
    const appr = sigs.filter((s) => s.approved);
    const longs = appr.filter((s) => s.dir === "LONG").length;
    const shorts = appr.filter((s) => s.dir === "SHORT").length;
    const tot = longs + shorts;
    const longPct = tot ? Math.round((longs / tot) * 100) : null;
    const active = sigs.filter((s) => s.status === "active" || s.status === "pending").length;
    const meta = smcCoins[coin] || {};
    return { coin, closes, last, change, total: sigs.length, longPct, longs, shorts, active, bias: meta.bias || null, cat: meta.category || null };
  }), [within]);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const dir = sortDir === "desc" ? -1 : 1;
    const val = (r) => {
      if (sortKey === "change") return r.change;
      if (sortKey === "price") return r.last;
      if (sortKey === "sentiment") return r.longPct ?? -1;
      if (sortKey === "signals") return r.active * 1000 + r.total; // live signals float to the top
      if (sortKey === "bias") return r.bias === "BULLISH" ? 1 : r.bias === "BEARISH" ? -1 : 0;
      return 0;
    };
    return [...rows].sort((a, b) => (val(a) - val(b)) * dir);
  }, [rows, sortKey, sortDir]);

  const onSort = (k) => {
    if (sortKey === k) { setSortDir((d) => (d === "desc" ? "asc" : "desc")); }
    else { setSortKey(k); setSortDir("desc"); }
  };

  // panorama summary — the one-line read of the whole board
  const bulls = rows.filter((r) => r.bias === "BULLISH").length;
  const live = rows.filter((r) => r.active > 0).length;
  const up = rows.filter((r) => r.change >= 0).length;

  return (
    <div>
      <SectionHeader
        icon={Globe}
        title="Market panorama"
        subtitle={`${rows.length} coins · ${up} up / ${rows.length - up} down · ${bulls} model-bullish · ${live} with live signals${isFiltered ? " · in range" : ""} · click a coin for full detail`}
      />
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {/* header row */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          <HeaderCell label="Coin" k="coin" sortKey={sortKey} sortDir={sortDir} onSort={() => { setSortKey(null); }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint }}>Trend</span>
          <HeaderCell label="Price" k="price" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
          <HeaderCell label="Δ" k="change" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
          <HeaderCell label="Sentiment" k="sentiment" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <HeaderCell label="Signals" k="signals" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
          <HeaderCell label="Model" k="bias" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
        </div>
        {/* rows */}
        {sorted.map((r) => {
          const isSel = r.coin === selected;
          const chColor = r.change >= 0 ? C.green : C.red;
          const sparkColor = r.change >= 0 ? C.green : C.red;
          const biasColor = r.bias === "BULLISH" ? C.green : r.bias === "BEARISH" ? C.red : C.textMuted;
          return (
            <div
              key={r.coin}
              onClick={() => onSelect(r.coin)}
              className="panorama-row"
              style={{
                display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center",
                padding: "9px 14px", cursor: "pointer",
                borderLeft: `3px solid ${isSel ? C.purple : "transparent"}`,
                backgroundColor: isSel ? C.purpleBg : "transparent",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {/* coin + category */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: isSel ? C.purple : C.text, ...mono }}>{r.coin}</span>
                {r.cat && <span style={{ fontSize: 9, color: C.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.cat}</span>}
              </div>
              {/* sparkline */}
              <div><Spark closes={r.closes} color={sparkColor} /></div>
              {/* price */}
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, ...mono, textAlign: "right" }}>{fmtPx(r.last)}</div>
              {/* change */}
              <div style={{ fontSize: 12, fontWeight: 800, color: chColor, ...mono, textAlign: "right" }}>{r.change >= 0 ? "+" : ""}{r.change.toFixed(1)}%</div>
              {/* sentiment bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {r.longPct == null ? (
                  <span style={{ fontSize: 10, color: C.textFaint }}>no signals</span>
                ) : (
                  <>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, overflow: "hidden", display: "flex", backgroundColor: C.bg, minWidth: 54 }}>
                      <div style={{ width: `${r.longPct}%`, backgroundColor: C.green }} />
                      <div style={{ width: `${100 - r.longPct}%`, backgroundColor: C.red }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, ...mono, color: r.longPct >= 55 ? C.green : r.longPct <= 45 ? C.red : C.textMuted, minWidth: 50, whiteSpace: "nowrap" }}>{r.longPct}%L</span>
                  </>
                )}
              </div>
              {/* signals: active + total */}
              <div style={{ textAlign: "right", ...mono }}>
                {r.active > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: C.amber }}>{r.active} live</span>}
                <span style={{ fontSize: 10.5, color: C.textMuted, marginLeft: r.active > 0 ? 6 : 0 }}>{r.total} sig</span>
              </div>
              {/* model bias */}
              <div style={{ textAlign: "right" }}>
                {r.bias ? (
                  <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.4px", color: biasColor, backgroundColor: `${biasColor}1c`, padding: "2px 7px", borderRadius: 4 }}>{r.bias}</span>
                ) : <span style={{ fontSize: 10, color: C.textFaint }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`.panorama-row:hover { background-color: ${C.cardHover} !important; }`}</style>
    </div>
  );
};

export { MarketPanorama };
