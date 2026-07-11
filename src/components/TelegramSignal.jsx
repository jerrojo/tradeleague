import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { mockTraders } from "../data/mockData";
import { C, mono } from "../theme";
import { price } from "../lib/format";

/* ═══════════════════════ TELEGRAM SIGNAL ═══════════════════════
   Every signal/trade can show its ORIGINAL post as it arrived on Telegram — the
   channel where the providers broadcast. A small Telegram glyph opens a popup that
   reconstructs the raw message (deterministically, from the signal's own fields) in
   the familiar Telegram-message layout, so the analyst can see the source verbatim. */

const TG_BLUE = "#2AABEE";

/* The X (Twitter) glyph. */
const XGlyph = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#fff" style={{ display: "block" }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);


const fmtPx = (p) => (p == null ? "—" : `$${price(p)}`);
const srand = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
const seedOf = (str) => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1e9; return h + 7; };

/* The Telegram paper-plane glyph (official mark, simplified path). */
const TelegramGlyph = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#fff" style={{ display: "block" }}>
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </svg>
);

/* Per-source branding — glyph, button gradient, modal header, labels. Signals
   default to Telegram; a `source: "x"` field routes to the X (Twitter) look. */
const SOURCES = {
  telegram: { key: "telegram", name: "Telegram", Glyph: TelegramGlyph, grad: `linear-gradient(135deg, ${TG_BLUE}, #229ED9)`, headerGrad: `linear-gradient(90deg, ${TG_BLUE}, #229ED9)`, border: "none", sub: "Telegram · original signal · 8 members", tip: "View the original signal on Telegram" },
  x: { key: "x", name: "X", Glyph: XGlyph, grad: "linear-gradient(135deg, #16181c, #000)", headerGrad: "linear-gradient(90deg, #000, #16181c)", border: "1px solid #2f3336", sub: "X (Twitter) · original post", tip: "View the original signal on X" },
};
const srcOf = (signal) => SOURCES[signal?.source] || SOURCES.telegram;

const B = ({ children }) => <b style={{ color: C.text, fontWeight: 700 }}>{children}</b>;

/* ── The reconstructed message body (Telegram formatting: emoji + bold labels) ── */
const TgMessage = ({ s }) => {
  const trader = mockTraders.find((t) => t.name === s.trader);
  const sd = seedOf(s.trader);
  const winRate = trader?.winRate ?? Math.round(45 + srand(sd) * 40);
  const roi3m = Math.round(40 + srand(sd * 3 + 1) * 130);
  const long = s.dir === "LONG";
  const tps = [s.tp1, s.tp2, s.tp3].filter((v) => v != null).map(fmtPx).join(", ");
  const date = new Date((s.time || Date.now() / 1000) * 1000).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const setupName = { FVG: "fair-value gap", OB: "order block", BOS: "break of structure", LIQ: "liquidity sweep", CHOCH: "change of character" }[s.setup] || (s.setup || "structure");
  const conf = [
    [`${s.setup || "Setup"} zone`, "confirmed"],
    ["Liquidity", `${long ? "BSL" : "SSL"} target`],
    [`${s.tf || "HTF"} bias`, long ? "Bullish" : "Bearish"],
  ];
  const P = ({ children }) => <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.55, color: C.textMuted }}>{children}</p>;
  return (
    <div style={{ ...mono }}>
      <P><span style={{ fontSize: 14 }}>🚨</span> <B>TRADING SIGNAL</B> <span style={{ fontSize: 14 }}>🚨</span></P>
      <P>👤 <B>Trader:</B> {s.trader}<br />
        📊 <B>Summary:</B> Last 3 months: Win rate of <B>{winRate}%</B> with a strong <span style={{ color: C.green, fontWeight: 700 }}>+{roi3m}% ROI</span>.</P>
      <P>💰 <B>Asset:</B> <span style={{ color: TG_BLUE }}>#{s.coin}USDT</span><br />
        📅 <B>Date:</B> {date} CST<br />
        📈 <B>Direction:</B> <B>{long ? "Long" : "Short"}</B> <span>{long ? "🟢" : "🔴"}</span></P>
      <P>🎯 <B>Trading Levels:</B><br />
        • <B>Entry:</B> {fmtPx(s.entry)}<br />
        • <B>Stop Loss:</B> <span style={{ color: C.red }}>{fmtPx(s.sl)}</span> 🛑<br />
        • <B>Take Profit:</B> <span style={{ color: C.green }}>{tps}</span> ✅</P>
      <P>⚡ <i>Act fast in this market</i><br />📊 <B>SMART MONEY ANALYSIS</B></P>
      <P>🎯 {s.approved
        ? <span style={{ fontWeight: 800, color: C.green }}>[✅ APPROVED]</span>
        : <span style={{ fontWeight: 800, color: C.red }}>[❌ REJECTED]</span>}
        {!s.approved && s.rejectReason ? <span style={{ color: C.textFaint }}> — {s.rejectReason}</span> : null}</P>
      <P>📝 <B>Logic:</B><br />{s.reasoning || `Price tagged the ${s.tf || "H1"} ${setupName}. ${long ? "Bullish" : "Bearish"} rejection with volume confirms the zone.`}</P>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, marginBottom: 3 }}>🔍 <B>Confluence Check:</B></div>
        {conf.map(([k, v]) => (
          <div key={k} style={{ fontSize: 12.5, color: C.textMuted }}>• <B>{k}:</B> <span style={{ color: C.green }}>[✓]</span> {v}</div>
        ))}
      </div>
      <P>🚀 <B>Target:</B> <span style={{ color: C.text }}>{fmtPx(s.tp1)}</span> <span style={{ color: C.textFaint }}>|</span> <B>Invalidation:</B> <span style={{ color: C.red }}>{fmtPx(s.sl)}</span></P>
    </div>
  );
};

const TelegramSignalModal = ({ signal, onClose }) => {
  const src = srcOf(signal);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 4000, backgroundColor: "rgba(0,0,0,0.62)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6vh 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, backgroundColor: C.card, boxShadow: C.shadowLg }}>
        {/* Source-styled header (Telegram / X) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: src.headerGrad }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}><src.Glyph size={17} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>VARIV {signal.approved ? "Approved" : "Rejected"} Signals</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.8)" }}>{src.sub}</div>
          </div>
          <button onClick={onClose} title="Close" style={{ width: 26, height: 26, borderRadius: 7, border: "none", backgroundColor: "rgba(255,255,255,0.18)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} /></button>
        </div>
        {/* chat body with the message bubble */}
        <div style={{ padding: 16, backgroundColor: C.bg, maxHeight: "72vh", overflowY: "auto" }}>
          <div style={{ backgroundColor: C.cardElev, border: `1px solid ${C.border}`, borderRadius: "4px 14px 14px 14px", padding: "14px 16px" }}>
            <TgMessage s={signal} />
            <div style={{ textAlign: "right", fontSize: 10, color: C.textFaint, ...mono }}>{new Date((signal.time || Date.now() / 1000) * 1000).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

/* Small round source button (Telegram / X) — drop it into any signal/trade row.
   Self-contained: manages its own open state and renders the popup in a portal. */
const SourceButton = ({ signal, size = 20 }) => {
  const [open, setOpen] = useState(false);
  const src = srcOf(signal);
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); } }}
        title={src.tip}
        style={{ width: size, height: size, borderRadius: "50%", border: src.border, cursor: "pointer", background: src.grad, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0, boxSizing: "border-box" }}
      >
        <src.Glyph size={Math.round(size * 0.62)} />
      </button>
      {open && <TelegramSignalModal signal={signal} onClose={() => setOpen(false)} />}
    </>
  );
};

const TelegramButton = SourceButton; // back-compat alias
export { SourceButton, TelegramButton, TelegramSignalModal };
