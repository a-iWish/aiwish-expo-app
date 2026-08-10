import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../navigation/types';
import { Product, SharedListItem } from '../types/product';
import {
  fetchSharedListDetail,
  addSharedListItem,
  removeSharedListItem,
  claimSharedListItem,
  leaveSharedList,
} from '../services/api';
import { useProducts, useProductSearch } from '../hooks/useProducts';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';
import { AppText, Button } from '../components';
import { RecommendationBadge } from '../components/RecommendationBadge';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';
import { SHARED_LISTS_KEY } from '../components/SharedListsPanel';

type Props = NativeStackScreenProps<RootStackParamList, 'SharedListDetail'>;

export const SharedListDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { listId } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { products } = useProducts();
  const { ids: wishlistIds } = useWishlist();

  const detailKey = useMemo(() => ['lists', 'detail', listId] as const, [listId]);
  const detailQuery = useQuery({
    queryKey: detailKey,
    queryFn: () => fetchSharedListDetail(listId),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: detailKey });
    queryClient.invalidateQueries({ queryKey: SHARED_LISTS_KEY });
  }, [queryClient, detailKey]);

  const addMutation = useMutation({
    mutationFn: (productId: string) => addSharedListItem(listId, productId),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not add item'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeSharedListItem(listId, productId),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not remove item'),
  });

  const claimMutation = useMutation({
    mutationFn: ({ productId, claim }: { productId: string; claim: boolean }) =>
      claimSharedListItem(listId, productId, claim),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not update claim'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveSharedList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARED_LISTS_KEY });
      navigation.goBack();
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not leave list'),
  });

  const detail = detailQuery.data;
  const isOwner = detail?.role === 'owner';

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await detailQuery.refetch();
    setRefreshing(false);
  }, [detailQuery]);

  const handleShareCode = useCallback(() => {
    if (!detail) return;
    Share.share({
      message: `Join my "${detail.name}" list on a.iwish with invite code ${detail.invite_code}`,
    });
  }, [detail]);

  const handleLeave = useCallback(() => {
    Alert.alert(
      isOwner ? 'Delete list' : 'Leave list',
      isOwner
        ? 'You own this list — leaving deletes it for everyone. Continue?'
        : 'Stop collaborating on this list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isOwner ? 'Delete' : 'Leave',
          style: 'destructive',
          onPress: () => leaveMutation.mutate(),
        },
      ],
    );
  }, [isOwner, leaveMutation]);

  // Wishlist products not already on the shared list — candidates to add.
  const existingProductIds = useMemo(
    () => new Set((detail?.items ?? []).map((it) => it.product_id)),
    [detail],
  );
  const addable = useMemo(() => {
    const watched = new Set(wishlistIds);
    return products.filter((p) => watched.has(p.id) && !existingProductIds.has(p.id));
  }, [products, wishlistIds, existingProductIds]);

  // Full-catalog search so any product can be added, not just wishlist items.
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);
  const { results: searchResults, searching, active: searchActive } =
    useProductSearch(debouncedSearch);
  const searchCandidates = useMemo(
    () => searchResults.filter((p) => !existingProductIds.has(p.id)).slice(0, 8),
    [searchResults, existingProductIds],
  );

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandEnd} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <AppText variant="title">List unavailable</AppText>
          <Button title="Back" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <AppText variant="body" style={{ color: colors.brandEnd }}>
            Back
          </AppText>
        </Pressable>
        <AppText variant="title" style={styles.headerTitle} numberOfLines={1}>
          {detail.name}
        </AppText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandEnd}
          />
        }
      >
        <View style={styles.inviteCard}>
          <View style={{ flex: 1 }}>
            <AppText variant="meta" style={styles.inviteLabel}>
              Invite code
            </AppText>
            <AppText variant="title" style={styles.inviteCode}>
              {detail.invite_code}
            </AppText>
          </View>
          <Button title="Share" onPress={handleShareCode} style={styles.shareBtn} />
        </View>

        <AppText variant="meta" style={styles.sectionLabel}>
          {detail.members.length} {detail.members.length === 1 ? 'member' : 'members'}
        </AppText>
        <View style={styles.memberRow}>
          {detail.members.map((m) => (
            <View key={m.user_id} style={styles.memberChip}>
              <AppText variant="caption" style={styles.memberText}>
                {m.full_name || m.email}
                {m.role === 'owner' ? ' \u2605' : ''}
              </AppText>
            </View>
          ))}
        </View>

        <AppText variant="meta" style={styles.sectionLabel}>
          Add products
        </AppText>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search the catalog…"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {searchActive &&
          (searching && searchCandidates.length === 0 ? (
            <ActivityIndicator color={colors.brandEnd} style={styles.searchLoading} />
          ) : searchCandidates.length === 0 ? (
            <AppText variant="caption" style={styles.emptyBody}>
              No matching products.
            </AppText>
          ) : (
            searchCandidates.map((p) => (
              <Pressable
                key={p.id}
                style={styles.resultRow}
                onPress={() => addMutation.mutate(p.id)}
              >
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.resultThumb} resizeMode="contain" />
                ) : (
                  <View style={[styles.resultThumb, styles.thumbPlaceholder]} />
                )}
                <AppText variant="bodySemibold" numberOfLines={2} style={styles.resultName}>
                  {p.name}
                </AppText>
                <AppText variant="caption" style={styles.addPlus}>
                  + Add
                </AppText>
              </Pressable>
            ))
          ))}

        {addable.length > 0 && (
          <>
            <AppText variant="meta" style={styles.sectionLabel}>
              Add from your wishlist
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.addRow}
            >
              {addable.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.addCard}
                  onPress={() => addMutation.mutate(p.id)}
                >
                  {p.image_url ? (
                    <Image source={{ uri: p.image_url }} style={styles.addThumb} resizeMode="contain" />
                  ) : (
                    <View style={[styles.addThumb, styles.thumbPlaceholder]} />
                  )}
                  <AppText variant="caption" numberOfLines={2} style={styles.addName}>
                    {p.name}
                  </AppText>
                  <AppText variant="caption" style={styles.addPlus}>
                    + Add
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <AppText variant="meta" style={styles.sectionLabel}>
          {detail.items.length} {detail.items.length === 1 ? 'item' : 'items'}
        </AppText>
        {detail.items.length === 0 ? (
          <AppText variant="caption" style={styles.emptyBody}>
            No items yet. Search the catalog or add from your wishlist above, or
            ask a member to add some.
          </AppText>
        ) : (
          detail.items.map((item) => (
            <ItemCard
              key={item.product_id}
              item={item}
              colors={colors}
              currentUserId={user?.id ?? null}
              onOpen={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
              onClaim={(claim) => claimMutation.mutate({ productId: item.product_id, claim })}
              onRemove={() => removeMutation.mutate(item.product_id)}
            />
          ))
        )}

        <Button
          title={isOwner ? 'Delete list' : 'Leave list'}
          onPress={handleLeave}
          variant="outline"
          style={styles.leaveBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const ItemCard = React.memo(function ItemCard({
  item,
  colors,
  currentUserId,
  onOpen,
  onClaim,
  onRemove,
}: {
  item: SharedListItem;
  colors: ThemeColors;
  currentUserId: string | null;
  onOpen: () => void;
  onClaim: (claim: boolean) => void;
  onRemove: () => void;
}) {
  const styles = useMemo(() => createItemStyles(colors), [colors]);
  const claimedByMe = !!item.claimed_by && item.claimed_by === currentUserId;
  const claimedByOther = !!item.claimed_by && item.claimed_by !== currentUserId;

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardMain} onPress={onOpen}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} resizeMode="contain" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        <View style={styles.info}>
          <AppText variant="bodySemibold" numberOfLines={2}>
            {item.name}
          </AppText>
          <View style={styles.metaRow}>
            {item.recommendation ? (
              <RecommendationBadge
                recommendation={item.recommendation}
                confidence={null}
                size="small"
              />
            ) : null}
            {item.current_price != null ? (
              <AppText variant="monoPrice" style={styles.price}>
                ${item.current_price.toFixed(2)}
              </AppText>
            ) : null}
          </View>
          {claimedByOther ? (
            <AppText variant="caption" style={styles.claimedOther}>
              Claimed by {item.claimed_by_name || 'a member'}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.actions}>
        {!claimedByOther && (
          <Pressable
            style={[styles.actionBtn, claimedByMe && styles.actionBtnActive]}
            onPress={() => onClaim(!claimedByMe)}
            hitSlop={6}
          >
            <AppText variant="caption" style={claimedByMe ? styles.actionActiveText : styles.actionText}>
              {claimedByMe ? 'Claimed' : 'Claim'}
            </AppText>
          </Pressable>
        )}
        <Pressable style={styles.actionBtn} onPress={onRemove} hitSlop={6}>
          <AppText variant="caption" style={styles.removeText}>
            Remove
          </AppText>
        </Pressable>
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.headerBg,
    },
    backBtn: { width: 60, minHeight: 44, justifyContent: 'center' },
    headerTitle: { flex: 1, textAlign: 'center' },
    scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.md,
    },
    inviteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.cardBg,
      borderRadius: borderRadius.card,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inviteLabel: { color: colors.textSecondary },
    inviteCode: { color: colors.brandEnd, letterSpacing: 2 },
    shareBtn: { minWidth: 90 },
    sectionLabel: {
      color: colors.textSecondary,
      marginTop: spacing.md,
      textTransform: 'uppercase',
    },
    memberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    memberChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    memberText: { color: colors.textSecondary },
    addRow: { gap: spacing.sm, paddingVertical: spacing.xs },
    addCard: {
      width: 110,
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    addThumb: { width: '100%', height: 70, borderRadius: borderRadius.sm },
    thumbPlaceholder: { backgroundColor: colors.surface2 },
    addName: { color: colors.text },
    addPlus: { color: colors.brandEnd },
    searchInput: {
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    searchLoading: { marginTop: spacing.md, alignSelf: 'flex-start' },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    resultThumb: { width: 44, height: 44, borderRadius: borderRadius.sm },
    resultName: { flex: 1, color: colors.text },
    emptyBody: { color: colors.textSecondary, maxWidth: 320 },
    leaveBtn: { marginTop: spacing.lg },
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
      gap: spacing.sm,
    },
    cardMain: { flexDirection: 'row', gap: spacing.md },
    thumb: { width: 56, height: 56, borderRadius: borderRadius.sm },
    thumbPlaceholder: { backgroundColor: colors.surface2 },
    info: { flex: 1, gap: spacing.xs },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    price: { color: colors.text },
    claimedOther: { color: colors.warning },
    actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
    actionBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.button,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 44,
      justifyContent: 'center',
    },
    actionBtnActive: { backgroundColor: colors.successBg, borderColor: colors.success },
    actionText: { color: colors.textSecondary },
    actionActiveText: { color: colors.success },
    removeText: { color: colors.textMuted },
  });
