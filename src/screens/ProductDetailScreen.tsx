import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { mockProducts } from '../data/mockProducts';
import {
  PriceDisplay,
  RecommendationBadge,
  RecommendationCard,
  PriceChart,
  InfoRow,
  Button,
} from '../components';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize } from '../styles/theme';

type Props = StackScreenProps<RootStackParamList, 'ProductDetail'>;

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { productId } = route.params;
  const product = mockProducts.find((p) => p.product_id === productId);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.thumbnail }} style={styles.image} />
        {product.price_change_percentage !== null &&
          product.price_change_percentage < 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {product.price_change_percentage.toFixed(0)}%
              </Text>
            </View>
          )}
      </View>

      {/* Product Info */}
      <View style={styles.section}>
        <Text style={styles.source}>{product.source}</Text>
        <Text style={styles.title}>{product.title}</Text>

        <View style={styles.priceRow}>
          <PriceDisplay
            currentPrice={product.extracted_price}
            oldPrice={product.extracted_old_price}
            changePercentage={product.price_change_percentage}
            size="large"
          />
        </View>

        <View style={styles.badgeRow}>
          <RecommendationBadge
            recommendation={product.recommendation}
            confidence={product.recommendation_confidence}
            size="large"
          />
        </View>
      </View>

      {/* ML Recommendation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recommendation</Text>
        <RecommendationCard product={product} />
      </View>

      {/* Price Chart */}
      <View style={styles.section}>
        <PriceChart priceHistory={product.price_history} />
      </View>

      {/* Product Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.detailsCard}>
          <InfoRow label="Category" value={product.category} icon="📦" />
          <InfoRow label="Retailer" value={product.source} icon="🏪" />
          <InfoRow
            label="Rating"
            value={`${product.rating} ★ (${product.reviews.toLocaleString()} reviews)`}
            icon="⭐"
          />
          <InfoRow label="Delivery" value={product.delivery} icon="🚚" />
          <InfoRow
            label="Position"
            value={`#${product.position} in search results`}
            icon="📊"
          />
          <InfoRow
            label="Data Points"
            value={`${product.price_history.length} price observations`}
            icon="📈"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Back to Products"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: spacing.xxl,
    },
    errorText: {
      color: colors.error,
      fontSize: fontSize.lg,
      textAlign: 'center',
      marginTop: spacing.xxl,
    },
    imageContainer: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      backgroundColor: colors.surface,
      position: 'relative',
    },
    image: {
      width: 200,
      height: 200,
      borderRadius: borderRadius.md,
    },
    discountBadge: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      backgroundColor: colors.success,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    discountText: {
      color: colors.white,
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    section: {
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    source: {
      fontSize: fontSize.xs,
      color: colors.primary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.xs,
    },
    priceRow: {
      marginTop: spacing.md,
    },
    badgeRow: {
      flexDirection: 'row',
      marginTop: spacing.md,
    },
    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    actions: {
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
    },
  });
