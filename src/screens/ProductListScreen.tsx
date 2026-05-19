import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
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
import { EditorialProductRow, AppText } from '../components';
import { DiscoverHeader } from '../components/DiscoverHeader';
import { FilterChipRow } from '../components/FilterChipRow';
import { SkeletonEditorialRow } from '../components/SkeletonEditorialRow';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing } from '../styles/theme';
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

const MemoRow = React.memo(EditorialProductRow);

export const ProductListScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('verdict');
  const [refreshing, setRefreshing] = useState(false);
  const { products, loading, error, refetch } = useProducts();

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
  }, [products, selectedCategory, sortMode]);

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', { productId: product.id });
    },
    [navigation],
  );

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
          </View>
        )}
      </>
    ),
    [
      products.length,
      filteredProducts.length,
      loading,
      error,
      categoryChips,
      sortChips,
      selectedCategory,
      sortMode,
      styles.filters,
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
