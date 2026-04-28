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
  RecommendationCard,
  PriceChart,
  Button,
} from '../components';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize, appIconSizes } from '../styles/theme';
import { lowestCurrentOffer } from '../utils/lowestCurrentOffer';

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
                ? require('../../assets/aiwish-icon.png')
                : require('../../assets/aiwish-nobg.png')} style={styles.stateBrandIcon} resizeMode="contain" accessibilityIgnoresInvertColors />
        <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: spacing.md }} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <Image source={isDark
                ? require('../../assets/aiwish-icon.png')
                : require('../../assets/aiwish-nobg.png')} style={styles.stateBrandIcon} resizeMode="contain" accessibilityIgnoresInvertColors />
        <Text style={styles.errorText}>{error ?? 'Product not found'}</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </SafeAreaView>
    );
  }

  // ── Data derivation ──────────────────────────────────────────────────────
  const headlineOffer = lowestCurrentOffer(product, product.stats ?? null);
  const referenceForHeadline = product.stats?.list_price ?? product.original_price ?? null;
  const currentForHeadline = headlineOffer?.price ?? product.current_price ?? null;

  // Sort comparison rows by price ascending, find lowest
  const sortedRows = [...comparisonRows].sort((a, b) => {
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return a.price - b.price;
  });
  const lowestPrice = sortedRows.find((r) => r.price != null)?.price ?? null;

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
          <View style={styles.heroBg} />

          <View style={styles.heroInner}>
            {/* Image */}
            <View style={styles.heroImgWrap}>
              <View style={styles.heroImg}>
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={{ width: '84%', height: '84%' }} resizeMode="contain" />
                ) : (
                  <View style={[styles.heroImg, styles.heroImgPlaceholder]}>
                    <Text style={{ fontSize: 36 }}>📦</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Product info */}
            <View style={styles.heroText}>
              <Text style={styles.heroSrc}>
                {headlineOffer?.retailer ?? product.retailer ?? 'unknown'} · {product.category}
              </Text>
              <Text style={styles.heroName} numberOfLines={3}>{product.name}</Text>
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

          {/* Bottom strip */}
          <View style={styles.heroStrip}>
            <Text style={styles.heroVia}>
              via{' '}
              <Text style={styles.heroViaStrong}>
                {headlineOffer?.retailer ?? product.retailer ?? 'unknown'}
              </Text>
              {product.delivery ? ` · ${product.delivery}` : ''}
            </Text>
            {product.stats?.is_lowest_90d && (
              <View style={styles.heroStatusBadge}>
                <Text style={styles.heroStatusText}>Lowest in 90d</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── AI Recommendation ────────────────────────────────────── */}
        <SectionLabel label="ai recommendation" colors={colors} />
        <View style={styles.sectionPad}>
          <RecommendationCard product={product} predictionFromApi={prediction} />
        </View>

        {/* ── Analytics (Keepa stats 2×2 grid) ────────────────────── */}
        {product.stats && (
          <>
            <SectionLabel label="analytics" colors={colors} />
            <View style={styles.statsGrid}>
              {product.stats.avg_price_90d != null && (
                <View style={styles.statTile}>
                  <Text style={styles.stLbl}>90-day avg</Text>
                  <Text style={[styles.stVal, { color: colors.brandEnd }]}>
                    ${product.stats.avg_price_90d.toFixed(0)}
                  </Text>
                  {currentForHeadline != null && (
                    <Text style={styles.stSub}>
                      ${Math.abs(product.stats.avg_price_90d - currentForHeadline).toFixed(0)} above now
                    </Text>
                  )}
                </View>
              )}
              {product.stats.deal_pct != null && (
                <View style={styles.statTile}>
                  <Text style={styles.stLbl}>deal score</Text>
                  <Text style={[styles.stVal, { color: colors.success }]}>
                    {product.stats.deal_pct > 0 ? '+' : ''}{product.stats.deal_pct.toFixed(1)}%
                  </Text>
                  <Text style={styles.stSub}>
                    {product.stats.deal_pct < 0 ? 'below average' : 'above average'}
                  </Text>
                </View>
              )}
              {product.stats.min_price_90d != null && product.stats.max_price_90d != null && (
                <View style={styles.statTile}>
                  <Text style={styles.stLbl}>90-day range</Text>
                  <Text style={[styles.stVal, { color: colors.warning, fontSize: fontSize.md }]}>
                    ${product.stats.min_price_90d.toFixed(0)}–${product.stats.max_price_90d.toFixed(0)}
                  </Text>
                  <Text style={styles.stSub}>window</Text>
                </View>
              )}
              <View style={styles.statTile}>
                <Text style={styles.stLbl}>data points</Text>
                <Text style={[styles.stVal, { color: colors.brandEnd }]}>
                  {product.data_points_count.toLocaleString()}
                </Text>
                <Text style={styles.stSub}>observations</Text>
              </View>
              {product.stats.is_lowest_ever && (
                <View style={[styles.statTile, { borderColor: `${colors.warning}44` }]}>
                  <Text style={styles.stLbl}>status</Text>
                  <Text style={[styles.stVal, { color: colors.warning, fontSize: fontSize.md }]}>🏆 All-time</Text>
                  <Text style={styles.stSub}>lowest ever</Text>
                </View>
              )}
              {!product.stats.is_lowest_ever && product.stats.is_lowest_90d && (
                <View style={[styles.statTile, { borderColor: `${colors.success}44` }]}>
                  <Text style={styles.stLbl}>status</Text>
                  <Text style={[styles.stVal, { color: colors.success, fontSize: fontSize.md }]}>📉 90-day</Text>
                  <Text style={styles.stSub}>lowest</Text>
                </View>
              )}
              {product.stats.sales_rank != null && (
                <View style={styles.statTile}>
                  <Text style={styles.stLbl}>sales rank</Text>
                  <Text style={[styles.stVal, { color: colors.brandEnd }]}>
                    #{product.stats.sales_rank.toLocaleString()}
                  </Text>
                  <Text style={styles.stSub}>amazon rank</Text>
                </View>
              )}
              {product.stats.monthly_sold != null && (
                <View style={styles.statTile}>
                  <Text style={styles.stLbl}>monthly sold</Text>
                  <Text style={[styles.stVal, { color: colors.brandEnd }]}>
                    {product.stats.monthly_sold.toLocaleString()}
                  </Text>
                  <Text style={styles.stSub}>units/mo</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Price history chart ──────────────────────────────────── */}
        <SectionLabel label="price history" colors={colors} />
        <View style={styles.sectionPad}>
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
              <View style={styles.retCard}>
                {sortedRows.map((item, idx) => {
                  const isBest = item.price != null && item.price === lowestPrice && idx === 0;
                  return (
                    <View key={`${item.source}-${item.retailer}`}>
                      {idx > 0 && <View style={styles.retDivider} />}
                      <View style={[styles.retRow, isBest && styles.retRowBest]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.retName}>{item.retailer}</Text>
                          <Text style={styles.retSub}>
                            {item.source === 'amazon'
                              ? 'latest price'
                              : item.historyBasis === 'monthly_avg'
                                ? 'monthly avg (est.)'
                                : item.historyBasis === 'latest_observation'
                                  ? 'latest price'
                                  : 'no price data'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.retPrice, isBest && { color: colors.success }]}>
                            {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
                          </Text>
                          {isBest && (
                            <View style={styles.retBestTag}>
                              <Text style={styles.retBestTagText}>Low</Text>
                            </View>
                          )}
                          <Text style={styles.retChev}>›</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
              {product.stats?.amazon_price != null && product.stats.new_price != null
                && product.stats.amazon_price !== product.stats.new_price && (
                <Text style={styles.compNote}>
                  Amazon: lowest new offer differs from Amazon-sold price (3rd party from $
                  {product.stats.new_price.toFixed(2)}).
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
          <Button title="Set Price Alert" onPress={() => {}} />
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
    stateBrandIcon: { width: appIconSizes.state, height: appIconSizes.state, borderRadius: 20 },
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
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(157,78,221,0.22)',
      shadowColor: '#9d4edd',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.1 : 0.12,
      shadowRadius: 32,
      elevation: 4,
    },
    heroBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? colors.surface : colors.surface,
    },
    heroInner: {
      padding: spacing.md,
      flexDirection: 'row',
      gap: spacing.md,
      alignItems: 'center',
      position: 'relative',
    },
    heroImgWrap: { position: 'relative', flexShrink: 0 },
    heroImg: {
      width: 90,
      height: 90,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.92)',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowRadius: 28,
    },
    heroImgPlaceholder: {
      backgroundColor: colors.surface2,
    },
    heroText: { flex: 1 },
    heroSrc: {
      fontSize: 9,
      letterSpacing: 2,
      color: colors.textSoft,
      textTransform: 'uppercase',
      marginBottom: 4,
      fontFamily: 'Roboto',
    },
    heroName: {
      fontSize: fontSize.md + 2,
      fontWeight: '700',
      letterSpacing: -0.4,
      lineHeight: 22,
      marginBottom: spacing.sm,
      color: colors.text,
    },
    heroPrices: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    heroPrice: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.text,
    },
    heroOrig: {
      fontSize: 14,
      textDecorationLine: 'line-through',
      color: colors.textSoft,
    },
    heroStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: 11,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    heroVia: {
      fontSize: 13,
      color: colors.textSoft,
    },
    heroViaStrong: {
      fontWeight: '600',
      color: colors.brandEnd,
    },
    heroStatusBadge: {
      backgroundColor: colors.successBg,
      borderWidth: 1,
      borderColor: colors.successBorder,
      borderRadius: 100,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    heroStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },

    // ── Section helpers
    sectionPad: { paddingHorizontal: spacing.md },

    // ── Stats grid
    statsGrid: {
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    statTile: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.sm + 4,
      width: (WINDOW_WIDTH - spacing.md * 2 - spacing.sm) / 2,
      shadowColor: '#c084fc',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.05 : 0.08,
      shadowRadius: 10,
      elevation: 2,
    },
    stLbl: {
      fontSize: 9,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textSoft,
      marginBottom: 6,
      fontWeight: '600',
    },
    stVal: {
      fontSize: fontSize.xl,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    stSub: {
      fontSize: 9,
      color: colors.textSoft,
      marginTop: 3,
      letterSpacing: 0.3,
    },

    // ── Retailer comparison (grouped card)
    retCard: {
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
    retRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: spacing.md,
      gap: 12,
    },
    retRowBest: {
      backgroundColor: colors.successBg,
    },
    retDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: spacing.md,
      backgroundColor: colors.border,
    },
    retName: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.3,
      color: colors.text,
    },
    retSub: {
      fontSize: 12,
      color: colors.textSoft,
      marginTop: 1,
    },
    retPrice: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: colors.text,
    },
    retBestTag: {
      backgroundColor: colors.successBg,
      borderWidth: 1,
      borderColor: colors.successBorder,
      borderRadius: 100,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: 6,
    },
    retBestTagText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.success,
    },
    retChev: {
      fontSize: 13,
      color: colors.textSoft,
      marginLeft: 4,
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
