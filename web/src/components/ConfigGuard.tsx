import type { ReactNode } from 'react'
import { isSupabaseConfigured } from '../lib/supabase'

export function ConfigGuard({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="setup-page">
        <div className="setup-card">
          <h1>Dr. Dose</h1>
          <p>Supabase is not configured yet.</p>
          <ol>
            <li>
              Create a project at{' '}
              <a href="https://supabase.com" target="_blank" rel="noreferrer">
                supabase.com
              </a>
            </li>
            <li>
              Run <code>supabase/schema.sql</code> in the SQL Editor
            </li>
            <li>
              Copy <code>web/.env.example</code> to <code>web/.env</code> and add
              your project URL and anon key
            </li>
            <li>
              Restart <code>npm run dev</code> in the <code>web</code> folder
            </li>
          </ol>
          <p className="setup-note">
            See <code>docs/SUPABASE_SETUP.md</code> in the repo for full steps.
          </p>
        </div>
      </div>
    )
  }

  return children
}
