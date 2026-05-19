import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing } from '../styles/theme';
import {
  normalizeVerdict,
  verdictColor,
  verdictDisplayWord,
  VerdictKey,
} from '../utils/verdictStyle';

interface VerdictDisplayProps {
  recommendation?: string | null;
  confidence?: number | null;
  size?: 'list' | 'detail' | 'compact';
  style?: ViewStyle;
}

export const VerdictDisplay: React.FC<VerdictDisplayProps> = ({
  recommendation,
  confidence,
  size = 'list',
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const key: VerdictKey = normalizeVerdict(recommendation);
  const color = verdictColor(key, colors);
  const word = verdictDisplayWord(key);
  const isDetail = size === 'detail';
  const isCompact = size === 'compact';

  return (
    <View
      style={[styles.row, isCompact && styles.rowCompact, style]}
      accessibilityRole="text"
      accessibilityLabel={
        confidence != null
          ? `${word}, ${Math.round(confidence)} percent confidence`
          : word
      }
    >
      <View style={styles.left}>
        <AppText
          variant={
            isCompact ? 'bodySemibold' : isDetail ? 'displayDetail' : 'displayList'
          }
          style={[
            { color },
            isCompact && styles.compactWord,
          ]}
        >
          {word}
        </AppText>
        {isDetail && (
          <View style={[styles.underline, { backgroundColor: color }]} />
        )}
      </View>
      {confidence != null && !isCompact && (
        <AppText variant="confidence" style={styles.confidence}>
          {Math.round(confidence)}%
        </AppText>
      )}
      {confidence != null && isCompact && (
        <AppText variant="caption" style={styles.confidence}>
          {Math.round(confidence)}%
        </AppText>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    rowCompact: {
      alignItems: 'center',
    },
    left: {
      flex: 1,
    },
    compactWord: {
      fontSize: 17,
      letterSpacing: 0.2,
    },
    underline: {
      height: 2,
      width: 48,
      marginTop: spacing.xs,
      borderRadius: 1,
    },
    confidence: {
      color: colors.textSecondary,
      paddingBottom: 4,
    },
  });
