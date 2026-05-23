import { useEffect, useRef } from 'react'
import {
  buildWellnessReportHtml,
  type WellnessReportData,
} from '../lib/wellnessReport'

type WellnessReportModalProps = {
  data: WellnessReportData
  onClose: () => void
}

export function WellnessReportModal({ data, onClose }: WellnessReportModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const html = buildWellnessReportHtml(data)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [onClose])

  function handlePrint() {
    const frame = iframeRef.current
    const win = frame?.contentWindow
    if (!win) return
    win.focus()
    win.print()
  }

  return (
    <div className="modal-backdrop wellness-report-backdrop" role="presentation">
      <div
        className="wellness-report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wellness-report-title"
      >
        <header className="wellness-report-toolbar">
          <h2 id="wellness-report-title">Report for your doctor</h2>
          <div className="wellness-report-actions">
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              Print / Save as PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <p className="wellness-report-toolbar-hint">
          Scroll to read the full report. Use Print → Save as PDF (no pop-up needed).
        </p>
        <iframe
          ref={iframeRef}
          className="wellness-report-frame"
          title="Wellness report preview"
          srcDoc={html}
        />
      </div>
    </div>
  )
}
