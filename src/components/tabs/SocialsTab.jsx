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
    const posts = mockTraders.flatMap(t =>
      (traderDeepData[t.name]?.socialPosts || []).map(p => ({
        ...p, traderName: t.name, traderAvatar: t.avatar, traderTier: t.tier, isBot: t.isBot
      }))
    );
    return posts.sort((a, b) => b.likes - a.likes);
  }, []);

  const filtered = platformFilter === "all" ? allPosts : allPosts.filter(p => p.platform === platformFilter);
  const totalEng = allPosts.reduce((s, p) => s + p.likes + p.replies, 0);
  const highlight = allPosts[0];

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
            <div key={post.id} className="card-hover" style={{ ...cardStyle, padding: "14px", borderLeft: `3px solid ${pColor}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "8px", fontWeight: "800", color: pColor, backgroundColor: pColor + "20", padding: "2px 6px", borderRadius: "3px" }}>{pIcon}</span>
                <Avatar name={post.traderName} size={26} />
                <span onClick={() => trader && openProfile(trader)} style={{ fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>{post.traderName}</span>
                <BotTag isBot={post.isBot} />
                <span style={{ fontSize: "10px", color: C.textMuted, ...mono, marginLeft: "auto" }}>{post.handle}</span>
                <span style={{ fontSize: "9px", color: C.textFaint }}>{post.time}</span>
              </div>
              <div style={{ fontSize: "12px", color: C.text, lineHeight: "1.5", marginBottom: "8px" }}>
                {post.text.length > 200 ? post.text.substring(0, 200) + "..." : post.text}
              </div>
              {(post.channel || post.subreddit) && (
                <div style={{ marginBottom: "6px" }}>
                  <Tag text={post.channel || post.subreddit} color={pColor} />
                </div>
              )}
              <div style={{ display: "flex", gap: "14px", alignItems: "center", fontSize: "10px", color: C.textMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Heart size={10} /> {post.likes}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MessageCircle size={10} /> {post.replies}</span>
                {post.retweets > 0 && <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Send size={10} /> {post.retweets}</span>}
                {post.impressions > 0 && <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Eye size={10} /> {(post.impressions/1000).toFixed(1)}K</span>}
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "3px", color: pColor, fontWeight: "600", fontSize: "9px" }} title={`Opens on ${post.platform}`}>
                  <ExternalLink size={10} /> View original
                </span>
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
