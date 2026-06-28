import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  Share,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { useProducts } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { Product, WishlistItem } from '../types/product';
import { shareWishlist, updateWishlistItem } from '../services/api';
import { EditorialProductRow, AppText, Button } from '../components';
import { ScreenHeader } from '../components/ScreenHeader';
import { normalizeVerdict } from '../utils/verdictStyle';
import { SkeletonEditorialRow } from '../components/SkeletonEditorialRow';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';
import {
  useQueryClient,
} from '@tanstack/react-query';
import { WISHLIST_QUERY_KEY } from '../hooks/useWishlist';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Wishlist'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

const MemoRow = React.memo(EditorialProductRow);

/** Common gift occasions offered in the occasion picker. */
const OCCASIONS = [
  'Birthday',
  'Christmas',
  'Anniversary',
  'Wedding',
  'Graduation',
  'Valentine\u2019s Day',
  'Just because',
] as const;

function formatSavedDelta(
  savedPrice: number | null | undefined,
  current: number | null | undefined,
): string | undefined {
  if (savedPrice == null || current == null || savedPrice <= 0) return undefined;
  const pct = ((current - savedPrice) / savedPrice) * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}% since saved`;
}

/** Human, urgency-aware label for a saved deadline (ISO yyyy-mm-dd). */
function formatDeadline(deadline: string | null | undefined): string | undefined {
  if (!deadline) return undefined;
  const [y, m, d] = deadline.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  const label = target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (days < 0) return `${label} · overdue`;
  if (days === 0) return `${label} · today`;
  if (days === 1) return `${label} · 1 day left`;
  if (days <= 14) return `${label} · ${days} days left`;
  return `by ${label}`;
}

export const WishlistScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { ids, getMeta, items } = useWishlist();
  const { products, loading, error, refetch } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  // Product whose occasion is being edited (drives the occasion picker modal).
  const [occasionTarget, setOccasionTarget] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const wishlistProducts = useMemo(
    () => products.filter((p) => ids.includes(p.id)),
    [products, ids],
  );

  /**
   * Savings dashboard: aggregate potential and realized savings across the
   * wishlist from data already loaded (no extra fetches).
   *   - potentialSavings: sum of (original - current) for discounted items.
   *   - droppedSinceSaved: sum of (savedPrice - current) where price fell after saving.
   *   - readyToBuy: count of items the model currently rates BUY.
   */
  const savings = useMemo(() => {
    let potentialSavings = 0;
    let droppedSinceSaved = 0;
    let droppedCount = 0;
    let readyToBuy = 0;
    for (const p of wishlistProducts) {
      const current = p.trusted_price ?? p.current_price ?? null;
      if (current != null && p.original_price != null && p.original_price > current) {
        potentialSavings += p.original_price - current;
      }
      if (normalizeVerdict(p.recommendation) === 'BUY') readyToBuy += 1;
      const savedPrice = getMeta(p.id)?.savedPrice ?? null;
      if (current != null && savedPrice != null && savedPrice > current) {
        droppedSinceSaved += savedPrice - current;
        droppedCount += 1;
      }
    }
    return {
      potentialSavings,
      droppedSinceSaved,
      droppedCount,
      readyToBuy,
      count: wishlistProducts.length,
    };
  }, [wishlistProducts, getMeta]);

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

  const openOccasionPicker = useCallback((productId: string) => {
    setOccasionTarget(productId);
  }, []);

  const handleSetOccasion = useCallback(
    async (occasion: string | null) => {
      const productId = occasionTarget;
      setOccasionTarget(null);
      if (!productId) return;
      try {
        // Empty string clears the occasion server-side.
        await updateWishlistItem(productId, { occasion: occasion ?? '' });
        queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Update failed';
        Alert.alert('Error', msg);
      }
    },
    [occasionTarget, queryClient],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const meta = getMeta(item.id);
      const current = item.trusted_price ?? item.current_price;
      const deltaLine = formatSavedDelta(meta?.savedPrice, current);
      const deadlineLine = formatDeadline(meta?.deadline);
      const metaSuffix =
        [deltaLine, deadlineLine].filter(Boolean).join('  ·  ') || undefined;
      const wishItem = itemMap[item.id];
      const isPublic = wishItem?.is_public ?? false;

      return (
        <View>
          <MemoRow
            product={item}
            onPress={handleProductPress}
            metaSuffix={metaSuffix}
          />
          <View style={styles.itemActions}>
            <Pressable
              onPress={() => openOccasionPicker(item.id)}
              style={styles.occasionBtn}
              accessibilityRole="button"
              accessibilityLabel={
                wishItem?.occasion
                  ? `Occasion: ${wishItem.occasion}. Tap to change.`
                  : 'Set a gift occasion'
              }
            >
              <AppText
                variant="caption"
                style={wishItem?.occasion ? styles.occasionTag : styles.occasionPlaceholder}
              >
                {wishItem?.occasion ? wishItem.occasion : '+ Occasion'}
              </AppText>
            </Pressable>
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
    [handleProductPress, getMeta, itemMap, handleTogglePublic, openOccasionPicker, colors, styles],
  );

  const activeOccasion = occasionTarget ? itemMap[occasionTarget]?.occasion ?? null : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Wishlist"
        subtitle="products you are tracking"
        showBrand
      />

      {wishlistProducts.length > 0 && (
        <View style={styles.dashboard}>
          <View style={styles.dashStat}>
            <AppText variant="price" style={styles.dashValue}>
              ${savings.potentialSavings.toFixed(0)}
            </AppText>
            <AppText variant="caption" style={styles.dashLabel}>
              potential savings
            </AppText>
          </View>
          <View style={styles.dashDivider} />
          <View style={styles.dashStat}>
            <AppText variant="price" style={styles.dashValue}>
              {savings.readyToBuy}
            </AppText>
            <AppText variant="caption" style={styles.dashLabel}>
              ready to buy
            </AppText>
          </View>
          <View style={styles.dashDivider} />
          <View style={styles.dashStat}>
            <AppText variant="price" style={styles.dashValue}>
              {savings.count}
            </AppText>
            <AppText variant="caption" style={styles.dashLabel}>
              tracked
            </AppText>
          </View>
        </View>
      )}

      {wishlistProducts.length > 0 && savings.droppedCount > 0 && (
        <AppText variant="caption" style={styles.droppedNote}>
          ${savings.droppedSinceSaved.toFixed(0)} dropped across {savings.droppedCount}{' '}
          item{savings.droppedCount === 1 ? '' : 's'} since you saved them.
        </AppText>
      )}

      {wishlistProducts.length > 0 && (
        <View style={styles.shareRow}>
          {isAuthenticated && (
            <Button
              title={sharing ? 'Sharing...' : 'Share Wishlist'}
              variant="outline"
              onPress={handleShare}
              disabled={sharing}
              style={styles.shareBtn}
            />
          )}
          {wishlistProducts.length > 1 && (
            <Button
              title="Compare"
              variant="outline"
              onPress={() => navigation.navigate('Compare')}
              style={styles.shareBtn}
            />
          )}
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
      ) : wishlistProducts.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="title" style={styles.emptyTitle}>
            {isAuthenticated ? 'Nothing saved yet' : 'Sign in to save'}
          </AppText>
          <AppText variant="caption" style={styles.emptyBody}>
            {isAuthenticated
              ? 'Save products from Discover to track prices and verdicts here.'
              : 'Sign in to save products and sync your wishlist across your devices.'}
          </AppText>
          <Button
            title={isAuthenticated ? 'Browse Discover' : 'Sign in'}
            onPress={() =>
              isAuthenticated
                ? navigation.navigate('Discover')
                : navigation.navigate('Login')
            }
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <FlashList
          data={wishlistProducts}
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

      <Modal
        visible={occasionTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOccasionTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOccasionTarget(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <AppText variant="bodySemibold" style={styles.modalTitle}>
              Gift occasion
            </AppText>
            <View style={styles.occasionOptions}>
              {OCCASIONS.map((occ) => {
                const selected = activeOccasion === occ;
                return (
                  <Pressable
                    key={occ}
                    onPress={() => handleSetOccasion(occ)}
                    style={[styles.occasionOption, selected && styles.occasionOptionSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <AppText
                      variant="caption"
                      style={[
                        styles.occasionOptionText,
                        selected && styles.occasionOptionTextSelected,
                      ]}
                    >
                      {occ}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {activeOccasion ? (
              <Pressable
                onPress={() => handleSetOccasion(null)}
                style={styles.occasionClear}
                accessibilityRole="button"
              >
                <AppText variant="caption" style={styles.occasionClearText}>
                  Clear occasion
                </AppText>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
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
    dashboard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dashStat: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    dashValue: {
      color: colors.brandEnd,
      fontSize: 22,
    },
    dashLabel: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
    dashDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: colors.border,
    },
    droppedNote: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      color: colors.success,
    },
    shareRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    shareBtn: {
      flex: 1,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    occasionBtn: {
      paddingVertical: spacing.xs,
      paddingRight: spacing.sm,
    },
    occasionTag: {
      color: colors.brandEnd,
    },
    occasionPlaceholder: {
      color: colors.textSecondary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    modalTitle: {
      color: colors.text,
    },
    occasionOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    occasionOption: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    occasionOptionSelected: {
      borderColor: colors.brandEnd,
      backgroundColor: colors.brandEnd,
    },
    occasionOptionText: {
      color: colors.text,
    },
    occasionOptionTextSelected: {
      color: colors.white,
    },
    occasionClear: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
    occasionClearText: {
      color: colors.error,
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
