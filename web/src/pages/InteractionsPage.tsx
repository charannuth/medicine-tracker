import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  checkMedicationInteractions,
  severityLabel,
  type InteractionCheckResult,
} from '../lib/drugInteractions'
import { filterMedicationsActiveOn } from '../lib/medicationDates'
import { supabase } from '../lib/supabase'
import { todayLocalDate } from '../lib/dates'
import type { Medication } from '../lib/types'

export function InteractionsPage() {
  const { user } = useAuth()
  const [result, setResult] = useState<InteractionCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [extraDrug, setExtraDrug] = useState('')
  const [rechecking, setRechecking] = useState(false)

  const runCheck = useCallback(
    async (names: string[]) => {
      setError(null)
      const data = await checkMedicationInteractions(names)
      setResult(data)
    },
    [],
  )

  useEffect(() => {
    if (!user) return

    let active = true

    async function load() {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        if (!supabase) {
          setError('Supabase is not configured')
          return
        }

        const userId = user.id
        const { data, error: fetchError } = await supabase
          .from('medications')
          .select('name, start_date, end_date')
          .eq('user_id', userId)
          .order('name')

        if (fetchError) throw fetchError

        const today = todayLocalDate()
        const activeMeds = filterMedicationsActiveOn(
          (data ?? []) as Medication[],
          today,
        )
        const names = activeMeds.map((m) => m.name)

        if (active) await runCheck(names)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not check interactions')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [user, runCheck])

  async function handleAddExtraDrug(e: React.FormEvent) {
    e.preventDefault()
    if (!result || !extraDrug.trim()) return

    setRechecking(true)
    try {
      const names = [...result.inputNames, extraDrug.trim()]
      await runCheck(names)
      setExtraDrug('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check interactions')
    } finally {
      setRechecking(false)
    }
  }

  const unresolved = result?.resolved.filter((r) => !r.canonical) ?? []
  const majorCount =
    result?.interactions.filter((i) => i.severity === 'major').length ?? 0

  return (
    <main className="page interactions-page">
      <header className="page-header">
        <h2>Drug interaction check</h2>
        <p className="page-subtitle">
          Cross-reference your active medications for known interaction warnings
        </p>
      </header>

      <div className="interaction-disclaimer" role="note">
        <strong>Not medical advice.</strong> This tool uses a limited reference
        database plus RxNorm name matching. It cannot list every interaction.
        Always confirm with your doctor or pharmacist before changing medications.
      </div>

      {error && <p className="banner banner-error">{error}</p>}

      {loading ? (
        <p className="loading">Checking your medications…</p>
      ) : result ? (
        <>
          <section className="interaction-summary-card">
            <h3>Your active medications</h3>
            {result.inputNames.length === 0 ? (
              <p>
                No active medications today.{' '}
                <Link to="/medications">Add medications</Link> to run a check.
              </p>
            ) : (
              <ul className="interaction-med-list">
                {result.resolved.map((row) => (
                  <li key={row.original}>
                    <span className="interaction-med-name">{row.original}</span>
                    {row.canonical && row.canonical !== normalize(row.original) && (
                      <span className="interaction-med-mapped">
                        → {row.canonical}
                      </span>
                    )}
                    {!row.canonical && (
                      <span className="interaction-med-unknown">
                        — not in reference set
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {result.inputNames.length >= 2 && (
              <p className="interaction-meta">
                Checked {result.pairCount} pair{result.pairCount === 1 ? '' : 's'} ·{' '}
                {result.interactions.length} warning
                {result.interactions.length === 1 ? '' : 's'} found
                {majorCount > 0 && (
                  <span className="interaction-major-count">
                    {' '}
                    ({majorCount} major)
                  </span>
                )}
              </p>
            )}
          </section>

          {result.interactions.length > 0 ? (
            <ul className="interaction-results">
              {result.interactions.map((item) => (
                <li
                  key={`${item.drugA}-${item.drugB}`}
                  className={`interaction-item interaction-${item.severity}`}
                >
                  <div className="interaction-item-header">
                    <span className={`badge badge-severity-${item.severity}`}>
                      {severityLabel(item.severity)}
                    </span>
                    <h4>
                      {item.displayA} + {item.displayB}
                    </h4>
                  </div>
                  <p>{item.description}</p>
                  <p className="interaction-management">
                    <strong>What to do:</strong> {item.management}
                  </p>
                </li>
              ))}
            </ul>
          ) : result.inputNames.length >= 2 ? (
            <div className="interaction-clear banner banner-success-style">
              <p>
                <strong>No known interactions</strong> in our reference database
                for your current medication list.
              </p>
              <p className="interaction-clear-note">
                This does not guarantee safety. New drugs, doses, and conditions
                can still matter — ask a pharmacist if unsure.
              </p>
            </div>
          ) : null}

          {unresolved.length > 0 && (
            <section className="interaction-unresolved">
              <h3>Could not fully map</h3>
              <p>
                These names were not matched to our interaction database. They were
                still included in the check if a synonym matched.
              </p>
              <ul>
                {unresolved.map((r) => (
                  <li key={r.original}>{r.original}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="interaction-extra">
            <h3>Check another drug</h3>
            <p className="field-hint">
              See if a medication you are considering interacts with your current list.
            </p>
            <form className="interaction-extra-form" onSubmit={handleAddExtraDrug}>
              <input
                value={extraDrug}
                onChange={(e) => setExtraDrug(e.target.value)}
                placeholder="e.g. ibuprofen"
                aria-label="Drug name to check"
              />
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={rechecking || !extraDrug.trim()}
              >
                {rechecking ? 'Checking…' : 'Add & recheck'}
              </button>
            </form>
          </section>
        </>
      ) : null}

      <p className="page-footer-hint">
        <Link to="/">Back to Today</Link>
      </p>
    </main>
  )
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
}
