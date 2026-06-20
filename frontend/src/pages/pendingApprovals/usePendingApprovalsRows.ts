import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchContracts } from '../../api/contracts'
import { fetchTimesheets } from '../../api/timesheets'
import {
  calculatePriceableSummary,
  calculateSelectionSummary,
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
} from './helpers'
import type { ApprovalFilters } from './types'

export function usePendingApprovalsRows(isAdmin: boolean) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [contractFilter, setContractFilter] = useState('')
  const [freelancerFilter, setFreelancerFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [optimisticallyHiddenIds, setOptimisticallyHiddenIds] = useState<Set<number>>(
    () => new Set()
  )

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
  const hasActiveFilters = Boolean(
    contractFilter || freelancerFilter || startDate || endDate
  )

  const selectedContract = contractFilter
    ? contractOptions.find((contract) => String(contract.id) === contractFilter)
    : undefined
  const selectedFreelancer = freelancerFilter
    ? freelancerOptions.find((freelancer) => String(freelancer.id) === freelancerFilter)
    : undefined

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

  function toggleRow(entryId: number) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  function toggleAllVisiblePriceable() {
    setSelectedIds((current) => toggleVisiblePriceableSelection(current, displayedPriceableRows))
  }

  return {
    isLoading,
    isError,
    entries,
    errorMessage,
    contractFilter,
    freelancerFilter,
    startDate,
    endDate,
    contractOptions,
    freelancerOptions,
    selectedContract,
    selectedFreelancer,
    isDateRangeInvalid,
    hasActiveFilters,
    summaryText,
    selectedRows,
    displayedRows,
    displayedPriceableRows,
    selectedIds,
    allVisiblePriceableSelected,
    isSelectAllIndeterminate,
    setContractFilter,
    setFreelancerFilter,
    setStartDate,
    setEndDate,
    clearFilters,
    handleRetryLoad,
    toggleRow,
    toggleAllVisiblePriceable,
    setSelectedIds,
    setOptimisticallyHiddenIds,
    hasSelection,
  }
}
