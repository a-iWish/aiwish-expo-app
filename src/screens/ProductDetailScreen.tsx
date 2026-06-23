import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { useProductDetail } from '../hooks/useProductDetail';
import {
  PriceChart,
  Button,
  AppText,
  VerdictDisplay,
  SegmentedControl,
  ProductHeroCard,
} from '../components';
import { insightHeadline, humanizeSummary } from '../utils/copyHelpers';
import { useTheme } from '../context/ThemeContext';
import {
  ThemeColors,
  spacing,
  borderRadius,
  appIconSizes,
  MIN_TOUCH,
} from '../styles/theme';
import { lowestCurrentOffer } from '../utils/lowestCurrentOffer';
import { mergePredictionSummary } from '../utils/predictionMerge';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../context/AuthContext';
import { buildRetailerPurchaseUrl } from '../utils/retailerPurchaseUrl';
import { normalizeVerdict } from '../utils/verdictStyle';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;
type DetailSegment = 'Summary' | 'History' | 'Retailers';

const SEGMENTS: DetailSegment[] = ['Summary', 'History', 'Retailers'];

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [segment, setSegment] = useState<DetailSegment>('Summary');
  const [showStickyBar, setShowStickyBar] = useState(false);

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

  const { isWatched, toggle: toggleWatchlist } = useWatchlist();
  const { isAuthenticated } = useAuth();
  const watched = isWatched(productId);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowStickyBar(e.nativeEvent.contentOffset.y > 120);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <Image
          source={
            isDark
              ? require('../../assets/aiwish-logo-transparent-dark.png')
              : require('../../assets/aiwish-logo-transparent-light.png')
          }
          style={styles.stateBrandIcon}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <ActivityIndicator size="large" color={colors.brandEnd} style={{ marginTop: spacing.md }} />
        <AppText variant="caption">Loading product...</AppText>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <AppText variant="body" style={{ color: colors.error }}>
          {error ?? 'Product not found'}
        </AppText>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
      </SafeAreaView>
    );
  }

  const headlineOffer = lowestCurrentOffer(product, product.stats ?? null);
  const currentForHeadline = headlineOffer?.price ?? product.current_price ?? null;
  const mergedPrediction = mergePredictionSummary(product.prediction, prediction);
  const recKey = normalizeVerdict(
    mergedPrediction?.recommendation ?? product.recommendation,
  );
  const isBuy = recKey === 'BUY';
  const isWait = recKey === 'WAIT';
  const confidence = mergedPrediction?.confidence ?? product.confidence ?? null;
  const rawTitle = mergedPrediction?.title
    ?? (isBuy ? 'Good price now' : isWait ? 'A better price may be ahead' : 'Keep watching');
  const headline = insightHeadline(rawTitle, recKey);
  const recommendationBody = mergedPrediction?.body
    ?? (isBuy
      ? 'The current price compares well against recent history.'
      : isWait
        ? 'The forecast suggests waiting before buying.'
        : 'There is not enough pricing pressure for a clear buy yet.');
  const reasons = mergedPrediction?.reasons ?? [];
  const avgDelta =
    product.stats?.avg_price_90d != null && currentForHeadline != null
      ? product.stats.avg_price_90d - currentForHeadline
      : null;
  const historyTakeaway =
    avgDelta != null
      ? `Today is $${Math.abs(avgDelta).toFixed(0)} ${avgDelta > 0 ? 'below' : 'above'} the 90-day average.`
      : product.stats?.is_lowest_90d
        ? 'Today is near the lowest tracked price in the last 90 days.'
        : 'Use the chart to compare recent price movement across retailers.';

  const sortedRows = [...comparisonRows].sort((a, b) => {
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return a.price - b.price;
  });
  const bestOffer = sortedRows.find((r) => r.price != null) ?? null;
  const otherOffers = bestOffer
    ? sortedRows.filter((row) => row !== bestOffer)
    : sortedRows;
  const retailerForCTA = headlineOffer?.retailer ?? product.retailer ?? 'retailer';

  const handlePurchase = () => {
    const url = buildRetailerPurchaseUrl(product.name, retailerForCTA);
    Linking.openURL(url);
  };

  const handleWatchlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isAuthenticated) {
      // Saving requires an account — send guests to sign in / register.
      navigation.navigate('Login');
      return;
    }
    toggleWatchlist(productId, currentForHeadline);
  };

  const handlePrimaryCta = () => {
    if (isWait && !watched) {
      handleWatchlist();
      return;
    }
    handlePurchase();
  };

  const ctaTitle = isBuy
    ? `Check price at ${retailerForCTA}`
    : isWait
      ? watched
        ? `View at ${retailerForCTA}`
        : 'Save to watchlist'
      : watched
        ? `View at ${retailerForCTA}`
        : 'Save to watchlist';

  const formatComparisonBasis = (item: (typeof sortedRows)[number]) => {
    if (item.source === 'amazon') return 'Amazon price';
    if (item.historyBasis === 'monthly_avg') return 'Monthly avg';
    if (item.historyBasis === 'latest_observation') return 'Latest observed';
    return 'No price data';
  };

  const effectiveMin90 =
    product.stats?.min_price_90d != null && currentForHeadline != null
      ? Math.min(product.stats.min_price_90d, currentForHeadline)
      : product.stats?.min_price_90d ?? null;
  const effectiveMax90 =
    product.stats?.max_price_90d != null && currentForHeadline != null
      ? Math.max(product.stats.max_price_90d, currentForHeadline)
      : product.stats?.max_price_90d ?? null;

  const summaryText = humanizeSummary(recommendationBody, reasons);

  const priceSignalRows = [
    currentForHeadline != null
      ? { label: 'Current price', value: `$${currentForHeadline.toFixed(2)}` }
      : null,
    product.stats?.deal_pct != null
      ? {
          label: 'Deal score',
          value: `${product.stats.deal_pct > 0 ? '+' : ''}${product.stats.deal_pct.toFixed(1)}%`,
        }
      : null,
    product.stats?.avg_price_90d != null
      ? { label: '90d average', value: `$${product.stats.avg_price_90d.toFixed(2)}` }
      : null,
    effectiveMin90 != null && effectiveMax90 != null
      ? {
          label: '90d range',
          value: `$${effectiveMin90.toFixed(2)}–$${effectiveMax90.toFixed(2)}`,
        }
      : null,
  ].filter((item): item is { label: string; value: string } => item != null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.navBtn}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.brandEnd} />
        </Pressable>
        <Pressable
          onPress={handleWatchlist}
          style={styles.navBtn}
          hitSlop={12}
          accessibilityLabel={watched ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Ionicons
            name={watched ? 'heart' : 'heart-outline'}
            size={24}
            color={watched ? colors.brandStart : colors.textSoft}
          />
        </Pressable>
      </View>

      {showStickyBar && (
        <View style={styles.stickyBar}>
          <AppText variant="bodySemibold" style={styles.stickyText}>
            {recKey ?? '···'}
            {confidence != null ? ` · ${Math.round(confidence)}%` : ''}
          </AppText>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <Animated.View entering={FadeInUp.duration(500)}>
          <VerdictDisplay
            recommendation={mergedPrediction?.recommendation ?? product.recommendation}
            confidence={confidence}
            size="detail"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.heroWrap}>
          <ProductHeroCard
            product={product}
            price={currentForHeadline}
            retailer={retailerForCTA}
            category={product.category}
          />
        </Animated.View>

        {headline ? (
          <AppText variant="bodySemibold" style={styles.insightHeadline}>
            {headline}
          </AppText>
        ) : null}

        <View style={styles.ctaWrap}>
          <Button title={ctaTitle} onPress={handlePrimaryCta} />
        </View>

        <View style={styles.segmentWrap}>
          <SegmentedControl
            options={SEGMENTS}
            value={segment}
            onChange={setSegment}
          />
        </View>

        {segment === 'Summary' && (
          <View style={styles.segmentBody}>
            <AppText variant="body">{summaryText}</AppText>
            {reasons.length > 1 && (
              <View style={styles.reasons}>
                {reasons.slice(1, 4).map((r, i) => (
                  <AppText key={i} variant="caption" style={styles.reasonLine}>
                    {r}
                  </AppText>
                ))}
              </View>
            )}
            {mergedPrediction?.model_name && (
              <AppText variant="meta" style={styles.modelLine}>
                Model · {mergedPrediction.model_name} · {product.data_points_count.toLocaleString()} points
              </AppText>
            )}
            {priceSignalRows.length > 0 && (
              <View style={styles.signalBlock}>
                <AppText variant="meta" style={styles.blockLabel}>
                  Price evidence
                </AppText>
                {priceSignalRows.map((row) => (
                  <View key={row.label} style={styles.signalRow}>
                    <AppText variant="caption">{row.label}</AppText>
                    <AppText variant="bodySemibold">{row.value}</AppText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {segment === 'History' && (
          <View style={styles.segmentBody}>
            <AppText variant="title" style={styles.sectionTitle}>
              Price history
            </AppText>
            <AppText variant="caption" style={styles.sectionCopy}>
              {historyTakeaway}
            </AppText>
            <PriceChart
              priceHistory={priceHistory}
              allRetailerSeries={allRetailerSeries}
              retailers={retailers}
              selectedRetailer={selectedRetailer}
              onRetailerChange={selectRetailer}
            />
          </View>
        )}

        {segment === 'Retailers' && (
          <View style={styles.segmentBody}>
            <AppText variant="title" style={styles.sectionTitle}>
              Retailers
            </AppText>
            {bestOffer && (
              <View style={styles.bestOffer}>
                <View>
                  <AppText variant="meta">Best offer</AppText>
                  <AppText variant="bodySemibold">{bestOffer.retailer}</AppText>
                  <AppText variant="caption">{formatComparisonBasis(bestOffer)}</AppText>
                </View>
                <AppText variant="price" style={styles.offerPrice}>
                  ${bestOffer.price!.toFixed(2)}
                </AppText>
              </View>
            )}
            {otherOffers.map((item) => (
              <View key={`${item.source}-${item.retailer}`} style={styles.offerRow}>
                <View style={styles.offerCopy}>
                  <AppText variant="bodySemibold">{item.retailer}</AppText>
                  <AppText variant="caption">{formatComparisonBasis(item)}</AppText>
                </View>
                <AppText variant="price" style={styles.offerPriceSmall}>
                  {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
                </AppText>
              </View>
            ))}
            {sortedRows.length === 0 && (
              <AppText variant="caption">No retailer comparison data yet.</AppText>
            )}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.md,
    },
    stateBrandIcon: {
      width: appIconSizes.state,
      height: appIconSizes.state,
    },
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    navBtn: {
      minWidth: MIN_TOUCH,
      minHeight: MIN_TOUCH,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stickyBar: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
      backgroundColor: colors.surface,
      minHeight: MIN_TOUCH,
      justifyContent: 'center',
    },
    stickyText: {
      letterSpacing: 0.2,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    heroWrap: {
      marginTop: spacing.lg,
    },
    insightHeadline: {
      marginTop: spacing.md,
      lineHeight: 22,
    },
    ctaWrap: {
      marginTop: spacing.md,
    },
    offerPrice: {
      fontSize: 22,
    },
    offerPriceSmall: {
      fontSize: 18,
    },
    segmentWrap: {
      marginTop: spacing.lg,
    },
    segmentBody: {
      marginTop: spacing.md,
      gap: spacing.md,
    },
    reasons: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    reasonLine: {
      lineHeight: 20,
    },
    modelLine: {
      marginTop: spacing.sm,
    },
    signalBlock: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
      gap: spacing.sm,
    },
    blockLabel: {
      marginBottom: spacing.xs,
    },
    signalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 24,
      letterSpacing: -0.5,
    },
    sectionCopy: {
      marginBottom: spacing.sm,
    },
    bestOffer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    offerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    offerCopy: {
      flex: 1,
      gap: 2,
    },
  });
