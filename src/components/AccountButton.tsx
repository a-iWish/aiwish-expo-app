import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from './AppText';
import { AccountMenu } from './AccountMenu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors } from '../styles/theme';

export function accountInitial(
  fullName?: string | null,
  email?: string | null,
): string {
  return (fullName || email || '?').trim().charAt(0).toUpperCase();
}

export const AccountButton: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePress = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setMenuVisible(true);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={[styles.button, isAuthenticated && styles.buttonAuthed]}
        accessibilityRole="button"
        accessibilityLabel={isAuthenticated ? 'Account' : 'Sign in'}
        hitSlop={8}
      >
        {isAuthenticated ? (
          <AppText variant="bodySemibold" style={styles.initial}>
            {accountInitial(user?.full_name, user?.email)}
          </AppText>
        ) : (
          <Ionicons
            name="person-outline"
            size={20}
            color={colors.textSecondary}
          />
        )}
      </Pressable>

      <AccountMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonAuthed: {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.brandEnd,
    },
    initial: {
      color: colors.brandEnd,
    },
  });
