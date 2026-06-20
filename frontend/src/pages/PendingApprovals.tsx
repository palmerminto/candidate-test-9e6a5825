import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchContracts } from '../api/contracts'
import { fetchTimesheets } from '../api/timesheets'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { formatEstimatedCost } from '../utils/cost'
import { ApprovalFilters } from './pendingApprovals/types'
import {
  calculateSelectionSummary,
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

export default function PendingApprovals() {
  const { isAdmin } = useAuth()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [contractFilter, setContractFilter] = useState('')
  const [freelancerFilter, setFreelancerFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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
  const visiblePriceableRows = useMemo(() => toPriceableRows(visibleRows), [visibleRows])
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
  } = useMemo(() => calculateSelectionSummary(visiblePriceableRows, selectedIds), [visiblePriceableRows, selectedIds])
  const filtersBlockSelection = isDateRangeInvalid

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

    setSelectedIds((current) => toggleVisiblePriceableSelection(current, visiblePriceableRows))
  }

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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          {errorMessage}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <p className="text-slate-500 text-sm">No submitted timesheets are waiting for approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
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
                  title={
                    selectedContract
                      ? `${selectedContract.freelancer.name} @ ${selectedContract.company.name}`
                      : undefined
                  }
                >
                  <option value="">All contracts</option>
                  {contractOptions.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.freelancer.name} @ {contract.company.name}
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
          </div>

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
                    disabled={filtersBlockSelection || visiblePriceableRows.length === 0}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSelectAllIndeterminate
                      }
                    }}
                    onChange={toggleAllVisiblePriceable}
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Freelancer</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600" style={{ minWidth: '7.5rem' }}>
                  Hours
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600" style={{ minWidth: '10rem' }}>
                  Estimated cost
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-slate-500 text-sm">
                    No timesheet entries match the current filters.
                  </td>
                </tr>
              ) : (
              visibleRows.map(({ entry, contract }) => {
                const freelancerName = contract?.freelancer.name ?? 'Unknown freelancer'
                const companyName = contract?.company.name ?? 'Unknown company'
                const estimatedCostText = contract
                  ? formatEstimatedCost(entry.hours, contract.daily_rate)
                  : 'Not priceable'
                const notesText = contract ? (entry.rejection_reason ?? '—') : 'Missing contract details'
                const isPriceable = Boolean(contract)

                return (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      <input
                        type="checkbox"
                        aria-label={`Select timesheet for ${freelancerName} on ${entry.date}`}
                        checked={isPriceable && selectedIds.has(entry.id)}
                        disabled={!isPriceable || filtersBlockSelection}
                        onChange={() => toggleRow(entry.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{entry.date}</td>
                    <td className="px-4 py-3 text-slate-700">{freelancerName}</td>
                    <td className="px-4 py-3 text-slate-700">{companyName}</td>
                    <td className="px-4 py-3 text-slate-700" style={{ minWidth: '7.5rem' }}>
                      {entry.hours}h
                    </td>
                    <td className="px-4 py-3 text-slate-700" style={{ minWidth: '10rem' }}>
                      {estimatedCostText}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs italic">{notesText}</td>
                  </tr>
                )
              })
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={4} className="px-4 py-2 text-slate-500 text-xs">
                  {selectedRows.length} selected
                </td>
                <td className="px-4 py-2 font-medium text-slate-700" style={{ minWidth: '7.5rem' }}>
                  {selectedHours}h total
                </td>
                <td className="px-4 py-2 font-medium text-slate-700" style={{ minWidth: '10rem' }}>
                  £{selectedCost.toFixed(2)} est.
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
