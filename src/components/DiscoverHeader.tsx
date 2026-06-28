import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { BrandBar } from './BrandBar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firstName } from '../utils/userName';
import { ThemeColors, spacing, DISPLAY_FONT } from '../styles/theme';

interface DiscoverHeaderProps {
  productCount: number;
  filteredCount: number;
}

export const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({
  productCount,
  filteredCount,
}) => {
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <BrandBar />

      <AppText variant="meta" style={styles.eyebrow}>
        {isAuthenticated
          ? `Welcome back, ${firstName(user?.full_name, user?.email)}`
          : 'Discover'}
      </AppText>
      <AppText style={styles.title}>Right moment to buy</AppText>
      <AppText variant="caption" style={styles.subtitle}>
        ai picks the right moment to buy
      </AppText>
      <AppText variant="meta" style={styles.count}>
        {filteredCount} of {productCount} products
      </AppText>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      backgroundColor: colors.headerBg,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    brandLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logo: {
      width: 36,
      height: 36,
    },
    wordmark: {
      fontSize: 22,
      letterSpacing: -0.6,
    },
    eyebrow: {
      marginBottom: spacing.xs,
    },
    title: {
      fontFamily: DISPLAY_FONT,
      fontSize: 32,
      lineHeight: 36,
      letterSpacing: -1.2,
      color: colors.text,
    },
    subtitle: {
      marginTop: spacing.xs,
      textTransform: 'none',
      letterSpacing: 0,
    },
    count: {
      marginTop: spacing.md,
      textTransform: 'none',
      letterSpacing: 0.2,
      color: colors.textSecondary,
    },
  });
