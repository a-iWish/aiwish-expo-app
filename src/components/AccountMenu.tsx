import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from './AppText';
import { accountInitial } from './AccountButton';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors, spacing, MIN_TOUCH } from '../styles/theme';

interface AccountMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const go = (screen: keyof RootStackParamList) => {
    onClose();
    navigation.navigate(screen as never);
  };

  const goSettings = () => {
    onClose();
    navigation.navigate('Main', { screen: 'Settings' });
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { top: insets.top + 52 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <AppText variant="bodySemibold" style={styles.avatarText}>
                {accountInitial(user?.full_name, user?.email)}
              </AppText>
            </View>
            <View style={styles.headerInfo}>
              {!!user?.full_name && (
                <AppText variant="bodySemibold" numberOfLines={1}>
                  {user.full_name}
                </AppText>
              )}
              <AppText variant="caption" numberOfLines={1}>
                {user?.email}
              </AppText>
              {user && !user.email_verified && (
                <AppText variant="caption" style={styles.unverified}>
                  Email not verified
                </AppText>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <MenuItem
            icon="person-outline"
            label="Edit profile"
            color={colors.text}
            onPress={() => go('EditProfile')}
            styles={styles}
            tint={colors.textSecondary}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Change password"
            color={colors.text}
            onPress={() => go('ChangePassword')}
            styles={styles}
            tint={colors.textSecondary}
          />
          <MenuItem
            icon="settings-outline"
            label="Settings"
            color={colors.text}
            onPress={goSettings}
            styles={styles}
            tint={colors.textSecondary}
          />

          <View style={styles.divider} />

          <MenuItem
            icon="log-out-outline"
            label="Log out"
            color={colors.error}
            onPress={handleLogout}
            styles={styles}
            tint={colors.error}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const MenuItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  tint: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}> = ({ icon, label, color, tint, onPress, styles }) => (
  <Pressable style={styles.item} onPress={onPress} accessibilityRole="button">
    <Ionicons name={icon} size={20} color={tint} />
    <AppText variant="body" style={{ color }}>
      {label}
    </AppText>
  </Pressable>
);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    card: {
      position: 'absolute',
      right: spacing.md,
      width: 250,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.xs,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.brandEnd,
    },
    avatarText: {
      color: colors.brandEnd,
    },
    headerInfo: {
      flex: 1,
      gap: 2,
    },
    unverified: {
      color: colors.warning,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.hairline,
      marginVertical: spacing.xs,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: MIN_TOUCH,
    },
  });
