import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { patchTimesheetEntry } from '../../api/timesheets'
import type { TimesheetDecisionPayload } from '../../api/timesheets'
import { formatBulkSuccessMessage, runBulkTimesheetDecisions } from './helpers'
import type { BulkFailureState, PendingActionKind, PriceableApprovalRow } from './types'

type UsePendingApprovalsActionsArgs = {
  hasSelection: boolean
  isDateRangeInvalid: boolean
  selectedRows: PriceableApprovalRow[]
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>
  setOptimisticallyHiddenIds: React.Dispatch<React.SetStateAction<Set<number>>>
}

type DecisionVariables = {
  entryId: number
  payload: TimesheetDecisionPayload
}

export function usePendingApprovalsActions({
  hasSelection,
  isDateRangeInvalid,
  selectedRows,
  setSelectedIds,
  setOptimisticallyHiddenIds,
}: UsePendingApprovalsActionsArgs) {
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [approvingEntryId, setApprovingEntryId] = useState<number | null>(null)
  const [rejectingEntryId, setRejectingEntryId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionReasonError, setRejectionReasonError] = useState<string | null>(null)
  const [pendingEntryIds, setPendingEntryIds] = useState<Set<number>>(() => new Set())
  const [pendingActionKind, setPendingActionKind] = useState<PendingActionKind | null>(null)
  const [isBulkRunning, setIsBulkRunning] = useState(false)
  const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false)
  const [isBulkRejectOpen, setIsBulkRejectOpen] = useState(false)
  const [bulkRejectionReason, setBulkRejectionReason] = useState('')
  const [bulkRejectionReasonError, setBulkRejectionReasonError] = useState<string | null>(null)
  const [bulkFailureState, setBulkFailureState] = useState<BulkFailureState | null>(null)

  function hideEntryOptimistically(entryId: number) {
    setOptimisticallyHiddenIds((current) => new Set(current).add(entryId))
    setSelectedIds((current) => {
      const next = new Set(current)
      next.delete(entryId)
      return next
    })
  }

  function resetActionUi() {
    setActionError(null)
    setActionSuccess(null)
    setApprovingEntryId(null)
    setRejectingEntryId(null)
    setRejectionReason('')
    setRejectionReasonError(null)
  }

  const decisionMutation = useMutation({
    mutationFn: ({ entryId, payload }: DecisionVariables) =>
      patchTimesheetEntry(entryId, payload),
    onSuccess: (_, { entryId, payload }) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', { status: 'submitted' }] })
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(entryId)
        return next
      })
      setOptimisticallyHiddenIds((current) => {
        const next = new Set(current)
        next.delete(entryId)
        return next
      })
      setApprovingEntryId(null)
      setRejectingEntryId(null)
      setRejectionReason('')
      setRejectionReasonError(null)
      setPendingEntryIds(new Set())
      setPendingActionKind(null)
      setActionError(null)
      setActionSuccess(
        payload.status === 'approved' ? 'Timesheet approved.' : 'Timesheet rejected.'
      )
    },
    onError: (_, { entryId }) => {
      setOptimisticallyHiddenIds((current) => {
        const next = new Set(current)
        next.delete(entryId)
        return next
      })
      setApprovingEntryId(null)
      setRejectingEntryId(null)
      setPendingEntryIds(new Set())
      setPendingActionKind(null)
      setActionError('Failed to update this timesheet. Please try again.')
      setActionSuccess(null)
    },
  })

  const isDecisionPending = decisionMutation.isPending
  const isAnyActionPending = isDecisionPending || isBulkRunning
  const isBulkTrayOpen = isBulkApproveOpen || isBulkRejectOpen
  const bulkConfirmDisabled = !hasSelection || isDateRangeInvalid || isAnyActionPending
  const isInteractionLocked = isAnyActionPending || isBulkTrayOpen
  const bulkActionsDisabled =
    !hasSelection ||
    isDateRangeInvalid ||
    isAnyActionPending ||
    isBulkRejectOpen ||
    isBulkApproveOpen
  const bulkActionTitle = !hasSelection
    ? 'Select at least one entry'
    : isDateRangeInvalid
      ? 'Fix the date range before acting on entries'
      : isAnyActionPending
        ? 'Wait for the current action to finish'
        : isBulkRejectOpen
          ? 'Complete or cancel bulk rejection first'
          : isBulkApproveOpen
            ? 'Complete or cancel bulk approval first'
            : undefined
  const trimmedRejectionReason = rejectionReason.trim()
  const trimmedBulkRejectionReason = bulkRejectionReason.trim()

  function openApprove(entryId: number) {
    resetActionUi()
    setApprovingEntryId(entryId)
  }

  function cancelApprove() {
    setApprovingEntryId(null)
  }

  function handleApprove(entryId: number) {
    resetActionUi()
    setBulkFailureState(null)
    setPendingEntryIds(new Set([entryId]))
    setPendingActionKind('approve')
    hideEntryOptimistically(entryId)
    decisionMutation.mutate({ entryId, payload: { status: 'approved' } })
  }

  function openReject(entryId: number) {
    resetActionUi()
    setRejectingEntryId(entryId)
  }

  function cancelReject() {
    setRejectingEntryId(null)
    setRejectionReason('')
    setRejectionReasonError(null)
  }

  function handleRejectionReasonChange(value: string) {
    setRejectionReason(value)
    if (rejectionReasonError) {
      setRejectionReasonError(null)
    }
  }

  function handleReject(entryId: number) {
    const reason = rejectionReason.trim()
    if (!reason) {
      setRejectionReasonError('Add a reason to reject')
      return
    }

    setRejectionReasonError(null)
    setActionError(null)
    setActionSuccess(null)
    setBulkFailureState(null)
    setPendingEntryIds(new Set([entryId]))
    setPendingActionKind('reject')
    hideEntryOptimistically(entryId)
    decisionMutation.mutate({
      entryId,
      payload: { status: 'rejected', rejection_reason: reason },
    })
  }

  async function runBulkAction(
    ids: number[],
    payload: TimesheetDecisionPayload,
    action: 'approved' | 'rejected'
  ) {
    resetActionUi()
    setBulkFailureState(null)
    setIsBulkApproveOpen(false)
    setIsBulkRejectOpen(false)
    setBulkRejectionReason('')
    setBulkRejectionReasonError(null)
    setIsBulkRunning(true)
    setPendingActionKind(action === 'approved' ? 'approve' : 'reject')
    setPendingEntryIds(new Set(ids))

    setOptimisticallyHiddenIds((current) => new Set([...current, ...ids]))
    setSelectedIds((current) => {
      const next = new Set(current)
      ids.forEach((id) => next.delete(id))
      return next
    })

    const { succeeded, failed } = await runBulkTimesheetDecisions(ids, payload, patchTimesheetEntry)

    if (failed.length > 0) {
      setOptimisticallyHiddenIds((current) => {
        const next = new Set(current)
        failed.forEach((id) => next.delete(id))
        return next
      })
      setSelectedIds((current) => {
        const next = new Set(current)
        failed.forEach((id) => next.add(id))
        return next
      })
    }

    setPendingEntryIds(new Set())
    setPendingActionKind(null)
    setIsBulkRunning(false)

    await queryClient.invalidateQueries({ queryKey: ['timesheets', { status: 'submitted' }] })

    if (failed.length === 0) {
      setBulkFailureState(null)
      setActionSuccess(formatBulkSuccessMessage(action, succeeded.length))
      return
    }

    setBulkFailureState({
      action,
      succeeded: succeeded.length,
      failed: failed.length,
      failedIds: failed,
      payload,
    })
  }

  function openBulkApprove() {
    if (!hasSelection || isDateRangeInvalid || isAnyActionPending) return

    resetActionUi()
    setBulkFailureState(null)
    setIsBulkRejectOpen(false)
    setBulkRejectionReason('')
    setBulkRejectionReasonError(null)
    setIsBulkApproveOpen(true)
  }

  function cancelBulkApprove() {
    setIsBulkApproveOpen(false)
  }

  function confirmBulkApprove() {
    if (bulkConfirmDisabled) return

    const ids = selectedRows.map(({ entry }) => entry.id)
    void runBulkAction(ids, { status: 'approved' }, 'approved')
  }

  function openBulkReject() {
    if (!hasSelection || isDateRangeInvalid || isAnyActionPending) return

    resetActionUi()
    setBulkFailureState(null)
    setIsBulkApproveOpen(false)
    setIsBulkRejectOpen(true)
    setBulkRejectionReason('')
    setBulkRejectionReasonError(null)
  }

  function cancelBulkReject() {
    setIsBulkRejectOpen(false)
    setBulkRejectionReason('')
    setBulkRejectionReasonError(null)
  }

  function handleBulkRejectionReasonChange(value: string) {
    setBulkRejectionReason(value)
    if (bulkRejectionReasonError) {
      setBulkRejectionReasonError(null)
    }
  }

  function handleBulkReject() {
    const reason = bulkRejectionReason.trim()
    if (bulkConfirmDisabled) return

    if (!reason) {
      setBulkRejectionReasonError('Add a reason to reject')
      return
    }

    const ids = selectedRows.map(({ entry }) => entry.id)
    void runBulkAction(
      ids,
      { status: 'rejected', rejection_reason: reason },
      'rejected'
    )
  }

  function handleBulkRetry() {
    if (!bulkFailureState || isBulkRunning) return

    const { failedIds, payload, action } = bulkFailureState
    void runBulkAction(failedIds, payload, action)
  }

  return {
    actionError,
    actionSuccess,
    bulkFailureState,
    isBulkRunning,
    approvingEntryId,
    rejectingEntryId,
    pendingEntryIds,
    pendingActionKind,
    isAnyActionPending,
    isInteractionLocked,
    bulkActionsDisabled,
    bulkActionTitle,
    bulkConfirmDisabled,
    isBulkApproveOpen,
    isBulkRejectOpen,
    bulkRejectionReason,
    bulkRejectionReasonError,
    trimmedBulkRejectionReason,
    rejectionReason,
    rejectionReasonError,
    trimmedRejectionReason,
    handleBulkRetry,
    openBulkApprove,
    openBulkReject,
    confirmBulkApprove,
    cancelBulkApprove,
    handleBulkRejectionReasonChange,
    handleBulkReject,
    cancelBulkReject,
    openApprove,
    cancelApprove,
    handleApprove,
    openReject,
    cancelReject,
    handleReject,
    handleRejectionReasonChange,
  }
}
