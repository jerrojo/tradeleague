import { TokenFieldViz } from "../TokenFieldViz";
import { InfoTip, StatCard, Tag } from "../common";
import { CheckCircle, ChevronDown, Search } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDate } from "../../contexts";
import { ftgPlayers, smcCoins } from "../../data/mockData";
import { C, cardStyle, mono } from "../../theme";
import { AlertTriangle, ArrowDown, ArrowUp, Target, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
/* ═══════════════════════ TAB 1: SMC ANALYSIS ═══════════════════════ */
const SMCAnalysis = () => {
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [coinPickerOpen, setCoinPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const { dateLabel: globalDateLabel } = useDate();
  const coin = smcCoins[selectedCoin];
  const coinPickerRef = useRef(null);

  const categories = ["All", "Layer 1", "Layer 2", "DeFi", "Meme", "AI"];

  const filteredCoins = useMemo(() => Object.keys(smcCoins).filter(ticker => {
    const matchesSearch = ticker.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || smcCoins[ticker].category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort(), [searchQuery, categoryFilter]);

  useEffect(() => {
    if (!coinPickerOpen) return;
    const handler = (e) => { if (coinPickerRef.current && !coinPickerRef.current.contains(e.target)) setCoinPickerOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [coinPickerOpen]);

  const chartData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    price: Math.round((coin.chartBase + i * coin.chartStep + Math.sin(i * 0.5) * coin.chartAmp) * 100) / 100,
    volume: Math.floor(1200 + Math.random() * 800),
    ma20: Math.round((coin.chartBase - coin.chartAmp * 0.25 + i * coin.chartStep * 1.05) * 100) / 100,
    ma50: Math.round((coin.chartBase - coin.chartAmp * 0.5 + i * coin.chartStep * 0.85) * 100) / 100,
  })), [selectedCoin]);

  const killZones = [
    { name: "Asia", time: "00:00–08:00 UTC", active: false },
    { name: "London", time: "08:00–16:00 UTC", active: true },
    { name: "NY AM", time: "13:00–17:00 UTC", active: true },
    { name: "NY PM", time: "17:00–21:00 UTC", active: false },
  ];

  const riskColor = coin.risk === "LOW" ? C.green : coin.risk === "MEDIUM" ? C.amber : C.red;
  const biasColor = coin.bias === "BULLISH" ? C.green : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ── Coin Selector: inline active coin + dropdown picker ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        {/* Active coin display */}
        <div ref={coinPickerRef} style={{ position: "relative" }}>
          <button onClick={() => { setCoinPickerOpen(!coinPickerOpen); setSearchQuery(""); }} style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px",
            backgroundColor: C.card, border: `1px solid ${coinPickerOpen ? C.purple : C.border}`,
            borderRadius: "8px", cursor: "pointer", transition: "border-color 0.15s"
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: "20px", fontWeight: "800", color: C.text, ...mono }}>{selectedCoin}</span>
              <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: "500" }}>/{coin.pair}</span>
            </div>
            <div style={{ width: "1px", height: "24px", backgroundColor: C.border }} />
            <span style={{ fontSize: "16px", fontWeight: "700", color: C.text, ...mono }}>{coin.price}</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: coin.change.startsWith("+") ? C.green : C.red, ...mono }}>{coin.change}</span>
            <div style={{ width: "1px", height: "24px", backgroundColor: C.border }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: biasColor, textTransform: "uppercase" }}>{coin.bias}</span>
            <ChevronDown size={16} color={C.textMuted} style={{ transform: coinPickerOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: "4px" }} />
          </button>

          {/* Dropdown picker */}
          {coinPickerOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300,
              backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "10px",
              width: "420px", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", overflow: "hidden"
            }}>
              {/* Search */}
              <div style={{ padding: "12px 12px 8px", position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "22px", top: "22px", color: C.textMuted }} />
                <input
                  type="text" placeholder="Search coins..." value={searchQuery} autoFocus
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px 8px 32px", borderRadius: "6px",
                    border: `1px solid ${C.border}`, backgroundColor: C.bg, color: C.text,
                    fontSize: "12px", fontFamily: "inherit", outline: "none",
                  }}
                />
              </div>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: "2px", padding: "0 12px 8px", borderBottom: `1px solid ${C.border}` }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                    padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                    border: "none", backgroundColor: categoryFilter === cat ? C.purpleBg : "transparent",
                    color: categoryFilter === cat ? C.purple : C.textMuted,
                  }}>{cat}</button>
                ))}
              </div>
              {/* Coin list */}
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {filteredCoins.map(c => {
                  const cd = smcCoins[c];
                  const isSelected = selectedCoin === c;
                  return (
                    <button key={c} onClick={() => { setSelectedCoin(c); setCoinPickerOpen(false); }} style={{
                      display: "flex", alignItems: "center", width: "100%", padding: "8px 14px",
                      border: "none", cursor: "pointer", gap: "12px",
                      backgroundColor: isSelected ? C.purpleBg : "transparent",
                      borderLeft: isSelected ? `3px solid ${C.purple}` : "3px solid transparent",
                    }}>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: isSelected ? C.purple : C.text }}>{c}</span>
                        <span style={{ fontSize: "10px", color: C.textFaint, marginLeft: "2px" }}>/{cd.pair}</span>
                        <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "8px" }}>{cd.category}</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: C.text, ...mono, minWidth: "80px", textAlign: "right" }}>{cd.price}</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", minWidth: "50px", textAlign: "right", ...mono,
                        color: cd.change.startsWith("+") ? C.green : C.red
                      }}>{cd.change}</span>
                    </button>
                  );
                })}
                {filteredCoins.length === 0 && (
                  <div style={{ padding: "20px", textAlign: "center", color: C.textMuted, fontSize: "12px" }}>No coins found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick-switch: top coins with performance */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["BTC","ETH","SOL","BNB","XRP","DOGE","AVAX","ADA"].map(c => {
            const cd = smcCoins[c];
            const isUp = cd.change.startsWith("+");
            const isActive = selectedCoin === c;
            return (
              <button key={c} onClick={() => setSelectedCoin(c)} style={{
                padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "600", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                border: `1px solid ${isActive ? C.purple : C.border}`,
                backgroundColor: isActive ? C.purpleBg : "transparent",
                color: isActive ? C.purple : C.text,
                transition: "all 0.15s ease",
                ...mono
              }}>
                <span>{c}</span>
                <span style={{
                  fontSize: "9px", fontWeight: "700",
                  color: isUp ? C.green : C.red,
                  backgroundColor: isUp ? C.greenBg : C.redBg,
                  padding: "1px 4px", borderRadius: "3px"
                }}>{cd.change}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Current Price" value={coin.price} sub={coin.change} icon={TrendingUp} color={coin.change.startsWith("+") ? C.green : C.red} />
        <StatCard label="Direction" value={coin.bias === "BULLISH" ? "↑ UP" : "↓ DOWN"} icon={coin.biasIcon === "up" ? ArrowUp : ArrowDown} color={biasColor} tip="bias" />
        <StatCard label="Signal Strength" value={`${coin.confluence}/10`} icon={Target} color={C.blue} tip="confluence" />
        <StatCard label="Risk Level" value={coin.risk === "LOW" ? "LOW" : coin.risk === "MEDIUM" ? "MEDIUM" : "HIGH"} icon={AlertTriangle} color={riskColor} tip="riskLevel" />
      </div>

      {/* Multi-Timeframe Grid */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Multi-Timeframe Analysis — {selectedCoin}/{coin.pair}</div>
        <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "10px" }}>Multi-Timeframe Analysis shows what happens across different time scales (minutes → hours)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {coin.tfData.map(tf => (
            <div key={tf.tf} style={cardStyle}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: C.purple, marginBottom: "12px" }}>{tf.tf === "15m" ? "15 min" : tf.tf === "1H" ? "1 hour" : "4 hours"}</div>
              {[
                ["Trend", tf.trend === "Bullish" ? "↑ Bullish" : tf.trend === "Bearish" ? "↓ Bearish" : "↔ Sideways", tf.trend === "Bullish" ? C.green : tf.trend === "Bearish" ? C.red : C.amber, null],
                ["Structure", tf.struct, tf.struct === "BOS" ? C.green : C.red, tf.struct === "BOS" ? "bos" : "choch"],
                ["Order Block", tf.ob.includes("Bullish")  ? "Buy" : "Sell", tf.ob.includes("Bullish") ? C.green : C.red, "ob"],
                ["Price Gap", tf.fvg === "Filled"  ? "Filled" : "Pending", tf.fvg === "Filled" ? C.green : C.amber, "fvg"],
                ["Liquidity", tf.liq === "Sweep Done" ? "✅ Captured" : tf.liq, C.blue, "liquidity"],
              ].map(([label, val, clr, tipKey]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "11px", color: C.textMuted }}>
                    {tipKey ? <InfoTip k={tipKey} inline><span>{label}</span></InfoTip> : label}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: clr }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Ideal Entry + Kill Zones side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ideal Entry — {selectedCoin}</div>
          <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "14px" }}>Where to enter, how much you can gain, and where to cut losses</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            {[
              ["Entry Zone", coin.entry.zone, C.text, "entryZone"],
              ["Risk:Reward", coin.entry.rr, C.green, "rr"],
              ["Target 1", coin.entry.tp1, C.blue, "tp"],
              ["Target 2", coin.entry.tp2, C.blue, "tp"],
              ["Target 3", coin.entry.tp3, C.blue, "tp"],
              ["Stop Loss", coin.entry.sl, C.red, "sl"],
            ].map(([l, v, clr, tipKey]) => (
              <div key={l}>
                <div style={{ fontSize: "10px", color: C.textMuted, marginBottom: "2px" }}>
                  <InfoTip k={tipKey} inline><span>{l}</span></InfoTip>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: clr, ...mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px", fontWeight: "600" }}>
              <InfoTip k="confluence" inline><span>CONFIRMATION FACTORS</span></InfoTip>
            </div>
            <div style={{ fontSize: "10px", color: C.textFaint, marginBottom: "8px" }}>More factors = more reliable signal</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {coin.confluenceFactors.map(f => {
                const tipMap = { "Order Block": "ob", "FVG": "fvg", "Liquidity": "liquidity", "Kill Zone": "killZone", "BOS": "bos" };
                return (
                  <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: C.green, cursor: tipMap[f] ? "help" : "default" }}>
                    <CheckCircle size={12} />
                    {tipMap[f] ? <InfoTip k={tipMap[f]} inline><span>{f}</span></InfoTip> : f}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <InfoTip k="killZone" inline><span>Horarios Clave</span></InfoTip>
          </div>
          {killZones.map(z => (
            <div key={z.name} style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: z.active ? C.green : C.textFaint }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600" }}>{z.name}</div>
                  <div style={{ fontSize: "10px", color: C.textMuted }}>{z.time}</div>
                </div>
              </div>
              <Tag text={z.active ? "ACTIVE" : "INACTIVE"} color={z.active ? C.green : C.textFaint} />
            </div>
          ))}
        </div>
      </div>

      {/* Safety Checks */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.textMuted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Chequeo de Seguridad — {selectedCoin}</div>
        <div style={{ fontSize: "11px", color: C.textFaint, marginBottom: "10px" }}>Indicators confirming whether it's safe to trade right now</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {coin.safety.map(c => {
            const tipMap = { "Funding Rate": "fundingRate", "Open Interest": "openInterest" };
            const nameMap = { "Funding Rate": "Funding Rate", "Open Interest": "Open Interest", "Volume": "Volume", "Correlation": "Correlation" };
            return (
              <div key={c.name} style={{ ...cardStyle, textAlign: "center" }}>
                {c.status === "pass" ? <CheckCircle size={22} color={C.green} /> : <AlertTriangle size={22} color={C.amber} />}
                <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "8px" }}>
                  {tipMap[c.name] ? <InfoTip k={tipMap[c.name]} inline><span>{nameMap[c.name] || c.name}</span></InfoTip> : (nameMap[c.name] || c.name)}
                </div>
                <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px", ...mono }}>{c.detail}</div>
                <div style={{ fontSize: "10px", color: c.status === "pass" ? C.green : C.amber, marginTop: "4px", textTransform: "uppercase", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>{c.status === "pass" ? <><CheckCircle size={10} /> OK</> : <><AlertTriangle size={10} /> Warning</>}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>
          {selectedCoin}/{smcCoins[selectedCoin].pair} — Price Action ({globalDateLabel})
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} />
            <XAxis dataKey="time" stroke={C.textMuted} fontSize={10} />
            <YAxis stroke={C.textMuted} fontSize={10} domain={["dataMin - auto", "dataMax + auto"]} />
            <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
            <Area type="monotone" dataKey="price" stroke={C.blue} fill="url(#priceGrad)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ma20" stroke={C.amber} dot={false} strokeWidth={1} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="ma50" stroke={C.purple} dot={false} strokeWidth={1} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Trading Field — Who's positioned on this token ── */}
      <div style={cardStyle}>
        <TokenFieldViz
          pair={`${selectedCoin}/USDT`}
          currentPrice={Math.round((coin.chartBase + 12 * coin.chartStep) * 100) / 100}
          priceRange={{ low: Math.round(coin.chartBase * 0.97), high: Math.round((coin.chartBase + 24 * coin.chartStep) * 1.03) }}
          players={ftgPlayers.map((p, i) => ({ ...p, coin: selectedCoin, entry: Math.round((coin.chartBase + (i * 1.3) * coin.chartStep) * 100) / 100, current: Math.round((coin.chartBase + 12 * coin.chartStep + (p.roi / 100) * coin.chartBase * 0.01) * 100) / 100 }))}
        />
      </div>
    </div>
  );
};


export {
  SMCAnalysis
};
