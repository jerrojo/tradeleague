import { useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, Award, ChevronDown, Clock, Cpu, Flame, Percent, Scale,
  Target, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import { Avatar, BotTag, InfoTip, StatCard } from "../common";
import { coinCandles, coinSignals, ROBOTIN_COINS } from "../../data/robotin";
import { C, cardStyle, mono } from "../../theme";

/* ═══════════════════════ TAB: ROBOTÍN WALLET (trade journal, simulated) ═══════════════════════
   Every approved signal Robotín executed, treated as a trade in its account.
   Same candle-derived outcomes as RobotinSignals, aggregated into a wallet-style
   P&L journal: account balance, equity curve, win rate and a per-trade audit. */

const STARTING_BALANCE = 50000;

const fmt = (p) => (p == null ? "—" : p < 1 ? p.toFixed(4) : p.toLocaleString());
const usd = (v) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const usdPlain = (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

/* Status → label + color (mirrors RobotinSignals STATUS map) */
const STATUS = {
  pending: { label: "Pending", color: C.amber },
  active: { label: "Active", color: C.blue },
  closed_TP: { label: "Take Profit", color: C.green },
  closed_SL: { label: "Stop Loss", color: C.red },
  expired: { label: "No entry", color: C.textFaint },
};
const statusKey = (s) => (s.status === "closed" ? `closed_${s.hit}` : s.status);

const RobotinWallet = () => {
  const [open, setOpen] = useState(null); // expanded trade id

  /* ── Every approved signal across all coins = Robotín's executed trades ── */
  const data = useMemo(() => {
    const trades = ROBOTIN_COINS
      .flatMap((coin) => coinSignals(coin, coinCandles(coin)))
      .filter((s) => s.approved === true)
      .sort((a, b) => a.time - b.time);

    const closed = trades.filter((t) => t.status === "closed");
    const pending = trades.filter((t) => t.status === "pending");
    const active = trades.filter((t) => t.status === "active");
    const wins = closed.filter((t) => t.hit === "TP");
    const losses = closed.filter((t) => t.hit === "SL");

    const netPnl = closed.reduce((a, t) => a + t.pnl, 0);
    const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
    const avgWin = wins.length ? grossWin / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : (grossWin > 0 ? Infinity : 0);
    const expectancy = closed.length ? netPnl / closed.length : 0;
    const best = closed.length ? Math.max(...closed.map((t) => t.pnl)) : 0;
    const worst = closed.length ? Math.min(...closed.map((t) => t.pnl)) : 0;
    const avgConfidence = trades.length
      ? trades.reduce((a, t) => a + t.confidence, 0) / trades.length
      : 0;

    /* ── Equity curve over closed trades, ordered by exit (fallback entry) time ── */
    const closedByExit = [...closed].sort(
      (a, b) => (a.exitIdx ?? 0) - (b.exitIdx ?? 0) || a.time - b.time
    );
    let bal = STARTING_BALANCE;
    let peak = STARTING_BALANCE;
    let maxDrawdown = 0; // worst peak-to-trough (negative number)
    const equity = [{ i: 0, balance: STARTING_BALANCE, pnl: 0 }];
    closedByExit.forEach((t, i) => {
      bal += t.pnl;
      peak = Math.max(peak, bal);
      maxDrawdown = Math.min(maxDrawdown, bal - peak);
      equity.push({ i: i + 1, balance: Math.round(bal * 100) / 100, pnl: t.pnl, hit: t.hit });
    });

    const balance = STARTING_BALANCE + netPnl;
    const returnPct = (netPnl / STARTING_BALANCE) * 100;

    /* ── "Today" subset: Robotín's most recently OPENED closed trades (clearly
       simulated). Ordered by entry time so it reflects recent activity rather
       than the late-resolving tail (which skews to stop-outs). ── */
    const recent = [...closed].sort((a, b) => a.time - b.time);
    const todayN = Math.min(8, recent.length);
    const today = recent.slice(recent.length - todayN);
    const todayPnl = today.reduce((a, t) => a + t.pnl, 0);
    const todayWins = today.filter((t) => t.hit === "TP").length;
    const todayLosses = today.filter((t) => t.hit === "SL").length;
    // current streak across the most recent activity (positive = wins, negative = losses)
    let streak = 0;
    for (let k = recent.length - 1; k >= 0; k--) {
      const win = recent[k].hit === "TP";
      if (k === recent.length - 1) { streak = win ? 1 : -1; continue; }
      if (win && streak > 0) streak++;
      else if (!win && streak < 0) streak--;
      else break;
    }

    return {
      trades, closed, pending, active, wins, losses,
      netPnl, grossWin, grossLoss, winRate, avgWin, avgLoss, profitFactor,
      expectancy, best, worst, avgConfidence, maxDrawdown,
      equity, balance, returnPct,
      today, todayPnl, todayWins, todayLosses, streak,
    };
  }, []);

  const tooltipStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" };
  const pfFmt = (v) => (v === Infinity ? "∞" : v.toFixed(2));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "15px", fontWeight: "800" }}>Robotín Wallet</div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800,
              color: C.cyan, backgroundColor: `${C.cyan}1c`, padding: "2px 8px", borderRadius: 4,
              textTransform: "uppercase", letterSpacing: "0.5px",
            }}><Cpu size={10} /> AI Execution Account</span>
          </div>
          <div style={{ fontSize: "11px", color: C.textMuted, marginTop: 2 }}>
            Every trade Robotín executed from approved signals · {data.trades.length} executed · {data.closed.length} closed · simulated
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Net P&amp;L</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: data.netPnl >= 0 ? C.green : C.red, ...mono }}>{usd(data.netPnl)}</div>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        <StatCard
          label="Total Net P&L" value={usd(data.netPnl)} icon={Wallet}
          color={data.netPnl >= 0 ? C.green : C.red}
          sub={`${data.returnPct >= 0 ? "+" : ""}${data.returnPct.toFixed(2)}% on balance`}
        />
        <StatCard
          label="Total Trades" value={data.trades.length.toLocaleString()} icon={TrendingUp} color={C.purple}
          sub={`${data.pending.length} pending · ${data.active.length} active · ${data.closed.length} closed`}
        />
        <StatCard
          label="Win Rate" value={`${data.winRate.toFixed(1)}%`} icon={Percent}
          color={data.winRate >= 50 ? C.green : C.red} tip="winRate"
          sub={`${data.wins.length} W / ${data.losses.length} L`}
        />
        <StatCard
          label="Wins vs Losses" value={`${data.wins.length} / ${data.losses.length}`} icon={Activity}
          color={C.blue} sub={`of ${data.closed.length} closed`}
        />
        <StatCard
          label="Avg Win / Avg Loss" value={`+$${data.avgWin.toFixed(0)} / -$${data.avgLoss.toFixed(0)}`}
          icon={Scale} color={C.amber}
          sub={data.avgLoss > 0 ? `ratio ${(data.avgWin / data.avgLoss).toFixed(2)}x` : "—"}
        />
        <StatCard
          label="Best / Worst" value={`+$${data.best.toFixed(0)} / -$${Math.abs(data.worst).toFixed(0)}`}
          icon={Award} color={C.green} sub="single trade"
        />
        <StatCard
          label="Profit Factor" value={pfFmt(data.profitFactor)} icon={Scale}
          color={data.profitFactor >= 1 ? C.green : C.red} tip="profitFactor"
        />
        <StatCard
          label="Expectancy" value={usd(data.expectancy)} icon={Target}
          color={data.expectancy >= 0 ? C.green : C.red} tip="expectancy" sub="avg per closed trade"
        />
        <StatCard
          label="Max Drawdown" value={usd(data.maxDrawdown)} icon={TrendingDown}
          color={C.red} tip="maxDD" sub="peak-to-trough equity"
        />
        <StatCard
          label="Avg Confidence" value={`${data.avgConfidence.toFixed(0)}%`} icon={Cpu}
          color={C.cyan} tip="confidence" sub="Robotín on executed trades"
        />
      </div>

      {/* ── Account balance + equity curve / Today's performance ── */}
      <div className="grid-2col-16">
        {/* Account Balance */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: "600" }}>
                <Wallet size={14} color={C.purple} /> Account Balance
              </div>
              <div style={{ fontSize: "10px", color: C.textFaint }}>Starting {usdPlain(STARTING_BALANCE)} + net P&amp;L · simulated equity curve over closed trades</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 800, ...mono }}>{usdPlain(Math.round(data.balance))}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: data.netPnl >= 0 ? C.green : C.red, ...mono }}>
                {usd(data.netPnl)} · {data.returnPct >= 0 ? "+" : ""}{data.returnPct.toFixed(2)}%
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.equity}>
              <defs>
                <linearGradient id="robotinEq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.purple} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
              <XAxis dataKey="i" stroke={C.textMuted} fontSize={10} tickFormatter={(v) => `#${v}`} />
              <YAxis stroke={C.textMuted} fontSize={10} domain={["auto", "auto"]} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(v) => (v === 0 ? "Start" : `Trade #${v}`)}
                formatter={(v) => [usdPlain(Math.round(Number(v))), "Balance"]}
              />
              <Area type="monotone" dataKey="balance" stroke={C.purple} strokeWidth={2.5} fill="url(#robotinEq)" dot={false} name="balance" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: "16px", fontSize: "9px", color: C.textMuted, marginTop: "4px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><span style={{ width: 14, height: 3, backgroundColor: C.purple, borderRadius: 1 }} /> Cumulative balance over closed trades</span>
          </div>
        </div>

        {/* Today's Performance (simulated subset) */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: "600" }}>
                <Activity size={14} color={C.blue} /> Today's Performance
              </div>
              <div style={{ fontSize: "10px", color: C.textFaint }}>Simulated session — last {data.today.length} closed trades</div>
            </div>
            <span style={{ fontSize: 8, fontWeight: 800, color: C.amber, backgroundColor: C.amberBg, padding: "2px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>Simulated</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ ...cardStyle, padding: "12px 14px", backgroundColor: C.cardElev }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>Session P&amp;L</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: data.todayPnl >= 0 ? C.green : C.red, ...mono }}>{usd(data.todayPnl)}</div>
            </div>
            <div style={{ ...cardStyle, padding: "12px 14px", backgroundColor: C.cardElev }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>Wins / Losses</div>
              <div style={{ fontSize: "22px", fontWeight: "800", ...mono }}>
                <span style={{ color: C.green }}>{data.todayWins}</span>
                <span style={{ color: C.textFaint }}> / </span>
                <span style={{ color: C.red }}>{data.todayLosses}</span>
              </div>
            </div>
            <div style={{ ...cardStyle, padding: "12px 14px", backgroundColor: C.cardElev }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px", display: "flex", alignItems: "center", gap: 4 }}>
                <InfoTip k="streak"><span>Current Streak</span></InfoTip>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: data.streak >= 0 ? C.green : C.red, ...mono, display: "flex", alignItems: "center", gap: 6 }}>
                <Flame size={16} />{data.streak >= 0 ? `${data.streak}W` : `${Math.abs(data.streak)}L`}
              </div>
            </div>
            <div style={{ ...cardStyle, padding: "12px 14px", backgroundColor: C.cardElev }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}>Session Win Rate</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: C.blue, ...mono }}>
                {data.today.length ? Math.round((data.todayWins / data.today.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Executed Trades list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: "13px", fontWeight: "700" }}>Executed Trades</div>
          <div style={{ fontSize: "10px", color: C.textMuted }}>{data.trades.length} trades · click a row for Robotín's reasoning &amp; audit</div>
        </div>

        {data.trades.map((s) => {
          const st = STATUS[statusKey(s)] || STATUS.pending;
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="card-hover" style={{ ...cardStyle, padding: 0, overflow: "hidden", borderLeft: `3px solid ${s.dir === "LONG" ? C.green : C.red}` }}>
              <button onClick={() => setOpen(isOpen ? null : s.id)} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                {/* Coin / pair + dir */}
                <div style={{ minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{s.coin}</span>
                    <span style={{ fontSize: 10, color: C.textMuted, ...mono }}>{s.pair}</span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: s.dir === "LONG" ? C.green : C.red, backgroundColor: `${s.dir === "LONG" ? C.green : C.red}18`, padding: "1px 6px", borderRadius: 3 }}>{s.dir}</span>
                </div>
                {/* Trader */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={s.trader} size={26} />
                  <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.trader}</span>
                    <BotTag isBot={s.isBot} size={14} />
                  </div>
                </div>
                {/* Robotín confidence */}
                <div style={{ textAlign: "center", minWidth: 78 }}>
                  <div style={{ fontSize: 8, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}><Cpu size={9} /> Robotín</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: s.confidence >= 75 ? C.green : C.amber, ...mono }}>{s.confidence}%</div>
                </div>
                {/* Status + pnl */}
                <div style={{ textAlign: "right", minWidth: 96 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: st.color }}>
                    {s.status === "pending" ? <Clock size={11} /> : s.status === "active" ? <Activity size={11} /> : null}{st.label}
                  </div>
                  {s.status === "closed" && <div style={{ fontSize: 12, fontWeight: 800, color: s.pnl >= 0 ? C.green : C.red, ...mono }}>{usd(s.pnl)}</div>}
                </div>
                <ChevronDown size={16} color={C.textFaint} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>

              {isOpen && (
                <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Cpu size={10} color={C.purple} /> Robotín's reasoning</div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.55, fontStyle: "italic" }}>“{s.reasoning}”</div>
                    <div style={{ marginTop: 8, fontSize: 10, color: C.textMuted, ...mono }}>Semantic tag: <span style={{ color: C.purple }}>{s.tag}</span></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {[
                      ["Confidence", `${s.confidence}%`, s.confidence >= 75 ? C.green : C.amber],
                      ["Entry", fmt(s.entry), C.text],
                      ["Targets", `TP1 ${fmt(s.tp1)} · TP2 ${fmt(s.tp2)} · TP3 ${fmt(s.tp3)}`, C.green],
                      ["Stop loss", fmt(s.sl), C.red],
                      ["P&L", s.status === "closed" ? usd(s.pnl) + ` (${s.pnlPct >= 0 ? "+" : ""}${s.pnlPct}%)` : "Open", s.status === "closed" ? (s.pnl >= 0 ? C.green : C.red) : C.textMuted],
                      ["Signal said", "Take Profit", C.green],
                      ["What happened", s.auditOutcome || "—", s.auditOutcome === "TP" ? C.green : s.auditOutcome === "SL" ? C.red : C.textMuted],
                      ["Audit", s.status === "closed" ? (s.hit === "TP" ? "Exact match" : "Outcome mismatch") : s.status, s.hit === "TP" ? C.green : s.hit === "SL" ? C.amber : C.textMuted],
                    ].map(([l, v, clr]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>
                        <span style={{ color: C.textMuted }}>{l}</span>
                        <span style={{ color: clr, fontWeight: 700, ...mono, textAlign: "right" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { RobotinWallet };
