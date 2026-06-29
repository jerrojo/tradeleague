import { useMemo } from "react";
import { X, Printer } from "lucide-react";
import { coinCandles, coinSignals, ROBOTIN_COINS } from "../data/robotin";
import { FUND, START_CAPITAL } from "../data/fund";
import { mockTraders } from "../data/mockData";

/* ═══════════════════════ COMMITTEE / LP TEAR SHEET ═══════════════════════
   A print-optimised, light-themed one-pager an allocator can save as PDF and
   take to an investment committee. Everything is derived from the SAME approved-
   signal book the rest of the app uses, so it never disagrees with the dashboard.
   The .tearsheet-overlay print rules in index.css isolate this for printing. */

const f0 = (x) => Math.round(x).toLocaleString();
const money = (x) => `${x < 0 ? "−" : ""}$${f0(Math.abs(x))}`;
const moneySigned = (x) => `${x < 0 ? "−" : "+"}$${f0(Math.abs(x))}`;

export const PrintTearSheet = ({ onClose }) => {
  const d = useMemo(() => {
    const all = ROBOTIN_COINS.flatMap((c) => coinSignals(c, coinCandles(c)));
    const approved = all.filter((s) => s.approved);
    const closed = approved.filter((s) => s.status === "closed");
    const wins = closed.filter((s) => s.hit === "TP");
    const net = closed.reduce((a, s) => a + s.pnl, 0);
    const grossW = wins.reduce((a, s) => a + s.pnl, 0);
    const grossL = Math.abs(closed.filter((s) => s.hit === "SL").reduce((a, s) => a + s.pnl, 0));
    const rej = all.filter((s) => !s.approved);
    const rejClosed = rej.filter((s) => s.hypoClosed);
    const avoided = rejClosed.reduce((a, s) => a + s.hypoPnl, 0);
    // providers
    const pm = {};
    all.forEach((s) => { (pm[s.trader] ||= { trader: s.trader, isBot: s.isBot, total: 0, approved: 0, execPnl: 0 }); pm[s.trader].total++; if (s.approved) { pm[s.trader].approved++; if (s.status === "closed") pm[s.trader].execPnl += s.pnl; } });
    const providers = Object.values(pm).sort((a, b) => b.execPnl - a.execPnl);
    return {
      total: all.length, approved: approved.length, closed: closed.length, active: approved.filter((s) => s.status === "active").length,
      net, balance: START_CAPITAL + net, returnPct: (net / START_CAPITAL) * 100,
      winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
      pf: grossL > 0 ? grossW / grossL : grossW > 0 ? Infinity : 0,
      approvalRate: all.length ? (approved.length / all.length) * 100 : 0,
      filterEdge: -avoided, avoidedLosers: rejClosed.filter((s) => s.hypoPnl < 0).length,
      providers, signaled: providers.length, monitored: mockTraders.length,
    };
  }, []);

  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const Stat = ({ label, value, color }) => (
    <div style={{ flex: "1 1 0", minWidth: 120, border: "1px solid #e3e6ea", borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".4px", textTransform: "uppercase", color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || "#0f172a", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{value}</div>
    </div>
  );

  return (
    <div className="tearsheet-overlay" style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.55)", overflow: "auto", display: "flex", justifyContent: "center", padding: "24px 16px" }}>
      {/* toolbar — hidden when printing */}
      <div className="tearsheet-toolbar" style={{ position: "fixed", top: 16, right: 20, display: "flex", gap: 8, zIndex: 601 }}>
        <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#7c5cff", color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}><Printer size={15} /> Print / Save PDF</button>
        <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#0f172a", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}><X size={15} /> Close</button>
      </div>

      {/* the page */}
      <div className="tearsheet-page" style={{ width: 760, maxWidth: "100%", background: "#fff", color: "#0f172a", borderRadius: 10, padding: "36px 40px", fontFamily: "'Inter', system-ui, sans-serif", alignSelf: "flex-start", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "2px solid #0f172a", paddingBottom: 14, marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#7c5cff", display: "inline-block" }} />
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.3px" }}>{FUND.name}</span>
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>· Allocator fund tear sheet</span>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Signal providers → Robotín R1 filter → executed book · base {money(START_CAPITAL)}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 10, color: "#6b7280" }}>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 12 }}>As of {today}</div>
            <div style={{ marginTop: 2 }}>Simulated · confidential</div>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <Stat label="Net asset value" value={money(d.balance)} />
          <Stat label="Net P&L" value={moneySigned(d.net)} color={d.net >= 0 ? "#16a34a" : "#dc2626"} />
          <Stat label="Return" value={`${d.returnPct >= 0 ? "+" : "−"}${Math.abs(d.returnPct).toFixed(1)}%`} color={d.returnPct >= 0 ? "#16a34a" : "#dc2626"} />
          <Stat label="Win rate" value={`${d.winRate.toFixed(1)}%`} />
          <Stat label="Profit factor" value={d.pf === Infinity ? "∞" : d.pf.toFixed(2)} />
        </div>

        {/* Robotín filter */}
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".5px", color: "#374151", margin: "8px 0 8px" }}>Robotín filter</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <Stat label="Signals processed" value={f0(d.total)} />
          <Stat label="Approval rate" value={`${Math.round(d.approvalRate)}%`} />
          <Stat label="Executed & closed" value={f0(d.closed)} />
          <Stat label="Filter edge" value={moneySigned(d.filterEdge)} color={d.filterEdge >= 0 ? "#16a34a" : "#dc2626"} />
          <Stat label="Open positions" value={f0(d.active)} />
        </div>

        {/* providers */}
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".5px", color: "#374151", margin: "8px 0 8px" }}>Signal providers — attribution ({d.signaled}/{d.monitored} monitored)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid #0f172a" }}>
              {[["Provider", "left"], ["Signals", "right"], ["Approved", "right"], ["Approval", "right"], ["Executed P&L", "right"]].map(([h, al]) => (
                <th key={h} style={{ textAlign: al, padding: "7px 8px", fontSize: 9.5, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: "#6b7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.providers.map((p) => (
              <tr key={p.trader} style={{ borderBottom: "1px solid #eceff2" }}>
                <td style={{ padding: "7px 8px", fontWeight: 700 }}>{p.trader}{p.isBot ? <span style={{ fontSize: 8, color: "#6b7280", marginLeft: 5 }}>BOT</span> : null}</td>
                <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#6b7280" }}>{p.total}</td>
                <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.approved}</td>
                <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.total ? Math.round((p.approved / p.total) * 100) : 0}%</td>
                <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 800, color: p.execPnl >= 0 ? "#16a34a" : "#dc2626" }}>{moneySigned(p.execPnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 22, paddingTop: 12, borderTop: "1px solid #e3e6ea", fontSize: 9.5, color: "#9ca3af", lineHeight: 1.5 }}>
          {FUND.name} is an allocator/quant fund that executes externally-sourced trading signals filtered by the Robotín R1 model. All figures are simulated for this preview and are not investment advice. Past performance does not guarantee future results.
        </div>
      </div>
    </div>
  );
};
