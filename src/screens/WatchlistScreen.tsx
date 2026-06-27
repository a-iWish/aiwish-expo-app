import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  Share,
  Alert,
  Switch,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { useProducts } from '../hooks/useProducts';
import { useWatchlist } from '../hooks/useWatchlist';
import { Product, WishlistItem } from '../types/product';
import { shareWishlist, updateWishlistItem } from '../services/api';
import { EditorialProductRow, AppText, Button } from '../components';
import { ScreenHeader } from '../components/ScreenHeader';
import { SkeletonEditorialRow } from '../components/SkeletonEditorialRow';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';
import {
  useQueryClient,
} from '@tanstack/react-query';
import { WISHLIST_QUERY_KEY } from '../hooks/useWatchlist';

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
  const { isAuthenticated } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { ids, getMeta, items } = useWatchlist();
  const { products, loading, error, refetch } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const queryClient = useQueryClient();

  const watchlistProducts = useMemo(
    () => products.filter((p) => ids.includes(p.id)),
    [products, ids],
  );

  // Build a map from product id to the wishlist item (for is_public / occasion)
  const itemMap = useMemo(() => {
    const map: Record<string, WishlistItem> = {};
    if (items) {
      for (const it of items) {
        map[it.product_id] = it;
      }
    }
    return map;
  }, [items]);

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

  const handleShare = useCallback(async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setSharing(true);
    try {
      const result = await shareWishlist();
      await Share.share({
        message: `Check out my wishlist: ${result.share_url}`,
        url: result.share_url,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not share';
      Alert.alert('Error', msg);
    } finally {
      setSharing(false);
    }
  }, [isAuthenticated, navigation]);

  const handleTogglePublic = useCallback(
    async (productId: string, isPublic: boolean) => {
      try {
        await updateWishlistItem(productId, { is_public: isPublic });
        queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        Alert.alert('Error', msg);
      }
    },
    [queryClient],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const meta = getMeta(item.id);
      const current = item.trusted_price ?? item.current_price;
      const deltaLine = formatSavedDelta(meta?.savedPrice, current);
      const wishItem = itemMap[item.id];
      const isPublic = wishItem?.is_public ?? false;

      return (
        <View>
          <MemoRow
            product={item}
            onPress={handleProductPress}
            metaSuffix={deltaLine}
          />
          <View style={styles.itemActions}>
            {wishItem?.occasion ? (
              <AppText variant="caption" style={styles.occasionTag}>
                {wishItem.occasion}
              </AppText>
            ) : null}
            <View style={styles.publicToggle}>
              <AppText variant="caption" style={styles.toggleLabel}>
                {isPublic ? 'Public' : 'Private'}
              </AppText>
              <Switch
                value={isPublic}
                onValueChange={(val) => handleTogglePublic(item.id, val)}
                trackColor={{
                  false: colors.border,
                  true: colors.brandEnd,
                }}
                thumbColor={colors.white}
                style={styles.switch}
              />
            </View>
          </View>
        </View>
      );
    },
    [handleProductPress, getMeta, itemMap, handleTogglePublic, colors, styles],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Watchlist"
        subtitle="products you are tracking"
        showBrand
      />

      {isAuthenticated && watchlistProducts.length > 0 && (
        <View style={styles.shareRow}>
          <Button
            title={sharing ? 'Sharing...' : 'Share Wishlist'}
            variant="outline"
            onPress={handleShare}
            disabled={sharing}
            style={styles.shareBtn}
          />
        </View>
      )}

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
    shareRow: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    shareBtn: {
      alignSelf: 'stretch',
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    occasionTag: {
      color: colors.brandEnd,
    },
    publicToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    toggleLabel: {
      color: colors.textSecondary,
    },
    switch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
  });
