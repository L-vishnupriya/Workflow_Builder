export const TOKENS = {
  colors: {
    orange: "#F97316",
    orangeLight: "#FFF7ED",
    orangeBorder: "#FDBA74",
    white: "#FFFFFF",
    bg: "#F1F3F5",
    canvas: "#F8F9FA",
    border: "#E5E7EB",
    borderDark: "#D1D5DB",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    audience: "#F97316",
    wait: "#6366F1",
    filter: "#F59E0B",
    action: "#10B981",
    split: "#8B5CF6",
    end: "#6B7280",
    audienceBg: "#FFF7ED",
    waitBg: "#EEF2FF",
    filterBg: "#FFFBEB",
    actionBg: "#ECFDF5",
    splitBg: "#F5F3FF",
    endBg: "#F9FAFB",
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.08)",
    md: "0 4px 12px rgba(0,0,0,0.10)",
    lg: "0 8px 24px rgba(0,0,0,0.12)",
    node: "0 2px 8px rgba(0,0,0,0.08)",
    nodeHover: "0 4px 16px rgba(0,0,0,0.14)",
  },
  font: {
    family: "'Inter', 'system-ui', sans-serif",
  },
} as const;

export function generateCSSVars(): string {
  return `
    :root, :host {
      --c1x-orange: ${TOKENS.colors.orange};
      --c1x-orange-light: ${TOKENS.colors.orangeLight};
      --c1x-orange-border: ${TOKENS.colors.orangeBorder};
      --c1x-white: ${TOKENS.colors.white};
      --c1x-bg: ${TOKENS.colors.bg};
      --c1x-canvas: ${TOKENS.colors.canvas};
      --c1x-border: ${TOKENS.colors.border};
      --c1x-border-dark: ${TOKENS.colors.borderDark};
      --c1x-text: ${TOKENS.colors.textPrimary};
      --c1x-text-secondary: ${TOKENS.colors.textSecondary};
      --c1x-text-muted: ${TOKENS.colors.textMuted};
      --c1x-shadow-sm: ${TOKENS.shadow.sm};
      --c1x-shadow-md: ${TOKENS.shadow.md};
      --c1x-shadow-node: ${TOKENS.shadow.node};
      --c1x-radius-md: ${TOKENS.radius.md};
      --c1x-radius-lg: ${TOKENS.radius.lg};
      --c1x-font: ${TOKENS.font.family};
    }
  `;
}
