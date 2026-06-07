import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, appIconSizes } from '../styles/theme';

export const SkeletonEditorialRow: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.row, { opacity }]}>
      <View style={styles.thumb} />
      <View style={styles.content}>
        <View style={styles.lineLg} />
        <View style={styles.lineMd} />
        <View style={styles.lineSm} />
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    thumb: {
      width: appIconSizes.listThumb,
      height: appIconSizes.listThumb,
      borderRadius: 8,
      backgroundColor: colors.surfaceLight,
    },
    content: {
      flex: 1,
      gap: spacing.sm,
      paddingTop: 4,
    },
    lineLg: {
      height: 28,
      width: '40%',
      borderRadius: 6,
      backgroundColor: colors.surfaceLight,
    },
    lineMd: {
      height: 18,
      width: '85%',
      borderRadius: 4,
      backgroundColor: colors.surfaceLight,
    },
    lineSm: {
      height: 12,
      width: '60%',
      borderRadius: 4,
      backgroundColor: colors.surfaceLight,
    },
  });
