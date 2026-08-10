import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SharedListSummary } from '../types/product';
import { createSharedList, joinSharedList, fetchSharedLists } from '../services/api';
import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';

export const SHARED_LISTS_KEY = ['lists', 'mine'] as const;

interface SharedListsPanelProps {
  /** Open a list's detail screen (create/join success + row tap). */
  onOpenList: (listId: string) => void;
}

const ListRow = React.memo(function ListRow({
  item,
  colors,
  onPress,
}: {
  item: SharedListSummary;
  colors: ThemeColors;
  onPress: (listId: string) => void;
}) {
  const styles = useMemo(() => createItemStyles(colors), [colors]);
  return (
    <Pressable style={styles.card} onPress={() => onPress(item.id)}>
      <View style={styles.info}>
        <AppText variant="bodySemibold" numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText variant="meta" style={styles.meta}>
          {item.occasion ? `${item.occasion} · ` : ''}
          {item.member_count} {item.member_count === 1 ? 'member' : 'members'} {'·'}{' '}
          {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
        </AppText>
      </View>
      <View style={styles.codePill}>
        <AppText variant="caption" style={styles.codeText}>
          {item.invite_code}
        </AppText>
      </View>
    </Pressable>
  );
});

/**
 * The Shared Lists content (create / join / list of lists), without any screen
 * chrome, so it can be embedded under the Wishlist tab's "Shared" segment.
 */
export const SharedListsPanel: React.FC<SharedListsPanelProps> = ({ onOpenList }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const listsQuery = useQuery({ queryKey: SHARED_LISTS_KEY, queryFn: fetchSharedLists });
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await listsQuery.refetch();
    setRefreshing(false);
  }, [listsQuery]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SHARED_LISTS_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (n: string) => createSharedList(n),
    onSuccess: (summary) => {
      setName('');
      invalidate();
      onOpenList(summary.id);
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not create list'),
  });

  const joinMutation = useMutation({
    mutationFn: (c: string) => joinSharedList(c),
    onSuccess: (summary) => {
      setCode('');
      invalidate();
      onOpenList(summary.id);
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not join list'),
  });

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }, [name, createMutation]);

  const handleJoin = useCallback(() => {
    const trimmed = code.trim();
    if (!trimmed) return;
    joinMutation.mutate(trimmed);
  }, [code, joinMutation]);

  const renderItem = useCallback(
    ({ item }: { item: SharedListSummary }) => (
      <ListRow item={item} colors={colors} onPress={onOpenList} />
    ),
    [colors, onOpenList],
  );

  const lists = listsQuery.data?.lists ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.actionRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New list name"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Button
          title={createMutation.isPending ? '...' : 'Create'}
          onPress={handleCreate}
          disabled={createMutation.isPending || name.trim().length === 0}
          style={styles.actionBtn}
        />
      </View>

      <View style={styles.actionRow}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Invite code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <Button
          title={joinMutation.isPending ? '...' : 'Join'}
          onPress={handleJoin}
          variant="outline"
          disabled={joinMutation.isPending || code.trim().length === 0}
          style={styles.actionBtn}
        />
      </View>

      {listsQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandEnd} />
        </View>
      ) : lists.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brandEnd}
            />
          }
        >
          <View style={styles.centered}>
            <AppText variant="title">No shared lists yet</AppText>
            <AppText variant="caption" style={styles.emptyBody}>
              Create a list for a group gift or shared household, then share the
              invite code so others can add items too.
            </AppText>
          </View>
        </ScrollView>
      ) : (
        <FlashList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
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
    actionBtn: { minWidth: 90 },
    emptyScroll: { flexGrow: 1 },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.sm,
    },
    emptyBody: { textAlign: 'center', maxWidth: 300 },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
    },
  });

const createItemStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.cardBg,
      borderRadius: borderRadius.card,
      padding: spacing.md,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    info: { flex: 1, gap: spacing.xs },
    meta: { color: colors.textSecondary },
    codePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface2,
    },
    codeText: { color: colors.brandEnd, letterSpacing: 1 },
  });
