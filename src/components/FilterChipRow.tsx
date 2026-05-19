import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing } from '../styles/theme';

export interface FilterChip {
  key: string;
  label: string;
}

interface FilterChipRowProps {
  label: string;
  chips: FilterChip[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  allowDeselect?: boolean;
}

export const FilterChipRow: React.FC<FilterChipRowProps> = ({
  label,
  chips,
  selectedKey,
  onSelect,
  allowDeselect = true,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <AppText variant="meta" style={styles.label}>
        {label}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {chips.map((chip) => {
          const active = selectedKey === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => {
                if (active && allowDeselect) {
                  onSelect(null);
                } else {
                  onSelect(chip.key);
                }
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <AppText
                variant="bodySemibold"
                style={[styles.chipText, active && styles.chipTextActive]}
              >
                {chip.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      gap: spacing.sm,
    },
    label: {
      paddingHorizontal: spacing.md,
    },
    row: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 100,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    chipActive: {
      borderColor: colors.brandEnd,
      backgroundColor: colors.brandEnd + '18',
    },
    chipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.text,
    },
  });
