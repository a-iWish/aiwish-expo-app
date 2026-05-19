import React, { useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { AppText } from './AppText';
import { BrandWordmark } from './BrandWordmark';
import { useTheme } from '../context/ThemeContext';
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
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      {showBrand && (
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
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    logo: {
      width: 36,
      height: 36,
    },
    wordmark: {
      fontSize: 22,
    },
    title: {
      fontSize: 34,
      letterSpacing: -1,
    },
    subtitle: {
      marginTop: spacing.xs,
    },
  });
