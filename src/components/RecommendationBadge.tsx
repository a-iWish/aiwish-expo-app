import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, fontSize } from '../styles/theme';

interface RecommendationBadgeProps {
  recommendation: 'BUY' | 'WAIT' | 'ANALYZING';
  confidence: number;
  size?: 'small' | 'large';
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  recommendation,
  confidence,
  size = 'small',
}) => {
  const { colors } = useTheme();
  const isLarge = size === 'large';

  const config = {
    BUY: { label: 'BUY NOW', color: colors.success, bgColor: 'rgba(34, 197, 94, 0.15)' },
    WAIT: { label: 'WAIT', color: colors.warning, bgColor: 'rgba(245, 158, 11, 0.15)' },
    ANALYZING: { label: 'ANALYZING', color: colors.textMuted, bgColor: 'rgba(100, 116, 139, 0.15)' },
  }[recommendation];

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, isLarge && styles.badgeLarge]}>
      <Text style={[styles.label, { color: config.color }, isLarge && styles.labelLarge]}>
        {config.label}
      </Text>
      {confidence > 0 && (
        <Text style={[styles.confidence, { color: config.color }]}>
          {confidence}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeLarge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelLarge: {
    fontSize: fontSize.md,
  },
  confidence: {
    marginLeft: 4,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});
