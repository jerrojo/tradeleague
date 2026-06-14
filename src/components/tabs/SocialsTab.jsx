import { Avatar, BotTag, StatCard, Tag } from "../common";
import { ExternalLink, Eye, Send } from "lucide-react";
import { useProfile } from "../../contexts";
import { mockTraders, traderDeepData } from "../../data/mockData";
import { C, cardStyle, mono } from "../../theme";
import { Flame, Heart, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
/* ═══════════════════════ TAB: SOCIALS ═══════════════════════ */
const SocialsTab = () => {
  const { openProfile } = useProfile();
  const [platformFilter, setPlatformFilter] = useState("all");

  const platforms = [
    { id: "all", label: "All", color: C.purple },
    { id: "twitter", label: "𝕏", color: "#1DA1F2" },
    { id: "discord", label: "DC", color: "#5865F2" },
    { id: "telegram", label: "TG", color: "#0088cc" },
    { id: "whatsapp", label: "WA", color: "#25D366" },
    { id: "reddit", label: "R", color: "#FF4500" },
    { id: "tradehub", label: "TH", color: C.purple },
  ];

  const allPosts = useMemo(() => {
    // Every trader has the same 12 post templates at the same timestamps, so ANY plain
    // sort (likes OR recency) clusters identical texts together. Diagonal interleave —
    // trader0·post0, trader1·post1, trader2·post2 … — guarantees each consecutive card
    // differs in BOTH trader and content, so the feed actually reads as varied.
    const byTrader = mockTraders.map(t =>
      (traderDeepData[t.name]?.socialPosts || []).map(p => ({
        ...p, traderName: t.name, traderTier: t.tier, isBot: t.isBot
      }))
    );
    const maxLen = Math.max(1, ...byTrader.map(a => a.length));
    const out = [];
    const seen = new Set();
    for (let k = 0; k < maxLen; k++) {
      byTrader.forEach((arr, ti) => {
        if (!arr.length) return;
        const post = arr[(k + ti) % arr.length];
        if (post && !seen.has(post.id)) { seen.add(post.id); out.push(post); }
      });
    }
    return out;
  }, []);

  const filtered = platformFilter === "all" ? allPosts : allPosts.filter(p => p.platform === platformFilter);
  const totalEng = allPosts.reduce((s, p) => s + p.likes + p.replies, 0);
  const highlight = useMemo(() => [...allPosts].sort((a, b) => b.likes - a.likes)[0], [allPosts]);

  const platColors = { twitter: "#1DA1F2", discord: "#5865F2", reddit: "#FF4500", tradehub: C.purple, telegram: "#0088cc", whatsapp: "#25D366" };
  const platIcons = { twitter: "𝕏", discord: "DC", reddit: "R", tradehub: "TH", telegram: "TG", whatsapp: "WA" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ ...cardStyle, padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "28px", fontWeight: "900", marginBottom: "6px" }}>💬 Socials</div>
        <div style={{ fontSize: "12px", color: C.textMuted }}>Curated cross-posts from X, Discord, Telegram, and more. Content that moves markets.</div>
      </div>

      {/* Platform filter */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {platforms.map(p => (
          <button key={p.id} onClick={() => setPlatformFilter(p.id)} style={{
            padding: "6px 14px", borderRadius: "16px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
            border: `1px solid ${platformFilter === p.id ? p.color : C.border}`,
            backgroundColor: platformFilter === p.id ? p.color + "20" : "transparent",
            color: platformFilter === p.id ? p.color : C.textMuted
          }}>{p.label}</button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <StatCard label="Total Posts" value={allPosts.length} icon={MessageCircle} color={C.cyan} />
        <StatCard label="Total Engagement" value={totalEng >= 1000 ? `${(totalEng/1000).toFixed(1)}K` : totalEng} icon={Heart} color={C.red} />
        <StatCard label="Highlight" value={highlight ? highlight.traderName : "—"} sub={highlight ? `${highlight.likes} likes` : ""} icon={Flame} color={C.amber} />
      </div>

      {/* Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.slice(0, 20).map(post => {
          const pColor = platColors[post.platform] || C.purple;
          const pIcon = platIcons[post.platform] || "?";
          const trader = mockTraders.find(t => t.name === post.traderName);
          return (
            <div key={post.id} className="card-hover" style={{ ...cardStyle, padding: "16px", display: "flex", gap: "12px" }}>
              <Avatar name={post.traderName} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
                  <span onClick={() => trader && openProfile(trader)} style={{ fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>{post.traderName}</span>
                  <BotTag isBot={post.isBot} size={14} />
                  <span title={post.platform} style={{ fontSize: "11px", fontWeight: "700", color: pColor }}>{pIcon}</span>
                  <span style={{ fontSize: "11px", color: C.textFaint, ...mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.handle}</span>
                  <span style={{ marginLeft: "auto", fontSize: "10px", color: C.textFaint, flexShrink: 0 }}>{post.time}</span>
                </div>
                <div style={{ fontSize: "13px", color: C.text, lineHeight: 1.55, marginBottom: "10px", whiteSpace: "pre-wrap" }}>{post.text}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px", color: C.textFaint }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Heart size={12} /> {post.likes.toLocaleString()}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><MessageCircle size={12} /> {post.replies}</span>
                  <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "4px", color: pColor, cursor: "pointer", fontWeight: 600 }} title={`Opens on ${post.platform}`}>
                    <ExternalLink size={11} /> Open
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export {
  SocialsTab
};
