import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PricePoint } from '../types/product';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize } from '../styles/theme';

interface PriceChartProps {
  priceHistory: PricePoint[];
}

export const PriceChart: React.FC<PriceChartProps> = ({ priceHistory }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (priceHistory.length === 0) return null;

  const prices = priceHistory.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const chartHeight = 140;

  const firstDate = priceHistory[0].timestamp;
  const lastDate = priceHistory[priceHistory.length - 1].timestamp;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price History</Text>
      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>${maxPrice.toFixed(0)}</Text>
          <Text style={styles.axisLabel}>
            ${((maxPrice + minPrice) / 2).toFixed(0)}
          </Text>
          <Text style={styles.axisLabel}>${minPrice.toFixed(0)}</Text>
        </View>
        <View style={styles.chart}>
          <View style={styles.barsContainer}>
            {priceHistory
              .filter((_, i) => i % Math.max(1, Math.floor(priceHistory.length / 30)) === 0)
              .map((point, index) => {
                const height =
                  ((point.price - minPrice) / range) * chartHeight * 0.85 + chartHeight * 0.15;
                return (
                  <View
                    key={index}
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor:
                          point.price <= minPrice + range * 0.3
                            ? colors.success
                            : point.price >= minPrice + range * 0.7
                            ? colors.error
                            : colors.primary,
                      },
                    ]}
                  />
                );
              })}
          </View>
          <View style={styles.xAxis}>
            <Text style={styles.axisLabel}>{firstDate.slice(5)}</Text>
            <Text style={styles.axisLabel}>{lastDate.slice(5)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Mid</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    title: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    chartContainer: {
      flexDirection: 'row',
      height: 160,
    },
    yAxis: {
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      marginRight: spacing.sm,
    },
    chart: {
      flex: 1,
    },
    barsContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    bar: {
      flex: 1,
      borderRadius: 2,
      minWidth: 3,
      marginHorizontal: 1,
      opacity: 0.8,
    },
    xAxis: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    axisLabel: {
      fontSize: 10,
      color: colors.textMuted,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.sm,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.xs,
    },
    legendText: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
  });
