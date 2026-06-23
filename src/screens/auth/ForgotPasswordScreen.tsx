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
import { RootStackParamList } from '../../navigation/types';
import { AppText, Button, FormField, BrandWordmark } from '../../components';
import { useTheme } from '../../context/ThemeContext';
import { forgotPasswordRequest } from '../../services/auth';
import { ThemeColors, spacing, MIN_TOUCH } from '../../styles/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setFormError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPasswordRequest(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not send reset email.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={26} color={colors.textSecondary} />
            </Pressable>

            <BrandWordmark
              textStyle={styles.wordmark}
              iwishColor={colors.brandEnd}
            />
            <AppText variant="displayList" style={styles.title}>
              Reset password
            </AppText>

            {sent ? (
              <View style={styles.form}>
                <AppText variant="body" style={styles.successText}>
                  If an account exists for{' '}
                  <AppText variant="bodySemibold">{email.trim()}</AppText>, we've
                  sent a reset link. Check your inbox and follow the link to
                  choose a new password.
                </AppText>
                <Button
                  title="Back to sign in"
                  onPress={() => navigation.replace('Login')}
                  style={styles.submit}
                />
              </View>
            ) : (
              <>
                <AppText variant="caption" style={styles.subtitle}>
                  Enter your email and we'll send you a link to reset your
                  password.
                </AppText>
                <View style={styles.form}>
                  <FormField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Your Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
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
                    title={submitting ? 'Sending…' : 'Send reset link'}
                    onPress={handleSubmit}
                    disabled={submitting}
                    style={styles.submit}
                  />
                </View>
              </>
            )}
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
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    content: { width: '100%', maxWidth: 460, alignSelf: 'center' },
    close: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      alignItems: 'flex-start',
      justifyContent: 'center',
      marginLeft: -spacing.xs,
    },
    wordmark: { fontSize: 24, marginTop: spacing.lg },
    title: { marginTop: spacing.lg },
    subtitle: { marginTop: spacing.sm, maxWidth: 320 },
    form: { marginTop: spacing.xl, gap: spacing.md },
    successText: { lineHeight: 22 },
    error: { color: colors.error },
    submit: { marginTop: spacing.sm },
  });
