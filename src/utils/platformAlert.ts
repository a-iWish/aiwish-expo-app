/**
 * Cross-platform Alert / Share helpers.
 *
 * react-native-web ships `Alert.alert` as a no-op (`static alert(){}`), so on the
 * web build every native Alert silently does nothing — confirmations never fire
 * and error messages never show. `Share.share` on web only works when the browser
 * exposes the Web Share API. These helpers route to the right implementation per
 * platform so the same call site works on iOS, Android and web.
 */
import { Alert, Platform, Share } from 'react-native';

type ConfirmOpts = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

/** A simple notice. Native: Alert.alert. Web: window.alert (RNW Alert is a no-op). */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(text);
    }
    return;
  }
  Alert.alert(title, message);
}

/** A confirm dialog. Native: Alert.alert buttons. Web: window.confirm. */
export function confirmAction(opts: ConfirmOpts): void {
  const {
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    destructive = false,
    onConfirm,
    onCancel,
  } = opts;

  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    const ok =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(text)
        : true;
    if (ok) onConfirm();
    else onCancel?.();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}

/**
 * Share content. Native: RN Share sheet. Web: Web Share API when available,
 * otherwise copy the link to the clipboard and tell the user.
 */
export async function shareContent(content: {
  message: string;
  url?: string;
  title?: string;
}): Promise<void> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({
          title: content.title,
          text: content.message,
          url: content.url,
        });
        return;
      } catch (e) {
        // User dismissed the native share sheet — do nothing.
        if (e instanceof Error && e.name === 'AbortError') return;
        // Any other failure falls through to the clipboard path.
      }
    }
    const toCopy = content.url ?? content.message;
    if (nav?.clipboard?.writeText) {
      try {
        await nav.clipboard.writeText(toCopy);
        notify('Link copied', 'The link is on your clipboard — paste it to share.');
        return;
      } catch {
        // Clipboard blocked — fall through to showing the link.
      }
    }
    notify('Share', toCopy);
    return;
  }

  await Share.share(
    content.url
      ? { message: content.message, url: content.url }
      : { message: content.message },
  );
}
