import { InfoTip, StatCard, Tag, TpProgressBar } from "../common";
import { Copy } from "lucide-react";
import { mockSignals } from "../../data/mockData";
import { C, cardStyle, mono } from "../../theme";
import { ToastContext } from "../common";
import { Activity, TrendingUp, Trophy, Zap } from "lucide-react";
import { useContext, useState } from "react";
/* ═══════════════════════ TAB 2: SIGNALS ═══════════════════════ */
const SignalsTab = () => {
  const [coinFilter, setCoinFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { addToast } = useContext(ToastContext);
  const coins = ["ALL","BTC","ETH","SOL","BNB","XRP"];
  const types = ["ALL","LONG","SHORT"];
  const statuses = ["ALL","active","tp_hit","sl_hit","pending"];
  const statusLabel = { active: "Active", tp_hit: "TP Hit", sl_hit: "SL Hit", pending: "Pending" };
  const statusColor = { active: C.blue, tp_hit: C.green, sl_hit: C.red, pending: C.textFaint };

  const filtered = mockSignals.filter(s =>
    (coinFilter === "ALL" || s.coin === coinFilter) &&
    (typeFilter === "ALL" || s.type === typeFilter) &&
    (statusFilter === "ALL" || s.status === statusFilter)
  );
  const wins = filtered.filter(s => s.status === "tp_hit").length;
  const total = filtered.filter(s => s.status !== "pending").length;

  const FilterRow = ({ label, options, active, setActive, colorFn }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: "600", width: "50px" }}>{label}</span>
      {options.map(o => (
        <button key={o} onClick={() => setActive(o)} style={{
          padding: "4px 12px", borderRadius: "4px", border: `1px solid ${active === o ? (colorFn ? colorFn(o) : C.purple) : C.border}`,
          backgroundColor: active === o ? (colorFn ? colorFn(o) + "20" : C.purpleBg) : "transparent",
          color: active === o ? (colorFn ? colorFn(o) : C.purple) : C.textMuted,
          fontSize: "11px", fontWeight: "600", cursor: "pointer"
        }}>{statusLabel[o] || o}</button>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "10px" }}>
        <FilterRow label="Coin" options={coins} active={coinFilter} setActive={setCoinFilter} />
        <FilterRow label="Type" options={types} active={typeFilter} setActive={setTypeFilter} colorFn={o => o === "LONG" ? C.green : o === "SHORT" ? C.red : C.purple} />
        <FilterRow label="Status" options={statuses} active={statusFilter} setActive={setStatusFilter} colorFn={o => statusColor[o] || C.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Total Signals" value={filtered.length} icon={Zap} color={C.purple} />
        <StatCard label="Win Rate" value={total > 0 ? Math.round((wins / total) * 100) + "%" : "—"} icon={Trophy} color={C.green} tip="winRate" />
        <StatCard label="Avg Profit" value={"$" + Math.round(filtered.reduce((a, s) => a + s.pnl, 0) / Math.max(filtered.length, 1)).toLocaleString()} icon={TrendingUp} color={C.blue} />
        <StatCard label="Active Now" value={filtered.filter(s => s.status === "active").length} icon={Activity} color={C.amber} tip="signalActive" />
      </div>

      {/* Signal Cards (card view for better UX) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map(s => (
          <div key={s.id} style={{ ...cardStyle, borderLeft: `3px solid ${s.type === "LONG" ? C.green : C.red}`, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800" }}>{s.coin}/USDT</span>
                    <Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} />
                    <span style={{ fontSize: "12px", color: C.amber, fontWeight: "600", ...mono }}>{s.leverage}</span>
                    <Tag text={statusLabel[s.status]} color={statusColor[s.status]} />
                  </div>
                  <div style={{ fontSize: "10px", color: C.textFaint, marginTop: "3px" }}>{s.group} · {s.date}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: s.pnl > 0 ? C.green : s.pnl < 0 ? C.red : C.textMuted, ...mono }}>
                  {s.pnl !== 0 ? (s.pnl > 0 ? "+" : "") + "$" + s.pnl.toLocaleString() : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: C.textMuted, marginBottom: "6px" }}>
              <span><InfoTip k="entryZone" inline><span>Entry:</span></InfoTip> <span style={{ color: C.text, ...mono }}>${s.entry.toLocaleString()}</span></span>
              <span><InfoTip k="tp" inline><span>TP:</span></InfoTip> <span style={{ color: C.green, ...mono }}>${s.tp.toLocaleString()}</span></span>
              <span><InfoTip k="sl" inline><span>SL:</span></InfoTip> <span style={{ color: C.red, ...mono }}>${s.sl.toLocaleString()}</span></span>
            </div>

            {/* TP Progress for active signals */}
            {s.status === "active" && <TpProgressBar entry={s.entry} tp={s.tp} sl={s.sl} status={s.status} />}

            {/* Quick Action */}
            {s.status === "active" && (
              <div style={{ marginTop: "6px" }}>
                <button onClick={() => {
                  const text = `Entry: $${s.entry}, TP: $${s.tp}, SL: $${s.sl}, Leverage: ${s.leverage}`;
                  navigator.clipboard.writeText(text).then(() => {
                    addToast("Signal copied to clipboard", "success");
                  }).catch(() => {
                    addToast("Entry: $" + s.entry + ", TP: $" + s.tp + ", SL: $" + s.sl, "info");
                  });
                }} style={{
                  display: "flex", alignItems: "center", gap: "3px", padding: "3px 10px", borderRadius: "4px",
                  cursor: "pointer", fontSize: "10px", fontWeight: "700",
                  backgroundColor: C.purpleBg, color: C.purple, border: "none"
                }}><Copy size={10} /> Copy Signal</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


export {
  SignalsTab
};
