import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useProductDetail } from '../hooks/useProductDetail';
import {
  PriceChart,
  Button,
} from '../components';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize, appIconSizes } from '../styles/theme';
import { lowestCurrentOffer } from '../utils/lowestCurrentOffer';
import { mergePredictionSummary } from '../utils/predictionMerge';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const { width: WINDOW_WIDTH } = Dimensions.get('window');


/** Section label with a trailing horizontal line */
const SectionLabel: React.FC<{ label: string; colors: ThemeColors }> = ({ label, colors }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
    <Text style={{ fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: colors.textMuted, fontWeight: '600' }}>
      {label}
    </Text>
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
  </View>
);

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [heroImageRatio, setHeroImageRatio] = useState(1);

  const { productId } = route.params;
  const {
    product,
    priceHistory,
    allRetailerSeries,
    retailers,
    selectedRetailer,
    selectRetailer,
    comparisonRows,
    prediction,
    loading,
    error,
  } = useProductDetail(productId);

  // Unused carousel state kept for data-flow compat
  const [, setCarouselIndex] = useState(0);
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCarouselIndex(viewableItems[0].index);
      }
    },
    [],
  );
  useEffect(() => { setCarouselIndex(0); }, [productId, comparisonRows.length]);
  // suppress unused-var lint
  void viewabilityConfig; void onViewableItemsChanged;

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <Image source={isDark
                ? require('../../assets/aiwish-logo-transparent-dark.png')
                : require('../../assets/aiwish-logo-transparent-light.png')} style={styles.stateBrandIcon} resizeMode="contain" accessibilityIgnoresInvertColors />
        <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: spacing.md }} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <Image source={isDark
                ? require('../../assets/aiwish-logo-transparent-dark.png')
                : require('../../assets/aiwish-logo-transparent-light.png')} style={styles.stateBrandIcon} resizeMode="contain" accessibilityIgnoresInvertColors />
        <Text style={styles.errorText}>{error ?? 'Product not found'}</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </SafeAreaView>
    );
  }

  // ── Data derivation ──────────────────────────────────────────────────────
  const headlineOffer = lowestCurrentOffer(product, product.stats ?? null);
  const referenceForHeadline = product.stats?.list_price ?? product.original_price ?? null;
  const currentForHeadline = headlineOffer?.price ?? product.current_price ?? null;
  const mergedPrediction = mergePredictionSummary(product.prediction, prediction);
  const recKey = mergedPrediction?.recommendation?.toUpperCase() ?? product.recommendation?.toUpperCase();
  const isBuy = recKey === 'BUY';
  const isWait = recKey === 'WAIT';
  const decisionLabel = isBuy ? 'Buy now' : isWait ? 'Wait' : 'Watch';
  const decisionColor = isBuy ? colors.success : isWait ? colors.warning : colors.neutralState;
  const confidence = mergedPrediction?.confidence ?? product.confidence ?? null;
  const savingsAmount = mergedPrediction?.savings_amount
    ?? (referenceForHeadline != null && currentForHeadline != null && referenceForHeadline > currentForHeadline
      ? referenceForHeadline - currentForHeadline
      : null);
  const avgDelta = product.stats?.avg_price_90d != null && currentForHeadline != null
    ? product.stats.avg_price_90d - currentForHeadline
    : null;
  const recommendationTitle = mergedPrediction?.title
    ?? (isBuy ? 'Good price now' : isWait ? 'A better price may be ahead' : 'Keep an eye on this one');
  const displayRecommendationTitle =
    recommendationTitle.trim().toUpperCase() === decisionLabel.toUpperCase()
      ? (isBuy ? 'Good price now' : isWait ? 'A better price may be ahead' : 'Keep watching')
      : recommendationTitle;
  const recommendationBody = mergedPrediction?.body
    ?? (isBuy
      ? 'The current price compares well against recent history.'
      : isWait
        ? 'The forecast suggests waiting before buying.'
        : 'There is not enough pricing pressure for a clear buy yet.');
  const priceContext = avgDelta != null
    ? `$${Math.abs(avgDelta).toFixed(0)} ${avgDelta > 0 ? 'below' : 'above'} 90-day avg`
    : product.stats?.is_lowest_90d
      ? 'Lowest in 90 days'
      : 'Price history available below';
  const historySummary = [
    currentForHeadline != null ? { label: 'Now', value: `$${currentForHeadline.toFixed(0)}` } : null,
    product.stats?.avg_price_90d != null ? { label: '90d avg', value: `$${product.stats.avg_price_90d.toFixed(0)}` } : null,
    product.stats?.min_price_90d != null ? { label: 'Low', value: `$${product.stats.min_price_90d.toFixed(0)}` } : null,
    product.stats?.max_price_90d != null ? { label: 'High', value: `$${product.stats.max_price_90d.toFixed(0)}` } : null,
  ].filter((item): item is { label: string; value: string } => item != null);
  const historyTakeaway = avgDelta != null
    ? `Today is $${Math.abs(avgDelta).toFixed(0)} ${avgDelta > 0 ? 'below' : 'above'} the 90-day average.`
    : product.stats?.is_lowest_90d
      ? 'Today is near the lowest tracked price in the last 90 days.'
      : 'Use the chart to compare recent price movement across retailers.';
  const marketSignal = product.stats?.is_lowest_ever
    ? 'Lowest price we have seen for this product.'
    : product.stats?.is_lowest_90d
      ? 'Currently near the recent low.'
      : avgDelta != null
        ? `Current price is ${avgDelta > 0 ? 'below' : 'above'} the recent average.`
        : 'Recent price and demand signals are available.';
  const priceSignalRows = [
    product.stats?.deal_pct != null
      ? {
        label: 'Deal score',
        value: `${product.stats.deal_pct > 0 ? '+' : ''}${product.stats.deal_pct.toFixed(1)}%`,
        tone: product.stats.deal_pct < 0 ? colors.success : colors.warning,
      }
      : null,
    product.stats?.avg_price_90d != null
      ? { label: 'Average price', value: `$${product.stats.avg_price_90d.toFixed(0)}`, tone: colors.text }
      : null,
    product.stats?.min_price_90d != null && product.stats.max_price_90d != null
      ? {
        label: '90-day range',
        value: `$${product.stats.min_price_90d.toFixed(0)}-${product.stats.max_price_90d.toFixed(0)}`,
        tone: colors.text,
      }
      : null,
  ].filter((item): item is { label: string; value: string; tone: string } => item != null);
  const demandSignalRows = [
    product.stats?.sales_rank != null
      ? { label: 'Sales rank', value: `#${product.stats.sales_rank.toLocaleString()}` }
      : null,
    product.stats?.monthly_sold != null
      ? { label: 'Monthly sold', value: product.stats.monthly_sold.toLocaleString() }
      : null,
    { label: 'Data points', value: product.data_points_count.toLocaleString() },
  ].filter((item): item is { label: string; value: string } => item != null);

  // Sort comparison rows by price ascending, find lowest
  const sortedRows = [...comparisonRows].sort((a, b) => {
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return a.price - b.price;
  });
  const bestOffer = sortedRows.find((r) => r.price != null) ?? null;
  const otherOffers = bestOffer
    ? sortedRows.filter((row) => row !== bestOffer)
    : sortedRows;
  const formatComparisonBasis = (item: typeof sortedRows[number]) => {
    if (item.source === 'amazon') return 'Amazon price';
    if (item.historyBasis === 'monthly_avg') return 'Monthly avg';
    if (item.historyBasis === 'latest_observation') return 'Latest observed';
    return 'No price data';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Custom nav bar ───────────────────────────────────────────── */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backText}>‹ back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>product details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero section ─────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <View style={styles.heroInner}>
            <View style={styles.heroImgWrap}>
              <View style={styles.heroImg}>
                {product.image_url ? (
                  <Image
                    source={{ uri: product.image_url }}
                    style={[styles.heroProductImage, { aspectRatio: heroImageRatio }]}
                    resizeMode="contain"
                    onLoad={({ nativeEvent }) => {
                      const { width, height } = nativeEvent.source;
                      if (width > 0 && height > 0) {
                        setHeroImageRatio(width / height);
                      }
                    }}
                  />
                ) : (
                  <View style={[styles.heroImg, styles.heroImgPlaceholder]}>
                    <Text style={styles.heroImgFallback}>ai</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.heroText}>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroSrc} numberOfLines={1}>
                  {headlineOffer?.retailer ?? product.retailer ?? 'unknown'}
                </Text>
                {product.stats?.is_lowest_90d && (
                  <View style={styles.heroStatusBadge}>
                    <Text style={styles.heroStatusText}>90d low</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroName} numberOfLines={3}>{product.name}</Text>

              <View style={styles.heroPriceBlock}>
                <Text style={styles.heroPriceLabel}>Current best price</Text>
                <View style={styles.heroPrices}>
                  {(headlineOffer?.price ?? product.current_price) != null && (
                    <Text style={styles.heroPrice}>
                      ${(headlineOffer?.price ?? product.current_price)!.toFixed(2)}
                    </Text>
                  )}
                  {referenceForHeadline != null && (
                    <Text style={styles.heroOrig}>${referenceForHeadline.toFixed(2)}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.heroStrip}>
            <Text style={styles.heroVia}>
              {product.category}
              {product.delivery ? ` · ${product.delivery}` : ''}
            </Text>
          </View>
        </View>

        {/* ── AI Recommendation ────────────────────────────────────── */}
        <SectionLabel label="ai recommendation" colors={colors} />
        <View style={styles.sectionPad}>
          <View style={styles.aiPanel}>
            <View style={styles.aiHeader}>
              <View style={styles.aiCopy}>
                <View style={styles.aiVerdictRow}>
                  <View style={[styles.aiDot, { backgroundColor: decisionColor }]} />
                  <Text style={[styles.aiVerdict, { color: decisionColor }]}>{decisionLabel}</Text>
                  {confidence != null && (
                    <Text style={styles.aiConfidence}>{confidence}% confidence</Text>
                  )}
                </View>
                <Text style={styles.aiTitle}>{displayRecommendationTitle}</Text>
                <Text style={styles.aiBody}>{recommendationBody}</Text>
              </View>
            </View>

            <View style={styles.aiMetricRow}>
              <View style={styles.aiMetric}>
                <Text style={styles.aiMetricLabel}>Current</Text>
                <Text style={styles.aiMetricValue}>
                  {currentForHeadline != null ? `$${currentForHeadline.toFixed(2)}` : '—'}
                </Text>
              </View>
              <View style={styles.aiMetric}>
                <Text style={styles.aiMetricLabel}>Usual</Text>
                <Text style={styles.aiMetricValue}>
                  {referenceForHeadline != null ? `$${referenceForHeadline.toFixed(2)}` : '—'}
                </Text>
              </View>
              <View style={styles.aiMetric}>
                <Text style={styles.aiMetricLabel}>Signal</Text>
                <Text style={[styles.aiMetricValue, { color: decisionColor }]}>
                  {isWait && mergedPrediction?.estimated_wait_days != null
                    ? `~${mergedPrediction.estimated_wait_days}d`
                    : savingsAmount != null
                      ? `$${savingsAmount.toFixed(0)}`
                      : '—'}
                </Text>
              </View>
            </View>
            <Text style={styles.aiFootnote}>{priceContext}</Text>
          </View>
        </View>

        {/* ── Analytics ───────────────────────────────────────────── */}
        {product.stats && (
          <>
            <SectionLabel label="analytics" colors={colors} />
            <View style={styles.marketPanel}>
              <View style={styles.marketHeader}>
                <Text style={styles.marketTitle}>Market signals</Text>
                <Text style={styles.marketTakeaway}>{marketSignal}</Text>
              </View>

              {priceSignalRows.length > 0 && (
                <View style={styles.marketGroup}>
                  <Text style={styles.marketGroupTitle}>Price evidence</Text>
                  {priceSignalRows.map((item) => (
                    <View key={item.label} style={styles.marketRow}>
                      <Text style={styles.marketLabel}>{item.label}</Text>
                      <Text style={[styles.marketValue, { color: item.tone }]}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.marketGroup}>
                <Text style={styles.marketGroupTitle}>Demand and data</Text>
                {demandSignalRows.map((item) => (
                  <View key={item.label} style={styles.marketRow}>
                    <Text style={styles.marketLabel}>{item.label}</Text>
                    <Text style={styles.marketValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── Price history chart ──────────────────────────────────── */}
        <SectionLabel label="price history" colors={colors} />
        <View style={styles.sectionPad}>
          <View style={styles.historySummaryCard}>
            <View style={styles.historySummaryHeader}>
              <Text style={styles.historySummaryTitle}>Today vs history</Text>
              <Text style={styles.historySummaryCopy}>{historyTakeaway}</Text>
            </View>
            {historySummary.length > 0 && (
              <View style={styles.historyMetricRow}>
                {historySummary.map((item) => (
                  <View key={item.label} style={styles.historyMetric}>
                    <Text style={styles.historyMetricLabel}>{item.label}</Text>
                    <Text style={styles.historyMetricValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <PriceChart
            priceHistory={priceHistory}
            allRetailerSeries={allRetailerSeries}
            retailers={retailers}
            selectedRetailer={selectedRetailer}
            onRetailerChange={selectRetailer}
            // amazonPrice={amazonRefPriceForChart}
          />
        </View>

        {/* ── Price comparison (grouped card) ─────────────────────── */}
        {sortedRows.length > 0 && (
          <>
            <SectionLabel label="price comparison" colors={colors} />
            <View style={[styles.sectionPad]}>
              <View style={styles.offerCard}>
                {bestOffer && (
                  <View style={styles.bestOffer}>
                    <View style={styles.bestOfferTop}>
                      <View style={styles.bestOfferCopy}>
                        <Text style={styles.bestOfferLabel}>Best offer</Text>
                        <Text style={styles.bestOfferRetailer}>{bestOffer.retailer}</Text>
                        <Text style={styles.bestOfferBasis}>{formatComparisonBasis(bestOffer)}</Text>
                      </View>
                      <Text style={styles.bestOfferPrice}>${bestOffer.price!.toFixed(2)}</Text>
                    </View>
                  </View>
                )}

                {otherOffers.length > 0 && (
                  <View style={styles.otherOffers}>
                    {bestOffer && <Text style={styles.otherOffersTitle}>Other retailers</Text>}
                    {otherOffers.map((item, idx) => (
                      <View key={`${item.source}-${item.retailer}`}>
                        {idx > 0 && <View style={styles.offerDivider} />}
                        <View style={styles.offerRow}>
                          <View style={styles.offerCopy}>
                            <Text style={styles.offerRetailer}>{item.retailer}</Text>
                            <Text style={styles.offerBasis}>{formatComparisonBasis(item)}</Text>
                          </View>
                          <Text style={[styles.offerPrice, item.price == null && styles.offerPriceMuted]}>
                            {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {product.stats?.amazon_price != null && product.stats.new_price != null
                && product.stats.amazon_price !== product.stats.new_price && (
                <Text style={styles.compNote}>
                  Amazon 3rd-party offer from ${product.stats.new_price.toFixed(2)}.
                </Text>
              )}
              {/* {product.stats?.list_price != null && (
                <Text style={styles.compMsrp}>MSRP: ${product.stats.list_price.toFixed(2)}</Text>
              )} */}
            </View>
          </>
        )}

        {/* ── Product Details ────────────────────────────────────────
        <SectionLabel label="product details" colors={colors} />
        <View style={[styles.sectionPad, { paddingBottom: 0 }]}>
          <View style={styles.detailsCard}>
            <InfoRow label="Category" value={product.category} icon="📦" />
            {product.stats?.brand != null && String(product.stats.brand).trim() !== '' && (
              <InfoRow label="Brand" value={String(product.stats.brand).trim()} icon="🏷️" />
            )}
            {product.retailer && (
              <InfoRow label="Retailer" value={product.retailer} icon="🏪" />
            )}
            {showRatingRow && (
              <InfoRow
                label="Rating"
                value={`${ratingVal != null ? `${ratingVal} ★` : '—'}${reviewCount != null ? ` (${reviewCount.toLocaleString()} reviews)` : ''}`}
                icon="⭐"
              />
            )}
            {product.msrp != null && (product.stats?.list_price == null || Math.abs(product.msrp - product.stats.list_price) > 0.01) && (
              <InfoRow label="MSRP" value={`$${product.msrp.toFixed(2)}`} icon="💲" />
            )}
            {product.delivery && (
              <InfoRow label="Delivery" value={product.delivery} icon="🚚" />
            )}
            {product.search_position != null && (
              <InfoRow label="Position" value={`#${product.search_position} in search results`} icon="📊" />
            )}
            <InfoRow label="Data Points" value={`${product.data_points_count} price observations`} icon="📈" />
          </View>
        </View> */}

        {/* ── CTA buttons ─────────────────────────────────────────── */}
        <View style={styles.ctaWrap}>
          <Button title="Add to wishlist" onPress={() => {}} />
          <Button
            title={`View on ${headlineOffer?.retailer ?? product.retailer ?? 'retailer'} →`}
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: { flex: 1 },
    content: { paddingBottom: spacing.xxl },

    // ── States
    centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
    stateBrandIcon: { width: appIconSizes.state, height: appIconSizes.state },
    loadingText: { marginTop: spacing.sm, fontSize: fontSize.sm, color: colors.textSoft },
    errorText: { color: colors.error, fontSize: fontSize.md, textAlign: 'center', marginBottom: spacing.md, paddingHorizontal: spacing.lg },

    // ── Nav bar
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backBtn: { minWidth: 60 },
    backText: {
      fontSize: 12,
      letterSpacing: 0.5,
      color: colors.brandEnd,
      fontWeight: '600',
    },
    navTitle: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textSoft,
      letterSpacing: 0.3,
      textTransform: 'lowercase',
    },

    // ── Hero
    heroWrap: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      borderRadius: borderRadius.cardLg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      shadowColor: '#17151C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.08 : 0.05,
      shadowRadius: 14,
      elevation: 2,
    },
    heroInner: {
      padding: spacing.md,
      gap: spacing.md,
      position: 'relative',
    },
    heroImgWrap: {
      position: 'relative',
      width: '100%',
    },
    heroImg: {
      width: '100%',
      minHeight: 160,
      maxHeight: 260,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroProductImage: {
      maxWidth: '100%',
      maxHeight: 250,
      width: '100%',
    },
    heroImgPlaceholder: {
      backgroundColor: colors.surface2,
      borderRadius: borderRadius.md,
      height: 180,
    },
    heroImgFallback: {
      color: colors.brandEnd,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: 0,
    },
    heroText: {
      gap: spacing.sm,
    },
    heroMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'space-between',
    },
    heroSrc: {
      flex: 1,
      fontSize: 11,
      letterSpacing: 0,
      color: colors.textSoft,
      textTransform: 'uppercase',
      fontWeight: '800',
    },
    heroName: {
      fontSize: fontSize.lg + 1,
      fontWeight: '800',
      letterSpacing: 0,
      lineHeight: 26,
      color: colors.text,
    },
    heroPriceBlock: {
      backgroundColor: colors.cardBg,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      padding: spacing.sm + 4,
    },
    heroPriceLabel: {
      color: colors.textSoft,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    heroPrices: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    heroPrice: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 0,
      color: colors.text,
    },
    heroOrig: {
      fontSize: 14,
      textDecorationLine: 'line-through',
      color: colors.textSoft,
    },
    heroStrip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 11,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    heroVia: {
      fontSize: 13,
      color: colors.textSoft,
      lineHeight: 18,
    },
    heroStatusBadge: {
      backgroundColor: colors.successBg,
      borderWidth: 1,
      borderColor: colors.successBorder,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    heroStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },

    // ── Section helpers
    sectionPad: { paddingHorizontal: spacing.md },

    // ── AI decision panel
    aiPanel: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderColor: colors.border,
      borderWidth: 1,
      padding: spacing.md,
      shadowColor: '#17151C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.05 : 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    aiHeader: {
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'stretch',
    },
    aiCopy: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    aiVerdictRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    aiDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    aiVerdict: {
      fontSize: fontSize.sm,
      fontWeight: '900',
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
    aiConfidence: {
      color: colors.textSoft,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0,
      marginLeft: 'auto',
    },
    aiTitle: {
      color: colors.text,
      fontSize: fontSize.lg,
      fontWeight: '800',
      letterSpacing: 0,
      lineHeight: 24,
      marginBottom: spacing.xs,
    },
    aiBody: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: '500',
      letterSpacing: 0,
      lineHeight: 20,
    },
    aiMetricRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    aiMetric: {
      backgroundColor: colors.cardBg,
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: borderRadius.sm,
      flex: 1,
      minHeight: 58,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      justifyContent: 'space-between',
    },
    aiMetricLabel: {
      color: colors.textSoft,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
    aiMetricValue: {
      color: colors.text,
      fontSize: fontSize.sm,
      fontWeight: '900',
      letterSpacing: 0,
    },
    aiFootnote: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0,
      lineHeight: 17,
      marginTop: spacing.sm,
    },

    // ── Price history summary
    historySummaryCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    historySummaryHeader: {
      marginBottom: spacing.sm,
    },
    historySummaryTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: '800',
      letterSpacing: 0,
      marginBottom: spacing.xs,
    },
    historySummaryCopy: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: '500',
      letterSpacing: 0,
      lineHeight: 19,
    },
    historyMetricRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    historyMetric: {
      backgroundColor: colors.cardBg,
      borderColor: colors.border,
      borderRadius: borderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      minHeight: 52,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      justifyContent: 'space-between',
    },
    historyMetricLabel: {
      color: colors.textSoft,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
    historyMetricValue: {
      color: colors.text,
      fontSize: fontSize.sm,
      fontWeight: '900',
      letterSpacing: 0,
    },

    // ── Market signals
    marketPanel: {
      marginHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      overflow: 'hidden',
      shadowColor: '#c084fc',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.05 : 0.08,
      shadowRadius: 10,
      elevation: 2,
    },
    marketHeader: {
      backgroundColor: colors.surfaceLight,
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
    },
    marketTitle: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: '800',
      letterSpacing: 0,
      marginBottom: spacing.xs,
    },
    marketTakeaway: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: '500',
      letterSpacing: 0,
      lineHeight: 19,
    },
    marketGroup: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    marketGroupTitle: {
      color: colors.textSoft,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    marketRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    marketLabel: {
      color: colors.textMuted,
      flex: 1,
      fontSize: fontSize.sm,
      fontWeight: '600',
      letterSpacing: 0,
    },
    marketValue: {
      color: colors.text,
      flexShrink: 0,
      fontSize: fontSize.md,
      fontWeight: '800',
      letterSpacing: -0.2,
    },

    // ── Retailer comparison
    offerCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.border,
      shadowColor: '#9d4edd',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.05 : 0.07,
      shadowRadius: 10,
      elevation: 2,
    },
    bestOffer: {
      backgroundColor: colors.successBg,
      borderBottomColor: colors.successBorder,
      borderBottomWidth: 1,
      padding: spacing.md,
    },
    bestOfferTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    bestOfferCopy: {
      flex: 1,
      minWidth: 0,
    },
    bestOfferLabel: {
      color: colors.success,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    bestOfferRetailer: {
      color: colors.text,
      fontSize: fontSize.lg,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    bestOfferBasis: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 3,
    },
    bestOfferPrice: {
      color: colors.success,
      fontSize: fontSize.xl,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    otherOffers: {
      paddingVertical: spacing.xs,
    },
    otherOffersTitle: {
      color: colors.textSoft,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    offerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
    },
    offerCopy: {
      flex: 1,
      minWidth: 0,
    },
    offerRetailer: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    offerBasis: {
      color: colors.textSoft,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    offerPrice: {
      color: colors.text,
      fontSize: fontSize.md + 1,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    offerPriceMuted: {
      color: colors.textSoft,
    },
    offerDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: spacing.md,
      backgroundColor: colors.border,
    },
    compNote: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginTop: spacing.sm,
      lineHeight: 18,
    },
    compMsrp: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
    },

    // ── Details card
    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      overflow: 'hidden',
      shadowColor: '#c084fc',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.05 : 0.08,
      shadowRadius: 12,
      elevation: 2,
    },

    // ── CTA
    ctaWrap: {
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
  });
