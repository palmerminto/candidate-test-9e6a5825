import { Contract, TimesheetEntry } from '../../api/client'
import { calculateEstimatedCost, formatEstimatedCostValue } from '../../utils/cost'
import { ApprovalFilters, ApprovalRow, PriceableApprovalRow } from './types'

export function rowMatchesFilters(
  row: ApprovalRow,
  contractFilter: string,
  freelancerFilter: string,
  startDate: string,
  endDate: string,
  applyDateFilter: boolean
): boolean {
  if (contractFilter && row.contract?.id !== Number(contractFilter)) return false
  if (freelancerFilter && row.contract?.freelancer.id !== Number(freelancerFilter)) return false
  if (applyDateFilter) {
    if (startDate && row.entry.date < startDate) return false
    if (endDate && row.entry.date > endDate) return false
  }
  return true
}

export function mapRows(entries: TimesheetEntry[], contractsById: Map<number, Contract>): ApprovalRow[] {
  return entries.map((entry) => ({
    entry,
    contract: contractsById.get(entry.contract_id),
  }))
}

export function toPriceableRows(rows: ApprovalRow[]): PriceableApprovalRow[] {
  return rows.filter((row): row is PriceableApprovalRow => Boolean(row.contract))
}

export function formatContractHeading(contract: Contract): string {
  return `Contract #${contract.id}`
}

export function formatContractDateRange(contract: Contract): string {
  return `${contract.start_date} – ${contract.end_date}`
}

export function formatContractFilterLabel(contract: Contract): string {
  return `${formatContractHeading(contract)} · ${contract.freelancer.name}`
}

export function formatContractFilterTitle(contract: Contract): string {
  return `${formatContractFilterLabel(contract)} · ${formatContractDateRange(contract)}`
}

export function getAllContractOptions(priceableRows: PriceableApprovalRow[]): Contract[] {
  const contracts = new Map<number, Contract>()
  priceableRows.forEach(({ contract }) => {
    contracts.set(contract.id, contract)
  })
  return [...contracts.values()].sort((a, b) => a.id - b.id)
}

export function getAllFreelancerOptions(priceableRows: PriceableApprovalRow[]): Contract['freelancer'][] {
  const freelancers = new Map<number, Contract['freelancer']>()
  priceableRows.forEach(({ contract }) => {
    freelancers.set(contract.freelancer.id, contract.freelancer)
  })
  return [...freelancers.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function getContractOptions(allContractOptions: Contract[], freelancerFilter: string): Contract[] {
  if (!freelancerFilter) return allContractOptions
  return allContractOptions.filter((contract) => String(contract.freelancer.id) === freelancerFilter)
}

export function getFreelancerOptions(
  allFreelancerOptions: Contract['freelancer'][],
  contractFilter: string,
  contractsById: Map<number, Contract>
): Contract['freelancer'][] {
  if (!contractFilter) return allFreelancerOptions
  const contract = contractsById.get(Number(contractFilter))
  if (!contract) return allFreelancerOptions
  return allFreelancerOptions.filter((freelancer) => freelancer.id === contract.freelancer.id)
}

export function getVisibleRows(
  rows: ApprovalRow[],
  filters: ApprovalFilters,
  applyDateFilter: boolean
): ApprovalRow[] {
  return rows.filter((row) =>
    rowMatchesFilters(
      row,
      filters.contractFilter,
      filters.freelancerFilter,
      filters.startDate,
      filters.endDate,
      applyDateFilter
    )
  )
}

export function getVisiblePriceableIds(
  rows: ApprovalRow[],
  filters: ApprovalFilters
): Set<number> {
  const visibleRows = getVisibleRows(rows, filters, true)
  return new Set(toPriceableRows(visibleRows).map(({ entry }) => entry.id))
}

export function reconcileSelectedIds(selectedIds: Set<number>, visiblePriceableIds: Set<number>): Set<number> {
  return new Set([...selectedIds].filter((id) => visiblePriceableIds.has(id)))
}

export function toggleVisiblePriceableSelection(
  selectedIds: Set<number>,
  visiblePriceableRows: PriceableApprovalRow[]
): Set<number> {
  const next = new Set(selectedIds)
  const allSelected = visiblePriceableRows.every(({ entry }) => next.has(entry.id))

  if (allSelected) {
    visiblePriceableRows.forEach(({ entry }) => next.delete(entry.id))
  } else {
    visiblePriceableRows.forEach(({ entry }) => next.add(entry.id))
  }

  return next
}

export function calculatePriceableSummary(priceableRows: PriceableApprovalRow[]): {
  entryCount: number
  totalHours: number
  totalCost: number
} {
  const entryCount = priceableRows.length
  const totalHours = priceableRows.reduce((sum, { entry }) => sum + Number(entry.hours), 0)
  const totalCost = priceableRows.reduce(
    (sum, { entry, contract }) => sum + calculateEstimatedCost(entry.hours, contract.daily_rate),
    0
  )

  return { entryCount, totalHours, totalCost }
}

export function calculateSelectionSummary(
  visiblePriceableRows: PriceableApprovalRow[],
  selectedIds: Set<number>
): {
  selectedRows: PriceableApprovalRow[]
  selectedHours: number
  selectedCost: number
  allVisiblePriceableSelected: boolean
  isSelectAllIndeterminate: boolean
} {
  const selectedRows = visiblePriceableRows.filter(({ entry }) => selectedIds.has(entry.id))
  const { totalHours: selectedHours, totalCost: selectedCost } =
    calculatePriceableSummary(selectedRows)
  const allVisiblePriceableSelected =
    visiblePriceableRows.length > 0 &&
    visiblePriceableRows.every(({ entry }) => selectedIds.has(entry.id))
  const isSelectAllIndeterminate = selectedRows.length > 0 && !allVisiblePriceableSelected

  return {
    selectedRows,
    selectedHours,
    selectedCost,
    allVisiblePriceableSelected,
    isSelectAllIndeterminate,
  }
}

export function formatSummaryBarText(
  selectedCount: number,
  selectedHours: number,
  selectedCost: number,
  visibleCount: number,
  visibleHours: number,
  visibleCost: number
): string {
  if (selectedCount > 0) {
    return `${selectedCount} selected · ${selectedHours.toFixed(1)}h · ${formatEstimatedCostValue(selectedCost)}`
  }

  const entryLabel = visibleCount === 1 ? 'entry' : 'entries'
  return `${visibleCount} ${entryLabel} · ${visibleHours.toFixed(1)}h · ${formatEstimatedCostValue(visibleCost)}`
}
