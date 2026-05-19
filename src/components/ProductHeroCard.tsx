import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ProductDetail } from '../types/product';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius } from '../styles/theme';
import { AppText } from './AppText';

interface ProductHeroCardProps {
  product: ProductDetail;
  price: number | null;
  retailer: string;
  category?: string;
}

export const ProductHeroCard: React.FC<ProductHeroCardProps> = ({
  product,
  price,
  retailer,
  category,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.placeholder}>
            <AppText variant="meta">Product</AppText>
          </View>
        )}
      </View>

      <View style={styles.copy}>
        {category ? (
          <AppText variant="meta" style={styles.category}>
            {category}
          </AppText>
        ) : null}
        <AppText variant="bodySemibold" style={styles.name}>
          {product.name}
        </AppText>
        {price != null && (
          <AppText variant="price" style={styles.price}>
            ${price.toFixed(2)}
          </AppText>
        )}
        <View style={styles.metaRow}>
          <AppText variant="meta" style={styles.retailer}>
            {retailer}
          </AppText>
          {product.stats?.is_lowest_90d && (
            <AppText variant="caption" style={styles.badge}>
              Lowest in 90 days
            </AppText>
          )}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    imageWrap: {
      width: '100%',
      height: 200,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    category: {
      textTransform: 'uppercase',
    },
    name: {
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.35,
    },
    price: {
      marginTop: spacing.xs,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    retailer: {
      textTransform: 'uppercase',
    },
    badge: {
      color: colors.success,
    },
  });
