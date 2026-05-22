import { useState } from 'react'
import { compareWeekMetrics } from '../lib/wellnessTrends'
import {
  openWellnessPrintReport,
  type ActiveMedicationSummary,
  type WellnessReportData,
} from '../lib/wellnessReport'
import { lastNDates } from '../lib/wellness'
import { todayLocalDate } from '../lib/dates'
import type { WellnessLog, WellnessProfileInput } from '../lib/wellness'
import type { MedBriefingEntry } from '../hooks/useWellnessMedBriefings'

type WellnessExportReportProps = {
  userEmail: string | undefined
  profile: WellnessProfileInput
  medications: ActiveMedicationSummary[]
  reportLogs: WellnessLog[]
  briefingEntries: MedBriefingEntry[]
}

export function WellnessExportReport({
  userEmail,
  profile,
  medications,
  reportLogs,
  briefingEntries,
}: WellnessExportReportProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleExport() {
    setMessage(null)
    setError(null)

    const today = todayLocalDate()
    const recentWeek = lastNDates(7, today)
    const priorWeek = lastNDates(14, today).slice(7, 14)
    const logDates = lastNDates(14, today)

    const data: WellnessReportData = {
      generatedAt: new Date().toLocaleString(),
      userEmail,
      profile,
      medications,
      logs: reportLogs,
      logDates,
      weekComparisons: compareWeekMetrics(recentWeek, priorWeek, reportLogs),
      medReviews: briefingEntries.map((e) => ({
        med: e.med,
        review: e.review,
      })),
    }

    const ok = openWellnessPrintReport(data)
    if (ok) {
      setMessage(
        'Report opened — use Print → Save as PDF, or print for your appointment.',
      )
    } else {
      setError('Allow pop-ups for this site, then try again.')
    }
  }

  return (
    <section className="wellness-card wellness-export">
      <h3 className="wellness-section-title">Report for your doctor</h3>
      <p className="field-hint">
        Opens a printable summary of your baseline, last 14 days of logs, week-over-week
        notes, and medication briefings. Save as PDF from the print dialog.
      </p>

      {error && <p className="banner banner-error">{error}</p>}
      {message && <p className="banner banner-success-style">{message}</p>}

      <button type="button" className="btn btn-primary" onClick={handleExport}>
        Open printable report
      </button>
    </section>
  )
}
