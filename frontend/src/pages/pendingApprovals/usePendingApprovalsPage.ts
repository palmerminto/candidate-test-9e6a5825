import { usePendingApprovalsActions } from './usePendingApprovalsActions'
import { usePendingApprovalsRows } from './usePendingApprovalsRows'

export function usePendingApprovalsPage(isAdmin: boolean) {
  const rows = usePendingApprovalsRows(isAdmin)
  const actions = usePendingApprovalsActions({
    hasSelection: rows.hasSelection,
    isDateRangeInvalid: rows.isDateRangeInvalid,
    selectedRows: rows.selectedRows,
    setSelectedIds: rows.setSelectedIds,
    setOptimisticallyHiddenIds: rows.setOptimisticallyHiddenIds,
  })

  const filtersBlockSelection = rows.isDateRangeInvalid || actions.isInteractionLocked

  function toggleRow(entryId: number) {
    if (filtersBlockSelection) return
    rows.toggleRow(entryId)
  }

  function toggleAllVisiblePriceable() {
    if (filtersBlockSelection) return
    rows.toggleAllVisiblePriceable()
  }

  return {
    loading: {
      isLoading: rows.isLoading,
      isError: rows.isError,
      entries: rows.entries,
      errorMessage: rows.errorMessage,
      handleRetryLoad: rows.handleRetryLoad,
    },
    feedback: {
      actionError: actions.actionError,
      actionSuccess: actions.actionSuccess,
      bulkFailureState: actions.bulkFailureState,
      isBulkRunning: actions.isBulkRunning,
      handleBulkRetry: actions.handleBulkRetry,
    },
    filters: {
      contractFilter: rows.contractFilter,
      freelancerFilter: rows.freelancerFilter,
      startDate: rows.startDate,
      endDate: rows.endDate,
      contractOptions: rows.contractOptions,
      freelancerOptions: rows.freelancerOptions,
      selectedContract: rows.selectedContract,
      selectedFreelancer: rows.selectedFreelancer,
      isDateRangeInvalid: rows.isDateRangeInvalid,
      hasActiveFilters: rows.hasActiveFilters,
      isInteractionLocked: actions.isInteractionLocked,
      setContractFilter: rows.setContractFilter,
      setFreelancerFilter: rows.setFreelancerFilter,
      setStartDate: rows.setStartDate,
      setEndDate: rows.setEndDate,
      clearFilters: rows.clearFilters,
    },
    summary: {
      summaryText: rows.summaryText,
      selectedRows: rows.selectedRows,
      bulkActionsDisabled: actions.bulkActionsDisabled,
      bulkActionTitle: actions.bulkActionTitle,
      bulkConfirmDisabled: actions.bulkConfirmDisabled,
      isBulkRunning: actions.isBulkRunning,
      isBulkApproveOpen: actions.isBulkApproveOpen,
      isBulkRejectOpen: actions.isBulkRejectOpen,
      bulkRejectionReason: actions.bulkRejectionReason,
      bulkRejectionReasonError: actions.bulkRejectionReasonError,
      trimmedBulkRejectionReason: actions.trimmedBulkRejectionReason,
      openBulkApprove: actions.openBulkApprove,
      openBulkReject: actions.openBulkReject,
      confirmBulkApprove: actions.confirmBulkApprove,
      cancelBulkApprove: actions.cancelBulkApprove,
      handleBulkRejectionReasonChange: actions.handleBulkRejectionReasonChange,
      handleBulkReject: actions.handleBulkReject,
      cancelBulkReject: actions.cancelBulkReject,
    },
    table: {
      displayedRows: rows.displayedRows,
      displayedPriceableRows: rows.displayedPriceableRows,
      selectedIds: rows.selectedIds,
      allVisiblePriceableSelected: rows.allVisiblePriceableSelected,
      isSelectAllIndeterminate: rows.isSelectAllIndeterminate,
      approvingEntryId: actions.approvingEntryId,
      rejectingEntryId: actions.rejectingEntryId,
      pendingEntryIds: actions.pendingEntryIds,
      pendingActionKind: actions.pendingActionKind,
      isAnyActionPending: actions.isAnyActionPending,
      isBulkInteractionLocked: actions.isInteractionLocked,
      rejectionReason: actions.rejectionReason,
      rejectionReasonError: actions.rejectionReasonError,
      trimmedRejectionReason: actions.trimmedRejectionReason,
      filtersBlockSelection,
      toggleAllVisiblePriceable,
      toggleRow,
      openApprove: actions.openApprove,
      cancelApprove: actions.cancelApprove,
      handleApprove: actions.handleApprove,
      openReject: actions.openReject,
      cancelReject: actions.cancelReject,
      handleReject: actions.handleReject,
      handleRejectionReasonChange: actions.handleRejectionReasonChange,
    },
  }
}
