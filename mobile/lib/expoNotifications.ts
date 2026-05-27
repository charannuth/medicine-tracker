/** Lazy-load expo-notifications so Metro reload does not crash before a native rebuild. */

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;
let handlerInstalled = false;

export async function getExpoNotifications(): Promise<NotificationsModule | null> {
  if (cached !== undefined) return cached;

  try {
    const Notifications = await import('expo-notifications');
    if (!handlerInstalled) {
      handlerInstalled = true;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
    cached = Notifications;
    return Notifications;
  } catch {
    cached = null;
    return null;
  }
}

export function notificationsNativeMissing(): boolean {
  return cached === null;
}
