import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
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
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Settings" />

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

      <View style={styles.section}>
        <AppText variant="meta" style={styles.sectionLabel}>
          About
        </AppText>
        <View style={styles.listGroup}>
          <View style={styles.row}>
            <AppText variant="body">Version</AppText>
            <AppText variant="caption">{APP_VERSION}</AppText>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <AppText variant="body">AI model</AppText>
            <AppText variant="caption">RF + XGBoost ensemble</AppText>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <AppText variant="body">Products tracked</AppText>
            <AppText variant="caption">80</AppText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
  });
