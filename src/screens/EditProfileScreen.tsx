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
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailChanged =
    email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase();
  const nameChanged = (fullName.trim() || null) !== (user?.full_name ?? null);
  const dirty = emailChanged || nameChanged;

  const handleSubmit = async () => {
    setFormError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!dirty) {
      navigation.goBack();
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile({
        fullName: nameChanged ? fullName : undefined,
        email: emailChanged ? email : undefined,
      });
      navigation.goBack();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not update profile.',
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
        <AppText variant="title">Edit profile</AppText>
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
              label="Name"
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
            {emailChanged && (
              <AppText variant="caption" style={styles.hint}>
                You'll need to verify your new email address after saving.
              </AppText>
            )}

            {!!formError && (
              <AppText variant="caption" style={styles.error}>
                {formError}
              </AppText>
            )}

            <Button
              title={submitting ? 'Saving…' : 'Save changes'}
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
    hint: { color: colors.textSecondary },
    error: { color: colors.error },
    submit: { marginTop: spacing.sm },
  });
