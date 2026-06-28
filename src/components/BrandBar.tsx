import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { BrandWordmark } from './BrandWordmark';
import { AccountButton } from './AccountButton';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing } from '../styles/theme';

/**
 * The brand + account row shared by every top-level screen header so the logo
 * and the account avatar sit in the exact same place across tabs.
 */
export const BrandBar: React.FC = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
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
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    left: {
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
  });
