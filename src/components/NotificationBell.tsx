import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from './AppText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors } from '../styles/theme';

/** Bell + unread badge shown next to the account button on every header. */
export const NotificationBell: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!isAuthenticated) return null;

  return (
    <Pressable
      onPress={() => navigation.navigate('Notifications')}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'
      }
      hitSlop={8}
    >
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={20}
        color={unreadCount > 0 ? colors.brandEnd : colors.textSecondary}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : String(unreadCount)}
          </AppText>
        </View>
      )}
    </Pressable>
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
    badge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      lineHeight: 14,
    },
  });
