import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, fontSize } from '../styles/theme';

interface PriceDisplayProps {
  currentPrice: number | null;
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

  if (currentPrice == null) {
    return (
      <View style={styles.container}>
        <Text style={[styles.currentPrice, isLarge && styles.currentPriceLarge, { color: colors.textMuted }]}>
          Price unavailable
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.currentPrice, isLarge && styles.currentPriceLarge]}>
        ${currentPrice.toFixed(2)}
      </Text>
      {oldPrice != null && oldPrice !== currentPrice && (
        <Text style={[styles.oldPrice, isLarge && styles.oldPriceLarge]}>
          ${oldPrice.toFixed(2)}
        </Text>
      )}
      {changePercentage != null && changePercentage !== 0 && (
        <View
          style={[
            styles.changeBadge,
            changePercentage < 0 ? styles.changeDown : styles.changeUp,
          ]}
        >
          <Text
            style={[
              styles.changeText,
              { color: changePercentage < 0 ? colors.success : colors.error },
            ]}
          >
            {changePercentage < 0 ? '↓' : '↑'}{Math.abs(changePercentage).toFixed(0)}%
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
      gap: 6,
    },
    currentPrice: {
      fontSize: fontSize.md,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: colors.textPrimary,
    },
    currentPriceLarge: {
      fontSize: fontSize.xxl,
      letterSpacing: -1,
    },
    oldPrice: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    oldPriceLarge: {
      fontSize: fontSize.md,
    },
    changeBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 100,
    },
    changeDown: {
      backgroundColor: 'rgba(110,231,183,0.12)',
    },
    changeUp: {
      backgroundColor: 'rgba(248,113,113,0.12)',
    },
    changeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
