import { ThemeColors } from '../styles/theme';

export type VerdictKey = 'BUY' | 'WAIT' | 'HOLD' | 'ANALYZING' | null;

export function normalizeVerdict(raw?: string | null): VerdictKey {
  const key = raw?.toUpperCase();
  if (key === 'BUY' || key === 'WAIT' || key === 'HOLD') return key;
  if (!raw) return null;
  return 'ANALYZING';
}

export function verdictDisplayWord(key: VerdictKey): string {
  switch (key) {
    case 'BUY':
      return 'BUY';
    case 'WAIT':
      return 'WAIT';
    case 'HOLD':
      return 'HOLD';
    default:
      return '···';
  }
}

export function verdictColor(key: VerdictKey, colors: ThemeColors): string {
  switch (key) {
    case 'BUY':
      return colors.success;
    case 'WAIT':
      return colors.warning;
    case 'HOLD':
      return colors.neutralState;
    default:
      return colors.textSoft;
  }
}

export function verdictSubtitle(key: VerdictKey): string {
  switch (key) {
    case 'BUY':
      return 'Buy now';
    case 'WAIT':
      return 'Wait';
    case 'HOLD':
      return 'Watch';
    default:
      return 'Analyzing';
  }
}
