/**
 * Expo push-notification registration.
 *
 * Requests permission, obtains the device's Expo push token, and registers it
 * with the API so the price-drop background job can reach this device. Safe to
 * call repeatedly (the API upserts) and on the simulator (no-ops gracefully).
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken, unregisterPushToken } from './api';

// Foreground display behavior: show the alert + play sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let cachedToken: string | null = null;

async function getExpoPushToken(): Promise<string | null> {
  // Push tokens only work on physical devices.
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // projectId is required for getExpoPushTokenAsync in SDK 49+.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResult.data;
  } catch {
    return null;
  }
}

/**
 * Register this device for push notifications and store the token server-side.
 * Returns the token on success, or null if unavailable (simulator/denied).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const token = await getExpoPushToken();
    if (!token) return null;
    cachedToken = token;
    await registerPushToken(token, Platform.OS);
    return token;
  } catch {
    return null;
  }
}

/** Remove this device's token from the server (called on logout). */
export async function unregisterForPushNotifications(): Promise<void> {
  if (!cachedToken) return;
  try {
    await unregisterPushToken(cachedToken);
  } catch {
    // best-effort
  } finally {
    cachedToken = null;
  }
}
