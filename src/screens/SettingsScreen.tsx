import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors, spacing, MIN_TOUCH } from '../styles/theme';
import { ScreenHeader, AppText } from '../components';
import { AppearancePreference } from '../styles/theme';

const APP_VERSION = '1.0.0';

const APPEARANCE_OPTIONS: { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const SettingsScreen: React.FC = () => {
  const { colors, appearance, setAppearance } = useTheme();
  const { isAuthenticated, user, logout, resendVerification } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>(
    'idle',
  );

  const handleResend = async () => {
    if (resendState === 'sending') return;
    setResendState('sending');
    try {
      await resendVerification();
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  const initial = (user?.full_name || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Settings" showBrand />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.section}>
        <AppText variant="meta" style={styles.sectionLabel}>
          Account
        </AppText>
        {isAuthenticated ? (
          <View style={styles.listGroup}>
            <View style={styles.accountRow}>
              <View style={styles.avatar}>
                <AppText variant="bodySemibold" style={styles.avatarText}>
                  {initial}
                </AppText>
              </View>
              <View style={styles.accountInfo}>
                {!!user?.full_name && (
                  <AppText variant="bodySemibold" numberOfLines={1}>
                    {user.full_name}
                  </AppText>
                )}
                <AppText variant="caption" numberOfLines={1}>
                  {user?.email}
                </AppText>
              </View>
            </View>
            <View style={styles.divider} />
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('EditProfile')}
              accessibilityRole="button"
            >
              <AppText variant="body">Edit profile</AppText>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('ChangePassword')}
              accessibilityRole="button"
            >
              <AppText variant="body">Change password</AppText>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('SharedLists')}
              accessibilityRole="button"
            >
              <AppText variant="body">Shared Lists</AppText>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={styles.row}
              onPress={logout}
              accessibilityRole="button"
            >
              <AppText variant="body" style={{ color: colors.error }}>
                Log out
              </AppText>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.signInCard}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
          >
            <View style={styles.signInTextWrap}>
              <AppText variant="bodySemibold">Sign in or create account</AppText>
              <AppText variant="caption" style={styles.signInHint}>
                Sync your wishlist and price alerts across devices.
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}

        {isAuthenticated && user && !user.email_verified && (
          <View style={styles.verifyBanner}>
            <Ionicons
              name="mail-unread-outline"
              size={20}
              color={colors.warning}
            />
            <View style={styles.verifyTextWrap}>
              <AppText variant="bodySemibold">Verify your email</AppText>
              <AppText variant="caption" style={styles.verifyHint}>
                {resendState === 'sent'
                  ? 'Verification email sent. Check your inbox.'
                  : 'Confirm your email to secure your account.'}
              </AppText>
            </View>
            {resendState !== 'sent' && (
              <Pressable onPress={handleResend} hitSlop={8}>
                <AppText variant="bodySemibold" style={styles.verifyAction}>
                  {resendState === 'sending' ? 'Sending…' : 'Resend'}
                </AppText>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="meta" style={styles.sectionLabel}>
          Appearance
        </AppText>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((opt) => {
            const selected = appearance === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setAppearance(opt.value)}
                style={[styles.appearanceBtn, selected && styles.appearanceBtnActive]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <AppText
                  variant="bodySemibold"
                  style={[styles.appearanceText, selected && styles.appearanceTextActive]}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="caption" style={styles.appearanceHint}>
          Editorial light and dark themes tuned for verdict readability.
        </AppText>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
    },
    section: {
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
    },
    sectionLabel: {
      marginBottom: spacing.sm,
    },
    appearanceRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    appearanceBtn: {
      flex: 1,
      minHeight: MIN_TOUCH,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    appearanceBtnActive: {
      borderColor: colors.brandEnd,
      backgroundColor: colors.surfaceLight,
    },
    appearanceText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    appearanceTextActive: {
      color: colors.brandEnd,
    },
    appearanceHint: {
      marginTop: spacing.sm,
    },
    listGroup: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      minHeight: MIN_TOUCH,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.hairline,
      marginLeft: spacing.md,
    },
    signInCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: MIN_TOUCH,
    },
    signInTextWrap: {
      flex: 1,
      gap: 2,
    },
    verifyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.warning,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    verifyTextWrap: {
      flex: 1,
      gap: 2,
    },
    verifyHint: {
      maxWidth: 220,
    },
    verifyAction: {
      color: colors.brandEnd,
    },
    signInHint: {
      maxWidth: 260,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.brandEnd,
    },
    avatarText: {
      color: colors.brandEnd,
    },
    accountInfo: {
      flex: 1,
      gap: 2,
    },
  });
