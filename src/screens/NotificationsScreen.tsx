import React, { useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AppText } from '../components';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { AppNotification } from '../types/notification';
import { ThemeColors, spacing, MIN_TOUCH } from '../styles/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notifications'>;
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  buy_signal: 'trending-down',
  price_drop: 'pricetag',
  test: 'flask',
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { notifications, unreadCount, markRead } = useNotifications();

  // Everything visible counts as seen: clear the unread state on open.
  useEffect(() => {
    if (unreadCount > 0) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);

  const renderItem = ({ item }: { item: AppNotification }) => {
    const unread = item.read_at === null;
    return (
      <Pressable
        style={[styles.card, unread && styles.cardUnread]}
        disabled={!item.product_id}
        onPress={() =>
          item.product_id &&
          navigation.navigate('ProductDetail', { productId: item.product_id })
        }
        accessibilityRole="button"
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={TYPE_ICONS[item.type] ?? 'notifications'}
            size={18}
            color={colors.brandEnd}
          />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <AppText variant="bodySemibold" style={styles.cardTitle}>
              {item.title}
            </AppText>
            {unread && <View style={styles.unreadDot} />}
          </View>
          <AppText variant="caption" style={styles.cardText}>
            {item.body}
          </AppText>
          <AppText variant="meta" style={styles.cardTime}>
            {timeAgo(item.created_at)}
          </AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="displayList" style={styles.title}>
          Notifications
        </AppText>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="notifications-off-outline"
              size={40}
              color={colors.textSoft}
            />
            <AppText variant="caption" style={styles.emptyText}>
              Nothing yet — we'll let you know when it's the right moment to
              buy something on your wishlist.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backButton: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      letterSpacing: -0.8,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    card: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardUnread: {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.brandEnd,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.neutralBg,
    },
    cardBody: {
      flex: 1,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    cardTitle: {
      flexShrink: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.secondary,
    },
    cardText: {
      marginTop: 2,
    },
    cardTime: {
      marginTop: spacing.xs,
      color: colors.textSoft,
    },
    empty: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.xl * 2,
      paddingHorizontal: spacing.lg,
    },
    emptyText: {
      textAlign: 'center',
    },
  });
