import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, fontSize } from '../styles/theme';

interface PriceDisplayProps {
  currentPrice: number;
  oldPrice: number | null;
  changePercentage: number | null;
  size?: 'small' | 'large';
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  currentPrice,
  oldPrice,
  changePercentage,
  size = 'small',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isLarge = size === 'large';

  return (
    <View style={styles.container}>
      <Text style={[styles.currentPrice, isLarge && styles.currentPriceLarge]}>
        ${currentPrice.toFixed(2)}
      </Text>
      {oldPrice && oldPrice !== currentPrice && (
        <Text style={[styles.oldPrice, isLarge && styles.oldPriceLarge]}>
          ${oldPrice.toFixed(2)}
        </Text>
      )}
      {changePercentage !== null && changePercentage !== 0 && (
        <View
          style={[
            styles.changeBadge,
            changePercentage < 0 ? styles.changeDown : styles.changeUp,
          ]}
        >
          <Text style={[styles.changeText, { color: changePercentage < 0 ? colors.success : colors.error }]}>
            {changePercentage > 0 ? '+' : ''}
            {changePercentage.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    currentPrice: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    currentPriceLarge: {
      fontSize: fontSize.xxl,
    },
    oldPrice: {
      marginLeft: spacing.sm,
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    oldPriceLarge: {
      fontSize: fontSize.lg,
    },
    changeBadge: {
      marginLeft: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 20,
    },
    changeDown: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    changeUp: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    changeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
  });
