import type { PendingApprovalsSummaryModel } from './types'

const tabularNums = { fontVariantNumeric: 'tabular-nums' as const }

type ApprovalSummaryBarProps = {
  summary: PendingApprovalsSummaryModel
}

export function ApprovalSummaryBar({ summary }: ApprovalSummaryBarProps) {
  const {
    summaryText,
    selectedRows,
    bulkActionsDisabled,
    bulkActionTitle,
    bulkConfirmDisabled,
    isBulkRunning,
    isBulkApproveOpen,
    isBulkRejectOpen,
    bulkRejectionReason,
    bulkRejectionReasonError,
    trimmedBulkRejectionReason,
    openBulkApprove,
    openBulkReject,
    confirmBulkApprove,
    cancelBulkApprove,
    handleBulkRejectionReasonChange,
    handleBulkReject,
    cancelBulkReject,
  } = summary

  const selectedCount = selectedRows.length

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-700" style={tabularNums}>
          {summaryText}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={bulkActionsDisabled}
            title={bulkActionTitle}
            onClick={openBulkApprove}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Approve selected
          </button>
          <button
            type="button"
            disabled={bulkActionsDisabled}
            title={bulkActionTitle}
            onClick={openBulkReject}
            className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Reject selected
          </button>
        </div>
      </div>
      {isBulkApproveOpen && (
        <div className="border-t border-slate-200 pt-4 space-y-4">
          <p className="text-sm text-slate-700">
            {selectedCount === 1
              ? 'Approve this selected pending timesheet entry?'
              : `Approve ${selectedCount} selected pending timesheet entries?`}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={bulkConfirmDisabled}
              onClick={confirmBulkApprove}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBulkRunning ? 'Approving…' : 'Confirm approve'}
            </button>
            <button
              type="button"
              disabled={isBulkRunning}
              onClick={cancelBulkApprove}
              className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel approval
            </button>
          </div>
        </div>
      )}
      {isBulkRejectOpen && (
        <div className="border-t border-slate-200 pt-4 space-y-4">
          <div>
            <label
              htmlFor="bulk_reject_reason"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Rejection reason
            </label>
            <input
              id="bulk_reject_reason"
              type="text"
              required
              value={bulkRejectionReason}
              onChange={(e) => handleBulkRejectionReasonChange(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {bulkRejectionReasonError && (
              <p className="text-red-600 text-xs mt-1">{bulkRejectionReasonError}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!trimmedBulkRejectionReason || bulkConfirmDisabled}
              onClick={handleBulkReject}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBulkRunning ? 'Rejecting…' : 'Confirm rejection'}
            </button>
            <button
              type="button"
              disabled={isBulkRunning}
              onClick={cancelBulkReject}
              className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel rejection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
