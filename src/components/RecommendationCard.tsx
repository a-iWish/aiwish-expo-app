import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductDetail, PredictionResponse } from '../types/product';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize } from '../styles/theme';
import { mergePredictionSummary } from '../utils/predictionMerge';

interface RecommendationCardProps {
  product: ProductDetail;
  predictionFromApi?: PredictionResponse | null;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  product,
  predictionFromApi,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const pred = useMemo(
    () => mergePredictionSummary(product.prediction, predictionFromApi),
    [product.prediction, predictionFromApi],
  );

  const rec = pred?.recommendation?.toUpperCase() ?? product.recommendation?.toUpperCase();
  const isBuy = rec === 'BUY';
  const isWait = rec === 'WAIT';

  const accentColor = isBuy ? colors.success : isWait ? colors.warning : colors.neutralState;
  const bgColor = isBuy ? colors.successBg : isWait ? colors.warningBg : colors.neutralBg;
  const borderCol = isBuy ? colors.successBorder : isWait ? colors.warningBorder : colors.neutralBorder;

  const verdictLabel = isBuy ? 'buy now' : isWait ? 'wait' : 'analyzing';
  const title = pred?.title
    || (isBuy ? 'Lowest in 90 days' : isWait ? 'We Recommend Waiting' : 'Analyzing Price Data...');
  const body = pred?.body || 'No recommendation available yet.';

  const confidence = pred?.confidence ?? product.confidence ?? null;
  const confPct = confidence != null ? Math.min(Math.max(confidence, 0), 100) : null;

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor: borderCol }]}>
      {/* Left accent bar */}
      <View style={[styles.leftAccent, { backgroundColor: accentColor }]} />

      {/* Verdict label */}
      <Text style={[styles.miniLabel, { color: accentColor }]}>{verdictLabel}</Text>

      {/* Title */}
      <Text style={[styles.recommendationTitle, { color: colors.text }]}>{title}</Text>

      {/* Body */}
      <Text style={styles.body}>{body}</Text>

      {pred?.reasons && pred.reasons.length > 0 && (
        <View style={styles.reasonsList}>
          {pred.reasons.map((r, i) => (
            <Text key={i} style={styles.reasonItem}>• {r}</Text>
          ))}
        </View>
      )}

      {/* Savings / expected drop */}
      {isWait && pred?.expected_drop_pct != null && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Expected drop</Text>
          <Text style={[styles.metaValue, { color: accentColor }]}>
            ~{pred.expected_drop_pct}%
            {pred.estimated_wait_days != null && ` in ${pred.estimated_wait_days} days`}
          </Text>
        </View>
      )}
      {isBuy && pred?.savings_amount != null && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>You save</Text>
          <Text style={[styles.metaValue, { color: colors.success }]}>
            ${pred.savings_amount.toFixed(2)}
          </Text>
        </View>
      )}
      {isBuy && pred?.savings_amount == null &&
        product.original_price != null && product.current_price != null &&
        product.original_price > product.current_price && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>You save</Text>
          <Text style={[styles.metaValue, { color: colors.success }]}>
            ${(product.original_price - product.current_price).toFixed(2)}
          </Text>
        </View>
      )}

      {/* Confidence bar */}
      {confPct != null && (
        <View style={styles.confRow}>
          <Text style={styles.confLabel}>confidence</Text>
          <View style={styles.confTrack}>
            <View
              style={[
                styles.confFill,
                {
                  width: `${confPct}%`,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.confVal, { color: accentColor }]}>{confPct}%</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      paddingLeft: spacing.md + 9,
      borderWidth: 1.5,
      position: 'relative',
      overflow: 'hidden',
    },
    leftAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    miniLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    recommendationTitle: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      letterSpacing: -0.4,
      marginBottom: spacing.xs,
    },
    body: {
      fontSize: fontSize.xs + 1,
      color: colors.textMuted,
      lineHeight: 18,
      letterSpacing: 0.2,
      marginBottom: spacing.xs,
    },
    reasonsList: {
      marginTop: spacing.xs,
      gap: 4,
    },
    reasonItem: {
      fontSize: fontSize.xs + 1,
      color: colors.textMuted,
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    metaLabel: {
      fontSize: fontSize.xs,
      color: colors.textSoft,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    metaValue: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    confRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.sm + 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    confLabel: {
      fontSize: 9,
      color: colors.textSoft,
      letterSpacing: 1,
      textTransform: 'uppercase',
      width: 72,
    },
    confTrack: {
      flex: 1,
      height: 6,
      backgroundColor: colors.surface2,
      borderRadius: 3,
      overflow: 'hidden',
    },
    confFill: {
      height: '100%',
      borderRadius: 3,
    },
    confVal: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      letterSpacing: -0.3,
      width: 36,
      textAlign: 'right',
    },
  });
