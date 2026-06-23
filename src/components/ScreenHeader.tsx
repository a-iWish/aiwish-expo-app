import React, { useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { AppText } from './AppText';
import { BrandWordmark } from './BrandWordmark';
import { AccountButton } from './AccountButton';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firstName } from '../utils/userName';
import { ThemeColors, spacing } from '../styles/theme';

interface ScreenHeaderProps {
  title: string;
  showBrand?: boolean;
  subtitle?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBrand = false,
  subtitle,
}) => {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {showBrand ? (
          <View style={styles.brandRow}>
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
        ) : (
          <View style={styles.flexSpacer} />
        )}
        <AccountButton />
      </View>

      {isAuthenticated && (
        <AppText variant="meta" style={styles.greeting}>
          Welcome back, {firstName(user?.full_name, user?.email)}
        </AppText>
      )}

      <AppText variant="displayList" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
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
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    flexSpacer: {
      flex: 1,
    },
    brandRow: {
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
    },
    greeting: {
      color: colors.brandEnd,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 34,
      letterSpacing: -1,
    },
    subtitle: {
      marginTop: spacing.xs,
    },
  });
