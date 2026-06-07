import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, spacing, borderRadius, fontSize, SEMIBOLD_FONT } from '../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isPrimary = variant === 'primary';

  if (isPrimary) {
    return (
      <TouchableOpacity
        style={[styles.primaryWrap, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.primaryInner}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={colors.brandEnd} />
                <Stop offset="100%" stopColor={colors.brandStart} />
              </LinearGradient>
            </Defs>
            <Path d="M0 0 H9999 V9999 H0 Z" fill="url(#btnGrad)" />
          </Svg>
          <Text style={[styles.text, styles.primaryText, disabled && styles.disabledText]}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.outline, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, styles.outlineText, disabled && styles.disabledText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryWrap: {
      height: 52,
      borderRadius: borderRadius.button,
      overflow: 'hidden',
    },
    primaryInner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.brandEnd,
    },
    disabled: {
      opacity: 0.45,
    },
    text: {
      fontSize: fontSize.md,
      fontFamily: SEMIBOLD_FONT,
      letterSpacing: -0.3,
    },
    primaryText: {
      color: colors.white,
    },
    outlineText: {
      color: colors.brandEnd,
    },
    disabledText: {
      color: colors.textSoft,
    },
  });
