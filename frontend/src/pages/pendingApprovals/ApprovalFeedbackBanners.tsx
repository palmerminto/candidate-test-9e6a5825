import { formatBulkResultMessage } from './helpers'
import type { PendingApprovalsFeedbackModel } from './types'

type ApprovalFeedbackBannersProps = {
  feedback: PendingApprovalsFeedbackModel
}

export function ApprovalFeedbackBanners({ feedback }: ApprovalFeedbackBannersProps) {
  const { actionError, actionSuccess, bulkFailureState, isBulkRunning, handleBulkRetry } = feedback

  if (!actionError && !actionSuccess && !bulkFailureState) {
    return null
  }

  return (
    <>
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded px-3 py-2">
          {actionSuccess}
        </div>
      )}
      {bulkFailureState && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
          {formatBulkResultMessage(
            bulkFailureState.action,
            bulkFailureState.succeeded,
            bulkFailureState.failed
          )}{' '}
          ·{' '}
          <button
            type="button"
            onClick={handleBulkRetry}
            disabled={isBulkRunning}
            className="text-indigo-600 hover:text-indigo-800 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Retry
          </button>
        </div>
      )}
    </>
  )
}
