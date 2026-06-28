import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { FriendWishItem } from '../types/product';
import {
  followUser,
  unfollowUser,
  fetchFollowing,
  fetchFriendsWishes,
} from '../services/api';
import { AppText, Button } from '../components';
import { ScreenHeader } from '../components/ScreenHeader';
import { RecommendationBadge } from '../components/RecommendationBadge';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Friends'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

const FOLLOWING_KEY = ['social', 'following'] as const;
const WISHES_KEY = ['social', 'friends-wishes'] as const;

const WishRow = React.memo(function WishRow({
  item,
  colors,
  onPress,
}: {
  item: FriendWishItem;
  colors: ThemeColors;
  onPress: (productId: string) => void;
}) {
  const styles = useMemo(() => createItemStyles(colors), [colors]);
  return (
    <Pressable style={styles.card} onPress={() => onPress(item.product_id)}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.thumb} resizeMode="contain" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.info}>
        <AppText variant="meta" style={styles.owner}>
          {item.owner_name || 'A friend'}
          {item.occasion ? ` \u00b7 ${item.occasion}` : ''}
        </AppText>
        <AppText variant="bodySemibold" numberOfLines={2}>
          {item.name}
        </AppText>
        <View style={styles.metaRow}>
          {item.recommendation ? (
            <RecommendationBadge recommendation={item.recommendation} confidence={null} size="small" />
          ) : null}
          {item.current_price != null ? (
            <AppText variant="monoPrice" style={styles.price}>
              ${item.current_price.toFixed(2)}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

export const FriendsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');

  const followingQuery = useQuery({
    queryKey: FOLLOWING_KEY,
    queryFn: fetchFollowing,
    enabled: isAuthenticated,
  });
  const wishesQuery = useQuery({
    queryKey: WISHES_KEY,
    queryFn: fetchFriendsWishes,
    enabled: isAuthenticated,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: FOLLOWING_KEY });
    queryClient.invalidateQueries({ queryKey: WISHES_KEY });
  }, [queryClient]);

  const followMutation = useMutation({
    mutationFn: (e: string) => followUser(e),
    onSuccess: () => {
      setEmail('');
      invalidate();
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not follow'),
  });

  const unfollowMutation = useMutation({
    mutationFn: (id: string) => unfollowUser(id),
    onSuccess: invalidate,
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not unfollow'),
  });

  const handleFollow = useCallback(() => {
    const trimmed = email.trim();
    if (!trimmed) return;
    followMutation.mutate(trimmed);
  }, [email, followMutation]);

  const handleOpenProduct = useCallback(
    (productId: string) => navigation.navigate('ProductDetail', { productId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: FriendWishItem }) => (
      <WishRow item={item} colors={colors} onPress={handleOpenProduct} />
    ),
    [colors, handleOpenProduct],
  );

  const following = followingQuery.data?.following ?? [];
  const wishes = wishesQuery.data?.items ?? [];

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Friends" subtitle="see what friends are saving" showBrand />
        <View style={styles.empty}>
          <AppText variant="title" style={styles.emptyTitle}>
            Sign in to connect
          </AppText>
          <AppText variant="caption" style={styles.emptyBody}>
            Sign in to follow friends and see what they're wishing for.
          </AppText>
          <Button
            title="Sign in"
            onPress={() => navigation.navigate('Login')}
            style={styles.emptyBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Friends" subtitle="see what friends are saving" showBrand />

      <View style={styles.followRow}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Follow by email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <Button
          title={followMutation.isPending ? '...' : 'Follow'}
          onPress={handleFollow}
          disabled={followMutation.isPending || email.trim().length === 0}
          style={styles.followBtn}
        />
      </View>

      {following.length > 0 && (
        <View style={styles.chips}>
          {following.map((u) => (
            <Pressable
              key={u.id}
              style={styles.chip}
              hitSlop={8}
              onPress={() =>
                Alert.alert('Unfollow', `Stop following ${u.full_name || u.email}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Unfollow', style: 'destructive', onPress: () => unfollowMutation.mutate(u.id) },
                ])
              }
            >
              <AppText variant="caption" style={styles.chipText}>
                {u.full_name || u.email} {'\u00d7'}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      {wishesQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandEnd} />
        </View>
      ) : wishes.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="title" style={styles.emptyTitle}>
            No friends' wishes yet
          </AppText>
          <AppText variant="caption" style={styles.emptyBody}>
            Follow someone by email to see the public items on their wishlist.
          </AppText>
        </View>
      ) : (
        <FlashList
          data={wishes}
          keyExtractor={(item) => `${item.owner_id}-${item.product_id}`}
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
    followRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    input: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    followBtn: {
      minWidth: 90,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    chipText: {
      color: colors.textSecondary,
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
    listContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
    },
  });

const createItemStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: colors.cardBg,
      borderRadius: borderRadius.card,
      padding: spacing.md,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
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
    owner: {
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
  });
