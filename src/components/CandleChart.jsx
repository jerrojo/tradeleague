import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import { C } from "../theme";

/* ═══════════════════════ CANDLE CHART ═══════════════════════
   TradingView-style price chart (lightweight-charts). Toggle candles ↔ line.
   Accepts OHLC data, signal markers (entry arrows) and price lines (entry/TP/SL). */
const CandleChart = ({ data = [], mode = "candles", markers = [], priceLines = [], height = 340 }) => {
  const elRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Create the chart once
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const chart = createChart(el, {
      width: el.clientWidth || 600,
      height,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: C.textMuted, fontSize: 11, fontFamily: "'SF Mono','Cascadia Code',monospace" },
      grid: { vertLines: { color: `${C.border}55` }, horzLines: { color: `${C.border}55` } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: C.textFaint, labelBackgroundColor: C.cardElev }, horzLine: { color: C.textFaint, labelBackgroundColor: C.cardElev } },
      rightPriceScale: { borderColor: C.border },
      timeScale: { borderColor: C.border, timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    // Track the container width so the chart re-fits on every layout change
    // (window resize, sidebar collapse, orientation). autoSize's built-in
    // observer proved unreliable, so we drive width explicitly. rAF-batched to
    // avoid ResizeObserver-loop warnings.
    let raf = 0;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (!w) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { try { chart.applyOptions({ width: w }); } catch { /* removed */ } });
    });
    ro.observe(el);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [height]);

  // (Re)build the series whenever mode or data changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data.length) return;
    if (seriesRef.current) { try { chart.removeSeries(seriesRef.current); } catch { /* gone */ } seriesRef.current = null; }

    let series;
    if (mode === "line") {
      series = chart.addLineSeries({ color: C.blue, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
      series.setData(data.map((d) => ({ time: d.time, value: d.close })));
    } else {
      series = chart.addCandlestickSeries({ upColor: C.green, downColor: C.red, wickUpColor: C.green, wickDownColor: C.red, borderVisible: false });
      series.setData(data);
    }
    seriesRef.current = series;

    if (markers.length) series.setMarkers([...markers].sort((a, b) => a.time - b.time));
    priceLines.forEach((pl) => { try { series.createPriceLine(pl); } catch { /* ignore */ } });
    chart.timeScale().fitContent();
  }, [mode, data, markers, priceLines]);

  return <div ref={elRef} style={{ width: "100%", height }} />;
};

export { CandleChart };
