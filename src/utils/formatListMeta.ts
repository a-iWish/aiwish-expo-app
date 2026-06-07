import { ThemeColors } from '../styles/theme';

export interface ListMetaPart {
  text: string;
  color?: string;
}

export function buildListMetaParts(
  price: number | null | undefined,
  deltaPct: number | null | undefined,
  retailer: string,
  suffix: string | undefined,
  colors: ThemeColors,
): ListMetaPart[] {
  const parts: ListMetaPart[] = [];

  if (price != null) {
    parts.push({
      text: `$${price.toFixed(2)}`,
      color: colors.text,
    });
  }

  if (deltaPct != null) {
    const isBelowRef = deltaPct < 0;
    parts.push({
      text: `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(0)}% vs ref`,
      color: isBelowRef ? colors.success : deltaPct > 0 ? colors.warning : colors.textSecondary,
    });
  }

  parts.push({
    text: retailer,
    color: colors.textSoft,
  });

  if (suffix) {
    parts.push({
      text: suffix,
      color: colors.textSecondary,
    });
  }

  return parts;
}
