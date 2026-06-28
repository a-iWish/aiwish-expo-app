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
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigation.goBack();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not sign in.');
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
            Welcome back
          </AppText>
          <AppText variant="caption" style={styles.subtitle}>
            Sign in to sync your wishlist and price alerts.
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
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
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

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={8}
              style={styles.forgot}
            >
              <AppText variant="caption" style={styles.link}>
                Forgot password?
              </AppText>
            </Pressable>

            <Button
              title={submitting ? 'Signing in…' : 'Sign in'}
              onPress={handleSubmit}
              disabled={submitting}
              style={styles.submit}
            />
          </View>

          <View style={styles.footer}>
            <AppText variant="caption">Don't have an account? </AppText>
            <Pressable
              onPress={() => navigation.replace('Register')}
              hitSlop={8}
            >
              <AppText variant="bodySemibold" style={styles.link}>
                Create one
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
      marginTop: spacing.xl,
      gap: spacing.md,
    },
    error: {
      color: colors.error,
    },
    forgot: {
      alignSelf: 'flex-end',
    },
    submit: {
      marginTop: spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xl,
    },
    link: {
      color: colors.brandEnd,
    },
  });
