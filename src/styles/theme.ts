import { Platform, ViewStyle } from 'react-native';

export type ThemeColors = typeof darkColors;

export type AppearancePreference = 'system' | 'light' | 'dark';

export const palette = {
  pink:     '#f0048c',
  lavender: '#9d4edd',
  cyan:     '#00d4e8',
  mint:     '#00c896',
  gold:     '#f5a623',
  blue:     '#5b8af0',
  red:      '#f87171',
};

export const darkColors = {
  background:   '#09090B',
  surface:      '#141416',
  surfaceLight: '#1C1C1F',
  surface2:     '#1C1C1F',
  headerBg:     '#09090B',
  cardBg:       '#141416',

  brandStart: '#F0048C',
  brandEnd:   '#9D4EDD',

  primary:   '#9d4edd',
  secondary: '#f0048c',
  accent:    '#9d4edd',
  error:     '#f87171',

  pink:     '#f0048c',
  lavender: '#9d4edd',
  blue:     '#5b8af0',
  mint:     '#00c896',
  gold:     '#f5a623',
  cyan:     '#9d4edd',

  success:      '#4ADE80',
  warning:      '#FBBF24',
  neutralState: '#94A3B8',

  successBg:  'rgba(74,222,128,0.12)',
  warningBg:  'rgba(251,191,36,0.12)',
  neutralBg:  'rgba(148,163,184,0.12)',

  successBorder: 'rgba(74,222,128,0.22)',
  warningBorder: 'rgba(251,191,36,0.22)',
  neutralBorder: 'rgba(148,163,184,0.18)',

  text:          '#FAFAFA',
  textPrimary:   '#FAFAFA',
  textSecondary: 'rgba(250,250,250,0.64)',
  textMuted:     'rgba(250,250,250,0.64)',
  textSoft:      'rgba(250,250,250,0.38)',

  border:    'rgba(255,255,255,0.08)',
  borderMed: 'rgba(255,255,255,0.12)',
  white:     '#FFFFFF',

  hairline: 'rgba(255,255,255,0.06)',
};

export const lightColors: ThemeColors = {
  background:   '#FDFBF7',
  surface:      '#FFFFFF',
  surfaceLight: '#F5F3EF',
  surface2:     '#F5F3EF',
  headerBg:     '#FDFBF7',
  cardBg:       '#FFFFFF',

  brandStart: '#F0048C',
  brandEnd:   '#9D4EDD',

  primary:   '#9d4edd',
  secondary: '#f0048c',
  accent:    '#9d4edd',
  error:     '#f87171',

  pink:     '#f0048c',
  lavender: '#9d4edd',
  blue:     '#5b8af0',
  mint:     '#16A34A',
  gold:     '#D97706',
  cyan:     '#9d4edd',

  success:      '#15803D',
  warning:      '#B45309',
  neutralState: '#64748B',

  successBg:  'rgba(21,128,61,0.10)',
  warningBg:  'rgba(180,83,9,0.10)',
  neutralBg:  'rgba(100,116,139,0.10)',

  successBorder: 'rgba(21,128,61,0.20)',
  warningBorder: 'rgba(180,83,9,0.20)',
  neutralBorder: 'rgba(100,116,139,0.16)',

  text:          '#18181B',
  textPrimary:   '#18181B',
  textSecondary: 'rgba(24,24,27,0.64)',
  textMuted:     'rgba(24,24,27,0.64)',
  textSoft:      'rgba(24,24,27,0.38)',

  border:    'rgba(24,24,27,0.08)',
  borderMed: 'rgba(24,24,27,0.14)',
  white:     '#FFFFFF',

  hairline: 'rgba(24,24,27,0.06)',
};

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
  pill:   100,
};

export const fontSize = {
  xs:  12,
  sm:  14,
  md:  16,
  lg:  20,
  xl:  24,
  xxl: 32,
  displayList: 40,
  displayDetail: 56,
  confidence: 32,
};

export const appIconSizes = {
  bar:      52,
  state:    92,
  selector: 52,
  listThumb: 64,
};

export const MIN_TOUCH = 44;

export const MONO_FONT = Platform.select({
  ios:     'Courier New',
  android: 'monospace',
  default: 'monospace',
});

export const DISPLAY_FONT  = 'Outfit_700Bold';
export const BODY_FONT     = 'Outfit_400Regular';
export const SEMIBOLD_FONT = 'Outfit_600SemiBold';

export const motion = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  durationFast: 250,
  durationMedium: 400,
  durationSlow: 600,
  staggerStep: 80,
};

export const shadows: Record<'card' | 'header' | 'glow', ViewStyle> = {
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#9d4edd',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  header: {
    ...Platform.select({
      ios: {
        shadowColor: '#18181B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  glow: {
    ...Platform.select({
      ios: {
        shadowColor: '#F0048C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
};
