import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { BrandBar } from './BrandBar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firstName } from '../utils/userName';
import { ThemeColors, spacing } from '../styles/theme';

interface ScreenHeaderProps {
  title: string;
  /** Kept for API compatibility; the brand bar always shows now. */
  showBrand?: boolean;
  subtitle?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle }) => {
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <BrandBar />

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
    greeting: {
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
