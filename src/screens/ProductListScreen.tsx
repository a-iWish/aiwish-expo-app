import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { useProducts, useDeals, useProductSearch } from '../hooks/useProducts';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { ProductFilters } from '../services/api';
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

/** Verdict filter options */
const VERDICT_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'buy', label: 'BUY' },
  { key: 'wait', label: 'WAIT' },
  { key: 'hold', label: 'HOLD' },
];

/** Confidence filter options */
const CONFIDENCE_CHIPS = [
  { key: 'any', label: 'Any' },
  { key: '70', label: '70+' },
  { key: '80', label: '80+' },
  { key: '90', label: '90+' },
];

/** Sort options that map to API sort_by values */
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

/** Recently viewed compact card (reuses DealCard visual style). */
const RecentCard = React.memo(function RecentCard({
  product,
  onPress,
  colors,
}: {
  product: Product;
  onPress: (p: Product) => void;
  colors: ThemeColors;
}) {
  const cardStyles = useMemo(() => createRecentCardStyles(colors), [colors]);
  const price = product.trusted_price ?? product.current_price;

  return (
    <Pressable
      onPress={() => onPress(product)}
      style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}`}
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
    </Pressable>
  );
});

const createRecentCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: 132,
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
      height: 68,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surfaceLight,
    },
    imagePlaceholder: {
      width: '100%',
      height: 68,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surfaceLight,
    },
    name: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: -0.1,
    },
    price: {
      fontFamily: SEMIBOLD_FONT,
      color: colors.text,
      fontSize: 13,
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

  // Advanced filter state
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [verdictFilter, setVerdictFilter] = useState<string | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<string | null>(null);
  const [minPriceText, setMinPriceText] = useState('');
  const [maxPriceText, setMaxPriceText] = useState('');

  // Build API filters object
  const apiFilters = useMemo<ProductFilters | undefined>(() => {
    const f: ProductFilters = {};
    let hasFilter = false;

    if (verdictFilter && verdictFilter !== 'all') {
      f.verdict = verdictFilter;
      hasFilter = true;
    }
    if (confidenceFilter && confidenceFilter !== 'any') {
      f.minConfidence = parseInt(confidenceFilter, 10);
      hasFilter = true;
    }
    const minP = minPriceText ? parseFloat(minPriceText) : null;
    if (minP != null && !isNaN(minP) && minP > 0) {
      f.minPrice = minP;
      hasFilter = true;
    }
    const maxP = maxPriceText ? parseFloat(maxPriceText) : null;
    if (maxP != null && !isNaN(maxP) && maxP > 0) {
      f.maxPrice = maxP;
      hasFilter = true;
    }
    return hasFilter ? f : undefined;
  }, [verdictFilter, confidenceFilter, minPriceText, maxPriceText]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (verdictFilter && verdictFilter !== 'all') count++;
    if (confidenceFilter && confidenceFilter !== 'any') count++;
    if (minPriceText) count++;
    if (maxPriceText) count++;
    return count;
  }, [verdictFilter, confidenceFilter, minPriceText, maxPriceText]);

  const clearAllFilters = useCallback(() => {
    setVerdictFilter(null);
    setConfidenceFilter(null);
    setMinPriceText('');
    setMaxPriceText('');
  }, []);

  const { products, loading, error, refetch } = useProducts(apiFilters);
  const { deals: apiDeals } = useDeals();
  const { recentIds } = useRecentlyViewed();

  // Server-side catalog search (matches a pasted product URL by ASIN, or any
  // name not on the currently loaded page). Layered on top of the local filter.
  const { results: searchResults, active: searchActive } = useProductSearch(query);
  const queryIsUrl = /^https?:\/\//i.test(query.trim());
  const isSearching = query.trim().length > 0;

  /**
   * Deals carousel: prefer the server-ranked /deals feed; fall back to a
   * client-side BUY + high-confidence filter when the endpoint returns nothing
   * (older API build or missing Keepa stats).
   */
  const deals = useMemo(() => {
    if (apiDeals.length > 0) return apiDeals;
    return products.filter((p) => {
      const verdict = normalizeVerdict(p.recommendation);
      return verdict === 'BUY' && (p.confidence ?? 0) >= 80;
    });
  }, [apiDeals, products]);

  /** Recently viewed products matched from the loaded product list. */
  const recentlyViewedProducts = useMemo(() => {
    if (recentIds.length === 0) return [];
    const productMap = new Map(products.map((p) => [p.id, p]));
    return recentIds
      .map((id) => productMap.get(id))
      .filter((p): p is Product => p != null);
  }, [recentIds, products]);

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
    // A pasted URL can't match the local list — defer entirely to the
    // server's ASIN lookup so the user lands on the catalog product.
    if (queryIsUrl) return searchActive ? searchResults : [];

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
      // Nothing on the loaded page matched — fall back to server search so the
      // result set isn't limited to the current product page.
      if (list.length === 0 && searchActive && searchResults.length > 0) {
        return searchResults;
      }
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
  }, [products, selectedCategory, sortMode, query, queryIsUrl, searchActive, searchResults]);

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

  const renderRecentCard = useCallback(
    ({ item }: { item: Product }) => (
      <RecentCard product={item} onPress={handleProductPress} colors={colors} />
    ),
    [handleProductPress, colors],
  );

  const dealKeyExtractor = useCallback((item: Product) => `deal-${item.id}`, []);
  const recentKeyExtractor = useCallback((item: Product) => `recent-${item.id}`, []);

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

  const toggleFilters = useCallback(() => {
    setFiltersExpanded((prev) => !prev);
  }, []);

  const listHeader = useMemo(
    () => (
      <>
        <DiscoverHeader
          productCount={products.length}
          filteredCount={filteredProducts.length}
        />
        {!loading && !error && (
          <View style={styles.searchTop}>
            <SearchBar value={query} onChange={setQuery} />
          </View>
        )}
        {!loading && !error && !isSearching && deals.length > 0 && (
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
        {!loading && !error && !isSearching && recentlyViewedProducts.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.dealsSectionHeader}>
              <AppText variant="bodySemibold" style={styles.dealsSectionTitle}>
                Recently Viewed
              </AppText>
            </View>
            <FlatList
              horizontal
              data={recentlyViewedProducts}
              keyExtractor={recentKeyExtractor}
              renderItem={renderRecentCard}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dealsListContent}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          </View>
        )}
        {!loading && !error && (
          <View style={styles.filters}>
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

            {/* Advanced Filters Toggle */}
            <View style={styles.filterToggleRow}>
              <Pressable
                onPress={toggleFilters}
                style={styles.filterToggleBtn}
                accessibilityRole="button"
                accessibilityLabel={
                  filtersExpanded ? 'Collapse filters' : 'Expand filters'
                }
              >
                <Ionicons
                  name={filtersExpanded ? 'options' : 'options-outline'}
                  size={18}
                  color={activeFilterCount > 0 ? colors.brandEnd : colors.textSecondary}
                />
                <AppText
                  variant="bodySemibold"
                  style={[
                    styles.filterToggleText,
                    activeFilterCount > 0 && { color: colors.brandEnd },
                  ]}
                >
                  Filters
                </AppText>
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <AppText variant="caption" style={styles.filterBadgeText}>
                      {activeFilterCount}
                    </AppText>
                  </View>
                )}
                <Ionicons
                  name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textSoft}
                />
              </Pressable>
              {activeFilterCount > 0 && (
                <Pressable
                  onPress={clearAllFilters}
                  style={styles.clearAllBtn}
                  accessibilityLabel="Clear all filters"
                >
                  <AppText variant="caption" style={styles.clearAllText}>
                    Clear all
                  </AppText>
                </Pressable>
              )}
            </View>

            {/* Collapsible Advanced Filters Panel */}
            {filtersExpanded && (
              <View style={styles.advancedFilters}>
                <FilterChipRow
                  label="Verdict"
                  chips={VERDICT_CHIPS}
                  selectedKey={verdictFilter ?? 'all'}
                  onSelect={(key) =>
                    setVerdictFilter(key === 'all' ? null : key)
                  }
                  allowDeselect={false}
                />

                <FilterChipRow
                  label="Confidence"
                  chips={CONFIDENCE_CHIPS}
                  selectedKey={confidenceFilter ?? 'any'}
                  onSelect={(key) =>
                    setConfidenceFilter(key === 'any' ? null : key)
                  }
                  allowDeselect={false}
                />

                <View style={styles.priceRangeWrap}>
                  <AppText variant="meta" style={styles.priceRangeLabel}>
                    Price range
                  </AppText>
                  <View style={styles.priceInputRow}>
                    <TextInput
                      value={minPriceText}
                      onChangeText={setMinPriceText}
                      placeholder="Min"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={styles.priceInput}
                      returnKeyType="done"
                      accessibilityLabel="Minimum price"
                    />
                    <AppText variant="caption" style={styles.priceDash}>
                      to
                    </AppText>
                    <TextInput
                      value={maxPriceText}
                      onChangeText={setMaxPriceText}
                      placeholder="Max"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={styles.priceInput}
                      returnKeyType="done"
                      accessibilityLabel="Maximum price"
                    />
                  </View>
                </View>
              </View>
            )}
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
      recentlyViewedProducts,
      recentKeyExtractor,
      renderRecentCard,
      categoryChips,
      sortChips,
      selectedCategory,
      sortMode,
      query,
      filtersExpanded,
      toggleFilters,
      activeFilterCount,
      verdictFilter,
      confidenceFilter,
      minPriceText,
      maxPriceText,
      isSearching,
      clearAllFilters,
      colors,
      styles,
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
    recentSection: {
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
    searchTop: {
      paddingBottom: spacing.sm,
    },
    filters: {
      gap: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    filterToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
    },
    filterToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: MIN_TOUCH,
      paddingVertical: spacing.sm,
    },
    filterToggleText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    filterBadge: {
      backgroundColor: colors.brandEnd,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    filterBadgeText: {
      color: '#FFFFFF',
      fontFamily: SEMIBOLD_FONT,
      fontSize: 11,
      lineHeight: 14,
    },
    clearAllBtn: {
      minHeight: MIN_TOUCH,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    clearAllText: {
      color: colors.brandEnd,
      fontFamily: SEMIBOLD_FONT,
    },
    advancedFilters: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
    priceRangeWrap: {
      gap: spacing.sm,
    },
    priceRangeLabel: {
      paddingHorizontal: spacing.md,
    },
    priceInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    priceInput: {
      flex: 1,
      fontFamily: BODY_FONT,
      fontSize: fontSize.sm,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      minHeight: MIN_TOUCH,
    },
    priceDash: {
      color: colors.textMuted,
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
