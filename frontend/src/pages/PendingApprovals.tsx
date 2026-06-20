import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchContracts } from '../api/contracts'
import {
  fetchTimesheets,
  patchTimesheetEntry,
  TimesheetDecisionPayload,
} from '../api/timesheets'
import { useAuth } from '../hooks/useAuth'
import { ApprovalFilters } from './pendingApprovals/types'
import {
  calculatePriceableSummary,
  calculateSelectionSummary,
  formatContractFilterLabel,
  formatContractFilterTitle,
  formatSummaryBarText,
  getAllContractOptions,
  getAllFreelancerOptions,
  getContractOptions,
  getFreelancerOptions,
  getVisiblePriceableIds,
  getVisibleRows,
  mapRows,
  reconcileSelectedIds,
  toPriceableRows,
  toggleVisiblePriceableSelection,
} from './pendingApprovals/helpers'
import { ApprovalsTable } from './pendingApprovals/ApprovalsTable'

const tabularNums = { fontVariantNumeric: 'tabular-nums' as const }

type DecisionVariables = {
  entryId: number
  payload: TimesheetDecisionPayload
}

export default function PendingApprovals() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [contractFilter, setContractFilter] = useState('')
  const [freelancerFilter, setFreelancerFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [approvingEntryId, setApprovingEntryId] = useState<number | null>(null)
  const [rejectingEntryId, setRejectingEntryId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionReasonError, setRejectionReasonError] = useState<string | null>(null)
  const [optimisticallyHiddenIds, setOptimisticallyHiddenIds] = useState<Set<number>>(
    () => new Set()
  )
  const [pendingEntryId, setPendingEntryId] = useState<number | null>(null)

  const timesheetsQuery = useQuery({
    queryKey: ['timesheets', { status: 'submitted' }],
    queryFn: () => fetchTimesheets({ status: 'submitted' }),
    enabled: isAdmin,
  })

  const contractsQuery = useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
    enabled: isAdmin,
  })

  const isLoading = timesheetsQuery.isLoading || contractsQuery.isLoading
  const isError = timesheetsQuery.isError || contractsQuery.isError
  const entries = timesheetsQuery.data ?? []
  const errorMessage = timesheetsQuery.isError
    ? 'Failed to load submitted timesheets. Please try again.'
    : contractsQuery.isError
      ? 'Failed to load contract details. Please try again.'
      : 'Failed to load pending approvals. Please try again.'

  const contractsById = useMemo(
    () => new Map((contractsQuery.data ?? []).map((contract) => [contract.id, contract])),
    [contractsQuery.data]
  )

  const rows = useMemo(() => mapRows(entries, contractsById), [entries, contractsById])
  const priceableRows = useMemo(() => toPriceableRows(rows), [rows])
  const allContractOptions = useMemo(() => getAllContractOptions(priceableRows), [priceableRows])
  const allFreelancerOptions = useMemo(() => getAllFreelancerOptions(priceableRows), [priceableRows])
  const contractOptions = useMemo(
    () => getContractOptions(allContractOptions, freelancerFilter),
    [allContractOptions, freelancerFilter]
  )
  const freelancerOptions = useMemo(
    () => getFreelancerOptions(allFreelancerOptions, contractFilter, contractsById),
    [allFreelancerOptions, contractFilter, contractsById]
  )

  useEffect(() => {
    if (
      contractFilter &&
      !contractOptions.some((contract) => String(contract.id) === contractFilter)
    ) {
      setContractFilter('')
    }
  }, [contractFilter, contractOptions])

  useEffect(() => {
    if (
      freelancerFilter &&
      !freelancerOptions.some((freelancer) => String(freelancer.id) === freelancerFilter)
    ) {
      setFreelancerFilter('')
    }
  }, [freelancerFilter, freelancerOptions])

  const isDateRangeInvalid = Boolean(startDate && endDate && startDate > endDate)
  const applyDateFilter = !isDateRangeInvalid
  const filters: ApprovalFilters = useMemo(
    () => ({
      contractFilter,
      freelancerFilter,
      startDate,
      endDate,
    }),
    [contractFilter, freelancerFilter, startDate, endDate]
  )

  const visibleRows = useMemo(
    () => getVisibleRows(rows, filters, applyDateFilter),
    [rows, filters, applyDateFilter]
  )
  const displayedRows = useMemo(
    () => visibleRows.filter(({ entry }) => !optimisticallyHiddenIds.has(entry.id)),
    [visibleRows, optimisticallyHiddenIds]
  )
  const visiblePriceableRows = useMemo(() => toPriceableRows(visibleRows), [visibleRows])
  const displayedPriceableRows = useMemo(
    () => visiblePriceableRows.filter(({ entry }) => !optimisticallyHiddenIds.has(entry.id)),
    [visiblePriceableRows, optimisticallyHiddenIds]
  )
  const visiblePriceableIds = useMemo(
    () => getVisiblePriceableIds(rows, filters),
    [rows, filters]
  )

  useEffect(() => {
    if (isDateRangeInvalid) return

    setSelectedIds((current) => {
      const next = reconcileSelectedIds(current, visiblePriceableIds)
      if (next.size === current.size && [...next].every((id) => current.has(id))) {
        return current
      }
      return next
    })
  }, [isDateRangeInvalid, visiblePriceableIds])

  const {
    selectedRows,
    selectedHours,
    selectedCost,
    allVisiblePriceableSelected,
    isSelectAllIndeterminate,
  } = useMemo(
    () => calculateSelectionSummary(displayedPriceableRows, selectedIds),
    [displayedPriceableRows, selectedIds]
  )
  const visibleSummary = useMemo(
    () => calculatePriceableSummary(displayedPriceableRows),
    [displayedPriceableRows]
  )
  const summaryText = formatSummaryBarText(
    selectedRows.length,
    selectedHours,
    selectedCost,
    visibleSummary.entryCount,
    visibleSummary.totalHours,
    visibleSummary.totalCost
  )
  const hasSelection = selectedRows.length > 0
  const bulkActionTitle = hasSelection
    ? 'Bulk actions will be added next'
    : 'Select at least one entry'
  const filtersBlockSelection = isDateRangeInvalid
  const hasActiveFilters = Boolean(
    contractFilter || freelancerFilter || startDate || endDate
  )

  function clearFilters() {
    setContractFilter('')
    setFreelancerFilter('')
    setStartDate('')
    setEndDate('')
  }

  function handleRetryLoad() {
    if (timesheetsQuery.isError) {
      timesheetsQuery.refetch()
    }
    if (contractsQuery.isError) {
      contractsQuery.refetch()
    }
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
      setPendingEntryId(null)
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
      setPendingEntryId(null)
      setActionError('Failed to update this timesheet. Please try again.')
      setActionSuccess(null)
    },
  })

  const selectedContract = contractFilter
    ? contractOptions.find((contract) => String(contract.id) === contractFilter)
    : undefined
  const selectedFreelancer = freelancerFilter
    ? freelancerOptions.find((freelancer) => String(freelancer.id) === freelancerFilter)
    : undefined

  function toggleRow(entryId: number) {
    if (filtersBlockSelection) return
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  function toggleAllVisiblePriceable() {
    if (filtersBlockSelection) return

    setSelectedIds((current) => toggleVisiblePriceableSelection(current, displayedPriceableRows))
  }

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

  function openApprove(entryId: number) {
    resetActionUi()
    setApprovingEntryId(entryId)
  }

  function cancelApprove() {
    setApprovingEntryId(null)
  }

  function handleApprove(entryId: number) {
    resetActionUi()
    setPendingEntryId(entryId)
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
    setPendingEntryId(entryId)
    hideEntryOptimistically(entryId)
    decisionMutation.mutate({
      entryId,
      payload: { status: 'rejected', rejection_reason: reason },
    })
  }

  const trimmedRejectionReason = rejectionReason.trim()
  const isDecisionPending = decisionMutation.isPending

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

      {isLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm space-y-3">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetryLoad}
            className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100"
          >
            Retry
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <p className="text-slate-500 text-sm">No submitted timesheets are waiting for approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
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

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-0 flex-1 basis-[12rem]">
                <label htmlFor="filter_contract" className="block text-sm font-medium text-slate-700 mb-1">
                  Contract
                </label>
                <select
                  id="filter_contract"
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 pr-8 text-sm bg-white truncate focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title={selectedContract ? formatContractFilterTitle(selectedContract) : undefined}
                >
                  <option value="">All contracts</option>
                  {contractOptions.map((contract) => (
                    <option
                      key={contract.id}
                      value={contract.id}
                      title={formatContractFilterTitle(contract)}
                    >
                      {formatContractFilterLabel(contract)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 flex-1 basis-[12rem]">
                <label htmlFor="filter_freelancer" className="block text-sm font-medium text-slate-700 mb-1">
                  Freelancer
                </label>
                <select
                  id="filter_freelancer"
                  value={freelancerFilter}
                  onChange={(e) => setFreelancerFilter(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 pr-8 text-sm bg-white truncate focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title={selectedFreelancer?.name}
                >
                  <option value="">All freelancers</option>
                  {freelancerOptions.map((freelancer) => (
                    <option key={freelancer.id} value={freelancer.id}>
                      {freelancer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[10rem] flex-1">
                <label htmlFor="filter_start_date" className="block text-sm font-medium text-slate-700 mb-1">
                  From date
                </label>
                <input
                  id="filter_start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="min-w-[10rem] flex-1">
                <label htmlFor="filter_end_date" className="block text-sm font-medium text-slate-700 mb-1">
                  To date
                </label>
                <input
                  id="filter_end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {isDateRangeInvalid && (
                  <p className="text-red-600 text-xs mt-1">From date must be on or before to date.</p>
                )}
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-700" style={tabularNums}>
              {summaryText}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                title={bulkActionTitle}
                aria-label="Approve selected"
                className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Approve
              </button>
              <button
                type="button"
                disabled
                title={bulkActionTitle}
                aria-label="Reject selected"
                className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>

          <ApprovalsTable
            displayedRows={displayedRows}
            displayedPriceableRows={displayedPriceableRows}
            selectedIds={selectedIds}
            filtersBlockSelection={filtersBlockSelection}
            allVisiblePriceableSelected={allVisiblePriceableSelected}
            isSelectAllIndeterminate={isSelectAllIndeterminate}
            approvingEntryId={approvingEntryId}
            rejectingEntryId={rejectingEntryId}
            pendingEntryId={pendingEntryId}
            isDecisionPending={isDecisionPending}
            rejectionReason={rejectionReason}
            rejectionReasonError={rejectionReasonError}
            trimmedRejectionReason={trimmedRejectionReason}
            onToggleAllVisiblePriceable={toggleAllVisiblePriceable}
            onToggleRow={toggleRow}
            onOpenApprove={openApprove}
            onCancelApprove={cancelApprove}
            onHandleApprove={handleApprove}
            onOpenReject={openReject}
            onCancelReject={cancelReject}
            onHandleReject={handleReject}
            onRejectionReasonChange={handleRejectionReasonChange}
          />
        </div>
      )}
    </div>
  )
}
