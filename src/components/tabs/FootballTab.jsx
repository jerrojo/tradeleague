import { TraderLink } from "../../contexts";
import { Tag } from "../common";
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle, Gamepad2, RefreshCw, TrendingDown, Trophy, Users } from "lucide-react";
import { useFeedFilter } from "../../contexts";
import { ftgCurrentPrice, ftgPair, ftgPlayers, ftgSessions, ftgTimeframes } from "../../data/mockData";
import { C, cardStyle, mono, tdStyle, thStyle } from "../../theme";
import { useState } from "react";
/* ═══════════════════════ TAB 8: FOOTBALL TRADING GAME ═══════════════════════ */

const FootballTab = () => {
  const [selTf, setSelTf] = useState("3D");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { setActiveTab } = useFeedFilter();

  const longs = ftgPlayers.filter(p => p.team === "LONG");
  const shorts = ftgPlayers.filter(p => p.team === "SHORT");
  const longCount = longs.length;
  const shortCount = shorts.length;
  const totalPlayers = ftgPlayers.length;
  const longPct = Math.round((longCount / totalPlayers) * 100);
  const shortPct = 100 - longPct;
  const avgRoi = (ftgPlayers.reduce((a, p) => a + p.roi, 0) / totalPlayers).toFixed(2);
  const bestPlayer = [...ftgPlayers].sort((a, b) => b.roi - a.roi)[0];

  /* Momentum: which team is "winning" the market */
  const momentum = shortPct > longPct ? "SHORT" : longPct > shortPct ? "LONG" : "NEUTRAL";
  const momStrength = Math.abs(longPct - shortPct) > 30 ? "STRONG" : Math.abs(longPct - shortPct) > 10 ? "MODERATE" : "WEAK";

  /* Orderflow / Volume / Structure / Liquidity mini-gauges */
  const gauges = [
    { label: "Orderflow", val: 8, max: 23 },
    { label: "Volume", val: 5, max: 7 },
    { label: "Structure", val: 14, max: 20 },
    { label: "Liquidity", val: 10, max: 10 },
  ];

  /* Down & Distance (American football metaphor: how far from next support/resistance) */
  const nearestTarget = 67400;
  const distance = Math.abs(ftgCurrentPrice - nearestTarget).toFixed(0);

  /* Active session */
  const activeSession = ftgSessions.find(s => s.active) || ftgSessions[0];
  /* Sentiment breakdown: humans vs bots */
  const longHumans = 3;
  const longBots = longCount - longHumans;
  const shortHumans = 2;
  const shortBots = shortCount - shortHumans;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Gamepad2 size={20} color={C.purple} />
          <span style={{ fontSize: "18px", fontWeight: "800" }}>Football Trading Game</span>
          <Tag text={`${totalPlayers} active players`} color={C.green} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", ...mono }}>{ftgPair}</div>
          {ftgTimeframes.map(tf => (
            <button key={tf} onClick={() => setSelTf(tf)} style={{
              padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
              backgroundColor: selTf === tf ? C.green : C.bg, color: selTf === tf ? "#000" : C.textMuted,
              border: `1px solid ${selTf === tf ? C.green : C.border}`, transition: "all 0.15s"
            }}>{tf}</button>
          ))}
          <button onClick={() => {
            setIsRefreshing(true);
            setTimeout(() => setIsRefreshing(false), 600);
          }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", backgroundColor: C.green, border: "none", color: "#000", fontSize: "11px", fontWeight: "700", cursor: "pointer", opacity: isRefreshing ? 0.7 : 1, transition: "opacity 0.2s" }}>
            <RefreshCw size={12} style={{ animation: isRefreshing ? "spin 0.6s linear" : "none" }} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Main: Field + Scoreboard ── */}
      <div className="grid-2col-16">

        {/* Multi-Token Sentiment Overview */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}><Gamepad2 size={13} /> Market Sentiment Overview</div>
              <div style={{ fontSize: "10px", color: C.textMuted }}>LONG vs SHORT positioning across top tokens</div>
            </div>
          </div>

          {/* Token sentiment mini-cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {[
              { token: "BTC", longPct: 62, price: "$67,240" },
              { token: "ETH", longPct: 55, price: "$3,410" },
              { token: "SOL", longPct: 71, price: "$142.80" },
              { token: "BNB", longPct: 48, price: "$580.50" },
              { token: "XRP", longPct: 44, price: "$0.52" },
            ].map(t => {
              const shortP = 100 - t.longPct;
              const dominant = t.longPct >= 50 ? "LONG" : "SHORT";
              const domColor = dominant === "LONG" ? C.green : C.red;
              return (
                <div key={t.token} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                  <div style={{ minWidth: "40px", fontSize: "12px", fontWeight: "700" }}>{t.token}</div>
                  <div style={{ minWidth: "65px", fontSize: "11px", color: C.textMuted, ...mono }}>{t.price}</div>
                  <div style={{ flex: 1, display: "flex", height: "14px", borderRadius: "3px", overflow: "hidden", gap: "1px" }}>
                    <div style={{ flex: t.longPct, backgroundColor: C.green, borderRadius: "3px 0 0 3px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "8px", fontWeight: "700", color: "#000" }}>{t.longPct}%</span>
                    </div>
                    <div style={{ flex: shortP, backgroundColor: C.red, borderRadius: "0 3px 3px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "8px", fontWeight: "700", color: "#fff" }}>{shortP}%</span>
                    </div>
                  </div>
                  <div style={{ minWidth: "50px", fontSize: "10px", fontWeight: "700", color: domColor, textAlign: "right" }}>{dominant}</div>
                </div>
              );
            })}
          </div>

          {/* CTA to Tokens tab */}
          <button onClick={() => setActiveTab("tokens")} style={{
            width: "100%", padding: "12px", borderRadius: "8px", cursor: "pointer",
            backgroundColor: `${C.purple}15`, border: `1px solid ${C.purple}40`, color: C.purple,
            fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "all 0.2s"
          }}>
            <Gamepad2 size={14} />
            Select a token in the Tokens tab for the full Trading Field view
            <ArrowRight size={14} />
          </button>
        </div>

        {/* ── Scoreboard ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Score */}
          <div style={cardStyle}>
            <div style={{ fontSize: "14px", fontWeight: "800", textAlign: "center", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><Trophy size={14} /> Scoreboard</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
              {/* LONG */}
              <div style={{ flex: 1, border: `1px solid ${C.green}40`, borderRadius: "8px", padding: "12px", textAlign: "center", backgroundColor: C.greenBg }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: C.green, textTransform: "uppercase" }}>LONG</div>
                <div style={{ fontSize: "32px", fontWeight: "900", color: C.green, ...mono, lineHeight: 1, marginTop: "4px" }}>{longPct}</div>
                <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "2px" }}>Bulls</div>
              </div>
              {/* Momentum */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: "70px" }}>
                <div style={{ fontSize: "9px", color: C.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Momentum</div>
                <div style={{ fontSize: "18px", marginTop: "4px" }}>{momentum === "SHORT" ? "⬇" : momentum === "LONG" ? "⬆" : "↔"}</div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: momStrength === "STRONG" ? C.amber : C.textMuted, marginTop: "2px" }}>{momStrength}</div>
              </div>
              {/* SHORT */}
              <div style={{ flex: 1, border: `1px solid ${C.red}40`, borderRadius: "8px", padding: "12px", textAlign: "center", backgroundColor: C.redBg }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: C.red, textTransform: "uppercase" }}>SHORT</div>
                <div style={{ fontSize: "32px", fontWeight: "900", color: C.red, ...mono, lineHeight: 1, marginTop: "4px", textShadow: shortPct > longPct ? `0 0 16px ${C.red}50` : "none" }}>{shortPct}</div>
                <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "2px" }}>Bears</div>
              </div>
            </div>

            {/* Possession bar */}
            <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
              <span>HOLDINGS</span>
              <span style={{ ...mono }}>{longPct}% LONG / {shortPct}% SHORT</span>
            </div>
            <div style={{ display: "flex", height: "10px", borderRadius: "5px", overflow: "hidden", gap: "2px" }}>
              <div style={{ flex: longPct, backgroundColor: C.green, borderRadius: "5px 0 0 5px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "8px", fontWeight: "700", color: "#000" }}>{longPct}%</span>
              </div>
              <div style={{ flex: shortPct, backgroundColor: C.red, borderRadius: "0 5px 5px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "8px", fontWeight: "700", color: "#fff" }}>{shortPct}%</span>
              </div>
            </div>
          </div>


          {/* ── Sentiment Breakdown ── */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><Users size={12} /> Sentiment: Traders vs Bots</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              {/* LONG Traders */}
              <div style={{ border: `1px solid ${C.green}40`, borderRadius: "6px", padding: "10px", backgroundColor: `${C.green}08` }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: C.green, textTransform: "uppercase", marginBottom: "6px" }}>LONG</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: C.green, ...mono, marginBottom: "6px" }}>{longCount}</div>
                <div style={{ fontSize: "9px", color: C.textMuted, marginBottom: "4px" }}>👤 {longHumans} humans</div>
                <div style={{ fontSize: "9px", color: C.textMuted }}>🤖 {longBots} bots</div>
              </div>
              {/* SHORT Traders */}
              <div style={{ border: `1px solid ${C.red}40`, borderRadius: "6px", padding: "10px", backgroundColor: `${C.red}08` }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: C.red, textTransform: "uppercase", marginBottom: "6px" }}>SHORT</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: C.red, ...mono, marginBottom: "6px" }}>{shortCount}</div>
                <div style={{ fontSize: "9px", color: C.textMuted, marginBottom: "4px" }}>👤 {shortHumans} humans</div>
                <div style={{ fontSize: "9px", color: C.textMuted }}>🤖 {shortBots} bots</div>
              </div>
            </div>
            {/* Sentiment bar with trader breakdown */}
            <div style={{ fontSize: "9px", color: C.textMuted, marginBottom: "4px", fontWeight: "600" }}>Trader Distribution</div>
            <div style={{ display: "flex", height: "24px", borderRadius: "6px", overflow: "hidden", gap: "2px", marginBottom: "8px" }}>
              <div style={{ flex: longCount, backgroundColor: C.green, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                <span style={{ fontSize: "7px", fontWeight: "700", color: "#000" }}>{longCount}L</span>
              </div>
              <div style={{ flex: shortCount, backgroundColor: C.red, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span style={{ fontSize: "7px", fontWeight: "700", color: "#fff" }}>{shortCount}S</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: C.textFaint }}>
              <span>{Math.round((longCount/(longCount+shortCount))*100)}% LONG</span>
              <span>{Math.round((shortCount/(longCount+shortCount))*100)}% SHORT</span>
            </div>
          </div>
          {/* Down & Distance + Game Clock */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={cardStyle}>
              <div style={{ fontSize: "10px", color: C.textMuted, fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>Down & Distance</div>
              <div style={{ fontSize: "18px", fontWeight: "800", ...mono }}>4th & {distance}</div>
              <div style={{ fontSize: "10px", color: C.amber, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <AlertTriangle size={10} /> Critical Down!
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "10px", color: C.textMuted, fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>Game Clock</div>
              <div style={{ fontSize: "18px", fontWeight: "800", ...mono }}>Q4 — 10:04</div>
              <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "4px" }}>{activeSession.name} Session</div>
            </div>
          </div>

          {/* Mini gauges */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {gauges.map(g => {
              const pct = (g.val / g.max) * 100;
              const clr = pct >= 60 ? C.green : pct >= 30 ? C.amber : C.red;
              return (
                <div key={g.label} style={{ ...cardStyle, padding: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", color: C.textMuted }}>{g.label}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", ...mono }}>{g.val}/{g.max}</span>
                  </div>
                  <div style={{ height: "2px", backgroundColor: C.border, borderRadius: "1px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: clr, borderRadius: "2px" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Statistics */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><BarChart3 size={12} /> Stats</div>
            {[
              ["Total Players", totalPlayers],
              ["Distribution", `${longCount} LONG / ${shortCount} SHORT`],
              ["Avg ROI", <span style={{ color: Number(avgRoi) >= 0 ? C.green : C.red }}>+{avgRoi}%</span>],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                <span style={{ color: C.textMuted }}>{label}</span>
                <span style={{ fontWeight: "600", ...mono }}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "4px" }}><Trophy size={10} color={C.amber} /> Best Player</div>
              <div style={{ fontSize: "14px", fontWeight: "700" }}><TraderLink name={bestPlayer.name}>{bestPlayer.name}</TraderLink></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Players ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}><Users size={14} /> Active Players</div>
          <span style={{ fontSize: "12px", color: C.textMuted }}>{totalPlayers} positions</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead><tr>
              {["Trader","Team","Entry","Current","ROI","Status","Time"].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {ftgPlayers.map(p => (
                <tr key={p.name}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "600" }}><TraderLink name={p.name}>{p.name}</TraderLink></div>
                        <div style={{ fontSize: "10px", color: C.textMuted }}>{p.coin}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <Tag text={p.team} color={p.team === "LONG" ? C.green : C.red} />
                  </td>
                  <td style={{ ...tdStyle, ...mono, fontSize: "12px" }}>${p.entry.toLocaleString()}</td>
                  <td style={{ ...tdStyle, ...mono, fontSize: "12px" }}>${p.current.toLocaleString()}</td>
                  <td style={{ ...tdStyle, ...mono, fontSize: "12px", fontWeight: "700", color: p.roi >= 0 ? C.green : C.red }}>
                    {p.roi >= 0 ? "+" : ""}{p.roi.toFixed(2)}%
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: p.status === "Win" ? C.green : C.red }}>
                      <span style={{ color: p.status === "Win" ? C.green : C.red }}>{p.status === "Win" ? <CheckCircle size={10} /> : <TrendingDown size={10} />}</span> {p.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export {
  FootballTab
};
