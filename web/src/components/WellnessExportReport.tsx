import { useState } from 'react'
import { createWellnessReportData } from '../lib/wellnessReport'
import type { ActiveMedicationSummary } from '../lib/wellnessReport'
import type { WellnessLog, WellnessProfileInput } from '../lib/wellness'
import type { PrnInsightsSummary } from '../lib/prnInsights'
import type { MedBriefingEntry } from '../hooks/useWellnessMedBriefings'
import { WellnessReportModal } from './WellnessReportModal'

type WellnessExportReportProps = {
  userEmail: string | undefined
  profile: WellnessProfileInput
  medications: ActiveMedicationSummary[]
  reportLogs: WellnessLog[]
  prnInsights: PrnInsightsSummary
  briefingEntries: MedBriefingEntry[]
}

export function WellnessExportReport({
  userEmail,
  profile,
  medications,
  reportLogs,
  prnInsights,
  briefingEntries,
}: WellnessExportReportProps) {
  const [reportOpen, setReportOpen] = useState(false)

  const reportData = createWellnessReportData({
    userEmail,
    profile,
    medications,
    reportLogs,
    prnInsights,
    briefingEntries,
  })

  return (
    <>
      <section className="wellness-card wellness-export">
        <h3 className="wellness-section-title">Report for your doctor</h3>
        <p className="field-hint">
          Opens a full-screen preview of your baseline, last 14 days of logs,
          as-needed medication patterns, week-over-week notes, and medication
          briefings. Then use Print → Save as PDF — no pop-up required.
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setReportOpen(true)}
        >
          View printable report
        </button>
      </section>

      {reportOpen && (
        <WellnessReportModal
          data={reportData}
          onClose={() => setReportOpen(false)}
        />
      )}
    </>
  )
}
