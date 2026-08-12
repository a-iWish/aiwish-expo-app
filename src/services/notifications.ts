/**
 * Local device notifications.
 *
 * The server decides WHAT to notify (the alert job / trigger route write rows
 * into the notifications table); the app fetches unseen ones and presents them
 * as local notifications — banner, sound, lock screen — indistinguishable from
 * remote pushes but requiring no APNs/FCM credentials.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Foreground display behavior: show the alert + play sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for notification permission (no-op if already granted/denied).
 * Safe to call repeatedly; returns whether we may present notifications.
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    return true;
  } catch {
    return false;
  }
}

/** Present a notification immediately (banner + sound + notification list). */
export async function presentLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: 'default' },
      trigger: null, // deliver now
    });
  } catch {
    // best-effort
  }
}
