/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#0f172a',
    tint: '#0f172a',
    background: '#f7f8fa',
    foreground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a',
    primary: '#0f172a',
    primaryForeground: '#f8fafc',
    secondary: '#e2e8f0',
    secondaryForeground: '#0f172a',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    success: '#16a34a',
    border: '#e2e8f0',
    input: '#e2e8f0',
  },
  dark: {
    text: '#f8fafc',
    tint: '#f8fafc',
    background: '#0f172a',
    foreground: '#f8fafc',
    card: '#111c31',
    cardForeground: '#f8fafc',
    primary: '#f8fafc',
    primaryForeground: '#0f172a',
    secondary: '#1e293b',
    secondaryForeground: '#f8fafc',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    accent: '#1e293b',
    accentForeground: '#f8fafc',
    destructive: '#f87171',
    destructiveForeground: '#0f172a',
    success: '#4ade80',
    border: '#243247',
    input: '#243247',
  },
  radius: 4,
};

export default colors;
