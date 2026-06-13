/* ═══════════════════════════════════════════════════════════════════════════
   DATA EXPORT — client-side CSV / JSON download
   Turns any trade set (raw or scenario-filtered) into a downloadable file.
   The CSV column set is the full VARIV "Vista D" schema so the export is
   analysis-ready in Excel, pandas, or a data warehouse.
   ═══════════════════════════════════════════════════════════════════════════ */

export const TRADE_EXPORT_COLUMNS = [
  "trader", "id", "signalTs", "execTs", "latencyMin", "date",
  "pair", "type", "style", "styleConfidence", "setupTag", "source", "tfDominant", "assetClass", "session", "marketRegime",
  "entry", "sl", "tp1", "tp2", "tp3", "exit", "tpReached",
  "leverage", "sizeUsd", "positionSizePct", "rr", "rrGross", "rrNet", "rMultiple", "riskUsd",
  "pnl", "pnlPct", "fees", "maePct", "mfePct",
  "outcome", "exitReason", "durationHours",
];

const csvCell = (v) => {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(trades, columns = TRADE_EXPORT_COLUMNS) {
  const header = columns.join(",");
  const rows = trades.map((t) => columns.map((c) => csvCell(t[c])).join(","));
  return [header, ...rows].join("\n");
}

export function toJSON(trades, columns = TRADE_EXPORT_COLUMNS) {
  return JSON.stringify(
    trades.map((t) => Object.fromEntries(columns.map((c) => [c, t[c] ?? null]))),
    null,
    2
  );
}

/* Trigger a browser download. No-op-safe outside the browser (SSR / tests). */
export function downloadFile(filename, content, mime = "text/plain") {
  if (typeof document === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) return false;
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}

const stamp = () => new Date().toISOString().slice(0, 10);
const slug = (s) => String(s || "export").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function exportTrades(trades, { name = "tradethlon", format = "csv", columns } = {}) {
  const base = `${slug(name)}_trades_${stamp()}`;
  if (format === "json") return downloadFile(`${base}.json`, toJSON(trades, columns), "application/json");
  return downloadFile(`${base}.csv`, toCSV(trades, columns), "text/csv");
}
