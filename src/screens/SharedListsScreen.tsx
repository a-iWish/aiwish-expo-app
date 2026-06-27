import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../navigation/types';
import { SharedListSummary } from '../types/product';
import { createSharedList, joinSharedList, fetchSharedLists } from '../services/api';
import { AppText, Button } from '../components';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SharedLists'>;

export const SHARED_LISTS_KEY = ['lists', 'mine'] as const;

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
          {item.occasion ? `${item.occasion} \u00b7 ` : ''}
          {item.member_count} {item.member_count === 1 ? 'member' : 'members'} {'\u00b7'}{' '}
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

export const SharedListsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const listsQuery = useQuery({ queryKey: SHARED_LISTS_KEY, queryFn: fetchSharedLists });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SHARED_LISTS_KEY });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (n: string) => createSharedList(n),
    onSuccess: (summary) => {
      setName('');
      invalidate();
      navigation.navigate('SharedListDetail', { listId: summary.id });
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not create list'),
  });

  const joinMutation = useMutation({
    mutationFn: (c: string) => joinSharedList(c),
    onSuccess: (summary) => {
      setCode('');
      invalidate();
      navigation.navigate('SharedListDetail', { listId: summary.id });
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

  const handleOpen = useCallback(
    (listId: string) => navigation.navigate('SharedListDetail', { listId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: SharedListSummary }) => (
      <ListRow item={item} colors={colors} onPress={handleOpen} />
    ),
    [colors, handleOpen],
  );

  const lists = listsQuery.data?.lists ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <AppText variant="body" style={{ color: colors.brandEnd }}>
            Back
          </AppText>
        </Pressable>
        <AppText variant="title" style={styles.headerTitle}>
          Shared Lists
        </AppText>
        <View style={styles.backBtn} />
      </View>

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
        <View style={styles.centered}>
          <AppText variant="title">No shared lists yet</AppText>
          <AppText variant="caption" style={styles.emptyBody}>
            Create a list for a group gift or shared household, then share the
            invite code so others can add items too.
          </AppText>
        </View>
      ) : (
        <FlashList
          data={lists}
          keyExtractor={(item) => item.id}
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
