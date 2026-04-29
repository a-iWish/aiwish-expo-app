import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../types/product';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize } from '../styles/theme';
import { RecommendationBadge } from './RecommendationBadge';
import { percentChangeVsReference } from '../utils/priceChangePercent';

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

  const rec = product.recommendation?.toUpperCase() ?? null;
  const isBuy = rec === 'BUY';
  const isWait = rec === 'WAIT';

  const referencePrice = product.msrp ?? product.original_price ?? null;
  const discountPct =
    product.trusted_price != null
      ? percentChangeVsReference(product.trusted_price, referencePrice)
      : null;

  const containerStyle = [
    styles.container,
    isBuy && styles.containerBuy,
    isWait && styles.containerWait,
    selected && { borderColor: colors.brandEnd, borderWidth: 2 },
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={() => onPress(product)}
      activeOpacity={0.8}
    >
      <View style={styles.inner}>
        {/* Product image */}
        <View style={styles.imgWrap}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.imgPlaceholder}>📦</Text>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.topLine}>
            <Text style={styles.retailer} numberOfLines={1}>
              {product.trusted_source ?? product.retailer ?? 'Trusted retailer'}
            </Text>
            <RecommendationBadge
              recommendation={product.recommendation ?? null}
              confidence={product.confidence ?? null}
              size="small"
            />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          </View>

          {/* Prices row */}
          <View style={styles.pricesRow}>
            {product.trusted_price != null ? (
              <>
                <Text style={styles.price}>
                  ${product.trusted_price.toFixed(2)}
                </Text>
                {referencePrice != null && referencePrice !== product.trusted_price && (
                  <Text style={styles.origPrice}>
                    ${referencePrice.toFixed(2)}
                  </Text>
                )}
                {discountPct != null && discountPct < 0 && (
                  <View style={styles.discGreen}>
                    <Text style={styles.discGreenText}>
                    ↓{Math.abs(discountPct).toFixed(1)}%
                    </Text>
                  </View>
                )}
                {discountPct != null && discountPct > 0 && (
                  <View style={styles.discRed}>
                    <Text style={styles.discRedText}>
                      ↑{Math.abs(discountPct).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.noPrice}>No trusted price</Text>
            )}
          </View>

          {/* Bottom row: badge + rating */}
          <View style={styles.bottomRow}>
            <Text style={styles.detailHint}>View price details</Text>
            {product.rating != null && (
              <View style={styles.ratingPill}>
                <Text style={styles.rating}>★ {product.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBg,
      borderRadius: borderRadius.card,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      position: 'relative',
      shadowColor: '#17151C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 1,
    },
    containerBuy: {
      borderColor: colors.successBorder,
    },
    containerWait: {
      borderColor: colors.warningBorder,
    },
    cornerGlow: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 100,
      height: 100,
      borderTopRightRadius: borderRadius.card,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 14,
      gap: 14,
    },
    imgWrap: {
      width: 84,
      height: 84,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imgPlaceholder: {
      fontSize: 30,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing.sm,
    },
    titleBlock: {
      gap: 3,
    },
    topLine: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'space-between',
    },
    retailer: {
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0,
      color: colors.textMuted,
      textTransform: 'uppercase',
    },
    name: {
      fontSize: fontSize.md + 1,
      fontWeight: '800',
      letterSpacing: 0,
      color: colors.text,
      lineHeight: 21,
    },
    pricesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 1,
    },
    price: {
      fontSize: 21,
      fontWeight: '900',
      letterSpacing: 0,
      color: colors.text,
    },
    origPrice: {
      fontSize: fontSize.sm,
      color: colors.textSoft,
      textDecorationLine: 'line-through',
    },
    discGreen: {
      backgroundColor: colors.successBg,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
    },
    discGreenText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.success,
      letterSpacing: 0,
    },
    discRed: {
      backgroundColor: 'rgba(248,113,113,0.12)',
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
    },
    discRedText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#f87171',
      letterSpacing: 0,
    },
    noPrice: {
      fontSize: fontSize.sm,
      color: colors.textSoft,
      fontStyle: 'italic',
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingTop: 1,
    },
    detailHint: {
      color: colors.textSoft,
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0,
    },
    ratingPill: {
      backgroundColor: colors.warningBg,
      borderColor: colors.warningBorder,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    rating: {
      fontSize: 12,
      color: colors.warning,
      fontWeight: '700',
      letterSpacing: 0,
    },
  });
