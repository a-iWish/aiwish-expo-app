import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Image,
  FlatList,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  ViewToken,
  Platform,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { AppText } from '../components/AppText';
import { BrandWordmark } from '../components/BrandWordmark';
import { Button } from '../components/Button';
import {
  ThemeColors,
  spacing,
  borderRadius,
  fontSize,
  DISPLAY_FONT,
  BODY_FONT,
  SEMIBOLD_FONT,
  MIN_TOUCH,
} from '../styles/theme';
import { verdictColor } from '../utils/verdictStyle';
import { RootStackParamList } from '../navigation/types';

const ONBOARDING_KEY = 'AIWISH_ONBOARDING_DONE';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface PageData {
  key: string;
  headline: string;
  subtext: string;
}

const PAGES: PageData[] = [
  {
    key: 'track',
    headline: 'Track prices across retailers',
    subtext:
      'We monitor Amazon, Walmart, Best Buy, and Target so you don’t have to.',
  },
  {
    key: 'ai',
    headline: 'AI picks the right moment',
    subtext:
      'Our model analyzes 18+ months of price history to tell you when to buy.',
  },
  {
    key: 'save',
    headline: 'Save and get notified',
    subtext:
      'Add products to your wishlist and set deadlines. We’ll tell you when the price is right.',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const flatListRef = useRef<FlatList<PageData>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  // Keep the current page aligned when the viewport resizes (web) or rotates.
  useEffect(() => {
    flatListRef.current?.scrollToOffset({
      offset: width * activeIndexRef.current,
      animated: false,
    });
  }, [width]);

  const handleDone = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }),
    );
  }, [navigation]);

  const handleSkip = useCallback(() => {
    handleDone();
  }, [handleDone]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        activeIndexRef.current = viewableItems[0].index;
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLastPage = activeIndex === PAGES.length - 1;

  const renderPage = useCallback(
    ({ item, index }: { item: PageData; index: number }) => (
      <OnboardingPage
        page={item}
        index={index}
        width={width}
        colors={colors}
        styles={styles}
        isLast={index === PAGES.length - 1}
        onGetStarted={handleDone}
      />
    ),
    [width, colors, styles, handleDone],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Skip button — pages 1 & 2 only */}
      {!isLastPage && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + spacing.md }]}
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <AppText variant="bodySemibold" style={styles.skipText}>
            Skip
          </AppText>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={width}
      />

      {/* Dot indicators */}
      <View style={[styles.dotsRow, { paddingBottom: insets.bottom + spacing.xl }]}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

/* ── Individual page ─────────────────────────────────────────────────── */

interface OnboardingPageProps {
  page: PageData;
  index: number;
  width: number;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  isLast: boolean;
  onGetStarted: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = React.memo(
  ({ page, index, width, colors, styles, isLast, onGetStarted }) => (
    <View style={[styles.page, { width }]}>
      {/* Visual area */}
      <View style={styles.visualArea}>
        {index === 0 && <PageOneVisual colors={colors} styles={styles} />}
        {index === 1 && <PageTwoVisual colors={colors} styles={styles} />}
        {index === 2 && <PageThreeVisual colors={colors} styles={styles} />}
      </View>

      {/* Text area */}
      <View style={styles.textArea}>
        <AppText variant="title" style={styles.headline}>
          {page.headline}
        </AppText>
        <AppText variant="body" style={styles.subtext}>
          {page.subtext}
        </AppText>
        {isLast && (
          <Button
            title="Get Started"
            onPress={onGetStarted}
            variant="primary"
            style={styles.ctaButton}
          />
        )}
      </View>
    </View>
  ),
);

/* ── Page visuals ────────────────────────────────────────────────────── */

/** Page 1: App logo over a gradient accent, with the brand wordmark below. */
const PageOneVisual: React.FC<{ colors: ThemeColors; styles: ReturnType<typeof createStyles> }> =
  ({ colors, styles }) => {
    const { isDark } = useTheme();
    return (
      <View style={styles.visualInner}>
        <View style={styles.gradientAccent}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id="onbGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={colors.brandStart} stopOpacity="0.18" />
                <Stop offset="100%" stopColor={colors.brandEnd} stopOpacity="0.18" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="24" fill="url(#onbGrad)" />
          </Svg>
          <Image
            source={
              isDark
                ? require('../../assets/aiwish-logo-transparent-dark.png')
                : require('../../assets/aiwish-logo-transparent-light.png')
            }
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
        <BrandWordmark
          textStyle={styles.wordmarkText}
          accessibilityLabel="a.iwish"
        />
      </View>
    );
  };

/** Page 2: BUY / WAIT verdict words stacked. */
const PageTwoVisual: React.FC<{ colors: ThemeColors; styles: ReturnType<typeof createStyles> }> =
  ({ colors, styles }) => {
    const buyColor = verdictColor('BUY', colors);
    const waitColor = verdictColor('WAIT', colors);

    return (
      <View style={styles.visualInner}>
        <View style={styles.verdictStack}>
          <AppText variant="displayList" style={[styles.verdictWord, { color: buyColor }]}>
            BUY
          </AppText>
          <AppText variant="displayList" style={[styles.verdictWord, { color: waitColor }]}>
            WAIT
          </AppText>
        </View>
      </View>
    );
  };

/** Page 3: Wishlist icon (heart outline in brand gradient tones). */
const PageThreeVisual: React.FC<{ colors: ThemeColors; styles: ReturnType<typeof createStyles> }> =
  ({ colors, styles }) => (
    <View style={styles.visualInner}>
      <View style={styles.heartCircle}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={colors.brandStart} stopOpacity="0.14" />
              <Stop offset="100%" stopColor={colors.brandEnd} stopOpacity="0.14" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx="100" fill="url(#heartGrad)" />
        </Svg>
        <AppText style={styles.heartGlyph}>&#9829;</AppText>
      </View>
    </View>
  );

/* ── Styles ──────────────────────────────────────────────────────────── */

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    skipButton: {
      position: 'absolute',
      right: spacing.lg,
      zIndex: 10,
      minHeight: MIN_TOUCH,
      minWidth: MIN_TOUCH,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipText: {
      color: colors.textSecondary,
    },

    /* Page layout */
    page: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    visualArea: {
      flex: Platform.OS === 'web' ? 2.5 : 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: spacing.xxl,
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
    },
    textArea: {
      flex: 1,
      justifyContent: 'flex-start',
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
    },
    headline: {
      fontSize: fontSize.xxl,
      fontFamily: DISPLAY_FONT,
      lineHeight: fontSize.xxl * 1.15,
      letterSpacing: -0.8,
      color: colors.text,
      marginBottom: spacing.md,
    },
    subtext: {
      color: colors.textSecondary,
      fontSize: fontSize.md,
      fontFamily: BODY_FONT,
      lineHeight: fontSize.md * 1.55,
    },
    ctaButton: {
      marginTop: spacing.xl,
    },

    /* Dots */
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: borderRadius.full,
    },
    dotActive: {
      backgroundColor: colors.brandEnd,
      width: 24,
    },
    dotInactive: {
      backgroundColor: colors.borderMed,
    },

    /* Page 1 visual */
    visualInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradientAccent: {
      width: 200,
      height: 200,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.xl,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 112,
      height: 112,
    },
    wordmarkText: {
      fontSize: 38,
      fontFamily: DISPLAY_FONT,
      letterSpacing: -1,
      color: colors.text,
    },

    /* Page 2 visual */
    verdictStack: {
      alignItems: 'flex-start',
      gap: spacing.xs,
    },
    verdictWord: {
      letterSpacing: -1.2,
    },

    /* Page 3 visual */
    heartCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heartGlyph: {
      fontSize: 64,
      color: colors.brandStart,
      fontFamily: SEMIBOLD_FONT,
    },
  });
