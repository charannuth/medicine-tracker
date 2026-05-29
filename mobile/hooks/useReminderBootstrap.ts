import { useEffect } from 'react';
import { AppState } from 'react-native';
import { getReminders } from '../lib/settings';
import { requestNotificationPermission } from '../lib/notifications';
import { rescheduleAllReminders } from '../lib/reminders';

/**
 * Keeps native dose reminders in sync when the app opens or returns to foreground.
 */
export function useReminderBootstrap(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    async function sync() {
      if (!userId) return;
      const { enabled } = await getReminders();
      if (!enabled) return;
      const granted = await requestNotificationPermission();
      if (!granted) return;
      try {
        await rescheduleAllReminders(userId);
      } catch {
        // ignore scheduling errors on bootstrap
      }
    }

    void sync();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });

    return () => sub.remove();
  }, [userId]);
}
