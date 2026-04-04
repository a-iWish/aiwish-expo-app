import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Product } from '../types/product';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize } from '../styles/theme';

interface RecommendationCardProps {
  product: Product;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ product }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isBuy = product.recommendation === 'BUY';
  const isWait = product.recommendation === 'WAIT';

  return (
    <View
      style={[
        styles.container,
        isBuy && styles.buyContainer,
        isWait && styles.waitContainer,
      ]}
    >
      <Text style={styles.icon}>{isBuy ? '⚡' : isWait ? '⏳' : '🔍'}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isBuy
            ? 'Great Time to Buy!'
            : isWait
            ? 'We Recommend Waiting'
            : 'Analyzing Price Data...'}
        </Text>
        <Text style={styles.reason}>{product.recommendation_reason}</Text>
        {isWait && product.predicted_drop_percentage && (
          <View style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>Expected drop:</Text>
            <Text style={styles.predictionValue}>
              ~{product.predicted_drop_percentage}% in {product.predicted_days_to_drop} days
            </Text>
          </View>
        )}
        {isBuy && product.extracted_old_price && (
          <View style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>You save:</Text>
            <Text style={[styles.predictionValue, { color: colors.success }]}>
              ${(product.extracted_old_price - product.extracted_price).toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.textMuted,
    },
    buyContainer: {
      borderLeftColor: colors.success,
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
    },
    waitContainer: {
      borderLeftColor: colors.warning,
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
    },
    icon: {
      fontSize: 28,
      marginRight: spacing.md,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    reason: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    predictionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    predictionLabel: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      fontWeight: '500',
    },
    predictionValue: {
      marginLeft: spacing.sm,
      fontSize: fontSize.sm,
      color: colors.warning,
      fontWeight: '700',
    },
  });
