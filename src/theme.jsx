import { createContext, useContext, useState } from "react";
/* ═══════════════════════ THEME ═══════════════════════ */
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);
const ThemeProvider = ({ children }) => {
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

/* ═══════════════════════ COLORS (v2 — semantic-first, higher contrast) ═══════════════════════
   Neutrals lifted for WCAG legibility (old textFaint #484f58 failed AA badly).
   green/red/amber stay strictly semantic; purple is the single brand accent. */
const C = {
  bg: "#0b0f15", card: "#161b22", cardElev: "#1b212b", cardHover: "#1f2630", border: "#272d37",
  borderLight: "#3a414c", text: "#e9eff5", textMuted: "#9ba6b2", textFaint: "#6b7482",
  green: "#3fb950", greenBg: "rgba(63,185,80,0.1)", red: "#f85149", redBg: "rgba(248,81,73,0.1)",
  amber: "#e3a72f", amberBg: "rgba(227,167,47,0.1)", purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.1)",
  blue: "#58a6ff", blueBg: "rgba(88,166,255,0.1)", cyan: "#39d0d8",
  shadow: "0 1px 2px rgba(0,0,0,0.4)", shadowLg: "0 8px 28px rgba(0,0,0,0.45)"
};

/* ═══════════════════════ HELPERS ═══════════════════════ */
const mono = { fontFamily: "'SF Mono','Cascadia Code','Fira Code',monospace", fontVariantNumeric: "tabular-nums" };
const tierColor = { Diamond: C.cyan, Platinum: C.purple, Gold: C.amber, Silver: C.textMuted };

const pillStyle = (color) => ({
  display: "inline-block", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
  backgroundColor: color === C.green ? C.greenBg : color === C.red ? C.redBg : color === C.amber ? C.amberBg : color === C.blue ? C.blueBg : C.purpleBg,
  color: color, border: `1px solid ${color}30`
});

const cardStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px", boxShadow: C.shadow };
const thStyle = { padding: "11px 14px", textAlign: "left", color: C.textMuted, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.border}` };
const tdStyle = { padding: "11px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` };

export {
  ThemeContext,
  useTheme,
  ThemeProvider,
  C,
  mono,
  tierColor,
  pillStyle,
  cardStyle,
  thStyle,
  tdStyle
};
