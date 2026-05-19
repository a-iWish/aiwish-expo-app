import React, { useMemo } from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import {
  BODY_FONT,
  DISPLAY_FONT,
  SEMIBOLD_FONT,
  fontSize,
  ThemeColors,
} from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

export type AppTextVariant =
  | 'displayList'
  | 'displayDetail'
  | 'confidence'
  | 'title'
  | 'body'
  | 'bodySemibold'
  | 'meta'
  | 'price'
  | 'monoPrice'
  | 'caption';

interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  color?: string;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createVariantStyles(colors), [colors]);
  const variantStyle = styles[variant];

  return (
    <Text
      style={[variantStyle, color != null && { color }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const createVariantStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    displayList: {
      fontFamily: DISPLAY_FONT,
      fontSize: fontSize.displayList,
      lineHeight: fontSize.displayList * 1.05,
      letterSpacing: -1.2,
      color: colors.text,
    },
    displayDetail: {
      fontFamily: DISPLAY_FONT,
      fontSize: fontSize.displayDetail,
      lineHeight: fontSize.displayDetail * 1.02,
      letterSpacing: -2,
      color: colors.text,
    },
    confidence: {
      fontFamily: DISPLAY_FONT,
      fontSize: fontSize.confidence,
      lineHeight: fontSize.confidence * 1.1,
      letterSpacing: -1,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    title: {
      fontFamily: SEMIBOLD_FONT,
      fontSize: fontSize.lg,
      lineHeight: fontSize.lg * 1.3,
      letterSpacing: -0.4,
      color: colors.text,
    },
    body: {
      fontFamily: BODY_FONT,
      fontSize: fontSize.md,
      lineHeight: fontSize.md * 1.45,
      color: colors.text,
    },
    bodySemibold: {
      fontFamily: SEMIBOLD_FONT,
      fontSize: fontSize.md,
      lineHeight: fontSize.md * 1.45,
      color: colors.text,
    },
    meta: {
      fontFamily: SEMIBOLD_FONT,
      fontSize: fontSize.xs,
      lineHeight: fontSize.xs * 1.4,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.textSoft,
    },
    price: {
      fontFamily: SEMIBOLD_FONT,
      fontSize: 28,
      lineHeight: 32,
      letterSpacing: -0.6,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    monoPrice: {
      fontFamily: SEMIBOLD_FONT,
      fontSize: fontSize.md,
      lineHeight: fontSize.md * 1.3,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    caption: {
      fontFamily: BODY_FONT,
      fontSize: fontSize.sm,
      lineHeight: fontSize.sm * 1.4,
      color: colors.textSecondary,
    },
  });
