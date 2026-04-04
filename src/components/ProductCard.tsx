import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../types/product';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize } from '../styles/theme';
import { RecommendationBadge } from './RecommendationBadge';
import { PriceDisplay } from './PriceDisplay';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  selected?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  selected = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selected]}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: product.thumbnail }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.source}>{product.source}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <PriceDisplay
          currentPrice={product.extracted_price}
          oldPrice={product.extracted_old_price}
          changePercentage={product.price_change_percentage}
          size="small"
        />
        <View style={styles.bottomRow}>
          <RecommendationBadge
            recommendation={product.recommendation}
            confidence={product.recommendation_confidence}
            size="small"
          />
          <Text style={styles.rating}>
            {'★'} {product.rating}
          </Text>
        </View>
      </View>
      {selected && <View style={styles.checkmark}><Text style={styles.checkmarkText}>✓</Text></View>}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selected: {
      borderColor: colors.primary,
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.surfaceLight,
    },
    info: {
      flex: 1,
      marginLeft: spacing.md,
      justifyContent: 'space-between',
    },
    source: {
      fontSize: fontSize.xs,
      color: colors.primary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: fontSize.sm,
      color: colors.textPrimary,
      fontWeight: '500',
      marginVertical: spacing.xs,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    rating: {
      fontSize: fontSize.xs,
      color: colors.warning,
      fontWeight: '600',
    },
    checkmark: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
