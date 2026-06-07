import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, MIN_TOUCH } from '../styles/theme';

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segment, selected && styles.segmentSelected]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <AppText
              variant="bodySemibold"
              style={[styles.label, selected && styles.labelSelected]}
            >
              {option}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.md,
      padding: 3,
      gap: 2,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: MIN_TOUCH - 12,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
    },
    segmentSelected: {
      backgroundColor: colors.surface,
    },
    label: {
      fontSize: 14,
      color: colors.textSoft,
    },
    labelSelected: {
      color: colors.text,
    },
  });
