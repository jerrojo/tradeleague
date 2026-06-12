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

/* ═══════════════════════ COLORS ═══════════════════════ */
const C = {
  bg: "#0d1117", card: "#161b22", cardHover: "#1c2129", border: "#21262d",
  borderLight: "#30363d", text: "#e6edf3", textMuted: "#8b949e", textFaint: "#484f58",
  green: "#3fb950", greenBg: "rgba(63,185,80,0.1)", red: "#f85149", redBg: "rgba(248,81,73,0.1)",
  amber: "#d29922", amberBg: "rgba(210,153,34,0.1)", purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.1)",
  blue: "#58a6ff", blueBg: "rgba(88,166,255,0.1)", cyan: "#39d0d8"
};

/* ═══════════════════════ HELPERS ═══════════════════════ */
const mono = { fontFamily: "'SF Mono','Cascadia Code','Fira Code',monospace", fontVariantNumeric: "tabular-nums" };
const tierColor = { Diamond: C.cyan, Platinum: C.purple, Gold: C.amber, Silver: C.textMuted };

const pillStyle = (color) => ({
  display: "inline-block", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
  backgroundColor: color === C.green ? C.greenBg : color === C.red ? C.redBg : color === C.amber ? C.amberBg : color === C.blue ? C.blueBg : C.purpleBg,
  color: color, border: `1px solid ${color}30`
});

const cardStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "12px" };
const thStyle = { padding: "10px 12px", textAlign: "left", color: C.textMuted, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.border}` };
const tdStyle = { padding: "10px 12px", fontSize: "12px", borderBottom: `1px solid ${C.border}` };

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
