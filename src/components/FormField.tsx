import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '../context/ThemeContext';
import {
  ThemeColors,
  spacing,
  borderRadius,
  fontSize,
  BODY_FONT,
  MIN_TOUCH,
} from '../styles/theme';

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  secureToggle?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  secureToggle = false,
  secureTextEntry,
  ...inputProps
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={styles.wrap}>
      <AppText variant="meta" style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          !!error && styles.inputWrapError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textSoft}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      gap: spacing.xs,
    },
    label: {
      marginBottom: 2,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: MIN_TOUCH + 4,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.button,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    inputWrapFocused: {
      borderColor: colors.brandEnd,
    },
    inputWrapError: {
      borderColor: colors.error,
    },
    input: {
      flex: 1,
      fontFamily: BODY_FONT,
      fontSize: fontSize.md,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    error: {
      color: colors.error,
    },
  });
