import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Coins, Wallet } from "lucide-react";
import { SectionHeader, InfoTip } from "../common";
import { monthLedger, breakdownBy } from "../../data/tradeReport";
import { usd as fUsd, usdCompact } from "../../lib/format";
import { C, cardStyle, mono } from "../../theme";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Money formatting routed through the single source (lib/format) so the minus glyph
// and decimals match the rest of the platform.
const usd = (n, sign = true) => fUsd(n, { signed: sign });
const compact = (n) => usdCompact(n, { signed: true });
const k = (n) => usdCompact(n);
const fmtDT = (ms) => { const d = new Date(ms); const p = (x) => String(x).padStart(2, "0"); return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${String(d.getFullYear()).slice(2)}, ${p(d.getHours())}:${p(d.getMinutes())}`; };
const fmtDur = (min) => { if (min == null) return "—"; const h = Math.floor(min / 60), m = min % 60; return h ? `${h}h ${m}m` : `${m}m`; };

const Stat = ({ label, children, color = C.text, tip }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint, marginBottom: 4 }}>{tip ? <InfoTip k={tip} inline><span>{label}</span></InfoTip> : label}</div>
    <div style={{ fontSize: 14, fontWeight: 800, color, ...mono }}>{children}</div>
  </div>
);

/* Landing month: never open on a dead calendar. If the current month has no
   positions yet (e.g. the 1st/2nd of a quiet month), fall back to the most
   recent month that has activity — the user can always jump back with TODAY. */
const initialView = () => {
  const now = new Date();
  let y = now.getFullYear(), m = now.getMonth();
  for (let i = 0; i < 12; i++) {
    if (monthLedger(y, m).month.positions > 0) return { y, m };
    m -= 1; if (m < 0) { m = 11; y -= 1; }
  }
  return { y: now.getFullYear(), m: now.getMonth() };
};
/* Default selected day: today if it has data, otherwise the latest day with data. */
const initialDay = (view, today) => {
  const ledger = monthLedger(view.y, view.m);
  const isCur = view.y === today.getFullYear() && view.m === today.getMonth();
  if (isCur && ledger.days[`${view.y}-${view.m}-${today.getDate()}`]) return today.getDate();
  const withData = Object.values(ledger.days).map((d) => d.day);
  return withData.length ? Math.max(...withData) : null;
};

const TradeReport = () => {
  const today = new Date();
  const [view, setView] = useState(initialView);
  const [selDay, setSelDay] = useState(() => initialDay(initialView(), today));

  const data = useMemo(() => monthLedger(view.y, view.m), [view]);
  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const isCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth();
  const canNext = view.y < today.getFullYear() || (view.y === today.getFullYear() && view.m < today.getMonth());

  const prev = () => { setSelDay(null); setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })); };
  const next = () => { if (!canNext) return; setSelDay(null); setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })); };
  const goToday = () => { setView({ y: today.getFullYear(), m: today.getMonth() }); setSelDay(today.getDate()); };

  const M = data.month;
  const sel = selDay ? data.days[`${view.y}-${view.m}-${selDay}`] : null;

  // calendar cells (leading blanks + day numbers)
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Header: title + month nav ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <SectionHeader icon={CalendarClock} title="Trade report" subtitle="Broker execution ledger — the VARIV accounts' realized positions by day · distinct from the live signal book (months of account history vs the current signal window) · simulated" />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={goToday} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${isCurrentMonth ? C.purple : C.border}`, backgroundColor: isCurrentMonth ? C.purpleBg : "transparent", color: isCurrentMonth ? C.purple : C.textMuted, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>TODAY</button>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={prev} aria-label="Previous month" style={navBtn}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text, minWidth: 130, textAlign: "center", ...mono }}>{MONTHS[view.m]} {view.y}</span>
            <button onClick={next} disabled={!canNext} aria-label="Next month" style={{ ...navBtn, opacity: canNext ? 1 : 0.3, cursor: canNext ? "pointer" : "default" }}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* ── Balance strip ── */}
      <div style={{ ...cardStyle, display: "flex", gap: 36, flexWrap: "wrap" }}>
        <Stat label="Initial Balance" tip="initialBalance">{usd(data.initialBalance, false)}</Stat>
        <Stat label="Current Balance" tip="currentBalance" color={data.currentBalance >= data.initialBalance ? C.green : C.red}>{usd(data.currentBalance, false)}</Stat>
        <Stat label="Month ROI" tip="monthRoi" color={data.roiPct > 0 ? C.green : data.roiPct < 0 ? C.red : C.textMuted}>{data.roiPct >= 0 ? "+" : ""}{data.roiPct.toFixed(2)}%</Stat>
      </div>

      {/* ── Empty month: say so explicitly and offer the way out ── */}
      {M.positions === 0 && (
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, borderColor: `${C.amber}40`, backgroundColor: `${C.amber}0a` }}>
          <CalendarClock size={16} color={C.amber} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: C.textMuted }}>
            No closed positions in <b style={{ color: C.text }}>{MONTHS[view.m]} {view.y}</b> yet.
          </span>
          <button onClick={() => { const v = initialView(); setView(v); setSelDay(initialDay(v, today)); }}
            style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.amber}50`, backgroundColor: "transparent", color: C.amber, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            Go to last active month
          </button>
        </div>
      )}

      {/* ── Monthly performance card ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint }}>Monthly Performance</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.text, marginTop: 2 }}>{MONTHS[view.m]} {view.y}</div>
          </div>
          <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint, marginBottom: 2 }}><InfoTip k="netPnlReport" inline><span>Net P&L</span></InfoTip></div>
              {/* zero is neutral — green means gain, not "nothing happened" */}
              <div style={{ fontSize: 26, fontWeight: 900, color: M.net > 0 ? C.green : M.net < 0 ? C.red : C.textMuted, ...mono }}>{usd(M.net)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint, marginBottom: 2 }}><InfoTip k="winRate" inline><span>Win Rate</span></InfoTip></div>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.text, ...mono }}>{M.wins}W / {M.losses}L <span style={{ fontSize: 16, color: C.textMuted }}>· {M.winRate.toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          <Stat label="Fees (pos)" tip="feesPos" color={C.red}>{usd(-M.fees)}</Stat>
          <Stat label="Positions" tip="positionsClosed">{M.positions} closed</Stat>
          <Stat label="RRR" tip="rrrReport">{M.rrr >= 999 ? "∞" : M.rrr.toFixed(2)}</Stat>
          <Stat label="Capital Vol." tip="capitalVol">{k(M.capitalVol)}</Stat>
          <Stat label="Leveraged Vol." tip="leveragedVol">{k(M.leveragedVol)}</Stat>
        </div>
      </div>

      {/* ── Calendar + weekly rail ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.7fr) minmax(220px, 1fr)", gap: 16, alignItems: "start" }}>
        {/* calendar */}
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            {WD.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.textFaint, padding: "2px 0" }}>{w}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {cells.map((d, i) => {
              if (d == null) return <div key={i} />;
              const rec = data.days[`${view.y}-${view.m}-${d}`];
              const isToday = isCurrentMonth && d === today.getDate();
              const isFuture = isCurrentMonth && d > today.getDate();
              const isSel = d === selDay;
              const pos = rec && rec.pnl >= 0;
              const accent = rec ? (pos ? C.green : C.red) : C.border;
              return (
                <button
                  key={i}
                  onClick={() => rec && setSelDay(d)}
                  disabled={!rec}
                  style={{
                    position: "relative", minHeight: 86, padding: "8px 9px", textAlign: "left", borderRadius: 9,
                    border: `1px solid ${isSel ? C.purple : rec ? `${accent}66` : C.border}`,
                    backgroundColor: isSel ? C.purpleBg : rec ? `${accent}14` : "transparent",
                    boxShadow: isSel ? `0 0 0 1px ${C.purple}` : "none",
                    cursor: rec ? "pointer" : "default", opacity: isFuture ? 0.4 : 1,
                    display: "flex", flexDirection: "column", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: isToday ? C.purple : C.text, ...mono }}>
                    {d}{isToday && <span style={{ fontSize: 8, marginLeft: 4, color: C.purple, fontWeight: 800 }}>TODAY</span>}
                  </span>
                  {rec && (
                    <span style={{ marginTop: "auto" }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: accent, ...mono }}>{compact(rec.pnl)}</span>
                      <span style={{ fontSize: 9.5, color: C.textMuted }}>{rec.count} pos</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* weekly rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Weekly Summary</div>
          {data.weeks.map((w) => (
            <div key={w.idx} style={{ ...cardStyle, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Week {w.idx}</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: w.net > 0 ? C.green : w.net < 0 ? C.red : C.textMuted, ...mono }}>{usd(w.net)}</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>{w.activeDays} day{w.activeDays === 1 ? "" : "s"} · {w.wins}W / {w.losses}L · {w.winRate.toFixed(1)}%</div>
              <div style={{ fontSize: 10.5, color: C.textMuted }}>Fees {usd(-w.fees)}</div>
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8, display: "flex", flexDirection: "column", gap: 2, fontSize: 10.5, color: C.textFaint }}>
                <span>RRR: <span style={{ color: C.textMuted }}>{w.rrr >= 999 ? "∞" : w.rrr.toFixed(2)}</span></span>
                <span>Capital vol.: <span style={{ color: C.textMuted }}>{k(w.capitalVol)}</span></span>
                <span>Leveraged vol.: <span style={{ color: C.textMuted }}>{k(w.leveragedVol)}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Day detail ── */}
      {sel && <DayDetail date={new Date(view.y, view.m, sel.day)} rec={sel} onClose={() => setSelDay(null)} />}
    </div>
  );
};

const DayDetail = ({ date, rec, onClose }) => {
  const longDate = date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const bySymbol = breakdownBy(rec.positions, "symbol");
  const byAccount = breakdownBy(rec.positions, "account");
  return (
    <div style={{ ...cardStyle, borderColor: C.borderLight }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{longDate}</div>
        <button onClick={onClose} style={{ ...navBtn, width: 28, height: 28 }} title="Close"><X size={15} /></button>
      </div>
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat label="Net PnL" tip="netPnlReport" color={rec.pnl >= 0 ? C.green : C.red}>{usd(rec.pnl)}</Stat>
        <Stat label="Commission" tip="commissionReport" color={C.red}>{usd(-rec.commission)}</Stat>
        <Stat label="Positions" tip="positionsClosed">{rec.count} opened</Stat>
      </div>

      {/* positions table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Symbol", "Side", "Entry", "Exit", "Net PnL", "Lev. ROI", "Leverage", "Margin", "Duration"].map((h, i) => (
                <th key={h} style={{ textAlign: i > 3 ? "right" : "left", padding: "8px 10px", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", color: C.textFaint, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rec.positions.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "9px 10px", fontWeight: 700, color: C.text, ...mono }}>{p.symbol}USDT</td>
                <td style={{ padding: "9px 10px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: p.side === "LONG" ? C.green : C.red, backgroundColor: `${p.side === "LONG" ? C.green : C.red}1c`, padding: "2px 7px", borderRadius: 4 }}>
                    {p.side === "LONG" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{p.side}
                  </span>
                </td>
                <td style={{ padding: "9px 10px", color: C.textMuted, ...mono, whiteSpace: "nowrap" }}>{fmtDT(p.entryTime)}</td>
                <td style={{ padding: "9px 10px", color: C.textMuted, ...mono, whiteSpace: "nowrap" }}>{p.exitTime ? fmtDT(p.exitTime) : <span style={{ color: C.amber, fontWeight: 700 }}>OPEN</span>}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 800, color: p.netPnl >= 0 ? C.green : C.red, ...mono }}>{usd(p.netPnl)}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: p.roiLev >= 0 ? C.green : C.red, ...mono }}>{p.roiLev >= 0 ? "+" : ""}{p.roiLev.toFixed(2)}%</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: C.textMuted, ...mono }}>{p.leverage}x</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: C.textMuted, ...mono }}>{usd(p.margin, false)}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: C.textMuted, ...mono, whiteSpace: "nowrap" }}>{fmtDur(p.durationMin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* breakdowns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 16 }}>
        <Breakdown title="By symbol" icon={Coins} rows={bySymbol} suffix="USDT" />
        <Breakdown title="By account" icon={Wallet} rows={byAccount} />
      </div>
    </div>
  );
};

const Breakdown = ({ title, icon: Icon, rows, suffix = "" }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint, marginBottom: 8 }}>
      <Icon size={12} /> {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map((r) => (
        <div key={r.key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 7, backgroundColor: C.bg, fontSize: 12 }}>
          <span style={{ fontWeight: 700, color: C.text, ...mono }}>{r.key}{suffix}</span>
          <span style={{ fontWeight: 800, color: r.net >= 0 ? C.green : C.red, ...mono }}>{usd(r.net)}</span>
        </div>
      ))}
    </div>
  </div>
);

const navBtn = { display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, cursor: "pointer" };

export { TradeReport };
