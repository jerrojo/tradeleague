import { useMemo } from "react";
import { GitBranch, ChevronRight, ShieldCheck, ShieldX, TrendingUp, Users } from "lucide-react";
import { SectionHeader, EmptyState } from "../common";
import { useTimeframe, useProfile } from "../../contexts";
import { mockTraders } from "../../data/mockData";
import { ALL_SIGNALS } from "../../data/robotin";
import { usd, pct, signColor } from "../../lib/format";
import { C, cardStyle, mono } from "../../theme";

/* ═══════════════════════ FILTER EDGE — what Robotín's approve/reject is worth ═══════════════════════
   The differentiator no off-the-shelf tool has: we know the counterfactual. Every
   signal carries a hypothetical "if executed" outcome, so we can compare the book
   Robotín actually ran (approved → executed) against the book of everything (all
   signals) and, crucially, against the signals it REJECTED. The edge is the P&L the
   filter avoided by screening losers out. Sliced by signal provider for attribution. */

const Funnel = ({ stages }) => (
  <div style={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "wrap" }}>
    {stages.map((s, i) => (
      <div key={s.label} style={{ display: "flex", alignItems: "center", flex: "1 1 0", minWidth: 150 }}>
        <div style={{ ...cardStyle, flex: 1, borderColor: `${s.color}40`, backgroundColor: `${s.color}0d` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint }}>{s.label}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: s.color, ...mono, marginTop: 2 }}>{s.value}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 2 }}>{s.sub}</div>
        </div>
        {i < stages.length - 1 && <ChevronRight size={18} color={C.textFaint} style={{ flexShrink: 0, margin: "0 6px" }} />}
      </div>
    ))}
  </div>
);

const HeroStat = ({ label, value, color, hint }) => (
  <div className="tl-card" style={{ ...cardStyle, flex: "1 1 0", minWidth: 180 }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color, ...mono, marginTop: 3 }}>{value}</div>
    {hint && <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 3, lineHeight: 1.4 }}>{hint}</div>}
  </div>
);

const FilterEdge = () => {
  const { within } = useTimeframe();
  const { openProfile } = useProfile();
  const openTrader = (name) => { const t = mockTraders.find((x) => x.name === name); if (t) openProfile(t); };

  const d = useMemo(() => {
    const all = ALL_SIGNALS.filter((s) => within(s.time));
    const approved = all.filter((s) => s.approved);
    const rejected = all.filter((s) => !s.approved);
    const execClosed = approved.filter((s) => s.status === "closed");
    const rejClosed = rejected.filter((s) => s.hypoClosed);

    const execPnl = execClosed.reduce((a, s) => a + s.pnl, 0);
    const avoidedPnl = rejClosed.reduce((a, s) => a + s.hypoPnl, 0); // what rejected signals WOULD have done
    const allIfExec = execPnl + avoidedPnl;                          // taking everything
    const edge = execPnl - allIfExec;                                // = −avoidedPnl
    const avoidedLosers = rejClosed.filter((s) => s.hypoPnl < 0).length;

    // attribution by signal provider
    const byTrader = new Map();
    all.forEach((s) => {
      if (!byTrader.has(s.trader)) byTrader.set(s.trader, { trader: s.trader, isBot: s.isBot, total: 0, approved: 0, execPnl: 0, avoidedPnl: 0 });
      const t = byTrader.get(s.trader);
      t.total++;
      if (s.approved) { t.approved++; if (s.status === "closed") t.execPnl += s.pnl; }
      else if (s.hypoClosed) t.avoidedPnl += s.hypoPnl;
    });
    const traders = [...byTrader.values()].map((t) => ({
      ...t,
      approvalRate: t.total ? (t.approved / t.total) * 100 : 0,
      edge: -t.avoidedPnl,
    })).sort((a, b) => b.execPnl - a.execPnl);

    return {
      published: all.length, approvedN: approved.length, rejectedN: rejected.length,
      execClosedN: execClosed.length, approvalRate: all.length ? (approved.length / all.length) * 100 : 0,
      execPnl, avoidedPnl, allIfExec, edge, avoidedLosers, rejClosedN: rejClosed.length, traders,
    };
  }, [within]);

  if (!d.published) {
    return <EmptyState icon={GitBranch} title="No signals in this period" hint="Widen the global timeframe to see how Robotín's filter performed." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionHeader
        icon={GitBranch}
        title="Filter edge — what Robotín's approve/reject is worth"
        subtitle="The executed book vs. the counterfactual of every signal, including the ones the filter rejected · simulated"
      />

      {/* funnel */}
      <Funnel stages={[
        { label: "Signals published", value: d.published, sub: "across all providers", color: C.blue },
        { label: "Approved by Robotín", value: d.approvedN, sub: `${pct(d.approvalRate)} approval rate`, color: C.purple },
        { label: "Executed & closed", value: d.execClosedN, sub: "became realized trades", color: C.green },
      ]} />

      {/* hero comparison */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <HeroStat label="Executed P&L" value={usd(d.execPnl, { signed: true })} color={signColor(d.execPnl, C)} hint="What Robotín's approved book actually realized." />
        <HeroStat label="All signals, if executed" value={usd(d.allIfExec, { signed: true })} color={signColor(d.allIfExec, C)} hint="Counterfactual: taking every signal, approved + rejected." />
        <HeroStat label="Filter edge" value={usd(d.edge, { signed: true })} color={signColor(d.edge, C)} hint={`Value the filter ${d.edge >= 0 ? "added" : "cost"} by screening signals.`} />
      </div>

      {/* counterfactual callout */}
      <div style={{ ...cardStyle, display: "flex", gap: 12, alignItems: "center", borderColor: `${d.edge >= 0 ? C.green : C.red}40`, backgroundColor: `${d.edge >= 0 ? C.green : C.red}0d` }}>
        {d.edge >= 0 ? <ShieldCheck size={22} color={C.green} /> : <ShieldX size={22} color={C.red} />}
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
          Robotín rejected <b style={{ ...mono }}>{d.rejectedN}</b> signals; of those that would have resolved, <b style={{ ...mono }}>{d.avoidedLosers}</b> were losers.
          {" "}Taken together they would have netted <b style={{ color: signColor(d.avoidedPnl, C), ...mono }}>{usd(d.avoidedPnl, { signed: true })}</b> — so screening them
          {" "}{d.edge >= 0 ? "added" : "cost"} <b style={{ color: signColor(d.edge, C), ...mono }}>{usd(d.edge, { signed: true })}</b> of edge this period.
        </div>
      </div>

      {/* attribution by provider */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
          <Users size={14} color={C.purple} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Attribution by signal provider</span>
          <span style={{ fontSize: 10, color: C.textMuted }}>{d.traders.length} providers · sorted by executed P&L</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {[["Provider", "left"], ["Signals", "right"], ["Approved", "right"], ["Approval", "right"], ["Executed P&L", "right"], ["Rejected if exec.", "right"], ["Edge", "right"]].map(([h, al]) => (
                  <th key={h} style={{ textAlign: al, padding: "9px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase", color: C.textFaint, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.traders.map((t) => (
                <tr key={t.trader} className="hoverable" title={`Open ${t.trader}'s profile`} onClick={() => openTrader(t.trader)} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                  <td style={{ padding: "9px 12px", fontWeight: 700, color: C.text }}>{t.trader}{t.isBot ? <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 6 }}>BOT</span> : null}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", ...mono, color: C.textMuted }}>{t.total}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", ...mono, color: C.text }}>{t.approved}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", ...mono, color: t.approvalRate >= 50 ? C.green : C.amber }}>{pct(t.approvalRate)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", ...mono, fontWeight: 800, color: signColor(t.execPnl, C) }}>{usd(t.execPnl, { signed: true })}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", ...mono, color: signColor(t.avoidedPnl, C) }}>{usd(t.avoidedPnl, { signed: true })}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", ...mono, fontWeight: 700, color: signColor(t.edge, C) }}>{usd(t.edge, { signed: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export { FilterEdge };
