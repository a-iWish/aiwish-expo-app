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
import { useAuth } from '../../context/AuthContext';
import { ThemeColors, spacing, MIN_TOUCH } from '../../styles/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setFormError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ email: email.trim(), password, fullName });
      navigation.goBack();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not create account.',
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

          <BrandWordmark textStyle={styles.wordmark} iwishColor={colors.brandEnd} />
          <AppText variant="displayList" style={styles.title}>
            Create account
          </AppText>
          <AppText variant="caption" style={styles.subtitle}>
            Join a.iwish to save products and get buy/wait verdicts.
          </AppText>

          <View style={styles.form}>
            <FormField
              label="Name (optional)"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              editable={!submitting}
            />
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
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder={`At least ${MIN_PASSWORD} characters`}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              secureTextEntry
              secureToggle
              editable={!submitting}
            />
            <FormField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter your password"
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
              title={submitting ? 'Creating account…' : 'Create account'}
              onPress={handleSubmit}
              disabled={submitting}
              style={styles.submit}
            />
          </View>

          <View style={styles.footer}>
            <AppText variant="caption">Already have an account? </AppText>
            <Pressable onPress={() => navigation.replace('Login')} hitSlop={8}>
              <AppText variant="bodySemibold" style={styles.link}>
                Sign in
              </AppText>
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    content: {
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
    },
    close: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      alignItems: 'flex-start',
      justifyContent: 'center',
      marginLeft: -spacing.xs,
    },
    wordmark: {
      fontSize: 24,
      marginTop: spacing.lg,
    },
    title: {
      marginTop: spacing.lg,
    },
    subtitle: {
      marginTop: spacing.sm,
      maxWidth: 300,
    },
    form: {
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    error: {
      color: colors.error,
    },
    submit: {
      marginTop: spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    link: {
      color: colors.brandEnd,
    },
  });
