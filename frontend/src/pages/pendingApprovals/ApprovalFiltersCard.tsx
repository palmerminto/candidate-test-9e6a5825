import { formatContractFilterLabel, formatContractFilterTitle } from './helpers'
import type { PendingApprovalsFiltersModel } from './types'

type ApprovalFiltersCardProps = {
  filters: PendingApprovalsFiltersModel
}

export function ApprovalFiltersCard({ filters }: ApprovalFiltersCardProps) {
  const {
    contractFilter,
    freelancerFilter,
    startDate,
    endDate,
    contractOptions,
    freelancerOptions,
    selectedContract,
    selectedFreelancer,
    isInteractionLocked,
    isDateRangeInvalid,
    hasActiveFilters,
    setContractFilter,
    setFreelancerFilter,
    setStartDate,
    setEndDate,
    clearFilters,
  } = filters

  return (
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
            disabled={isInteractionLocked}
            className="w-full border border-slate-300 rounded px-3 py-2 pr-8 text-sm bg-white truncate focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
            disabled={isInteractionLocked}
            className="w-full border border-slate-300 rounded px-3 py-2 pr-8 text-sm bg-white truncate focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
            disabled={isInteractionLocked}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
            disabled={isInteractionLocked}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
            disabled={isInteractionLocked}
            className="text-slate-600 text-sm px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
