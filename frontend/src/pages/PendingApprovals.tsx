import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ApprovalFeedbackBanners } from './pendingApprovals/ApprovalFeedbackBanners'
import { ApprovalFiltersCard } from './pendingApprovals/ApprovalFiltersCard'
import { ApprovalSummaryBar } from './pendingApprovals/ApprovalSummaryBar'
import { ApprovalsTable } from './pendingApprovals/ApprovalsTable'
import { usePendingApprovalsPage } from './pendingApprovals/usePendingApprovalsPage'

export default function PendingApprovals() {
  const { isAdmin } = useAuth()
  const { loading, feedback, filters, summary, table } = usePendingApprovalsPage(isAdmin)

  if (!isAdmin) {
    return <Navigate to="/contracts" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Pending approvals</h1>
        <p className="text-slate-500 text-sm">
          Review submitted timesheet entries and approve or reject them.
        </p>
      </div>

      {loading.isLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : loading.isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm space-y-3">
          <p>{loading.errorMessage}</p>
          <button
            type="button"
            onClick={loading.handleRetryLoad}
            className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100"
          >
            Retry
          </button>
        </div>
      ) : loading.entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <p className="text-slate-500 text-sm">No submitted timesheets are waiting for approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ApprovalFeedbackBanners feedback={feedback} />
          <ApprovalFiltersCard filters={filters} />
          <ApprovalSummaryBar summary={summary} />
          <ApprovalsTable table={table} />
        </div>
      )}
    </div>
  )
}
