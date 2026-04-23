import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { MonthlyPricePoint, RetailerPriceSeries } from '../types/product';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize } from '../styles/theme';
import { retailerLineColor } from '../utils/retailerChartColors';

interface PriceChartProps {
  priceHistory: MonthlyPricePoint[];
  allRetailerSeries?: RetailerPriceSeries[];
  retailers?: string[];
  selectedRetailer?: string | null;
  onRetailerChange?: (retailer: string | null) => void;
  amazonPrice?: number | null;
}

function unionMonths(series: RetailerPriceSeries[]): string[] {
  const s = new Set<string>();
  for (const { data } of series) {
    for (const p of data) s.add(p.month);
  }
  return [...s].sort();
}

function buildAvgPath(
  months: string[],
  series: MonthlyPricePoint[],
  toX: (i: number) => number,
  toY: (v: number) => number,
): string {
  let d = '';
  let first = true;
  months.forEach((month, i) => {
    const pt = series.find((p) => p.month === month);
    if (!pt) return;
    const x = toX(i);
    const y = toY(pt.avg_price);
    d += `${first ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    first = false;
  });
  return d;
}

function formatAxisPrice(n: number): string {
  const a = Math.abs(n);
  if (a >= 1000) return `$${(n / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
}

function pickXLabelIndices(len: number): number[] {
  if (len <= 0) return [];
  if (len <= 7) return Array.from({ length: len }, (_, i) => i);
  const out = new Set<number>([0, len - 1]);
  const step = (len - 1) / 6;
  for (let k = 1; k <= 5; k += 1) {
    out.add(Math.min(len - 1, Math.round(k * step)));
  }
  return [...out].sort((a, b) => a - b);
}

export const PriceChart: React.FC<PriceChartProps> = ({
  priceHistory,
  allRetailerSeries = [],
  retailers = [],
  selectedRetailer = null,
  onRetailerChange,
  amazonPrice,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: windowWidth } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const multiMode = selectedRetailer === null && allRetailerSeries.length > 0;
  const monthsMulti = useMemo(
    () => (multiMode ? unionMonths(allRetailerSeries) : []),
    [multiMode, allRetailerSeries],
  );

  const Y_AXIS_W = 58;
  const H_PAD = 10;
  const chartHeight = multiMode ? 300 : 280;
  const basePlot = Math.max(268, windowWidth - 40 - Y_AXIS_W);
  const pointCount = multiMode
    ? Math.max(monthsMulti.length, 1)
    : Math.max(priceHistory.length, 1);
  const minPxPerPoint = multiMode ? 58 : 46;
  const plotInnerWidth = Math.max(basePlot, Math.min(pointCount * minPxPerPoint, 1800));
  const needsHScroll = plotInnerWidth > basePlot + 0.5;
  const svgWidth = plotInnerWidth + H_PAD * 2;

  const { dataMin, dataMax, yMin, yMax, yRange, yTickValues, activeHistory } = useMemo(() => {
    if (multiMode) {
      let lo = Number.POSITIVE_INFINITY;
      let hi = Number.NEGATIVE_INFINITY;
      for (const { data } of allRetailerSeries) {
        for (const p of data) {
          lo = Math.min(lo, p.avg_price);
          hi = Math.max(hi, p.avg_price);
        }
      }
      if (amazonPrice != null) { lo = Math.min(lo, amazonPrice); hi = Math.max(hi, amazonPrice); }
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
        return { dataMin: 0, dataMax: 1, yMin: 0, yMax: 1, yRange: 1, yTickValues: [0, 0.25, 0.5, 0.75, 1], activeHistory: [] as MonthlyPricePoint[] };
      }
      const yPad = (hi - lo) * 0.14 || 1;
      const yMinV = lo - yPad; const yMaxV = hi + yPad; const yRangeV = yMaxV - yMinV;
      const yTicks = 5;
      return { dataMin: lo, dataMax: hi, yMin: yMinV, yMax: yMaxV, yRange: yRangeV, yTickValues: Array.from({ length: yTicks }, (_, i) => yMinV + (yRangeV / (yTicks - 1)) * i), activeHistory: [] as MonthlyPricePoint[] };
    }
    const ph = priceHistory;
    if (ph.length === 0) return { dataMin: 0, dataMax: 1, yMin: 0, yMax: 1, yRange: 1, yTickValues: [0, 0.25, 0.5, 0.75, 1], activeHistory: ph };
    const dMin = Math.min(...ph.map((p) => p.min_price));
    const dMax = Math.max(...ph.map((p) => p.max_price));
    const rangeMin = amazonPrice != null ? Math.min(dMin, amazonPrice) : dMin;
    const rangeMax = amazonPrice != null ? Math.max(dMax, amazonPrice) : dMax;
    const yPad = (rangeMax - rangeMin) * 0.1 || 1;
    const yMinV = rangeMin - yPad; const yMaxV = rangeMax + yPad; const yRangeV = yMaxV - yMinV;
    const yTicks = 5;
    return { dataMin: dMin, dataMax: dMax, yMin: yMinV, yMax: yMaxV, yRange: yRangeV, yTickValues: Array.from({ length: yTicks }, (_, i) => yMinV + (yRangeV / (yTicks - 1)) * i), activeHistory: ph };
  }, [multiMode, monthsMulti, allRetailerSeries, priceHistory, amazonPrice]);

  const toX = (i: number, len: number) =>
    H_PAD + (len > 1 ? (i / (len - 1)) * plotInnerWidth : plotInnerWidth / 2);
  const toY = (val: number) => chartHeight - ((val - yMin) / yRange) * chartHeight;

  const minLinePath = useMemo(() => {
    if (multiMode || activeHistory.length === 0) return '';
    return activeHistory.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i, activeHistory.length).toFixed(1)},${toY(p.min_price).toFixed(1)}`).join(' ');
  }, [multiMode, activeHistory, plotInnerWidth, yMin, yRange, chartHeight]);

  const avgLinePath = useMemo(() => {
    if (multiMode || activeHistory.length === 0) return '';
    return activeHistory.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i, activeHistory.length).toFixed(1)},${toY(p.avg_price).toFixed(1)}`).join(' ');
  }, [multiMode, activeHistory, plotInnerWidth, yMin, yRange, chartHeight]);

  const maxLinePath = useMemo(() => {
    if (multiMode || activeHistory.length === 0) return '';
    return activeHistory.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i, activeHistory.length).toFixed(1)},${toY(p.max_price).toFixed(1)}`).join(' ');
  }, [multiMode, activeHistory, plotInnerWidth, yMin, yRange, chartHeight]);

  const minMaxAreaPath = useMemo(() => {
    if (multiMode || activeHistory.length === 0) return '';
    const ph = activeHistory;
    return ph.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i, ph.length).toFixed(1)},${toY(p.max_price).toFixed(1)}`).join(' ')
      + [...ph].reverse().map((p, i) => `L${toX(ph.length - 1 - i, ph.length).toFixed(1)},${toY(p.min_price).toFixed(1)}`).join(' ')
      + ' Z';
  }, [multiMode, activeHistory, plotInnerWidth, yMin, yRange, chartHeight]);

  const multiAvgPaths = useMemo(() => {
    if (!multiMode || monthsMulti.length === 0) return [];
    const len = monthsMulti.length;
    const tx = (i: number) => toX(i, len);
    return allRetailerSeries.map((s) => ({
      retailer: s.retailer,
      color: retailerLineColor(s.retailer),
      path: buildAvgPath(monthsMulti, s.data, tx, toY),
    })).filter((x) => x.path.length > 0);
  }, [multiMode, monthsMulti, allRetailerSeries, plotInnerWidth, yMin, yRange, chartHeight]);

  const multiMeanAvg = useMemo(() => {
    if (!multiMode) return null;
    const vals: number[] = [];
    for (const { data } of allRetailerSeries) { for (const p of data) vals.push(p.avg_price); }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [multiMode, allRetailerSeries]);

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
  };

  const xLabelLen = multiMode ? monthsMulti.length : activeHistory.length;
  const xLabelIndices = pickXLabelIndices(xLabelLen);
  const monthLabels = multiMode ? monthsMulti : activeHistory.map((p) => p.month);

  if (!multiMode && priceHistory.length === 0 && retailers.length === 0) return null;

  const showEmpty = multiMode
    ? monthsMulti.length === 0 || allRetailerSeries.every((s) => s.data.length === 0)
    : priceHistory.length === 0;

  const selectedMonth = multiMode
    ? (selectedIndex != null ? monthsMulti[selectedIndex] : null)
    : (selectedIndex != null ? activeHistory[selectedIndex]?.month : null);

  const hasAmazonMonthlyHistory = allRetailerSeries.some(
    (s) => (s.retailer === 'Amazon' || s.retailer.startsWith('Amazon')) && s.data.length > 0,
  );
  const showAmazonRefLine = amazonPrice != null && !(multiMode && hasAmazonMonthlyHistory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.chartHead}>
        <Text style={styles.title}>Price History</Text>
      </View>

      {/* Retailer tabs */}
      {onRetailerChange &&
        retailers.length > 0 &&
        (retailers.length > 1 || allRetailerSeries.length > 1 || retailers.includes('Amazon')) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.retailerScroll}
          contentContainerStyle={styles.retailerRow}
        >
          <Pressable
            style={[styles.rtab, !selectedRetailer && styles.rtabActive]}
            onPress={() => onRetailerChange(null)}
          >
            <Text style={[styles.rtabText, !selectedRetailer && styles.rtabTextActive]}>
              all
            </Text>
          </Pressable>
          {retailers.map((r) => (
            <Pressable
              key={r}
              style={[styles.rtab, selectedRetailer === r && styles.rtabActive]}
              onPress={() => onRetailerChange(selectedRetailer === r ? null : r)}
            >
              <Text style={[styles.rtabText, selectedRetailer === r && styles.rtabTextActive]}>
                {r.toLowerCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {multiMode && (
        <Text style={styles.subtitle}>
          Monthly average per retailer. Tap a retailer above for min–max range.
        </Text>
      )}

      {showEmpty ? (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No price data for this retailer</Text>
        </View>
      ) : (
        <>
          {selectedMonth != null && selectedIndex != null && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipMonth}>{formatMonth(selectedMonth)}</Text>
              {multiMode ? (
                allRetailerSeries.map((s) => {
                  const pt = s.data.find((p) => p.month === selectedMonth);
                  if (!pt) return null;
                  return (
                    <Text key={s.retailer} style={styles.tooltipLine}>
                      <Text style={{ color: retailerLineColor(s.retailer), fontWeight: '700' }}>
                        {s.retailer}
                      </Text>
                      {`: $${pt.avg_price.toFixed(2)} avg`}
                    </Text>
                  );
                })
              ) : (
                <Text style={styles.tooltipText}>
                  Max: ${activeHistory[selectedIndex]!.max_price.toFixed(2)}  Avg: $
                  {activeHistory[selectedIndex]!.avg_price.toFixed(2)}  Min: $
                  {activeHistory[selectedIndex]!.min_price.toFixed(2)}
                </Text>
              )}
            </View>
          )}

          <View style={[styles.chartContainer, { minHeight: chartHeight }]}>
            <View style={[styles.yAxis, { width: Y_AXIS_W }]}>
              {[...yTickValues].reverse().map((val, i) => (
                <Text key={i} style={styles.axisLabel}>{formatAxisPrice(val)}</Text>
              ))}
            </View>

            <ScrollView
              horizontal
              scrollEnabled={needsHScroll}
              showsHorizontalScrollIndicator={needsHScroll}
              style={styles.chartPlotScroll}
              contentContainerStyle={needsHScroll ? styles.chartScrollContentWide : styles.chartScrollContentFit}
              nestedScrollEnabled
            >
              <View style={{ width: svgWidth }}>
                <View style={styles.chartPlotOuter}>
                  <Svg width={svgWidth} height={chartHeight} viewBox={`0 0 ${svgWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
                    <Defs>
                      <LinearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={colors.secondary} stopOpacity="0.18" />
                        <Stop offset="0.55" stopColor={colors.secondary} stopOpacity="0.06" />
                        <Stop offset="1" stopColor={colors.secondary} stopOpacity="0" />
                      </LinearGradient>
                    </Defs>

                    <Rect x={0} y={0} width={svgWidth} height={chartHeight} fill={colors.surfaceLight} rx={12} ry={12} />

                    {yTickValues.map((val, i) => (
                      <Line key={i} x1={0} y1={toY(val)} x2={svgWidth} y2={toY(val)} stroke={colors.border} strokeWidth={1} opacity={multiMode ? 0.3 : 0.45} />
                    ))}

                    {selectedIndex != null && (multiMode ? monthsMulti.length : activeHistory.length) > 0 && (
                      <Line
                        x1={toX(selectedIndex, multiMode ? monthsMulti.length : activeHistory.length)}
                        y1={6}
                        x2={toX(selectedIndex, multiMode ? monthsMulti.length : activeHistory.length)}
                        y2={chartHeight - 6}
                        stroke={colors.primary}
                        strokeWidth={1.5}
                        opacity={0.55}
                      />
                    )}

                    {multiMode ? (
                      <>
                        {multiAvgPaths.map(({ retailer, color, path }) => (
                          <React.Fragment key={retailer}>
                            <Path d={path} fill="none" stroke={colors.textPrimary} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" opacity={0.1} />
                            <Path d={path} fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
                          </React.Fragment>
                        ))}
                        {showAmazonRefLine && (
                          <Line x1={0} y1={toY(amazonPrice!)} x2={svgWidth} y2={toY(amazonPrice!)} stroke="#FF9900" strokeWidth={2.5} strokeDasharray="10,6" strokeLinecap="round" opacity={0.95} />
                        )}
                        {monthsMulti.map((month, i) => {
                          const isSel = selectedIndex === i;
                          return (
                            <React.Fragment key={month}>
                              {allRetailerSeries.map((s) => {
                                const pt = s.data.find((p) => p.month === month);
                                if (!pt) return null;
                                const cx = toX(i, monthsMulti.length);
                                const rc = retailerLineColor(s.retailer);
                                return (
                                  <Circle key={s.retailer} cx={cx} cy={toY(pt.avg_price)} r={isSel ? 6 : 3.5} fill={isSel ? rc : colors.surface} stroke={rc} strokeWidth={isSel ? 2.5 : 1.75} />
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        <Path d={minMaxAreaPath} fill="url(#rangeGrad)" />
                        <Path d={maxLinePath} fill="none" stroke={colors.error} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
                        <Path d={minLinePath} fill="none" stroke={colors.success} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
                        <Path d={avgLinePath} fill="none" stroke={colors.secondary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" opacity={1} />
                        {showAmazonRefLine && (
                          <Line x1={0} y1={toY(amazonPrice!)} x2={svgWidth} y2={toY(amazonPrice!)} stroke="#FF9900" strokeWidth={2.5} strokeDasharray="8,5" strokeLinecap="round" opacity={0.95} />
                        )}
                        {activeHistory.map((p, i) => {
                          const isSel = selectedIndex === i;
                          return (
                            <React.Fragment key={i}>
                              {isSel && (
                                <>
                                  <Circle cx={toX(i, activeHistory.length)} cy={toY(p.max_price)} r={4.5} fill={colors.error} stroke={colors.background} strokeWidth={1.5} />
                                  <Circle cx={toX(i, activeHistory.length)} cy={toY(p.min_price)} r={4.5} fill={colors.success} stroke={colors.background} strokeWidth={1.5} />
                                </>
                              )}
                              <Circle cx={toX(i, activeHistory.length)} cy={toY(p.avg_price)} r={isSel ? 6 : 4} fill={isSel ? colors.secondary : colors.surface} stroke={colors.secondary} strokeWidth={isSel ? 2.75 : 2} />
                            </React.Fragment>
                          );
                        })}
                      </>
                    )}
                  </Svg>

                  <View style={styles.chartInnerBorder} pointerEvents="none" />

                  <View style={styles.tapLayer}>
                    {(multiMode ? monthsMulti : activeHistory).map((_, i) => (
                      <Pressable key={i} style={styles.tapTarget} onPress={() => setSelectedIndex(selectedIndex === i ? null : i)} />
                    ))}
                  </View>

                  {showAmazonRefLine && (
                    <View style={[styles.amazonLabel, { bottom: ((amazonPrice! - yMin) / yRange) * chartHeight + 2 }]}>
                      <Text style={styles.amazonLabelText}>Amazon ${amazonPrice!.toFixed(2)}</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.xAxisInner, { width: svgWidth, paddingHorizontal: H_PAD }]}>
                  {monthLabels.map((monthStr, i) => (
                    <View key={`${monthStr}-${i}`} style={{ width: plotInnerWidth / pointCount, alignItems: 'center', minHeight: 22, justifyContent: 'flex-start' }}>
                      {xLabelIndices.includes(i) ? (
                        <Text style={styles.xLabel} numberOfLines={1}>{formatMonth(monthStr)}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Price strip */}
          <View style={styles.priceStrip}>
            <View style={styles.ps}>
              <Text style={styles.psLabel}>low</Text>
              <Text style={[styles.psVal, { color: colors.success }]}>${dataMin.toFixed(2)}</Text>
            </View>
            <View style={styles.ps}>
              <Text style={styles.psLabel}>avg</Text>
              <Text style={[styles.psVal, { color: colors.primary }]}>
                {multiMode
                  ? (multiMeanAvg != null ? `$${multiMeanAvg.toFixed(2)}` : '—')
                  : activeHistory.length > 0
                    ? `$${(activeHistory.reduce((s, p) => s + p.avg_price, 0) / activeHistory.length).toFixed(2)}`
                    : '—'}
              </Text>
            </View>
            <View style={styles.ps}>
              <Text style={styles.psLabel}>high</Text>
              <Text style={[styles.psVal, { color: colors.secondary }]}>${dataMax.toFixed(2)}</Text>
            </View>
          </View>

          {/* Legend */}
          {multiMode ? (
            <View style={styles.legendWrap}>
              <Text style={styles.legendTitle}>retailers (monthly avg)</Text>
              <View style={styles.legendGrid}>
                {allRetailerSeries.filter((s) => s.data.length > 0).map((s) => (
                  <View key={s.retailer} style={styles.legendItem}>
                    <View style={[styles.legendLine, { backgroundColor: retailerLineColor(s.retailer) }]} />
                    <Text style={styles.legendText} numberOfLines={1}>{s.retailer}</Text>
                  </View>
                ))}
                {showAmazonRefLine && (
                  <View style={styles.legendItem}>
                    <View style={styles.legendDashed} />
                    <Text style={styles.legendText}>Amazon ref.</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: colors.error, opacity: 0.65 }]} />
                <Text style={styles.legendText}>Max</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: colors.secondary }]} />
                <Text style={styles.legendText}>Avg</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: colors.success, opacity: 0.65 }]} />
                <Text style={styles.legendText}>Min</Text>
              </View>
              {showAmazonRefLine && (
                <View style={styles.legendItem}>
                  <View style={styles.legendDashed} />
                  <Text style={styles.legendText}>Amazon</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    chartHead: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    title: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    emptyChart: {
      minHeight: 120,
      alignItems: 'center',
      justifyContent: 'center',
      margin: spacing.md,
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    emptyText: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
    },
    retailerScroll: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    retailerRow: {
      flexDirection: 'row',
      gap: 6,
      paddingBottom: 2,
    },
    rtab: {
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: 5,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    rtabActive: {
      borderColor: colors.secondary,
      backgroundColor: `${colors.secondary}15`,
    },
    rtabText: {
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: 'lowercase',
      fontWeight: '600',
    },
    rtabTextActive: {
      color: colors.secondary,
      fontWeight: '700',
    },
    tooltip: {
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.md,
      padding: spacing.sm + 4,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tooltipMonth: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    tooltipText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    tooltipLine: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    chartContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: spacing.sm,
    },
    chartPlotScroll: { flex: 1 },
    chartScrollContentWide: { alignItems: 'stretch' },
    chartScrollContentFit: { flexGrow: 1, justifyContent: 'center' },
    yAxis: {
      justifyContent: 'space-between',
      paddingRight: spacing.xs,
      marginRight: 2,
    },
    axisLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'right',
      letterSpacing: -0.2,
    },
    chartPlotOuter: {
      position: 'relative',
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    },
    chartInnerBorder: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tapLayer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
    tapTarget: { flex: 1 },
    amazonLabel: { position: 'absolute', right: 6 },
    amazonLabelText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: '#FF9900',
      backgroundColor: 'rgba(255,153,0,0.14)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      overflow: 'hidden',
    },
    xAxisInner: {
      flexDirection: 'row',
      marginTop: spacing.sm,
      alignSelf: 'stretch',
    },
    xLabel: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
      fontWeight: '600',
    },
    priceStrip: {
      flexDirection: 'row',
      gap: 6,
      padding: spacing.sm + 2,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    ps: {
      flex: 1,
      backgroundColor: colors.surfaceLight,
      borderRadius: 10,
      padding: spacing.sm,
      alignItems: 'center',
    },
    psLabel: {
      fontSize: 8,
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 3,
    },
    psVal: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    legendWrap: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    legendTitle: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    legendGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.md,
      marginBottom: spacing.xs,
      maxWidth: '48%',
    },
    legendLine: {
      width: 18,
      height: 4,
      borderRadius: 2,
      marginRight: spacing.xs,
    },
    legendDashed: {
      width: 18,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: '#FF9900',
      marginRight: spacing.xs,
    },
    legendText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      fontWeight: '500',
      flexShrink: 1,
    },
  });
