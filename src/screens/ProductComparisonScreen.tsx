import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Product } from '../types/product';
import { useProducts } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { AppText } from '../components';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';
import { normalizeVerdict } from '../utils/verdictStyle';

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

const MAX_SELECTION = 3;

function priceOf(p: Product): number | null {
  return p.trusted_price ?? p.current_price ?? null;
}

type MetricRow = {
  label: string;
  value: (p: Product) => string;
  /** Index of the "best" selected product for this metric, or null. */
  best?: (selected: Product[]) => number | null;
};

const METRICS: MetricRow[] = [
  {
    label: 'Price',
    value: (p) => {
      const v = priceOf(p);
      return v != null ? `$${v.toFixed(2)}` : '—';
    },
    best: (sel) => {
      let bi: number | null = null;
      let bv = Infinity;
      sel.forEach((p, i) => {
        const v = priceOf(p);
        if (v != null && v < bv) {
          bv = v;
          bi = i;
        }
      });
      return bi;
    },
  },
  {
    label: 'Verdict',
    value: (p) => normalizeVerdict(p.recommendation) ?? '—',
  },
  {
    label: 'Confidence',
    value: (p) => (p.confidence != null ? `${p.confidence}%` : '—'),
    best: (sel) => {
      let bi: number | null = null;
      let bv = -Infinity;
      sel.forEach((p, i) => {
        const v = p.confidence ?? -Infinity;
        if (v > bv) {
          bv = v;
          bi = i;
        }
      });
      return bi;
    },
  },
  {
    label: 'Discount',
    value: (p) => (p.discount_pct != null ? `${p.discount_pct.toFixed(0)}%` : '—'),
    best: (sel) => {
      let bi: number | null = null;
      let bv = -Infinity;
      sel.forEach((p, i) => {
        const v = p.discount_pct ?? -Infinity;
        if (v > bv) {
          bv = v;
          bi = i;
        }
      });
      return bi;
    },
  },
  {
    label: 'Rating',
    value: (p) => (p.rating != null ? `${p.rating.toFixed(1)}\u2605` : '—'),
    best: (sel) => {
      let bi: number | null = null;
      let bv = -Infinity;
      sel.forEach((p, i) => {
        const v = p.rating ?? -Infinity;
        if (v > bv) {
          bv = v;
          bi = i;
        }
      });
      return bi;
    },
  },
  {
    label: 'Reviews',
    value: (p) => (p.reviews_count != null ? p.reviews_count.toLocaleString() : '—'),
  },
];

export const ProductComparisonScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { ids } = useWishlist();
  const { products } = useProducts();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => ids.includes(p.id)),
    [products, ids],
  );

  const selected = useMemo(
    () => selectedIds.map((id) => wishlistProducts.find((p) => p.id === id)).filter(Boolean) as Product[],
    [selectedIds, wishlistProducts],
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id);
      if (curr.length >= MAX_SELECTION) return curr;
      return [...curr, id];
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <AppText variant="body" style={{ color: colors.brandEnd }}>
            Back
          </AppText>
        </Pressable>
        <AppText variant="title" style={styles.headerTitle}>
          Compare
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <AppText variant="caption" style={styles.hint}>
        Select up to {MAX_SELECTION} saved products to compare.
      </AppText>

      <View style={styles.pickerRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerContent}>
          {wishlistProducts.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => toggle(p.id)}
                style={[styles.pickerChip, isSelected && styles.pickerChipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.pickerThumb} resizeMode="contain" />
                ) : (
                  <View style={[styles.pickerThumb, styles.pickerThumbPlaceholder]} />
                )}
                <AppText variant="caption" numberOfLines={1} style={styles.pickerLabel}>
                  {p.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {selected.length === 0 ? (
        <View style={styles.centered}>
          <AppText variant="caption" style={styles.emptyBody}>
            {wishlistProducts.length === 0
              ? 'Save products to your wishlist first, then compare them here.'
              : 'Tap products above to start comparing.'}
          </AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.tableWrap} showsVerticalScrollIndicator={false}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.metricLabelCell} />
            {selected.map((p) => (
              <View key={p.id} style={styles.productCell}>
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.headerThumb} resizeMode="contain" />
                ) : (
                  <View style={[styles.headerThumb, styles.pickerThumbPlaceholder]} />
                )}
                <AppText variant="caption" numberOfLines={2} style={styles.headerName}>
                  {p.name}
                </AppText>
              </View>
            ))}
          </View>

          {METRICS.map((metric) => {
            const bestIndex = metric.best ? metric.best(selected) : null;
            return (
              <View key={metric.label} style={styles.metricRow}>
                <View style={styles.metricLabelCell}>
                  <AppText variant="meta" style={styles.metricLabel}>
                    {metric.label}
                  </AppText>
                </View>
                {selected.map((p, i) => {
                  const isBest = bestIndex === i && selected.length > 1;
                  return (
                    <View key={p.id} style={styles.productCell}>
                      <AppText
                        variant="bodySemibold"
                        style={[styles.metricValue, isBest && styles.metricBest]}
                      >
                        {metric.value(p)}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.headerBg,
    },
    backBtn: {
      width: 60,
      minHeight: 44,
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },
    hint: {
      color: colors.textSecondary,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    pickerRow: {
      paddingVertical: spacing.sm,
    },
    pickerContent: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    pickerChip: {
      width: 96,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
      alignItems: 'center',
      gap: spacing.xs,
    },
    pickerChipSelected: {
      borderColor: colors.brandEnd,
    },
    pickerThumb: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.sm,
    },
    pickerThumbPlaceholder: {
      backgroundColor: colors.surface2,
    },
    pickerLabel: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    emptyBody: {
      textAlign: 'center',
      maxWidth: 280,
      color: colors.textSecondary,
    },
    tableWrap: {
      padding: spacing.md,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    metricLabelCell: {
      width: 90,
      justifyContent: 'center',
    },
    metricLabel: {
      color: colors.textSecondary,
    },
    productCell: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
      gap: spacing.xs,
    },
    headerThumb: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.sm,
    },
    headerName: {
      textAlign: 'center',
      color: colors.text,
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    metricValue: {
      color: colors.text,
    },
    metricBest: {
      color: colors.success,
    },
  });
