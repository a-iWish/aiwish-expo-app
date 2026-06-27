import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../navigation/types';
import { SharedWishlistItem } from '../types/product';
import { getSharedWishlist, markBought } from '../services/api';
import { AppText, Button } from '../components';
import { RecommendationBadge } from '../components/RecommendationBadge';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SharedWishlist'>;

const SharedItem = React.memo(function SharedItem({
  item,
  giftMode,
  onMarkBought,
  markingId,
  colors,
}: {
  item: SharedWishlistItem;
  giftMode: boolean;
  onMarkBought: (productId: string) => void;
  markingId: string | null;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createItemStyles(colors), [colors]);
  const isClaimed = item.marked_bought_by != null;
  const isMarking = markingId === item.product_id;

  return (
    <View style={[styles.card, isClaimed && styles.cardClaimed]}>
      <View style={styles.row}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.thumb}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        <View style={styles.info}>
          <AppText variant="bodySemibold" numberOfLines={2} style={isClaimed ? styles.claimedText : undefined}>
            {item.name}
          </AppText>
          {item.category ? (
            <AppText variant="meta" style={styles.category}>
              {item.category}
            </AppText>
          ) : null}
          {item.occasion ? (
            <AppText variant="caption" style={styles.occasion}>
              {item.occasion}
            </AppText>
          ) : null}
          <View style={styles.metaRow}>
            {item.recommendation ? (
              <RecommendationBadge
                recommendation={item.recommendation}
                confidence={item.confidence ?? null}
                size="small"
              />
            ) : null}
            {!giftMode && item.current_price != null ? (
              <AppText variant="monoPrice" style={styles.price}>
                ${item.current_price.toFixed(2)}
              </AppText>
            ) : null}
          </View>
        </View>
      </View>

      {giftMode && (
        <View style={styles.actionRow}>
          {isClaimed ? (
            <AppText variant="caption" style={styles.claimedLabel}>
              Already claimed
            </AppText>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.markBtn,
                pressed && styles.markBtnPressed,
              ]}
              onPress={() => onMarkBought(item.product_id)}
              disabled={isMarking}
            >
              {isMarking ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <AppText variant="bodySemibold" style={styles.markBtnText}>
                  Mark as Bought
                </AppText>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
});

export const SharedWishlistScreen: React.FC<Props> = ({ route, navigation }) => {
  const { token } = route.params;
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Gift mode is on by default in shared view
  const [giftMode, setGiftMode] = useState(true);

  const queryKey = ['shared-wishlist', token, giftMode] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getSharedWishlist(token, giftMode),
  });

  const markMutation = useMutation({
    mutationFn: (productId: string) => markBought(token, productId),
    onMutate: (productId) => setMarkingId(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-wishlist', token] });
      Alert.alert('Done', 'Item marked as bought.');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message || 'Could not mark item.');
    },
    onSettled: () => setMarkingId(null),
  });

  const handleMarkBought = useCallback(
    (productId: string) => {
      if (!isAuthenticated) {
        navigation.navigate('Login');
        return;
      }
      markMutation.mutate(productId);
    },
    [isAuthenticated, markMutation, navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: SharedWishlistItem }) => (
      <SharedItem
        item={item}
        giftMode={giftMode}
        onMarkBought={handleMarkBought}
        markingId={markingId}
        colors={colors}
      />
    ),
    [giftMode, handleMarkBought, markingId, colors],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <AppText variant="body" style={{ color: colors.brandEnd }}>
            Back
          </AppText>
        </Pressable>
        <AppText variant="title" style={styles.headerTitle} numberOfLines={1}>
          {data ? `${data.owner_name}'s Wishlist` : 'Shared Wishlist'}
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeChip, giftMode && styles.modeChipActive]}
          onPress={() => setGiftMode(true)}
        >
          <AppText
            variant="meta"
            style={giftMode ? styles.modeTextActive : styles.modeText}
          >
            Gift Mode
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.modeChip, !giftMode && styles.modeChipActive]}
          onPress={() => setGiftMode(false)}
        >
          <AppText
            variant="meta"
            style={!giftMode ? styles.modeTextActive : styles.modeText}
          >
            Browse
          </AppText>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandEnd} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AppText variant="body" style={{ color: colors.error }}>
            {(error as Error).message || 'Could not load wishlist'}
          </AppText>
        </View>
      ) : data && data.items.length === 0 ? (
        <View style={styles.centered}>
          <AppText variant="title">No public items</AppText>
          <AppText variant="caption" style={{ marginTop: spacing.sm }}>
            This wishlist has no public items to show.
          </AppText>
        </View>
      ) : (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(item) => item.product_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    modeRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    modeChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 44,
      justifyContent: 'center',
    },
    modeChipActive: {
      backgroundColor: colors.brandEnd,
      borderColor: colors.brandEnd,
    },
    modeText: {
      color: colors.textSecondary,
    },
    modeTextActive: {
      color: colors.white,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
    },
  });

const createItemStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: borderRadius.card,
      padding: spacing.md,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardClaimed: {
      opacity: 0.5,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.sm,
    },
    thumbPlaceholder: {
      backgroundColor: colors.surface2,
    },
    info: {
      flex: 1,
      gap: spacing.xs,
    },
    category: {
      color: colors.textSoft,
    },
    occasion: {
      color: colors.brandEnd,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    price: {
      color: colors.text,
    },
    claimedText: {
      color: colors.textSoft,
    },
    actionRow: {
      marginTop: spacing.sm,
      alignItems: 'flex-start',
    },
    markBtn: {
      backgroundColor: colors.brandEnd,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.button,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    markBtnPressed: {
      opacity: 0.8,
    },
    markBtnText: {
      color: colors.white,
    },
    claimedLabel: {
      color: colors.textSoft,
      fontStyle: 'italic',
    },
  });
