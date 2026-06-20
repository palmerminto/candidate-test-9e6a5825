import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Contract, TimesheetEntry } from '../api/client'
import { fetchContracts } from '../api/contracts'
import { fetchTimesheets } from '../api/timesheets'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import { formatEstimatedCost } from '../utils/cost'

type ApprovalRow = {
  entry: TimesheetEntry
  contract: Contract | undefined
}

export default function PendingApprovals() {
  const { isAdmin } = useAuth()

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
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Freelancer</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Estimated cost</th>
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

                return (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{entry.date}</td>
                    <td className="px-4 py-3 text-slate-700">{freelancerName}</td>
                    <td className="px-4 py-3 text-slate-700">{companyName}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.hours}h</td>
                    <td className="px-4 py-3 text-slate-700">{estimatedCostText}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs italic">{notesText}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
