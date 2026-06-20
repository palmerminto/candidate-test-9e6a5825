import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Contract, TimesheetEntry } from '../api/client'
import { fetchContracts } from '../api/contracts'
import { fetchTimesheets } from '../api/timesheets'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { calculateEstimatedCost, formatEstimatedCost } from '../utils/cost'

type ApprovalRow = {
  entry: TimesheetEntry
  contract: Contract | undefined
}

type PriceableApprovalRow = {
  entry: TimesheetEntry
  contract: Contract
}

export default function PendingApprovals() {
  const { isAdmin } = useAuth()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())

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

  if (!isAdmin) {
    return <Navigate to="/contracts" replace />
  }

  const isLoading = timesheetsQuery.isLoading || contractsQuery.isLoading
  const isError = timesheetsQuery.isError || contractsQuery.isError
  const entries = timesheetsQuery.data ?? []
  const errorMessage = timesheetsQuery.isError
    ? 'Failed to load submitted timesheets. Please try again.'
    : contractsQuery.isError
      ? 'Failed to load contract details. Please try again.'
      : 'Failed to load pending approvals. Please try again.'

  const contractsById = new Map(
    (contractsQuery.data ?? []).map((contract) => [contract.id, contract])
  )

  const rows: ApprovalRow[] = entries.map((entry) => ({
    entry,
    contract: contractsById.get(entry.contract_id),
  }))

  const priceableRows: PriceableApprovalRow[] = rows.filter(
    (row): row is PriceableApprovalRow => Boolean(row.contract)
  )
  const selectedRows = priceableRows.filter(({ entry }) => selectedIds.has(entry.id))
  const selectedHours = selectedRows.reduce((sum, { entry }) => sum + Number(entry.hours), 0)
  const selectedCost = selectedRows.reduce(
    (sum, { entry, contract }) => sum + calculateEstimatedCost(entry.hours, contract.daily_rate),
    0
  )
  const allPriceableSelected =
    priceableRows.length > 0 && priceableRows.every(({ entry }) => selectedIds.has(entry.id))
  const isSelectAllIndeterminate = selectedRows.length > 0 && !allPriceableSelected

  function toggleRow(entryId: number) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  function toggleAllVisiblePriceable() {
    setSelectedIds((current) => {
      const next = new Set(current)
      const allSelected = priceableRows.every(({ entry }) => next.has(entry.id))

      if (allSelected) {
        priceableRows.forEach(({ entry }) => next.delete(entry.id))
      } else {
        priceableRows.forEach(({ entry }) => next.add(entry.id))
      }

      return next
    })
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
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  <input
                    type="checkbox"
                    aria-label="Select all visible priceable timesheets"
                    aria-checked={isSelectAllIndeterminate ? 'mixed' : allPriceableSelected}
                    checked={allPriceableSelected}
                    disabled={priceableRows.length === 0}
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
              {rows.map(({ entry, contract }) => {
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
                        disabled={!isPriceable}
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
              })}
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
      )}
    </div>
  )
}
