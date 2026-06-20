import type { Contract, TimesheetEntry } from '../../api/client'
import type { TimesheetDecisionPayload } from '../../api/timesheets'

export type ApprovalRow = {
  entry: TimesheetEntry
  contract: Contract | undefined
}

export type PriceableApprovalRow = {
  entry: TimesheetEntry
  contract: Contract
}

export type ApprovalFilters = {
  contractFilter: string
  freelancerFilter: string
  startDate: string
  endDate: string
}

export type BulkFailureState = {
  action: 'approved' | 'rejected'
  succeeded: number
  failed: number
  failedIds: number[]
  payload: TimesheetDecisionPayload
}

export type PendingActionKind = 'approve' | 'reject'

export type PendingApprovalsLoadingModel = {
  isLoading: boolean
  isError: boolean
  entries: TimesheetEntry[]
  errorMessage: string
  handleRetryLoad: () => void
}

export type PendingApprovalsFeedbackModel = {
  actionError: string | null
  actionSuccess: string | null
  bulkFailureState: BulkFailureState | null
  isBulkRunning: boolean
  handleBulkRetry: () => void
}

export type PendingApprovalsFiltersModel = {
  contractFilter: string
  freelancerFilter: string
  startDate: string
  endDate: string
  contractOptions: Contract[]
  freelancerOptions: Contract['freelancer'][]
  selectedContract: Contract | undefined
  selectedFreelancer: Contract['freelancer'] | undefined
  isDateRangeInvalid: boolean
  hasActiveFilters: boolean
  isInteractionLocked: boolean
  setContractFilter: (value: string) => void
  setFreelancerFilter: (value: string) => void
  setStartDate: (value: string) => void
  setEndDate: (value: string) => void
  clearFilters: () => void
}

export type PendingApprovalsSummaryModel = {
  summaryText: string
  selectedRows: PriceableApprovalRow[]
  bulkActionsDisabled: boolean
  bulkActionTitle: string | undefined
  bulkConfirmDisabled: boolean
  isBulkRunning: boolean
  isBulkApproveOpen: boolean
  isBulkRejectOpen: boolean
  bulkRejectionReason: string
  bulkRejectionReasonError: string | null
  trimmedBulkRejectionReason: string
  openBulkApprove: () => void
  openBulkReject: () => void
  confirmBulkApprove: () => void
  cancelBulkApprove: () => void
  handleBulkRejectionReasonChange: (value: string) => void
  handleBulkReject: () => void
  cancelBulkReject: () => void
}

export type PendingApprovalsTableModel = {
  displayedRows: ApprovalRow[]
  displayedPriceableRows: PriceableApprovalRow[]
  selectedIds: Set<number>
  allVisiblePriceableSelected: boolean
  isSelectAllIndeterminate: boolean
  approvingEntryId: number | null
  rejectingEntryId: number | null
  pendingEntryIds: Set<number>
  pendingActionKind: PendingActionKind | null
  isAnyActionPending: boolean
  isBulkInteractionLocked: boolean
  rejectionReason: string
  rejectionReasonError: string | null
  trimmedRejectionReason: string
  filtersBlockSelection: boolean
  toggleAllVisiblePriceable: () => void
  toggleRow: (entryId: number) => void
  openApprove: (entryId: number) => void
  cancelApprove: () => void
  handleApprove: (entryId: number) => void
  openReject: (entryId: number) => void
  cancelReject: () => void
  handleReject: (entryId: number) => void
  handleRejectionReasonChange: (value: string) => void
}
