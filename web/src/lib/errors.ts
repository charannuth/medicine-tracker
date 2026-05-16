type ErrorLike = {
  message?: string
  code?: string
  details?: string
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as ErrorLike
    const msg = e.message ?? e.details
    if (msg) {
      if (
        /start_date|end_date/i.test(msg) ||
        e.code === 'PGRST204' ||
        e.code === '42703'
      ) {
        return (
          'Database is missing schedule date columns. In Supabase SQL Editor, ' +
          'run supabase/migrations/004_medication_dates.sql, then try again.'
        )
      }
      if (/dosage/i.test(msg) && /column/i.test(msg)) {
        return (
          'Database schema is out of date. Run pending migrations in Supabase ' +
          '(see supabase/migrations/), then try again.'
        )
      }
      return msg
    }
  }

  if (err instanceof Error) return err.message
  return fallback
}
