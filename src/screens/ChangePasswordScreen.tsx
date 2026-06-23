import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AppText, Button, FormField } from '../components';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemeColors, spacing, MIN_TOUCH } from '../styles/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>;
};

const MIN_PASSWORD = 8;

export const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { changePassword } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!current) {
      setFormError('Please enter your current password.');
      return;
    }
    if (next.length < MIN_PASSWORD) {
      setFormError(`New password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (next !== confirm) {
      setFormError('New passwords do not match.');
      return;
    }
    if (next === current) {
      setFormError('New password must be different from the current one.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      navigation.goBack();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not change password.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <AppText variant="title">Change password</AppText>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <FormField
              label="Current password"
              value={current}
              onChangeText={setCurrent}
              placeholder="Your current password"
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              secureTextEntry
              secureToggle
              editable={!submitting}
            />
            <FormField
              label="New password"
              value={next}
              onChangeText={setNext}
              placeholder={`At least ${MIN_PASSWORD} characters`}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              secureTextEntry
              secureToggle
              editable={!submitting}
            />
            <FormField
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter your new password"
              autoCapitalize="none"
              secureTextEntry
              secureToggle
              editable={!submitting}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />

            {!!formError && (
              <AppText variant="caption" style={styles.error}>
                {formError}
              </AppText>
            )}

            <Button
              title={submitting ? 'Updating…' : 'Update password'}
              onPress={handleSubmit}
              disabled={submitting}
              style={styles.submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    back: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    form: { gap: spacing.md, maxWidth: 460, width: '100%', alignSelf: 'center' },
    error: { color: colors.error },
    submit: { marginTop: spacing.sm },
  });
