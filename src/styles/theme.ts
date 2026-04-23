import { Platform, ViewStyle } from 'react-native';

export type ThemeColors = typeof darkColors;

// ── Shared palette ───────────────────────────────────────────────────────────
export const palette = {
  pink:     '#f0048c',
  lavender: '#9d4edd',
  cyan:     '#00d4e8',
  mint:     '#00c896',
  gold:     '#f5a623',
  blue:     '#5b8af0',
  red:      '#f87171',
};

// ── Dark (Vaporwave) ─────────────────────────────────────────────────────────
export const darkColors = {
  // Backgrounds
  background:   '#0B0D12',
  surface:      '#12161F',
  surfaceLight: '#171C26',
  surface2:     '#171C26',
  headerBg:     '#0B0D12',
  cardBg:       '#12161F',

  // Brand gradient
  brandStart: '#F0048C',
  brandEnd:   '#9D4EDD',

  // Brand / UI accents (kept for backward compat)
  primary:   '#9d4edd',   // lavender
  secondary: '#f0048c',   // pink
  accent:    '#00d4e8',   // cyan
  error:     '#f87171',

  // Extended palette (kept for backward compat)
  pink:     '#f0048c',
  lavender: '#9d4edd',
  blue:     '#5b8af0',
  mint:     '#00c896',
  gold:     '#f5a623',
  cyan:     '#00d4e8',

  // Semantic states — reduced palette
  success:      '#22C55E',
  warning:      '#F59E0B',
  neutralState: '#94A3B8',

  // State backgrounds
  successBg:  'rgba(34,197,94,0.12)',
  warningBg:  'rgba(245,158,11,0.12)',
  neutralBg:  'rgba(148,163,184,0.12)',

  // State borders
  successBorder: 'rgba(34,197,94,0.22)',
  warningBorder: 'rgba(245,158,11,0.22)',
  neutralBorder: 'rgba(148,163,184,0.18)',

  // Text
  text:          '#F5F7FF',
  textPrimary:   '#F5F7FF',
  textSecondary: 'rgba(245,247,255,0.64)',
  textMuted:     'rgba(245,247,255,0.64)',
  textSoft:      'rgba(245,247,255,0.38)',

  // Structural
  border:    'rgba(255,255,255,0.08)',
  borderMed: 'rgba(255,255,255,0.12)',
  white:     '#FFFFFF',
};

// ── Light (Daywave) ──────────────────────────────────────────────────────────
export const lightColors: ThemeColors = {
  // Backgrounds
  background:   '#F7F4FB',
  surface:      '#FFFFFF',
  surfaceLight: '#F4F0FA',
  surface2:     '#F4F0FA',
  headerBg:     '#F7F4FB',
  cardBg:       '#FFFFFF',

  // Brand gradient
  brandStart: '#F0048C',
  brandEnd:   '#9D4EDD',

  // Brand / UI accents (kept for backward compat)
  primary:   '#9d4edd',
  secondary: '#f0048c',
  accent:    '#00d4e8',
  error:     '#f87171',

  // Extended palette (kept for backward compat)
  pink:     '#f0048c',
  lavender: '#9d4edd',
  blue:     '#5b8af0',
  mint:     '#16A34A',
  gold:     '#D97706',
  cyan:     '#9d4edd',

  // Semantic states — reduced palette
  success:      '#16A34A',
  warning:      '#D97706',
  neutralState: '#64748B',

  // State backgrounds
  successBg:  'rgba(22,163,74,0.10)',
  warningBg:  'rgba(217,119,6,0.10)',
  neutralBg:  'rgba(100,116,139,0.10)',

  // State borders
  successBorder: 'rgba(22,163,74,0.20)',
  warningBorder: 'rgba(217,119,6,0.20)',
  neutralBorder: 'rgba(100,116,139,0.16)',

  // Text
  text:          '#18181B',
  textPrimary:   '#18181B',
  textSecondary: 'rgba(24,24,27,0.64)',
  textMuted:     'rgba(24,24,27,0.64)',
  textSoft:      'rgba(24,24,27,0.38)',

  // Structural
  border:    'rgba(24,24,27,0.08)',
  borderMed: 'rgba(24,24,27,0.14)',
  white:     '#FFFFFF',
};

// Keep backward-compatible default export
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm:     8,
  md:     12,
  lg:     16,
  xl:     24,
  full:   100,
  button: 14,
  card:   20,
  cardLg: 26,
};

export const fontSize = {
  xs:  12,
  sm:  14,
  md:  16,
  lg:  20,
  xl:  24,
  xxl: 32,
};

export const appIconSizes = {
  bar:      52,
  state:    92,
  selector: 52,
};

export const MONO_FONT = Platform.select({
  ios:     'Courier New',
  android: 'monospace',
  default: 'monospace',
});

export const shadows: Record<'card' | 'header' | 'glow', ViewStyle> = {
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#9d4edd',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  header: {
    ...Platform.select({
      ios: {
        shadowColor: '#9d4edd',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  glow: {
    ...Platform.select({
      ios: {
        shadowColor: '#F0048C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
};
