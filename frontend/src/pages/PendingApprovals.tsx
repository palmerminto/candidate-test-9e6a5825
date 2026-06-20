import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchTimesheets } from '../api/timesheets'
import { useAuth } from '../hooks/useAuth'

export default function PendingApprovals() {
  const { isAdmin } = useAuth()

  const timesheetsQuery = useQuery({
    queryKey: ['timesheets', { status: 'submitted' }],
    queryFn: () => fetchTimesheets({ status: 'submitted' }),
    enabled: isAdmin,
  })

  if (!isAdmin) {
    return <Navigate to="/contracts" replace />
  }

  const isLoading = timesheetsQuery.isLoading
  const isError = timesheetsQuery.isError
  const entries = timesheetsQuery.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Pending approvals</h1>
        <p className="text-slate-500 text-sm">
          Review submitted timesheet entries and approve or reject them.
        </p>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          Failed to load pending approvals. Please try again.
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <p className="text-slate-500 text-sm">No submitted timesheets are waiting for approval.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <p className="text-slate-500 text-sm">
            {entries.length} submitted {entries.length === 1 ? 'entry' : 'entries'}
          </p>
          <p className="text-slate-500 text-sm">The approvals table will appear here in Step 4.</p>
        </div>
      )}
    </div>
  )
}
