export const tokens = {
  colors: {
    base: '#09090b',
    surface: '#121215',
    elevated: '#18181b',
    hover: '#222226',
    borderSubtle: '#27272a',
    borderStrong: '#3f3f46',
    borderAccent: 'rgba(59, 130, 246, 0.35)',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    accent: '#3b82f6',
    accentLight: '#60a5fa',
    accentDark: '#1d4ed8',
    accentGlow: 'rgba(59, 130, 246, 0.15)',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
} as const;

export type DesignTokens = typeof tokens;
