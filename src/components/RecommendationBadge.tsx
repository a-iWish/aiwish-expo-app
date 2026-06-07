import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MONO_FONT } from '../styles/theme';

interface RecommendationBadgeProps {
  recommendation: string | null;
  confidence: number | null;
  size?: 'small' | 'large';
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  recommendation,
  confidence,
  size = 'small',
}) => {
  const { colors } = useTheme();
  const isLarge = size === 'large';
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const key = recommendation?.toUpperCase() ?? 'ANALYZING';
  const isAnalyzing = key !== 'BUY' && key !== 'WAIT';

  useEffect(() => {
    if (!isAnalyzing) return;
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [isAnalyzing, shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 200],
  });

  const cfg = useMemo(() => {
    if (key === 'BUY') {
      return {
        label: 'Buy Now',
        color: colors.success,
        bg: colors.successBg,
        border: colors.successBorder,
      };
    }
    if (key === 'WAIT') {
      return {
        label: 'Wait',
        color: colors.warning,
        bg: colors.warningBg,
        border: colors.warningBorder,
      };
    }
    return {
      label: 'Analyzing',
      color: colors.textSoft,
      bg: colors.surface,
      border: colors.border,
    };
  }, [key, colors]);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg, borderColor: cfg.border, overflow: 'hidden' },
        isLarge && styles.badgeLarge,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: cfg.color, fontFamily:'Roboto' },
          isLarge && styles.labelLarge,
        ]}
      >
        {cfg.label}
      </Text>
      {confidence != null && confidence > 0 && (
        <Text style={[styles.confidence, { color: cfg.color, fontFamily:'Roboto' }]}>
          {'  '}{confidence}%
        </Text>
      )}
      {isAnalyzing && (
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  labelLarge: {
    fontSize: 12,
  },
  confidence: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(157,78,221,0.2)',
  },
});
