import React, { useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { AppText } from './AppText';
import { BrandWordmark } from './BrandWordmark';
import { AccountButton } from './AccountButton';
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
  const { colors, isDark } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <Image
            source={
              isDark
                ? require('../../assets/aiwish-logo-transparent-dark.png')
                : require('../../assets/aiwish-logo-transparent-light.png')
            }
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <BrandWordmark textStyle={styles.wordmark} iwishColor={colors.brandEnd} />
        </View>
        <AccountButton />
      </View>

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
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    brandLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logo: {
      width: 32,
      height: 32,
    },
    wordmark: {
      fontSize: 20,
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
