import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

/**
 * Tapping a device notification opens the relevant product. Rendered once
 * inside the NavigationContainer; renders nothing itself.
 */
export const NotificationTapHandler: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const productId = res.notification.request.content.data?.product_id;
      if (typeof productId === 'string' && productId) {
        navigation.navigate('ProductDetail', { productId });
      } else {
        navigation.navigate('Notifications');
      }
    });
    return () => sub.remove();
  }, [navigation]);

  return null;
};
