export const IN_APP_REMINDER_EVENT = 'dr-dose-in-app-reminder'

export type InAppReminderDetail = {
  title: string
  body: string
}

export function emitInAppReminder(detail: InAppReminderDetail): void {
  window.dispatchEvent(
    new CustomEvent<InAppReminderDetail>(IN_APP_REMINDER_EVENT, { detail }),
  )
}
