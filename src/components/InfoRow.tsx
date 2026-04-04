import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, fontSize } from '../styles/theme';

interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    icon: {
      fontSize: 16,
      marginRight: spacing.sm,
    },
    label: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    value: {
      fontSize: fontSize.sm,
      color: colors.textPrimary,
      fontWeight: '600',
    },
  });
