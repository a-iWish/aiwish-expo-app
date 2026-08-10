import { ThemeColors } from '../styles/theme';

// The app deals in two verdicts: BUY and WAIT. The model's other classes are
// collapsed into these — BUY_ELSEWHERE -> BUY here in the client, and HOLD -> WAIT
// upstream in the API — so the client never sees HOLD or BUY_ELSEWHERE.
export type VerdictKey = 'BUY' | 'WAIT' | 'ANALYZING' | null;

export function normalizeVerdict(raw?: string | null): VerdictKey {
  const key = raw?.toUpperCase();
  if (key === 'BUY' || key === 'WAIT') return key;
  // BUY_ELSEWHERE ("buy, but it's cheaper at another retailer") is a buy signal,
  // and the row's meta line already names the cheaper store, so surface it as BUY.
  if (key === 'BUY_ELSEWHERE') return 'BUY';
  if (!raw) return null;
  return 'ANALYZING';
}

export function verdictDisplayWord(key: VerdictKey): string {
  switch (key) {
    case 'BUY':
      return 'BUY';
    case 'WAIT':
      return 'WAIT';
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
    default:
      return 'Analyzing';
  }
}
