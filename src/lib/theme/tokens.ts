export const tokens = {
  color: {
    background: "#070707",
    surface: "#101010",
    elevated: "#181818",
    textPrimary: "#f5f2ea",
    textMuted: "#b7b0a3",
    accent: "#f2c46d",
    accentSecondary: "#8fb7ff",
    success: "#8ccfb0",
    warning: "#f2c46d"
  },
  radius: {
    card: "0.5rem",
    pill: "999px"
  },
  blur: {
    glass: "20px"
  },
  motion: {
    quick: 0.18,
    base: 0.28,
    slow: 0.55
  },
  shadow: {
    card: "0 18px 42px rgba(0, 0, 0, 0.32)",
    accent: "0 0 0 1px rgba(242, 196, 109, 0.22)"
  }
} as const;
