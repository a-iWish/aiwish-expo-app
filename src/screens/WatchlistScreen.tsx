import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { useProducts } from '../hooks/useProducts';
import { useWatchlist } from '../hooks/useWatchlist';
import { Product } from '../types/product';
import { EditorialProductRow, AppText, Button } from '../components';
import { ScreenHeader } from '../components/ScreenHeader';
import { SkeletonEditorialRow } from '../components/SkeletonEditorialRow';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing } from '../styles/theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Watchlist'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

const MemoRow = React.memo(EditorialProductRow);

function formatSavedDelta(
  savedPrice: number | null | undefined,
  current: number | null | undefined,
): string | undefined {
  if (savedPrice == null || current == null || savedPrice <= 0) return undefined;
  const pct = ((current - savedPrice) / savedPrice) * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}% since saved`;
}

export const WatchlistScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { ids, getMeta } = useWatchlist();
  const { products, loading, error, refetch } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  const watchlistProducts = useMemo(
    () => products.filter((p) => ids.includes(p.id)),
    [products, ids],
  );

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
    ({ item }: { item: Product }) => {
      const meta = getMeta(item.id);
      const current = item.trusted_price ?? item.current_price;
      const deltaLine = formatSavedDelta(meta?.savedPrice, current);
      return (
        <MemoRow
          product={item}
          onPress={handleProductPress}
          metaSuffix={deltaLine}
        />
      );
    },
    [handleProductPress, getMeta],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Watchlist"
        subtitle="products you are tracking"
        showBrand
      />

      {loading ? (
        <View>
          <SkeletonEditorialRow />
          <SkeletonEditorialRow />
          <SkeletonEditorialRow />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AppText variant="body" style={{ color: colors.error }}>
            {error}
          </AppText>
          <Pressable onPress={() => refetch()}>
            <AppText variant="bodySemibold" style={{ color: colors.brandEnd }}>
              Retry
            </AppText>
          </Pressable>
        </View>
      ) : watchlistProducts.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="displayList" style={styles.emptyVerdict}>
            WAIT
          </AppText>
          <AppText variant="title" style={styles.emptyTitle}>
            Nothing saved yet
          </AppText>
          <AppText variant="caption" style={styles.emptyBody}>
            Save products from Discover to track prices and verdicts here.
          </AppText>
          <Button
            title="Browse Discover"
            onPress={() => navigation.navigate('Discover')}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <FlashList
          data={watchlistProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brandEnd}
            />
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.sm,
    },
    empty: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      alignItems: 'flex-start',
    },
    emptyVerdict: {
      color: colors.warning,
      fontSize: 48,
    },
    emptyTitle: {
      marginTop: spacing.md,
    },
    emptyBody: {
      marginTop: spacing.sm,
      maxWidth: 280,
    },
    emptyBtn: {
      marginTop: spacing.lg,
      alignSelf: 'stretch',
    },
  });
