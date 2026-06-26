import { useMemo, useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { Globe, ChevronUp, ChevronDown, LayoutGrid, Table as TableIcon } from "lucide-react";
import { coinCandles, coinSignals, ROBOTIN_COINS } from "../../data/robotin";
import { smcCoins } from "../../data/mockData";
import { CollapsibleSection } from "../common";
import { useTimeframe } from "../../contexts";
import { C, mono } from "../../theme";

const a2 = (a) => Math.max(0, Math.min(255, Math.round(a * 255))).toString(16).padStart(2, "0");

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
  const [view, setView] = useState("table");     // "table" | "map"
  const [sizeBy, setSizeBy] = useState("signals"); // signals | activity | equal
  const [colorBy, setColorBy] = useState("change"); // change | sentiment

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

  // ── treemap (heatmap) data + colour ──
  const chgColor = (v) => `${v >= 0 ? C.green : C.red}${a2(0.16 + Math.min(1, Math.abs(v || 0) / 6) * 0.6)}`;
  const sentColor = (lp) => (lp == null ? `${C.textFaint}22` : `${lp >= 55 ? C.green : lp <= 45 ? C.red : C.textMuted}${a2(0.18 + Math.min(1, Math.abs((lp - 50) / 50)) * 0.55)}`);
  const sizeVal = (r) => (sizeBy === "equal" ? 1 : sizeBy === "activity" ? (r.active || 0.3) : (r.total || 0.5));
  const treeData = sorted.map((r) => ({ name: r.coin, size: sizeVal(r), change: r.change, longPct: r.longPct, total: r.total, active: r.active }));
  const renderTile = (props) => {
    const { x, y, width, height, name, change, longPct } = props;
    if (width <= 0 || height <= 0 || !name) return null;
    const fill = colorBy === "sentiment" ? sentColor(longPct) : chgColor(change);
    const isSel = name === selected;
    const showText = width > 40 && height > 26;
    return (
      <g onClick={() => onSelect(name)} style={{ cursor: "pointer" }}>
        <rect x={x} y={y} width={width} height={height} fill={fill} stroke={isSel ? C.purple : C.bg} strokeWidth={isSel ? 2.5 : 2} rx={3} />
        {showText && (
          <>
            <text x={x + 7} y={y + 17} fill="#fff" stroke="none" fontSize={12} fontWeight="800" style={{ fontFamily: "monospace" }}>{name}</text>
            <text x={x + 7} y={y + 31} fill="#fff" stroke="none" fontSize={10} fontWeight="700" style={{ fontFamily: "monospace" }}>
              {colorBy === "sentiment" ? (longPct == null ? "—" : `${longPct}%L`) : `${change >= 0 ? "+" : ""}${(change || 0).toFixed(1)}%`}
            </text>
          </>
        )}
      </g>
    );
  };
  const TileTip = ({ active: on, payload }) => {
    if (!on || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 11, ...mono }}>
        <div style={{ fontWeight: 800, color: C.text, marginBottom: 2 }}>{d.name}/USDT</div>
        <div style={{ color: d.change >= 0 ? C.green : C.red }}>{d.change >= 0 ? "+" : ""}{(d.change || 0).toFixed(1)}% Δ</div>
        <div style={{ color: C.textMuted }}>{d.longPct == null ? "no signals" : `${d.longPct}% long`} · {d.total} sig{d.active ? ` · ${d.active} live` : ""}</div>
      </div>
    );
  };

  const segBtn = (on) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none", backgroundColor: on ? C.purple : "transparent", color: on ? "#fff" : C.textMuted, fontFamily: "inherit" });
  const miniSel = { backgroundColor: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 11, fontWeight: 600, padding: "5px 8px", cursor: "pointer", outline: "none", fontFamily: "inherit" };

  const controls = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {view === "map" && (
        <>
          <select value={sizeBy} onChange={(e) => setSizeBy(e.target.value)} style={miniSel} title="Tile size by" aria-label="Size tiles by">
            <option value="signals">Size: signals</option>
            <option value="activity">Size: live signals</option>
            <option value="equal">Size: equal</option>
          </select>
          <select value={colorBy} onChange={(e) => setColorBy(e.target.value)} style={miniSel} title="Tile color by" aria-label="Color tiles by">
            <option value="change">Color: Δ%</option>
            <option value="sentiment">Color: sentiment</option>
          </select>
        </>
      )}
      <div style={{ display: "inline-flex", borderRadius: 7, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <button style={segBtn(view === "table")} onClick={() => setView("table")} aria-label="Table view"><TableIcon size={13} /> Table</button>
        <button style={segBtn(view === "map")} onClick={() => setView("map")} aria-label="Heatmap view"><LayoutGrid size={13} /> Heatmap</button>
      </div>
    </div>
  );

  return (
    <CollapsibleSection
      icon={Globe}
      title="Market panorama"
      summary={`${rows.length} coins · ${up} up / ${rows.length - up} down · ${bulls} model-bullish · ${live} with live signals${isFiltered ? " · in range" : ""} · click a coin for detail`}
      right={controls}
      accent={C.cyan}
      persistKey="markets-panorama"
      maxBody={view === "table" ? 520 : undefined}
    >
      {view === "map" && (
        <div style={{ padding: 12 }}>
          <ResponsiveContainer width="100%" height={420}>
            <Treemap data={treeData} dataKey="size" stroke={C.bg} content={renderTile} isAnimationActive={false}>
              <Tooltip content={<TileTip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}
      {view === "table" && (
      <div>
        {/* header row (sticky inside the scroll body) */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, backgroundColor: C.card, position: "sticky", top: 0, zIndex: 2 }}>
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
      )}
      <style>{`.panorama-row:hover { background-color: ${C.cardHover} !important; }`}</style>
    </CollapsibleSection>
  );
};

export { MarketPanorama };
