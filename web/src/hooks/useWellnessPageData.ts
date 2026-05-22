import { useEffect, useMemo, useState } from 'react'
import { filterMedicationsActiveOn } from '../lib/medicationDates'
import { todayLocalDate } from '../lib/dates'
import { supabase } from '../lib/supabase'
import type { Medication } from '../lib/types'
import type { ActiveMedicationSummary } from '../lib/wellnessReport'
import {
  emptyWellnessLogInput,
  emptyWellnessProfileInput,
  fetchWellnessLog,
  fetchWellnessLogsForDates,
  fetchWellnessProfile,
  lastNDates,
  logFromRow,
  profileToInput,
  type WellnessLog,
  type WellnessLogInput,
  type WellnessProfileInput,
} from '../lib/wellness'

export function useWellnessPageData(
  userId: string | undefined,
  selectedDate: string,
) {
  const today = todayLocalDate()
  const weekDates = useMemo(() => lastNDates(7, today), [today])
  const trendDates = useMemo(() => lastNDates(14, today), [today])
  const reportDates = trendDates

  const [profileDraft, setProfileDraft] =
    useState<WellnessProfileInput>(emptyWellnessProfileInput)
  const [logDraft, setLogDraft] = useState<WellnessLogInput>(() =>
    emptyWellnessLogInput(selectedDate),
  )
  const [weekLogs, setWeekLogs] = useState<WellnessLog[]>([])
  const [activeMeds, setActiveMeds] = useState<ActiveMedicationSummary[]>([])
  const [trendLogs, setTrendLogs] = useState<WellnessLog[]>([])
  const [reportLogs, setReportLogs] = useState<WellnessLog[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [logLoading, setLogLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    let active = true
    const controller = new AbortController()

    const timer = window.setTimeout(() => {
      if (!active) return
      setPageLoading(true)
      setError(null)

      void (async () => {
        const [profile, logs, trends] = await Promise.all([
          fetchWellnessProfile(userId),
          fetchWellnessLogsForDates(userId, weekDates),
          fetchWellnessLogsForDates(userId, trendDates),
        ])
        if (!active || controller.signal.aborted) return
        setProfileDraft(profileToInput(profile))
        setWeekLogs(logs)
        setTrendLogs(trends)
        setReportLogs(trends)

        if (!supabase) return
        const { data, error: medError } = await supabase
          .from('medications')
          .select('name, start_date, end_date')
          .eq('user_id', userId)
          .order('name')
        if (medError) throw medError
        const activeMedRows = filterMedicationsActiveOn(
          (data ?? []) as Medication[],
          today,
        )
        setActiveMeds(
          activeMedRows.map((m) => ({
            name: m.name,
            start_date: m.start_date,
            end_date: m.end_date,
          })),
        )
      })()
        .catch((err: unknown) => {
          if (!active || controller.signal.aborted) return
          setError(
            err instanceof Error ? err.message : 'Could not load wellness data',
          )
        })
        .finally(() => {
          if (!active || controller.signal.aborted) return
          setPageLoading(false)
        })
    }, 0)

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [userId, today, weekDates, trendDates])

  useEffect(() => {
    if (!userId || pageLoading) return

    let active = true
    const controller = new AbortController()

    const timer = window.setTimeout(() => {
      if (!active) return
      setLogLoading(true)

      void fetchWellnessLog(userId, selectedDate)
        .then((row) => {
          if (!active || controller.signal.aborted) return
          setLogDraft(row ? logFromRow(row) : emptyWellnessLogInput(selectedDate))
        })
        .catch((err: unknown) => {
          if (!active || controller.signal.aborted) return
          setError(err instanceof Error ? err.message : 'Could not load log')
        })
        .finally(() => {
          if (!active || controller.signal.aborted) return
          setLogLoading(false)
        })
    }, 0)

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [userId, selectedDate, pageLoading])

  async function refreshWeekLogs() {
    if (!userId) return
    const [logs, trends] = await Promise.all([
      fetchWellnessLogsForDates(userId, weekDates),
      fetchWellnessLogsForDates(userId, trendDates),
    ])
    setWeekLogs(logs)
    setTrendLogs(trends)
    setReportLogs(trends)
  }

  return {
    today,
    weekDates,
    profileDraft,
    setProfileDraft,
    logDraft,
    setLogDraft,
    weekLogs,
    trendLogs,
    reportLogs,
    reportDates,
    activeMeds,
    pageLoading,
    logLoading,
    error,
    setError,
    refreshWeekLogs,
  }
}
