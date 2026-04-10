import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";

/* ═══════════════════════════════════════════════════════════════
   Trade Signal Visualization
   Candlestick chart with per-trader trade highlighting,
   entry/exit markers, price level lines, and 3-state UX:
     1) No selection → normal candles
     2) Trader selected → overview (all trades as colored zones)
     3) Trade selected → focus (dim outside, light inside)
   ═══════════════════════════════════════════════════════════════ */

// ─── Color Palette (dark trading theme) ───
const P = {
  bg:        "#0d1117",
  panelBg:   "#161b22",
  cardBg:    "#1c2333",
  border:    "#30363d",
  text:      "#e6edf3",
  muted:     "#8b949e",
  dim:       "#6e7681",
  green:     "#3fb950",
  greenDim:  "rgba(63,185,80,0.08)",
  red:       "#f85149",
  redDim:    "rgba(248,81,73,0.08)",
  blue:      "#58a6ff",
  dimCandle: "#2a2e35",
};

const mono = "'SF Mono','Cascadia Code','Fira Code','Consolas',monospace";
const sansFont = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

// ─── Seeded random for deterministic mock data ───
const srand = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── Generate OHLCV candle data ───
function generateCandles(count = 80, seed = 42) {
  const candles = [];
  let price = 67500;
  for (let i = 0; i < count; i++) {
    const r1 = srand(seed + i * 7);
    const r2 = srand(seed + i * 13 + 100);
    const r3 = srand(seed + i * 19 + 200);
    const r4 = srand(seed + i * 23 + 300);
    const drift = (r1 - 0.48) * 600;
    const open = price;
    const close = open + drift;
    const high = Math.max(open, close) + r2 * 300;
    const low = Math.min(open, close) - r3 * 300;
    const vol = Math.round(1200 + r4 * 8000);
    const d = new Date(2026, 2, 1);
    d.setDate(d.getDate() + i);
    candles.push({
      index: i,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: vol,
    });
    price = close;
  }
  return candles;
}

// ─── Mock traders with trades ───
const TRADERS = [
  {
    id: "t1", name: "Scalp King", color: "#58a6ff", avatar: "👑",
    winRate: 78,
    trades: [
      { entry: 8, exit: 18, side: "long", entryPrice: 67800, exitPrice: 69950 },
      { entry: 28, exit: 35, side: "short", entryPrice: 68400, exitPrice: 67100 },
      { entry: 50, exit: 61, side: "long", entryPrice: 67200, exitPrice: 68800 },
    ],
  },
  {
    id: "t2", name: "Crypto Ninja", color: "#3fb950", avatar: "🥷",
    winRate: 72,
    trades: [
      { entry: 5, exit: 14, side: "long", entryPrice: 67600, exitPrice: 68900 },
      { entry: 22, exit: 30, side: "long", entryPrice: 67900, exitPrice: 68500 },
      { entry: 45, exit: 55, side: "short", entryPrice: 68200, exitPrice: 67500 },
    ],
  },
  {
    id: "t3", name: "Smart Money", color: "#d29922", avatar: "🧠",
    winRate: 81,
    trades: [
      { entry: 12, exit: 24, side: "long", entryPrice: 67500, exitPrice: 69200 },
      { entry: 38, exit: 48, side: "short", entryPrice: 68100, exitPrice: 66900 },
      { entry: 60, exit: 72, side: "long", entryPrice: 67000, exitPrice: 69100 },
    ],
  },
  {
    id: "t4", name: "Phoenix Rise", color: "#f0883e", avatar: "🔥",
    winRate: 68,
    trades: [
      { entry: 3, exit: 11, side: "long", entryPrice: 67700, exitPrice: 68400 },
      { entry: 32, exit: 42, side: "short", entryPrice: 68500, exitPrice: 67800 },
      { entry: 56, exit: 66, side: "long", entryPrice: 67100, exitPrice: 68300 },
    ],
  },
];

// Derive P&L
function calcPnl(trade) {
  if (trade.side === "long") return ((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100);
  return ((trade.entryPrice - trade.exitPrice) / trade.entryPrice * 100);
}

// ─── SVG Glow filter definition ───
function GlowFilters() {
  return (
    <defs>
      <filter id="glow-sm" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glow-lg" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function TradeSignalViz() {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 960, h: 520 });
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [viewRange, setViewRange] = useState([0, 79]);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Responsive sizing
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setDims({ w: Math.max(400, w), h: Math.max(320, Math.min(600, w * 0.55)) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const candles = useMemo(() => generateCandles(80, 42), []);

  // Auto-center on trade selection
  useEffect(() => {
    if (!selectedTrade) return;
    const mid = Math.floor((selectedTrade.entry + selectedTrade.exit) / 2);
    const halfView = 25;
    const start = Math.max(0, mid - halfView);
    const end = Math.min(candles.length - 1, start + halfView * 2);
    setViewRange([start, end]);
  }, [selectedTrade, candles.length]);

  // Chart margins & dimensions
  const margin = { top: 56, right: 72, bottom: 32, left: 64 };
  const chartW = dims.w - margin.left - margin.right;
  const chartH = dims.h - margin.top - margin.bottom;

  // Visible candles
  const visible = useMemo(() => {
    return candles.slice(viewRange[0], viewRange[1] + 1);
  }, [candles, viewRange]);

  // D3 scales
  const xScale = useMemo(() => {
    return d3.scaleBand()
      .domain(visible.map((_, i) => i))
      .range([0, chartW])
      .padding(0.22);
  }, [visible, chartW]);

  const yScale = useMemo(() => {
    const allHigh = d3.max(visible, d => d.high);
    const allLow = d3.min(visible, d => d.low);
    const pad = (allHigh - allLow) * 0.1;
    return d3.scaleLinear()
      .domain([allLow - pad, allHigh + pad])
      .range([chartH, 0]);
  }, [visible, chartH]);

  // Volume scale
  const volH = 40;
  const volScale = useMemo(() => {
    const maxVol = d3.max(visible, d => d.volume) || 1;
    return d3.scaleLinear().domain([0, maxVol]).range([0, volH]);
  }, [visible, volH]);

  // Map trade candle indices to visible indices
  const tradeToVisible = useCallback((tradeEntry, tradeExit) => {
    const vStart = Math.max(0, tradeEntry - viewRange[0]);
    const vEnd = Math.min(visible.length - 1, tradeExit - viewRange[0]);
    return { vStart, vEnd };
  }, [viewRange, visible.length]);

  // Determine candle dimming
  const isDimmed = useCallback((candleGlobalIdx) => {
    if (!selectedTrade) return false;
    return candleGlobalIdx < selectedTrade.entry || candleGlobalIdx > selectedTrade.exit;
  }, [selectedTrade]);

  // Y axis ticks
  const yTicks = useMemo(() => yScale.ticks(6), [yScale]);
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(visible.length / 8));
    return visible.filter((_, i) => i % step === 0);
  }, [visible]);

  // ─── Handlers ───
  const handleTraderClick = (trader) => {
    if (selectedTrader?.id === trader.id) {
      setSelectedTrader(null);
      setSelectedTrade(null);
      setViewRange([0, 79]);
    } else {
      setSelectedTrader(trader);
      setSelectedTrade(null);
      setViewRange([0, 79]);
    }
  };

  const handleTradeClick = (trade) => {
    if (selectedTrade === trade) {
      setSelectedTrade(null);
      setViewRange([0, 79]);
    } else {
      setSelectedTrade(trade);
    }
  };

  const trans = prefersReducedMotion.current ? "none" : "opacity 0.4s ease, fill 0.4s ease";

  // ─── Render ───
  return (
    <div ref={containerRef} style={{
      width: "100%", maxWidth: 1200, margin: "0 auto",
      backgroundColor: P.bg, color: P.text, fontFamily: sansFont,
      borderRadius: 12, overflow: "hidden",
      border: `1px solid ${P.border}`,
    }}>

      {/* ═══ TRADER SELECTOR ═══ */}
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 4 }}>
          Signal Providers
        </span>
        {TRADERS.map(t => {
          const isActive = selectedTrader?.id === t.id;
          return (
            <button key={t.id} onClick={() => handleTraderClick(t)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${isActive ? t.color : P.border}`,
              backgroundColor: isActive ? t.color + "18" : "transparent",
              color: isActive ? t.color : P.muted,
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              transition: "all 0.2s ease",
            }}>
              <span style={{ fontSize: 16 }}>{t.avatar}</span>
              <span>{t.name}</span>
              <span style={{ fontSize: 10, fontFamily: mono, opacity: 0.7 }}>{t.winRate}%</span>
            </button>
          );
        })}
      </div>

      {/* ═══ TRADE CHIPS (when trader selected) ═══ */}
      {selectedTrader && (
        <div style={{
          padding: "10px 20px 0", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center",
          animation: prefersReducedMotion.current ? "none" : "fadeSlideIn 0.3s ease forwards",
        }}>
          <span style={{ fontSize: 10, color: P.dim, fontWeight: 600, marginRight: 4 }}>TRADES:</span>
          {selectedTrader.trades.map((trade, i) => {
            const pnl = calcPnl(trade);
            const isWin = pnl > 0;
            const isSelected = selectedTrade === trade;
            return (
              <button key={i} onClick={() => handleTradeClick(trade)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                borderRadius: 6,
                border: `1px solid ${isSelected ? (isWin ? P.green : P.red) : P.border}`,
                backgroundColor: isSelected ? (isWin ? P.greenDim : P.redDim) : "transparent",
                color: isWin ? P.green : P.red,
                cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: mono,
                transition: "all 0.2s ease",
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: P.text }}>{trade.side.toUpperCase()}</span>
                <span>{isWin ? "+" : ""}{pnl.toFixed(1)}%</span>
                <span style={{ fontSize: 9, color: P.dim }}>
                  #{trade.entry}→#{trade.exit}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ P&L BANNER (focus mode) ═══ */}
      {selectedTrade && selectedTrader && (() => {
        const pnl = calcPnl(selectedTrade);
        const isWin = pnl > 0;
        const clr = isWin ? P.green : P.red;
        const dur = selectedTrade.exit - selectedTrade.entry;
        return (
          <div style={{
            margin: "12px 20px 0", padding: "12px 20px", borderRadius: 10,
            background: `linear-gradient(135deg, ${clr}08, ${clr}14)`,
            border: `1px solid ${clr}30`,
            display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
            animation: prefersReducedMotion.current ? "none" : "fadeSlideIn 0.35s ease forwards",
          }}>
            <div>
              <div style={{ fontSize: 10, color: P.muted, fontWeight: 600, marginBottom: 2 }}>P&L</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: mono, color: clr, letterSpacing: "-0.02em" }}>
                {isWin ? "+" : ""}{pnl.toFixed(2)}%
              </div>
            </div>
            <div style={{ width: 1, height: 40, backgroundColor: P.border }} />
            <div style={{ display: "flex", gap: 24 }}>
              {[
                ["Side", selectedTrade.side.toUpperCase()],
                ["Entry", `$${selectedTrade.entryPrice.toLocaleString()}`],
                ["Exit", `$${selectedTrade.exitPrice.toLocaleString()}`],
                ["Duration", `${dur} candles`],
                ["Provider", selectedTrader.name],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: P.dim, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: mono, marginTop: 1 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ═══ CHART ═══ */}
      <div style={{ padding: "12px 20px 16px", position: "relative" }}>
        <svg
          viewBox={`0 0 ${dims.w} ${dims.h + volH + 8}`}
          width="100%"
          style={{ display: "block", overflow: "visible" }}
        >
          <GlowFilters />
          <g transform={`translate(${margin.left},${margin.top})`}>

            {/* ── Grid lines ── */}
            {yTicks.map((tick, i) => (
              <line key={i} x1={0} x2={chartW} y1={yScale(tick)} y2={yScale(tick)}
                stroke={P.border} strokeDasharray="2 3" opacity={0.5} />
            ))}

            {/* ── Trade zones (overview mode: trader selected, no specific trade) ── */}
            {selectedTrader && !selectedTrade && selectedTrader.trades.map((trade, ti) => {
              const { vStart, vEnd } = tradeToVisible(trade.entry, trade.exit);
              if (vEnd < 0 || vStart >= visible.length) return null;
              const x0 = xScale(vStart) - xScale.bandwidth() * 0.15;
              const x1 = xScale(vEnd) + xScale.bandwidth() * 1.15;
              const pnl = calcPnl(trade);
              const isWin = pnl > 0;
              const isHovered = hoveredZone === ti;
              return (
                <g key={ti} style={{ cursor: "pointer" }} onClick={() => handleTradeClick(trade)}
                  onMouseEnter={() => setHoveredZone(ti)} onMouseLeave={() => setHoveredZone(null)}>
                  <rect
                    x={x0} y={0} width={Math.max(0, x1 - x0)} height={chartH}
                    fill={selectedTrader.color}
                    opacity={isHovered ? 0.08 : 0.04}
                    rx={4}
                    style={{ transition: trans }}
                  />
                  {/* P&L chip floating at top */}
                  {(() => {
                    const cx = (x0 + x1) / 2;
                    const pillW = 58;
                    return (
                      <g transform={`translate(${cx},${-8})`}>
                        <rect x={-pillW / 2} y={-12} width={pillW} height={20} rx={10}
                          fill={isWin ? P.green + "20" : P.red + "20"}
                          stroke={isWin ? P.green + "50" : P.red + "50"} strokeWidth={0.5}
                        />
                        <text textAnchor="middle" y={2} fill={isWin ? P.green : P.red}
                          fontSize={10} fontWeight={700} fontFamily={mono}>
                          {isWin ? "+" : ""}{pnl.toFixed(1)}%
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}

            {/* ── Price level lines (focus mode) ── */}
            {selectedTrade && selectedTrader && (() => {
              const pnl = calcPnl(selectedTrade);
              const isWin = pnl > 0;
              const entryY = yScale(selectedTrade.entryPrice);
              const exitY = yScale(selectedTrade.exitPrice);
              const topY = Math.min(entryY, exitY);
              const botY = Math.max(entryY, exitY);
              return (
                <g>
                  {/* Fill between entry and exit */}
                  <rect x={0} y={topY} width={chartW} height={Math.max(1, botY - topY)}
                    fill={isWin ? P.green : P.red} opacity={0.04} />
                  {/* Entry line */}
                  <line x1={0} x2={chartW} y1={entryY} y2={entryY}
                    stroke={selectedTrader.color} strokeDasharray="6 4" opacity={0.6} strokeWidth={1} />
                  <text x={chartW + 4} y={entryY + 3} fill={selectedTrader.color}
                    fontSize={9} fontWeight={700} fontFamily={mono}>ENTRY</text>
                  {/* Exit line */}
                  <line x1={0} x2={chartW} y1={exitY} y2={exitY}
                    stroke={isWin ? P.green : P.red} strokeDasharray="6 4" opacity={0.6} strokeWidth={1} />
                  <text x={chartW + 4} y={exitY + 3} fill={isWin ? P.green : P.red}
                    fontSize={9} fontWeight={700} fontFamily={mono}>EXIT</text>
                  {/* Price labels on right */}
                  {[
                    { price: selectedTrade.entryPrice, y: entryY, color: selectedTrader.color },
                    { price: selectedTrade.exitPrice, y: exitY, color: isWin ? P.green : P.red },
                  ].map((lbl, i) => (
                    <g key={i} transform={`translate(${chartW + 4},${lbl.y + (i === 0 ? 14 : -6)})`}>
                      <rect x={0} y={-8} width={60} height={16} rx={3}
                        fill={lbl.color + "18"} stroke={lbl.color + "40"} strokeWidth={0.5} />
                      <text x={30} y={3} textAnchor="middle" fill={lbl.color}
                        fontSize={9} fontWeight={700} fontFamily={mono}>
                        ${lbl.price.toLocaleString()}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* ── Candlesticks ── */}
            {visible.map((candle, i) => {
              const globalIdx = viewRange[0] + i;
              const bullish = candle.close >= candle.open;
              const baseColor = bullish ? P.green : P.red;
              const dimmed = isDimmed(globalIdx);
              const candleColor = dimmed ? P.dimCandle : baseColor;
              const candleOpacity = dimmed ? 0.3 : 1;
              const cx = xScale(i) + xScale.bandwidth() / 2;
              const bw = xScale.bandwidth();
              const bodyTop = yScale(Math.max(candle.open, candle.close));
              const bodyBot = yScale(Math.min(candle.open, candle.close));
              const bodyH = Math.max(1, bodyBot - bodyTop);
              const isHovered = hoveredCandle === i;

              // Check if candle is inside active trade
              const insideTrade = selectedTrade && globalIdx >= selectedTrade.entry && globalIdx <= selectedTrade.exit;

              return (
                <g key={i}
                  onMouseEnter={() => setHoveredCandle(i)}
                  onMouseLeave={() => setHoveredCandle(null)}
                  style={{ cursor: "crosshair" }}
                >
                  {/* Wick */}
                  <line
                    x1={cx} x2={cx}
                    y1={yScale(candle.high)} y2={yScale(candle.low)}
                    stroke={candleColor}
                    strokeWidth={1}
                    style={{ transition: trans, opacity: candleOpacity }}
                  />
                  {/* Body */}
                  <rect
                    x={xScale(i)} y={bodyTop}
                    width={bw} height={bodyH}
                    fill={bullish ? candleColor : P.bg}
                    stroke={candleColor}
                    strokeWidth={bullish ? 0 : 1.5}
                    rx={1}
                    style={{ transition: trans, opacity: candleOpacity }}
                  />
                  {/* Hover highlight (only on non-dimmed candles) */}
                  {isHovered && !dimmed && (
                    <rect
                      x={xScale(i) - 0.5} y={bodyTop - 0.5}
                      width={bw + 1} height={bodyH + 1}
                      fill="none" stroke="#ffffff" strokeWidth={1} rx={1}
                      opacity={0.4}
                    />
                  )}
                </g>
              );
            })}

            {/* ── Crosshair on hover ── */}
            {hoveredCandle !== null && visible[hoveredCandle] && (
              <line
                x1={xScale(hoveredCandle) + xScale.bandwidth() / 2}
                x2={xScale(hoveredCandle) + xScale.bandwidth() / 2}
                y1={0} y2={chartH}
                stroke={P.dim} strokeDasharray="3 3" opacity={0.4} strokeWidth={0.5}
              />
            )}

            {/* ── Entry / Exit Markers (focus mode) ── */}
            {selectedTrade && selectedTrader && (() => {
              const { vStart, vEnd } = tradeToVisible(selectedTrade.entry, selectedTrade.exit);
              if (vStart < 0 || vStart >= visible.length) return null;
              const entryCandle = visible[vStart];
              const exitCandle = visible[Math.min(vEnd, visible.length - 1)];
              if (!entryCandle || !exitCandle) return null;
              const pnl = calcPnl(selectedTrade);
              const isWin = pnl > 0;
              const isLong = selectedTrade.side === "long";

              const entryCx = xScale(vStart) + xScale.bandwidth() / 2;
              const exitCx = xScale(Math.min(vEnd, visible.length - 1)) + xScale.bandwidth() / 2;

              // Entry marker position: below for longs, above for shorts
              const entryPinY = isLong
                ? yScale(entryCandle.low) + 28
                : yScale(entryCandle.high) - 28;
              const entryConnY = isLong ? yScale(entryCandle.low) : yScale(entryCandle.high);

              // Exit marker
              const exitPinY = isLong
                ? yScale(exitCandle.high) - 28
                : yScale(exitCandle.low) + 28;
              const exitConnY = isLong ? yScale(exitCandle.high) : yScale(exitCandle.low);

              return (
                <g>
                  {/* Entry connector + pin */}
                  <line x1={entryCx} x2={entryCx} y1={entryConnY} y2={entryPinY}
                    stroke={selectedTrader.color} strokeWidth={1} opacity={0.6} strokeDasharray="2 2" />
                  <circle cx={entryCx} cy={entryPinY} r={11}
                    fill={selectedTrader.color} filter="url(#glow-sm)" />
                  <text x={entryCx} y={entryPinY + 1} textAnchor="middle" dominantBaseline="central"
                    fill="#fff" fontSize={12} fontWeight={900}>
                    {isLong ? "↑" : "↓"}
                  </text>
                  <text x={entryCx} y={entryPinY + (isLong ? 22 : -16)} textAnchor="middle"
                    fill={selectedTrader.color} fontSize={8} fontWeight={800} fontFamily={mono}>
                    {isLong ? "BUY" : "SELL"}
                  </text>

                  {/* Exit connector + pin */}
                  <line x1={exitCx} x2={exitCx} y1={exitConnY} y2={exitPinY}
                    stroke={isWin ? P.green : P.red} strokeWidth={1} opacity={0.6} strokeDasharray="2 2" />
                  <circle cx={exitCx} cy={exitPinY} r={11}
                    fill={isWin ? P.green : P.red} filter="url(#glow-sm)" />
                  <text x={exitCx} y={exitPinY + 1} textAnchor="middle" dominantBaseline="central"
                    fill="#fff" fontSize={11} fontWeight={900}>✕</text>

                  {/* Exit P&L badge */}
                  <g transform={`translate(${exitCx},${exitPinY + (isLong ? -22 : 22)})`} filter="url(#glow-lg)">
                    <rect x={-34} y={-10} width={68} height={20} rx={10}
                      fill={isWin ? P.green + "25" : P.red + "25"}
                      stroke={isWin ? P.green : P.red} strokeWidth={0.8} />
                    <text textAnchor="middle" y={4} fill={isWin ? P.green : P.red}
                      fontSize={10} fontWeight={800} fontFamily={mono}>
                      {isWin ? "+" : ""}{pnl.toFixed(1)}%
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* ── Y Axis labels ── */}
            {yTicks.map((tick, i) => (
              <text key={i} x={-8} y={yScale(tick) + 3} textAnchor="end"
                fill={P.dim} fontSize={9} fontFamily={mono}>
                ${(tick / 1000).toFixed(1)}K
              </text>
            ))}

            {/* ── X Axis labels ── */}
            {xTicks.map((candle, i) => {
              const vi = visible.indexOf(candle);
              if (vi < 0) return null;
              return (
                <text key={i} x={xScale(vi) + xScale.bandwidth() / 2} y={chartH + 18}
                  textAnchor="middle" fill={P.dim} fontSize={9} fontFamily={mono}>
                  {candle.date}
                </text>
              );
            })}

            {/* ── Volume bars ── */}
            <g transform={`translate(0,${chartH + 28})`}>
              {visible.map((candle, i) => {
                const globalIdx = viewRange[0] + i;
                const bullish = candle.close >= candle.open;
                const dimmed = isDimmed(globalIdx);
                const barColor = dimmed ? P.dimCandle : (bullish ? P.green : P.red);
                const barH = volScale(candle.volume);
                return (
                  <rect key={i}
                    x={xScale(i)} y={volH - barH}
                    width={xScale.bandwidth()} height={barH}
                    fill={barColor} opacity={dimmed ? 0.15 : 0.25}
                    rx={1}
                    style={{ transition: trans }}
                  />
                );
              })}
            </g>
          </g>

          {/* ── Hover Tooltip ── */}
          {hoveredCandle !== null && visible[hoveredCandle] && (() => {
            const c = visible[hoveredCandle];
            const cx = margin.left + xScale(hoveredCandle) + xScale.bandwidth() / 2;
            const tipW = 150;
            const tipH = 96;
            const flipX = cx + tipW + 20 > dims.w;
            const tipX = flipX ? cx - tipW - 12 : cx + 12;
            const tipY = margin.top + 10;
            const bullish = c.close >= c.open;
            const globalIdx = viewRange[0] + hoveredCandle;
            const insideTrade = selectedTrade && globalIdx >= selectedTrade.entry && globalIdx <= selectedTrade.exit;

            return (
              <g style={{ pointerEvents: "none" }}>
                <rect x={tipX} y={tipY} width={tipW} height={insideTrade ? tipH + 16 : tipH} rx={8}
                  fill={P.panelBg} stroke={P.border} strokeWidth={1} opacity={0.96} />
                <text x={tipX + 12} y={tipY + 18} fill={P.text} fontSize={11} fontWeight={700}>{c.date}</text>
                {[
                  ["O", c.open, bullish ? P.green : P.red],
                  ["H", c.high, P.green],
                  ["L", c.low, P.red],
                  ["C", c.close, bullish ? P.green : P.red],
                ].map(([label, val, clr], i) => (
                  <g key={label}>
                    <text x={tipX + 12} y={tipY + 36 + i * 14} fill={P.dim} fontSize={9} fontFamily={mono}>{label}:</text>
                    <text x={tipX + 28} y={tipY + 36 + i * 14} fill={clr} fontSize={9} fontWeight={600} fontFamily={mono}>
                      ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </text>
                  </g>
                ))}
                <text x={tipX + 90} y={tipY + 18} fill={P.dim} fontSize={8} fontFamily={mono} textAnchor="end">
                  Vol: {c.volume.toLocaleString()}
                </text>
                {insideTrade && selectedTrader && (
                  <g>
                    <circle cx={tipX + 16} cy={tipY + tipH + 2} r={3} fill={selectedTrader.color} />
                    <text x={tipX + 24} y={tipY + tipH + 5} fill={selectedTrader.color} fontSize={9} fontWeight={600}>
                      Inside trade
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ═══ TRADE SUMMARY CARDS (overview mode: trader selected, no specific trade) ═══ */}
      {selectedTrader && !selectedTrade && (
        <div style={{
          padding: "0 20px 20px", display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          animation: prefersReducedMotion.current ? "none" : "fadeSlideIn 0.4s ease forwards",
        }}>
          {selectedTrader.trades.map((trade, i) => {
            const pnl = calcPnl(trade);
            const isWin = pnl > 0;
            const dur = trade.exit - trade.entry;
            return (
              <button key={i} onClick={() => handleTradeClick(trade)}
                style={{
                  backgroundColor: P.panelBg, border: `1px solid ${P.border}`,
                  borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                  textAlign: "left", color: P.text,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = selectedTrader.color + "60"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800,
                    backgroundColor: trade.side === "long" ? P.greenDim : P.redDim,
                    color: trade.side === "long" ? P.green : P.red,
                    border: `1px solid ${trade.side === "long" ? P.green : P.red}30`,
                  }}>{trade.side.toUpperCase()}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, fontFamily: mono, color: isWin ? P.green : P.red }}>
                    {isWin ? "+" : ""}{pnl.toFixed(2)}%
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 10, color: P.dim, fontFamily: mono }}>
                  <span>Entry: ${trade.entryPrice.toLocaleString()}</span>
                  <span>Exit: ${trade.exitPrice.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 9, color: P.dim, marginTop: 6, fontFamily: mono }}>
                  {dur} candles · Candle #{trade.entry} → #{trade.exit}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ Animation keyframes ═══ */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; transition-duration: 0s !important; }
        }
      `}</style>
    </div>
  );
}
