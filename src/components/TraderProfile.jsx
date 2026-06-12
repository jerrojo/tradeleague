import { BotTag, InfoTip, StatCard, Tag } from "./common";
import { ActivityHeatmap, TradeStructureDiagram } from "./widgets";
import { Bell, BellRing, ChevronRight, Circle, Eye, Heart, Link2, MessageCircle, RefreshCw, Send } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { traderDeepData, traderSocials } from "../data/mockData";
import { ACHIEVEMENTS, alphaColor, alphaLabel, calcAlphaScore, calcDegenScore, calcExpectancy, degenLabel, expectancyColor, titleByLevel } from "../lib/scoring";
import { C, cardStyle, mono, tdStyle, thStyle, tierColor } from "../theme";
import { ToastContext } from "./common";
import { Activity, BarChart3, Clock, DollarSign, Flame, Lightbulb, Star, Target, TrendingDown, TrendingUp, Trophy, Users, Zap } from "lucide-react";
import { useContext, useState } from "react";
/* ═══════════════════════ TRADER PROFILE (standalone) ═══════════════════════ */
const TraderProfile = ({ trader, onClose }) => {
  const [profileTab, setProfileTab] = useState("overview");
  const [socialFilter, setSocialFilter] = useState("all");
  const [isFollowing, setIsFollowing] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const { addToast } = useContext(ToastContext);
  const t = trader;
  const deep = traderDeepData[t.name];

  const profileTabs = ["overview","signals","trades","predictions","social","pnl","risk_dna","journal"];
  const tabLabels = { overview: "Overview", signals: "Signals", trades: "Trades", predictions: "Predictions", social: "Social", pnl: "P&L", risk_dna: "Risk DNA", journal: "Journal" };

  const moodColors = { Confident: C.green, Frustrated: C.red, Focused: C.blue, Excited: C.amber, Neutral: C.textMuted };
  const socials = traderSocials[t.name] || {};
  const socialMeta = { twitter: { label: "X / Twitter", color: "#1DA1F2", icon: "𝕏", url: "https://x.com/" }, discord: { label: "Discord", color: "#5865F2", icon: "DC", url: "https://discord.gg/" }, telegram: { label: "Telegram", color: "#0088cc", icon: "TG", url: "https://t.me/" }, youtube: { label: "YouTube", color: "#FF0000", icon: "YT", url: "https://youtube.com/@" }, website: { label: "Website", color: C.textMuted, icon: "WEB", url: "" } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Back button + Quick Actions bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={onClose} style={{ padding: "6px 14px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.textMuted, fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
        </button>

        <div style={{ flex: 1 }} />

        {/* ★ Follow */}
        <button onClick={() => { setIsFollowing(!isFollowing); addToast(isFollowing ? `Unfollowed ${t.name}` : `Following ${t.name}`, isFollowing ? "info" : "success"); }} style={{
          display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "6px",
          border: `1px solid ${isFollowing ? C.amber : C.border}`,
          backgroundColor: isFollowing ? C.amberBg : "transparent",
          color: isFollowing ? C.amber : C.textMuted, fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s"
        }}>
          <Star size={13} fill={isFollowing ? C.amber : "none"} /> {isFollowing ? "Following" : "Follow"}
        </button>

        {/* 🔔 Alerts */}
        <button onClick={() => { setAlertsOn(!alertsOn); addToast(alertsOn ? `Alerts disabled for ${t.name}` : `Alerts enabled for ${t.name}`, alertsOn ? "info" : "success"); }} style={{
          display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "6px",
          border: `1px solid ${alertsOn ? C.blue : C.border}`,
          backgroundColor: alertsOn ? C.blueBg : "transparent",
          color: alertsOn ? C.blue : C.textMuted, fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s"
        }}>
          {alertsOn ? <BellRing size={13} /> : <Bell size={13} />} {alertsOn ? "Alerts ON" : "Alerts"}
        </button>

        {/* ✉ DM / Message */}
        <button onClick={() => addToast(`Message sent to ${t.name}`, "info")} style={{
          display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "6px",
          border: `1px solid ${C.purple}40`, backgroundColor: C.purpleBg,
          color: C.purple, fontSize: "11px", fontWeight: "700", cursor: "pointer"
        }}>
          <Send size={13} /> Message
        </button>

        {/* 🔗 Chat Room */}
        <button onClick={() => addToast(`Joined ${t.name}'s chat room`, "info")} style={{
          display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "6px",
          border: `1px solid ${C.cyan}40`, backgroundColor: `${C.cyan}10`,
          color: C.cyan, fontSize: "11px", fontWeight: "700", cursor: "pointer"
        }}>
          <Link2 size={13} /> Chat Room
        </button>

        {/* Social media quick links */}
        {Object.keys(socials).map(platform => {
          const sm = socialMeta[platform];
          if (!sm) return null;
          return (
            <button key={platform} title={`${sm.label}: ${socials[platform]}`} onClick={() => addToast(`Opening ${t.name}'s ${sm.label}`, "info")} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: "6px",
              border: `1px solid ${sm.color}30`, backgroundColor: `${sm.color}10`,
              color: sm.color, fontSize: "10px", fontWeight: "800", cursor: "pointer"
            }}>
              {sm.icon}
            </button>
          );
        })}
      </div>

      {/* Profile Header Card — redesigned */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {/* ── Top banner strip with tier accent ── */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${tierColor[t.tier]}, ${tierColor[t.tier]}60, transparent)` }} />

        <div style={{ padding: "16px 20px", display: "flex", gap: "20px", alignItems: "flex-start" }}>
          {/* ── LEFT: Avatar + Identity + Alpha ── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "140px" }}>
            {/* Avatar with tier ring + level indicator */}
            <div style={{ position: "relative" }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", backgroundColor: C.bg, border: `3px solid ${tierColor[t.tier]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", boxShadow: `0 0 20px ${tierColor[t.tier]}25` }}>{t.avatar}</div>
              {/* Level badge on avatar */}
              <div style={{ position: "absolute", bottom: -2, right: -2, backgroundColor: C.purple, color: "#fff", fontSize: "9px", fontWeight: "800", padding: "2px 6px", borderRadius: "10px", border: `2px solid ${C.card}`, ...mono }}>Lv.{t.level}</div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: "900", marginTop: "10px", letterSpacing: "-0.3px" }}>{t.name}</div>
            <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "4px", flexWrap: "wrap", justifyContent: "center" }}>
              <Tag text={t.tier} color={tierColor[t.tier]} />
              <BotTag isBot={t.isBot} />
              <span style={{ fontSize: "9px", color: C.textFaint, fontStyle: "italic" }}>{titleByLevel(t.level)}</span>
            </div>

            {/* Alpha Score — prominent badge */}
            {(() => { const alpha = calcAlphaScore(t); const aClr = alphaColor(alpha); return (
              <div style={{ marginTop: "12px", padding: "10px 20px", borderRadius: "10px", backgroundColor: `${aClr}10`, border: `1.5px solid ${aClr}35`, textAlign: "center", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "4px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "900", color: aClr, ...mono, lineHeight: 1 }}>{alpha}</span>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: aClr, opacity: 0.7 }}>/100</span>
                </div>
                <div style={{ fontSize: "9px", fontWeight: "700", color: aClr, marginTop: "3px", letterSpacing: "1px" }}>ALPHA {alphaLabel(alpha)}</div>
              </div>
            ); })()}

            {/* Degen Score pill */}
            {(() => { const degen = calcDegenScore(t); const dClr = degen >= 60 ? C.red : degen >= 40 ? C.amber : C.green; return (
              <div style={{ marginTop: "8px", fontSize: "9px", fontWeight: "800", color: dClr, padding: "3px 10px", borderRadius: "4px", backgroundColor: `${dClr}15`, border: `1px solid ${dClr}25`, letterSpacing: "0.5px" }}>
                {degenLabel(degen)}
              </div>
            ); })()}

            {/* XP Progress bar */}
            <div style={{ marginTop: "8px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: C.textFaint, marginBottom: "3px" }}>
                <span>XP {(t.xp || 0).toLocaleString()}</span>
                <span>{(t.xpNext || 10000).toLocaleString()}</span>
              </div>
              <div style={{ height: 3, backgroundColor: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((t.xp || 0) / (t.xpNext || 10000)) * 100}%`, backgroundColor: C.purple, borderRadius: 2 }} />
              </div>
            </div>
          </div>

          {/* ── CENTER: Bio + Info Grid + Stats + Badges ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: "1.6", marginBottom: "12px" }}>{t.bio}</div>

            {/* Info grid — 2 rows of 4 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              {[["Rank", `#${t.rank}`, null], ["Location", t.location, null], ["Since", t.joined, null], ["Style", t.style, null],
                ["Exchange", t.exchange, null], ["Favorite Pairs", t.favPairs.slice(0, 2).join(", "), null], ["Avg Duration", t.avgHold, null], ["Risk:Reward", t.avgRR, "rr"],
              ].map(([l, v, tip]) => (
                <div key={l}>
                  <div style={{ fontSize: "9px", color: C.textFaint, textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.3px" }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", marginTop: "2px" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Follower stats row */}
            <div style={{ display: "flex", gap: "16px", paddingTop: "10px", borderTop: `1px solid ${C.border}`, marginBottom: "12px" }}>
              {[["Followers", t.followers, null], ["Following", t.following, null], ["Copiers", t.copiers, "copiers"], ["Trades", t.trades, null]].map(([l, v, tip]) => (
                <div key={l}>
                  <span style={{ fontSize: "16px", fontWeight: "900", ...mono }}>{v.toLocaleString()}</span>
                  <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "4px" }}>{tip ? <InfoTip k={tip} inline><span>{l}</span></InfoTip> : l}</span>
                </div>
              ))}
            </div>

            {/* ── Badges row — actual icons, not just a count ── */}
            {t.badges.length > 0 && (
              <div style={{ paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "9px", color: C.textFaint, fontWeight: "600", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px" }}>Badges ({t.badges.length})</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {t.badges.map(bKey => {
                    const ach = ACHIEVEMENTS[bKey];
                    if (!ach) return null;
                    const AchIcon = ach.icon;
                    return (
                      <div key={bKey} title={`${ach.name}: ${ach.desc}`} style={{
                        display: "flex", alignItems: "center", gap: "5px", padding: "4px 8px",
                        borderRadius: "6px", backgroundColor: `${ach.color}12`, border: `1px solid ${ach.color}25`,
                        cursor: "default"
                      }}>
                        <AchIcon size={12} color={ach.color} />
                        <span style={{ fontSize: "9px", fontWeight: "700", color: ach.color }}>{ach.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Social links — compact row with handles ── */}
            {Object.keys(socials).length > 0 && (
              <div style={{ display: "flex", gap: "5px", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}`, flexWrap: "wrap", alignItems: "center" }}>
                {Object.keys(socials).map(platform => {
                  const sm = socialMeta[platform];
                  if (!sm) return null;
                  return (
                    <button key={platform} title={`${sm.label}: ${socials[platform]}`} onClick={() => addToast(`Opening ${sm.label}`, "info")} style={{
                      display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px",
                      borderRadius: "5px", border: `1px solid ${sm.color}25`, cursor: "pointer",
                      backgroundColor: `${sm.color}08`, color: sm.color, fontSize: "9px", fontWeight: "700"
                    }}>
                      <span style={{ fontWeight: "900" }}>{sm.icon}</span>
                      <span style={{ color: C.textMuted, fontWeight: "500", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{socials[platform]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: KPI Stats column with colored accents ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
            {[
              ["PnL Total", `+$${(t.pnl / 1000).toFixed(1)}K`, C.green, null, DollarSign],
              ["Win Rate", `${t.winRate}%`, C.green, "winRate", Target],
              ["Sharpe", t.sharpe.toFixed(1), C.blue, "sharpe", Activity],
              ["Max Drawdown", `${t.maxDD}%`, C.red, "maxDD", TrendingDown],
              ["Profit Factor", t.profitFactor?.toFixed(1) || "—", C.amber, "profitFactor", BarChart3],
              ["Expectancy", `$${calcExpectancy(t)}`, expectancyColor(calcExpectancy(t)), "expectancy", Lightbulb],
              ["Streak", `${t.streak}W`, C.purple, "streak", Flame],
            ].map(([l, v, clr, tip, Icon]) => (
              <div key={l} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px",
                borderRadius: "6px", backgroundColor: `${clr}06`, borderLeft: `2px solid ${clr}50`
              }}>
                <Icon size={12} color={clr} style={{ opacity: 0.6, flexShrink: 0 }} />
                <span style={{ fontSize: "10px", color: C.textMuted, flex: 1 }}>{tip ? <InfoTip k={tip}><span>{l}</span></InfoTip> : l}</span>
                <span style={{ fontSize: "13px", fontWeight: "800", color: clr, ...mono }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {profileTabs.map(pt => (
          <button key={pt} onClick={() => setProfileTab(pt)} style={{
            padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
            border: `1px solid ${profileTab === pt ? C.purple : C.border}`,
            backgroundColor: profileTab === pt ? C.purpleBg : "transparent",
            color: profileTab === pt ? C.purple : C.textMuted
          }}>{tabLabels[pt]}</button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {profileTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600" }}>Equity Curve — Last 30 Days</div>
              {/* Win Rate Trinity — VARIV anti-pattern rule: never show WR alone */}
              <div style={{ display: "flex", gap: "12px", fontSize: "10px" }}>
                <span style={{ color: C.green, fontWeight: "700", ...mono }}><InfoTip k="winRate" inline><span>WR</span></InfoTip> {t.winRate}%</span>
                <span style={{ color: C.amber, fontWeight: "700", ...mono }}><InfoTip k="profitFactor" inline><span>PF</span></InfoTip> {t.profitFactor?.toFixed(1)}</span>
                <span style={{ color: C.red, fontWeight: "700", ...mono }}><InfoTip k="maxDD" inline><span>DD</span></InfoTip> {t.maxDD}%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={(() => {
                let peak = -Infinity;
                return deep.dailyEquity.map(d => {
                  peak = Math.max(peak, d.equity);
                  return { ...d, peak, drawdown: d.equity < peak ? d.equity : null };
                });
              })()}>
                <defs>
                  <linearGradient id="profEq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                  <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.red} stopOpacity={0.15} /><stop offset="95%" stopColor={C.red} stopOpacity={0.03} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="day" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={(v, name) => [`$${Number(v).toLocaleString()}`, name === "peak" ? "Peak" : name === "drawdown" ? "Drawdown" : "Equity"]} />
                <Area type="monotone" dataKey="peak" stroke={`${C.textFaint}40`} fill="none" strokeWidth={1} strokeDasharray="4 3" dot={false} />
                <Area type="monotone" dataKey="equity" stroke={C.green} fill="url(#profEq)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="drawdown" stroke={C.red} fill="url(#ddFill)" strokeWidth={1} dot={false} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Activity Heatmap — GitHub-style (VARIV View A.3) */}
          <ActivityHeatmap traderData={deep} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Skill Radar</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={t.radarData.map(r => ({ subject: r.s, value: r.v }))}><PolarGrid stroke={C.border} /><PolarAngleAxis dataKey="subject" stroke={C.textMuted} fontSize={10} /><PolarRadiusAxis stroke={C.border} fontSize={9} domain={[0, 100]} /><Radar dataKey="value" stroke={C.purple} fill={C.purpleBg} fillOpacity={0.6} /></RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Monthly P&L</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deep.monthlyPnl}><CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="month" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "PnL"]} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>{deep.monthlyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Recent social post preview */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Latest Activity</div>
            {deep.socialPosts.slice(0, 2).map(post => (
              <div key={post.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}`, display: "flex", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>{deep.platIcons[post.platform]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600" }}>{post.handle}</span>
                    <span style={{ fontSize: "9px", color: deep.platColors[post.platform], fontWeight: "700", textTransform: "uppercase" }}>{post.platform}</span>
                    <span style={{ fontSize: "10px", color: C.textFaint, marginLeft: "auto" }}>{post.time}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: C.text, lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{post.text.slice(0, 150)}{post.text.length > 150 ? "..." : ""}</div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}><span style={{ fontSize: "10px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><Heart size={9} /> {post.likes}</span><span style={{ fontSize: "10px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><MessageCircle size={9} /> {post.replies}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SEÑALES ═══ */}
      {profileTab === "signals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Total Signals" value={deep.signalStats.total} icon={Zap} color={C.purple} />
            <StatCard label="Accuracy" value={`${deep.signalStats.accuracy}%`} icon={Target} color={C.green} tip="winRate" />
            <StatCard label="Active Now" value={deep.signalStats.active} icon={Activity} color={C.amber} tip="signalActive" />
            <StatCard label="Subscribers" value={deep.signalStats.subscribers} icon={Users} color={C.blue} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <StatCard label="Avg Profit / Signal" value={`$${deep.signalStats.avgPnlPerSignal.toLocaleString()}`} icon={TrendingUp} color={deep.signalStats.avgPnlPerSignal >= 0 ? C.green : C.red} />
            <StatCard label="Best Signal" value={`+$${deep.signalStats.bestSignal.toLocaleString()}`} icon={Trophy} color={C.green} />
          </div>
          {/* Active Signals */}
          {deep.signals.filter(s => s.status === "active").length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.green, animation: "none" }} /> Active Signals
              </div>
              {deep.signals.filter(s => s.status === "active").map(s => (
                <div key={s.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700" }}>{s.pair}</span>
                      <Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} />
                      <span style={{ fontSize: "11px", color: C.amber, fontWeight: "600", ...mono }}>{s.leverage}</span>
                      <span style={{ fontSize: "10px", color: C.textMuted }}>{s.group}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: C.textMuted }}>
                      <span><InfoTip k="entryZone" inline><span>Entry:</span></InfoTip> <span style={{ color: C.text, ...mono }}>${s.entry.toLocaleString()}</span></span>
                      <span><InfoTip k="tp" inline><span>TP:</span></InfoTip> <span style={{ color: C.green, ...mono }}>${s.tp.toLocaleString()}</span></span>
                      <span><InfoTip k="sl" inline><span>SL:</span></InfoTip> <span style={{ color: C.red, ...mono }}>${s.sl.toLocaleString()}</span></span>
                      <span><InfoTip k="rr" inline><span>R:R</span></InfoTip> <span style={{ color: C.blue, ...mono }}>{s.rr}</span></span>
                    </div>
                    <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px", fontStyle: "italic" }}>{s.analysis}</div>
                    {/* Trade Structure Diagram — VARIV View B.2 */}
                    <TradeStructureDiagram entry={s.entry} sl={s.sl} tp={s.tp} type={s.type} />
                  </div>
                  <div style={{ textAlign: "right", minWidth: "100px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: s.pnl >= 0 ? C.green : C.red, ...mono }}>{s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}</div>
                    <div style={{ fontSize: "10px", color: C.textMuted }}>{s.subscribers} subs</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Signal History Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Signal History — Last 12</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead><tr>{["Pair","Type","Entry","Target","Stop Loss","Leverage","R:R","Group","PnL","Status","Subscribers","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {deep.signals.map(s => (
                    <tr key={s.id} style={{ borderLeft: `3px solid ${s.type === "LONG" ? C.green : C.red}` }}>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{s.pair}</td>
                      <td style={tdStyle}><Tag text={s.type} color={s.type === "LONG" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${s.entry.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px", color: C.green }}>${s.tp.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px", color: C.red }}>${s.sl.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, color: C.amber }}>{s.leverage}</td>
                      <td style={{ ...tdStyle, ...mono }}>{s.rr}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{s.group}</td>
                      <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: s.pnl >= 0 ? C.green : C.red }}>{s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}</td>
                      <td style={tdStyle}><Tag text={s.status === "active" ? "Active" : s.status === "tp_hit" ? "TP Hit" : "SL Hit"} color={s.status === "active" ? C.blue : s.status === "tp_hit" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>{s.subscribers}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{s.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRADES ═══ */}
      {profileTab === "trades" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Total Trades" value={t.trades} icon={Activity} color={C.blue} />
            <StatCard label="Win Rate" value={`${t.winRate}%`} icon={Trophy} color={C.green} />
            <StatCard label="Avg R:R" value={t.avgRR} icon={Target} color={C.purple} />
            <StatCard label="Avg Hold" value={t.avgHold} icon={Clock} color={C.amber} />
          </div>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Trade History — Last 20 Trades</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                <thead><tr>{["Pair","Type","Entry","Exit","PnL","Leverage","R:R","Duration","Status","Notes","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {deep.history.map(tr => (
                    <tr key={tr.id} style={{ borderLeft: `3px solid ${tr.type === "LONG" ? C.green : C.red}` }}>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{tr.pair}</td>
                      <td style={tdStyle}><Tag text={tr.type} color={tr.type === "LONG" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${tr.entry.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontSize: "11px" }}>${tr.exit.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: tr.pnl >= 0 ? C.green : C.red }}>{tr.pnl >= 0 ? "+" : ""}${tr.pnl.toLocaleString()}</td>
                      <td style={{ ...tdStyle, ...mono, color: C.amber }}>{tr.leverage}</td>
                      <td style={{ ...tdStyle, ...mono }}>{tr.rr}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{tr.duration}</td>
                      <td style={tdStyle}><Tag text={tr.status === "tp_hit" ? "TP Hit" : "SL Hit"} color={tr.status === "tp_hit" ? C.green : C.red} /></td>
                      <td style={{ ...tdStyle, fontSize: "10px", color: C.textMuted, maxWidth: "160px" }}>{tr.notes}</td>
                      <td style={{ ...tdStyle, fontSize: "11px", color: C.textMuted }}>{tr.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PREDICTIONS ═══ */}
      {profileTab === "predictions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Accuracy" value={`${Math.round((deep.predStats.correct / deep.predStats.total) * 100)}%`} sub={`${deep.predStats.correct}/${deep.predStats.total}`} icon={Target} color={C.green} tip="winRate" />
            <StatCard label="Racha Actual" value={`${deep.predStats.streak} correctas`} icon={Flame} color={C.amber} tip="streak" />
            <StatCard label="Total Apostado" value={`$${deep.predStats.totalStaked.toLocaleString()}`} icon={DollarSign} color={C.blue} tip="pot" />
            <StatCard label="Net Profit" value={`+$${deep.predStats.totalWon.toLocaleString()}`} icon={Trophy} color={C.green} />
          </div>
          {/* Active bets */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Active Predictions</div>
            {deep.predictionsList.filter(p => p.status === "open").map(p => (
              <div key={p.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{p.question}</div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Tag text={p.bet} color={p.bet === "YES" ? C.green : C.red} />
                    <span style={{ fontSize: "11px", color: C.textMuted }}>at {p.odds}¢</span>
                    <span style={{ fontSize: "11px", color: C.textMuted }}>{p.date}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: "120px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", ...mono }}>${p.stake}</div>
                  <div style={{ fontSize: "10px", color: C.green }}>Potential: ${p.potential}</div>
                </div>
              </div>
            ))}
          </div>
          {/* History */}
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", fontSize: "13px", fontWeight: "600" }}>Prediction History</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Market","Bet","Odds","Stake","Result","P&L","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {deep.predictionsList.filter(p => p.status !== "open").map(p => (
                  <tr key={p.id} style={{ borderLeft: `3px solid ${p.status === "won" ? C.green : C.red}` }}>
                    <td style={{ ...tdStyle, maxWidth: "250px" }}>{p.question}</td>
                    <td style={tdStyle}><Tag text={p.bet} color={p.bet === "YES" ? C.green : C.red} /></td>
                    <td style={{ ...tdStyle, ...mono }}>{p.odds}¢</td>
                    <td style={{ ...tdStyle, ...mono }}>${p.stake}</td>
                    <td style={tdStyle}><Tag text={p.status === "won" ? "Won" : "Lost"} color={p.status === "won" ? C.green : C.red} /></td>
                    <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: (p.pnl||0) >= 0 ? C.green : C.red }}>{(p.pnl||0) >= 0 ? "+" : ""}${(p.pnl||0)}</td>
                    <td style={{ ...tdStyle, color: C.textMuted }}>{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ SOCIAL ═══ */}
      {profileTab === "social" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <StatCard label="𝕏 Followers" value={deep.socialStats.twitterFollowers.toLocaleString()} icon={Users} color={"#1DA1F2"} />
            <StatCard label="Discord Messages" value={deep.socialStats.discordMessages.toLocaleString()} icon={Activity} color={"#5865F2"} />
            <StatCard label="Reddit Karma" value={deep.socialStats.redditKarma.toLocaleString()} icon={Star} color={"#FF4500"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <StatCard label="Telegram Members" value={deep.socialStats.telegramMembers.toLocaleString()} icon={Users} color={"#0088cc"} />
            <StatCard label="WhatsApp Groups" value={deep.socialStats.whatsappGroups} icon={Users} color={"#25D366"} />
            <StatCard label="Avg Engagement" value={`${deep.socialStats.avgEngagement}%`} sub={`Top: ${deep.socialStats.topPlatform}`} icon={TrendingUp} color={C.green} />
          </div>
          {/* Platform filter */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["all","twitter","discord","telegram","whatsapp","reddit","tradehub"].map(p => (
              <button key={p} onClick={() => setSocialFilter(p)} style={{
                padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                border: `1px solid ${socialFilter === p ? (p === "all" ? C.purple : deep.platColors[p]) : C.border}`,
                backgroundColor: socialFilter === p ? (p === "all" ? C.purpleBg : deep.platColors[p] + "18") : "transparent",
                color: socialFilter === p ? (p === "all" ? C.purple : deep.platColors[p]) : C.textMuted, textTransform: "capitalize"
              }}>{p === "all" ? "All" : p === "tradehub" ? "Tradethlon" : p === "twitter" ? "𝕏 Twitter" : p === "telegram" ? "Telegram" : p === "whatsapp" ? "WhatsApp" : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            ))}
          </div>
          {/* Posts */}
          {deep.socialPosts.filter(p => socialFilter === "all" || p.platform === socialFilter).map(post => (
            <div key={post.id} style={{ ...cardStyle, borderLeft: `3px solid ${deep.platColors[post.platform]}` }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ fontSize: "20px", width: 32, textAlign: "center" }}>{deep.platIcons[post.platform]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700" }}>{post.handle}</span>
                    <span style={{ fontSize: "10px", color: deep.platColors[post.platform], fontWeight: "700", textTransform: "uppercase", padding: "2px 6px", borderRadius: "3px", backgroundColor: deep.platColors[post.platform] + "18" }}>{post.platform}</span>
                    {post.channel && <span style={{ fontSize: "10px", color: C.textMuted }}>{post.channel}</span>}
                    {post.subreddit && <span style={{ fontSize: "10px", color: C.textMuted }}>{post.subreddit}</span>}
                    <span style={{ fontSize: "10px", color: C.textFaint, marginLeft: "auto" }}>{post.time}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.6", marginBottom: "10px", whiteSpace: "pre-wrap" }}>{post.text}</div>
                  <div style={{ display: "flex", gap: "16px", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "11px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><Heart size={10} /> {post.likes.toLocaleString()}</span>
                    {post.retweets > 0 && <span style={{ fontSize: "11px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><RefreshCw size={10} /> {post.retweets}</span>}
                    <span style={{ fontSize: "11px", color: C.textMuted, display: "inline-flex", alignItems: "center", gap: "3px" }}><MessageCircle size={10} /> {post.replies}</span>
                    {post.impressions > 0 && <span style={{ fontSize: "11px", color: C.textMuted }}><Eye size={10} /> {(post.impressions / 1000).toFixed(1)}K</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ P&L ═══ */}
      {profileTab === "pnl" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Total PnL" value={`+$${(t.pnl / 1000).toFixed(1)}K`} icon={TrendingUp} color={C.green} />
            <StatCard label="Best Month" value={t.bestMonth} icon={Trophy} color={C.green} />
            <StatCard label="Worst Month" value={t.worstMonth} icon={TrendingDown} color={C.red} />
            <StatCard label="Profit Factor" value={t.profitFactor?.toFixed(1) || "—"} icon={Target} color={C.amber} />
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Monthly P&L Breakdown</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deep.monthlyPnl}><CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="month" stroke={C.textMuted} fontSize={11} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "PnL"]} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>{deep.monthlyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Month","PnL","Trades","Win Rate","Result"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>{deep.monthlyPnl.map(m => (
                <tr key={m.month}><td style={{ ...tdStyle, fontWeight: "600" }}>{m.month} 2026</td>
                <td style={{ ...tdStyle, ...mono, fontWeight: "700", color: m.pnl >= 0 ? C.green : C.red }}>{m.pnl >= 0 ? "+" : ""}${m.pnl.toLocaleString()}</td>
                <td style={{ ...tdStyle, ...mono }}>{m.trades}</td><td style={{ ...tdStyle, ...mono }}>{m.winRate}%</td>
                <td style={tdStyle}><Tag text={m.pnl >= 0 ? "Profitable" : "Loss"} color={m.pnl >= 0 ? C.green : C.red} /></td></tr>
              ))}</tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Equity Curve — 30 Days</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={deep.dailyEquity}>
                <defs><linearGradient id="pnlEq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="day" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} formatter={v => [`$${Number(v).toLocaleString()}`, "Equity"]} />
                <Area type="monotone" dataKey="equity" stroke={C.blue} fill="url(#pnlEq)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ RISK DNA ═══ */}
      {profileTab === "risk_dna" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Sharpe Ratio" value={t.sharpe.toFixed(1)} icon={BarChart3} color={C.blue} />
            <StatCard label="Max Drawdown" value={`${t.maxDD}%`} icon={TrendingDown} color={C.red} />
            <StatCard label="Profit Factor" value={t.profitFactor?.toFixed(1) || "—"} icon={DollarSign} color={C.green} />
            <StatCard label="Win Streak" value={`${t.streak} trades`} icon={Flame} color={C.amber} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Session Performance */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Session</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deep.riskDna.sessionPerf}><CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="session" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                <Bar dataKey="winRate" name="Win %" fill={C.green} radius={[3, 3, 0, 0]} /></BarChart>
              </ResponsiveContainer>
              {deep.riskDna.sessionPerf.map(s => (
                <div key={s.session} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}`, fontSize: "11px" }}>
                  <span style={{ color: C.textMuted }}>{s.session}</span>
                  <span style={{ ...mono }}>{s.trades} trades — {s.winRate}% WR — avg ${s.avgPnl}</span>
                </div>
              ))}
            </div>
            {/* Day of Week */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Day</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deep.riskDna.dayOfWeek}><CartesianGrid strokeDasharray="3 3" stroke={`${C.border}60`} /><XAxis dataKey="day" stroke={C.textMuted} fontSize={10} /><YAxis stroke={C.textMuted} fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "12px" }} />
                <Bar dataKey="pnl" name="PnL" radius={[3, 3, 0, 0]}>{deep.riskDna.dayOfWeek.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? C.green : C.red} />)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Pair Breakdown */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Performance by Pair</div>
              {deep.riskDna.pairBreakdown.map(p => (
                <div key={p.pair} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700" }}>{p.pair}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: C.green, ...mono }}>+${(p.pnl / 1000).toFixed(1)}K</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: C.textMuted }}>
                    <span>{p.trades} trades</span><span>{p.winRate}% WR</span><span>R:R {p.avgRR}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Behavioral Analysis */}
            <div style={cardStyle}>
              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Behavioral Analysis</div>
              {Object.entries({
                "Avg Position Size": deep.riskDna.behavioral.avgPositionSize,
                "Max Leverage Used": deep.riskDna.behavioral.maxLevUsed,
                "Revenge Trade Rate": deep.riskDna.behavioral.revengeTradeRate,
                "Tilt After Loss": deep.riskDna.behavioral.tiltAfterLoss,
                "Hold Time Bias": deep.riskDna.behavioral.holdTimeBias,
                "Streak Behavior": deep.riskDna.behavioral.streakBehavior,
                "Recovery Time": deep.riskDna.behavioral.recoveryTime,
                "Best Time of Day": deep.riskDna.behavioral.bestTimeOfDay,
              }).map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: "12px" }}>
                  <span style={{ color: C.textMuted }}>{l}</span>
                  <span style={{ fontWeight: "600", color: v === "Low" ? C.green : v === "Medium" ? C.amber : v === "High" ? C.red : C.text, ...mono }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Drawdown History */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>Drawdown History</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              {deep.riskDna.drawdownPeriods.map((dd, i) => (
                <div key={i} style={{ padding: "12px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "4px" }}>{dd.start} → {dd.end}</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: C.red, ...mono }}>-{dd.depth}</div>
                  <div style={{ fontSize: "11px", color: C.green, marginTop: "4px" }}>Recovery: {dd.recovery}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Radar */}
          <div style={cardStyle}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>Skill Radar</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={t.radarData.map(r => ({ subject: r.s, value: r.v }))}><PolarGrid stroke={C.border} /><PolarAngleAxis dataKey="subject" stroke={C.textMuted} fontSize={10} /><PolarRadiusAxis stroke={C.border} fontSize={9} domain={[0, 100]} /><Radar dataKey="value" stroke={C.purple} fill={C.purpleBg} fillOpacity={0.6} /></RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ JOURNAL ═══ */}
      {profileTab === "journal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard label="Journal Entries" value={deep.journal.length} icon={Activity} color={C.blue} />
            <StatCard label="Net PnL (Journaled)" value={`$${deep.journal.reduce((a, j) => a + j.pnl, 0).toLocaleString()}`} icon={TrendingUp} color={C.green} />
            <StatCard label="Most Common Mood" value="Focused" icon={Target} color={C.blue} />
            <StatCard label="Avg Tags/Entry" value={(deep.journal.reduce((a, j) => a + j.tags.length, 0) / deep.journal.length).toFixed(1)} icon={Star} color={C.purple} />
          </div>
          {deep.journal.map(entry => (
            <div key={entry.id} style={{ ...cardStyle, borderLeft: `3px solid ${moodColors[entry.mood] || C.textMuted}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: `${moodColors[entry.mood] || C.textMuted}20`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Circle size={10} color={moodColors[entry.mood] || C.textMuted} /></span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>{entry.date}, 2026</div>
                    <div style={{ fontSize: "11px", color: moodColors[entry.mood], fontWeight: "600" }}>{entry.mood}</div>
                  </div>
                </div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: entry.pnl >= 0 ? C.green : entry.pnl < 0 ? C.red : C.textMuted, ...mono }}>
                  {entry.pnl > 0 ? "+" : ""}{entry.pnl === 0 ? "No trades" : `$${entry.pnl.toLocaleString()}`}
                </div>
              </div>
              <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.7", marginBottom: "10px" }}>{entry.text}</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {entry.tags.map(tag => (
                  <span key={tag} style={{ fontSize: "10px", color: C.purple, backgroundColor: C.purpleBg, padding: "3px 8px", borderRadius: "4px", fontWeight: "600" }}>#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export {
  TraderProfile
};
