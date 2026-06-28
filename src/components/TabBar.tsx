import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, SEMIBOLD_FONT } from '../styles/theme';

type IonIcon = keyof typeof Ionicons.glyphMap;

const TAB_CONFIG: Record<
  string,
  { label: string; icon: IonIcon; activeIcon: IonIcon }
> = {
  Discover: { label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
  Wishlist: { label: 'Wishlist', icon: 'heart-outline', activeIcon: 'heart' },
  Friends: { label: 'Friends', icon: 'people-outline', activeIcon: 'people' },
  Settings: { label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
};

export const TabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(
    () => createStyles(colors, insets.bottom),
    [colors, insets.bottom],
  );

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? {
            label: route.name,
            icon: 'ellipse-outline' as IonIcon,
            activeIcon: 'ellipse' as IonIcon,
          };
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
            >
              {isFocused && <View style={styles.activeIndicator} />}
              <Ionicons
                name={isFocused ? config.activeIcon : config.icon}
                size={22}
                color={isFocused ? colors.brandEnd : colors.textSoft}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#18181B',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        android: { elevation: 8 },
      }),
    },
    bar: {
      flexDirection: 'row',
      height: 49,
      marginBottom: bottomInset,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      position: 'relative',
      paddingTop: 4,
    },
    activeIndicator: {
      position: 'absolute',
      top: 4,
      width: 56,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.brandEnd + '20',
    },
    label: {
      fontSize: 10,
      fontFamily: SEMIBOLD_FONT,
      color: colors.textSoft,
      letterSpacing: 0.1,
    },
    labelActive: {
      color: colors.brandEnd,
    },
  });
