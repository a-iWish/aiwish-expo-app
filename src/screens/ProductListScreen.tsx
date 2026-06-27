import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types/product';
import { EditorialProductRow, AppText, SearchBar } from '../components';
import { DiscoverHeader } from '../components/DiscoverHeader';
import { FilterChipRow } from '../components/FilterChipRow';
import { SkeletonEditorialRow } from '../components/SkeletonEditorialRow';
import { useTheme } from '../context/ThemeContext';
import {
  ThemeColors,
  spacing,
  borderRadius,
  fontSize,
  MIN_TOUCH,
  SEMIBOLD_FONT,
  BODY_FONT,
  DISPLAY_FONT,
} from '../styles/theme';
import { normalizeVerdict } from '../utils/verdictStyle';

const ALL_CATEGORIES = ['Baby', 'Cameras', 'Headphones', 'Home Electronics & Personal Care'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  Baby: 'Baby',
  Cameras: 'Cameras',
  Headphones: 'Audio',
  'Home Electronics & Personal Care': 'Home tech',
};

type SortMode = 'verdict' | 'price' | 'drop';

const VERDICT_ORDER: Record<string, number> = { BUY: 0, WAIT: 1, HOLD: 2 };

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Discover'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

/** A compact horizontal deal card for the "Best Deals" carousel. */
const DealCard = React.memo(function DealCard({
  product,
  onPress,
  colors,
}: {
  product: Product;
  onPress: (p: Product) => void;
  colors: ThemeColors;
}) {
  const cardStyles = useMemo(() => createDealCardStyles(colors), [colors]);
  const price = product.trusted_price ?? product.current_price;
  const confidence = product.confidence ?? 0;

  return (
    <Pressable
      onPress={() => onPress(product)}
      style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, Buy ${confidence}%`}
    >
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={cardStyles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={cardStyles.imagePlaceholder} />
      )}
      <AppText variant="bodySemibold" numberOfLines={2} style={cardStyles.name}>
        {product.name}
      </AppText>
      {price != null && (
        <AppText variant="caption" style={cardStyles.price}>
          ${price.toFixed(2)}
        </AppText>
      )}
      <View style={cardStyles.badge}>
        <AppText variant="caption" style={cardStyles.badgeText}>
          BUY {'·'} {Math.round(confidence)}%
        </AppText>
      </View>
    </Pressable>
  );
});

const createDealCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: 148,
      backgroundColor: colors.cardBg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    cardPressed: {
      backgroundColor: colors.surfaceLight,
    },
    image: {
      width: '100%',
      height: 80,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surfaceLight,
    },
    imagePlaceholder: {
      width: '100%',
      height: 80,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surfaceLight,
    },
    name: {
      fontSize: 13,
      lineHeight: 17,
      letterSpacing: -0.15,
    },
    price: {
      fontFamily: SEMIBOLD_FONT,
      color: colors.text,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.successBg,
      borderColor: colors.successBorder,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: SEMIBOLD_FONT,
      fontSize: 10,
      letterSpacing: 0.5,
      color: colors.success,
      textTransform: 'uppercase',
    },
  });

const MemoRow = React.memo(EditorialProductRow);

export const ProductListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('verdict');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { products, loading, error, refetch } = useProducts();

  /** Products with high-confidence BUY recommendation for the deals carousel. */
  const deals = useMemo(
    () =>
      products.filter((p) => {
        const verdict = normalizeVerdict(p.recommendation);
        return verdict === 'BUY' && (p.confidence ?? 0) >= 80;
      }),
    [products],
  );

  const categoryCounts = useMemo(
    () =>
      products.reduce<Record<string, number>>((acc, product) => {
        acc[product.category] = (acc[product.category] ?? 0) + 1;
        return acc;
      }, {}),
    [products],
  );

  const categoryChips = useMemo(
    () => [
      { key: 'all', label: `All ${products.length}` },
      ...ALL_CATEGORIES.map((cat) => ({
        key: cat,
        label: `${CATEGORY_LABELS[cat] ?? cat} ${categoryCounts[cat] ?? 0}`,
      })),
    ],
    [products.length, categoryCounts],
  );

  const sortChips = useMemo(
    () => [
      { key: 'verdict', label: 'Best picks' },
      { key: 'price', label: 'Lowest price' },
      { key: 'drop', label: 'Biggest drop' },
    ],
    [],
  );

  const filteredProducts = useMemo(() => {
    let list =
      selectedCategory && selectedCategory !== 'all'
        ? products.filter((p) => p.category === selectedCategory)
        : [...products];

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q) ||
          (p.retailer ?? '').toLowerCase().includes(q),
      );
    }

    if (sortMode === 'verdict') {
      list.sort((a, b) => {
        const ak = normalizeVerdict(a.recommendation) ?? 'HOLD';
        const bk = normalizeVerdict(b.recommendation) ?? 'HOLD';
        const order = (VERDICT_ORDER[ak] ?? 3) - (VERDICT_ORDER[bk] ?? 3);
        if (order !== 0) return order;
        return (b.confidence ?? 0) - (a.confidence ?? 0);
      });
    } else if (sortMode === 'price') {
      list.sort((a, b) => {
        const pa = a.trusted_price ?? a.current_price ?? Infinity;
        const pb = b.trusted_price ?? b.current_price ?? Infinity;
        return pa - pb;
      });
    } else {
      list.sort((a, b) => (b.discount_pct ?? 0) - (a.discount_pct ?? 0));
    }

    return list;
  }, [products, selectedCategory, sortMode, query]);

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', { productId: product.id });
    },
    [navigation],
  );

  const renderDealCard = useCallback(
    ({ item }: { item: Product }) => (
      <DealCard product={item} onPress={handleProductPress} colors={colors} />
    ),
    [handleProductPress, colors],
  );

  const dealKeyExtractor = useCallback((item: Product) => `deal-${item.id}`, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <MemoRow product={item} onPress={handleProductPress} />
    ),
    [handleProductPress],
  );

  const listHeader = useMemo(
    () => (
      <>
        <DiscoverHeader
          productCount={products.length}
          filteredCount={filteredProducts.length}
        />
        {!loading && !error && deals.length > 0 && (
          <View style={styles.dealsSection}>
            <View style={styles.dealsSectionHeader}>
              <AppText variant="bodySemibold" style={styles.dealsSectionTitle}>
                Best Deals Right Now
              </AppText>
              <AppText variant="meta" style={styles.dealsSectionCount}>
                {deals.length}
              </AppText>
            </View>
            <FlatList
              horizontal
              data={deals}
              keyExtractor={dealKeyExtractor}
              renderItem={renderDealCard}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dealsListContent}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          </View>
        )}
        {!loading && !error && (
          <View style={styles.filters}>
            <SearchBar value={query} onChange={setQuery} />
            <FilterChipRow
              label="Category"
              chips={categoryChips}
              selectedKey={selectedCategory ?? 'all'}
              onSelect={(key) =>
                setSelectedCategory(key === 'all' ? null : key)
              }
              allowDeselect={false}
            />
            <FilterChipRow
              label="Sort by"
              chips={sortChips}
              selectedKey={sortMode}
              onSelect={(key) => key && setSortMode(key as SortMode)}
              allowDeselect={false}
            />
          </View>
        )}
      </>
    ),
    [
      products.length,
      filteredProducts.length,
      loading,
      error,
      deals,
      dealKeyExtractor,
      renderDealCard,
      categoryChips,
      sortChips,
      selectedCategory,
      sortMode,
      query,
      styles.filters,
      styles.dealsSection,
      styles.dealsSectionHeader,
      styles.dealsSectionTitle,
      styles.dealsSectionCount,
      styles.dealsListContent,
    ],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading ? (
        <View style={styles.flex}>
          <DiscoverHeader productCount={0} filteredCount={0} />
          <SkeletonEditorialRow />
          <SkeletonEditorialRow />
          <SkeletonEditorialRow />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <DiscoverHeader productCount={0} filteredCount={0} />
          <AppText variant="body" style={styles.errorText}>
            {error}
          </AppText>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <AppText variant="bodySemibold" style={styles.retryText}>
              Retry
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlashList
          style={styles.flex}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brandEnd}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <AppText variant="title">No products found</AppText>
              <AppText variant="caption">Try a different category.</AppText>
            </View>
          }
        />
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
    flex: {
      flex: 1,
    },
    dealsSection: {
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    dealsSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    dealsSectionTitle: {
      fontSize: fontSize.md,
      letterSpacing: -0.2,
    },
    dealsSectionCount: {
      backgroundColor: colors.successBg,
      color: colors.success,
      fontFamily: SEMIBOLD_FONT,
      fontSize: fontSize.xs,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      overflow: 'hidden',
    },
    dealsListContent: {
      paddingHorizontal: spacing.md,
    },
    filters: {
      gap: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    listContent: {
      paddingBottom: spacing.xl,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.sm,
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    retryText: {
      color: colors.brandEnd,
    },
  });
