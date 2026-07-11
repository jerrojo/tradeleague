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

/* ═══════════════════════ COLORS (v3 — trading-desk palette) ═══════════════════════
   v2 was GitHub's dark theme: an olive-ish green (#3fb950) and a heavy border that
   made every card read as a boxed cell in a grid. v3 is a trading palette:

   · a DEEPER background, so cards separate by elevation instead of by outline —
     the borders drop to a whisper and the panels read as floating, not fenced;
   · a VIVID emerald green — "money up" should be unmistakable, and the old green
     was muddy next to it;
   · a brighter near-white for values, so the number always outranks its label.

   green/red/amber stay strictly semantic; purple is the single brand accent.
   Neutrals stay above the WCAG AA floor (the old textFaint #484f58 failed badly). */
const C = {
  bg: "#0a0e14", card: "#12171f", cardElev: "#171d26", cardHover: "#1c2430", border: "#212934",
  borderLight: "#333c4a", text: "#f0f4f9", textMuted: "#98a3b1", textFaint: "#7c8794",
  green: "#22c55e", greenBg: "rgba(34,197,94,0.1)", red: "#f6465d", redBg: "rgba(246,70,93,0.1)",
  amber: "#efa62e", amberBg: "rgba(239,166,46,0.1)", purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.1)",
  blue: "#4d9fff", blueBg: "rgba(77,159,255,0.1)", cyan: "#2dd4d8",
  shadow: "0 1px 3px rgba(0,0,0,0.5)", shadowLg: "0 12px 36px rgba(0,0,0,0.55)"
};

/* ═══════════════════════ HELPERS ═══════════════════════ */
const mono = { fontFamily: "'SF Mono','Cascadia Code','Fira Code',monospace", fontVariantNumeric: "tabular-nums" };

/* ═══════════════════════ TYPE SCALE ═══════════════════════
   ONE ramp for the whole product. Before this there was no scale, only drift: the
   same role ("a KPI card's value") existed at 15, 18, 20, 21 and 23px across five
   near-identical card primitives, and several cards rendered their LABEL at the same
   size as their VALUE — so the number you came for didn't outrank the word next to it.

   The rule every card obeys:  VALUE  >  LABEL  >  SUB
   — in size, in weight, and in brightness. Labels are never uppercase-bold (that was
   making 11px labels optically beat 14px values); UPPERCASE is reserved for `eyebrow`,
   which titles a *group* of cards, never a card itself. */
const T = {
  display:  { fontSize: 30, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.5px", ...mono }, // max ONE per page
  valueXl:  { fontSize: 26, fontWeight: 800, lineHeight: 1.05, ...mono },  // rail hero, funnel stage, fork trunk
  valueLg:  { fontSize: 22, fontWeight: 800, lineHeight: 1.1, ...mono },   // the default KPI card value
  value:    { fontSize: 18, fontWeight: 700, lineHeight: 1.15, ...mono },  // dense / secondary card
  valueSm:  { fontSize: 13, fontWeight: 700, ...mono },                    // label→value rows, table stats
  label:    { fontSize: 12, fontWeight: 600, color: C.textMuted },         // every card label. Sentence case.
  eyebrow:  { fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textFaint },
  caption:  { fontSize: 10.5, fontWeight: 500, color: C.textFaint },       // every sub

  /* Section ladder — a real 1.25× ramp with the weight getting HEAVIER as you go up,
     instead of the old page-16/700 → section-14/800 → card-13/600 (a 1px non-step
     that let rogue 15/800 card titles outrank the page itself). */
  pageTitle:    { fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" },
  sectionTitle: { fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" },
  cardTitle:    { fontSize: 13, fontWeight: 600 },
};

const tierColor = { Diamond: C.cyan, Platinum: C.purple, Gold: C.amber, Silver: C.textMuted };

const pillStyle = (color) => ({
  display: "inline-block", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
  backgroundColor: color === C.green ? C.greenBg : color === C.red ? C.redBg : color === C.amber ? C.amberBg : color === C.blue ? C.blueBg : C.purpleBg,
  color: color, border: `1px solid ${color}30`
});

/* Softer radius + roomier padding — modern terminal cards breathe */
const cardStyle = { backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "16px", boxShadow: C.shadow };
const thStyle = { padding: "11px 14px", textAlign: "left", color: C.textMuted, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.border}` };
const tdStyle = { padding: "11px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` };

export {
  ThemeContext,
  useTheme,
  ThemeProvider,
  C,
  T,
  mono,
  tierColor,
  pillStyle,
  cardStyle,
  thStyle,
  tdStyle
};
