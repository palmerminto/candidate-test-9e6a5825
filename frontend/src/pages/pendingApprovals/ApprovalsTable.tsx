import { Fragment, ReactNode } from 'react'
import { calculateEstimatedCost, formatCurrency } from '../../utils/cost'
import { formatContractDateRange, formatContractHeading } from './helpers'
import { ApprovalRow, PriceableApprovalRow } from './types'

const TABLE_COLUMN_COUNT = 7
const tabularNums = { fontVariantNumeric: 'tabular-nums' as const }

type ActionTrayProps = {
  children: ReactNode
}

type ApprovalsTableProps = {
  displayedRows: ApprovalRow[]
  displayedPriceableRows: PriceableApprovalRow[]
  selectedIds: Set<number>
  filtersBlockSelection: boolean
  allVisiblePriceableSelected: boolean
  isSelectAllIndeterminate: boolean
  approvingEntryId: number | null
  rejectingEntryId: number | null
  pendingEntryId: number | null
  isDecisionPending: boolean
  rejectionReason: string
  rejectionReasonError: string | null
  trimmedRejectionReason: string
  onToggleAllVisiblePriceable: () => void
  onToggleRow: (entryId: number) => void
  onOpenApprove: (entryId: number) => void
  onCancelApprove: () => void
  onHandleApprove: (entryId: number) => void
  onOpenReject: (entryId: number) => void
  onCancelReject: () => void
  onHandleReject: (entryId: number) => void
  onRejectionReasonChange: (value: string) => void
}

function ActionTray({ children }: ActionTrayProps) {
  return (
    <tr className="bg-slate-50">
      <td colSpan={TABLE_COLUMN_COUNT} className="px-4 py-4">
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">{children}</div>
      </td>
    </tr>
  )
}

export function ApprovalsTable({
  displayedRows,
  displayedPriceableRows,
  selectedIds,
  filtersBlockSelection,
  allVisiblePriceableSelected,
  isSelectAllIndeterminate,
  approvingEntryId,
  rejectingEntryId,
  pendingEntryId,
  isDecisionPending,
  rejectionReason,
  rejectionReasonError,
  trimmedRejectionReason,
  onToggleAllVisiblePriceable,
  onToggleRow,
  onOpenApprove,
  onCancelApprove,
  onHandleApprove,
  onOpenReject,
  onCancelReject,
  onHandleReject,
  onRejectionReasonChange,
}: ApprovalsTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600">
              <input
                type="checkbox"
                aria-label="Select all visible filtered priceable timesheets"
                aria-checked={isSelectAllIndeterminate ? 'mixed' : allVisiblePriceableSelected}
                checked={allVisiblePriceableSelected}
                disabled={filtersBlockSelection || displayedPriceableRows.length === 0}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = isSelectAllIndeterminate
                  }
                }}
                onChange={onToggleAllVisiblePriceable}
              />
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Freelancer</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Contract</th>
            <th
              className="text-right px-4 py-3 font-medium text-slate-600"
              style={{ minWidth: '7.5rem', ...tabularNums }}
            >
              Hours
            </th>
            <th
              className="text-right px-4 py-3 font-medium text-slate-600"
              style={{ minWidth: '10rem', ...tabularNums }}
            >
              Est. cost
            </th>
            <th
              scope="col"
              aria-label="Actions"
              className="text-left px-4 py-3 font-medium text-slate-600"
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {displayedRows.length === 0 ? (
            <tr>
              <td colSpan={TABLE_COLUMN_COUNT} className="px-4 py-6 text-slate-500 text-sm">
                No timesheet entries match the current filters.
              </td>
            </tr>
          ) : (
            displayedRows.map(({ entry, contract }) => {
              const freelancerName = contract?.freelancer.name ?? 'Unknown freelancer'
              const estimatedCostValue = contract
                ? calculateEstimatedCost(entry.hours, contract.daily_rate)
                : null
              const isPriceable = Boolean(contract)
              const isApprovingThisRow = approvingEntryId === entry.id
              const isRejectingThisRow = rejectingEntryId === entry.id
              const isPendingThisRow = pendingEntryId === entry.id && isDecisionPending
              const hasOpenTray = isApprovingThisRow || isRejectingThisRow
              const rowActionsDisabled = !isPriceable || isPendingThisRow || hasOpenTray
              let actionCellContent: ReactNode

              if (!isPriceable) {
                actionCellContent = (
                  <span className="text-slate-500 text-xs italic">Not actionable</span>
                )
              } else if (isPendingThisRow) {
                actionCellContent = (
                  <span className="text-slate-500 text-xs">
                    {isRejectingThisRow ? 'Rejecting…' : 'Approving…'}
                  </span>
                )
              } else {
                actionCellContent = (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={rowActionsDisabled}
                      onClick={() => onOpenApprove(entry.id)}
                      aria-label={`Approve entry for ${freelancerName} on ${entry.date}`}
                      className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={rowActionsDisabled}
                      onClick={() => onOpenReject(entry.id)}
                      aria-label={`Reject entry for ${freelancerName} on ${entry.date}`}
                      className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                )
              }

              return (
                <Fragment key={entry.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      <input
                        type="checkbox"
                        aria-label={`Select entry for ${freelancerName} on ${entry.date}`}
                        checked={isPriceable && selectedIds.has(entry.id)}
                        disabled={!isPriceable || filtersBlockSelection || isPendingThisRow}
                        onChange={() => onToggleRow(entry.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{entry.date}</td>
                    <td className="px-4 py-3 text-slate-700">{freelancerName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {contract ? (
                        <div>
                          <div>{formatContractHeading(contract)}</div>
                          <div className="text-slate-500 text-xs">
                            {formatContractDateRange(contract)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Missing contract details</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-slate-700 text-right"
                      style={{ minWidth: '7.5rem', ...tabularNums }}
                    >
                      {entry.hours}h
                    </td>
                    <td
                      className="px-4 py-3 text-slate-700 text-right"
                      style={{ minWidth: '10rem', ...tabularNums }}
                    >
                      {estimatedCostValue !== null ? (
                        formatCurrency(estimatedCostValue)
                      ) : (
                        <span className="text-slate-500 text-xs italic">Not priceable</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{actionCellContent}</td>
                  </tr>
                  {isApprovingThisRow && (
                    <ActionTray>
                      <p className="text-sm text-slate-700">Approve this pending timesheet entry?</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={isPendingThisRow}
                          onClick={() => onHandleApprove(entry.id)}
                          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isPendingThisRow ? 'Approving…' : 'Confirm approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isPendingThisRow}
                          onClick={onCancelApprove}
                          className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Cancel approval
                        </button>
                      </div>
                    </ActionTray>
                  )}
                  {isRejectingThisRow && (
                    <ActionTray>
                      <div>
                        <label
                          htmlFor={`reject_reason_${entry.id}`}
                          className="block text-sm font-medium text-slate-700 mb-1"
                        >
                          Rejection reason
                        </label>
                        <input
                          id={`reject_reason_${entry.id}`}
                          type="text"
                          required
                          value={rejectionReason}
                          onChange={(e) => onRejectionReasonChange(e.target.value)}
                          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {rejectionReasonError && (
                          <p className="text-red-600 text-xs mt-1">{rejectionReasonError}</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={!trimmedRejectionReason || isPendingThisRow}
                          onClick={() => onHandleReject(entry.id)}
                          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isPendingThisRow ? 'Rejecting…' : 'Confirm rejection'}
                        </button>
                        <button
                          type="button"
                          disabled={isPendingThisRow}
                          onClick={onCancelReject}
                          className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Cancel rejection
                        </button>
                      </div>
                    </ActionTray>
                  )}
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
