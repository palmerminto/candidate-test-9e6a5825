import { describe, expect, it } from 'vitest'
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
  toggleVisiblePriceableSelection,
  toPriceableRows,
} from './helpers'
import { contractsFixture, submittedEntriesFixture } from './testFixtures'
import { ApprovalFilters } from './types'

function makeRows() {
  const contractsById = new Map(contractsFixture.map((contract) => [contract.id, contract]))
  return mapRows(submittedEntriesFixture, contractsById)
}

describe('pendingApprovals helpers', () => {
  it('maps entries to rows and keeps orphaned contracts unpriceable', () => {
    const rows = makeRows()
    expect(rows).toHaveLength(3)
    expect(rows[0].contract?.id).toBe(1)
    expect(rows[2].contract).toBeUndefined()
  })

  it('derives unique sorted contract and freelancer options', () => {
    const rows = makeRows()
    const priceableRows = toPriceableRows(rows)
    const allContractOptions = getAllContractOptions(priceableRows)
    const allFreelancerOptions = getAllFreelancerOptions(priceableRows)

    expect(allContractOptions.map((contract) => contract.id)).toEqual([1, 2])
    expect(allFreelancerOptions.map((freelancer) => freelancer.id)).toEqual([11, 22])
  })

  it('narrows contract and freelancer options based on active filters', () => {
    const rows = makeRows()
    const priceableRows = toPriceableRows(rows)
    const allContractOptions = getAllContractOptions(priceableRows)
    const allFreelancerOptions = getAllFreelancerOptions(priceableRows)
    const contractsById = new Map(contractsFixture.map((contract) => [contract.id, contract]))

    expect(getContractOptions(allContractOptions, '11').map((contract) => contract.id)).toEqual([1])
    expect(getFreelancerOptions(allFreelancerOptions, '2', contractsById).map((f) => f.id)).toEqual([22])
  })

  it('filters visible rows by contract, freelancer, and date range', () => {
    const rows = makeRows()
    const filters: ApprovalFilters = {
      contractFilter: '',
      freelancerFilter: '11',
      startDate: '2026-05-01',
      endDate: '2026-05-01',
    }

    const visibleRows = getVisibleRows(rows, filters, true)
    expect(visibleRows.map((row) => row.entry.id)).toEqual([101])
  })

  it('skips date filtering when date filtering is disabled', () => {
    const rows = makeRows()
    const filters: ApprovalFilters = {
      contractFilter: '',
      freelancerFilter: '',
      startDate: '2026-05-10',
      endDate: '2026-05-01',
    }

    const visibleRows = getVisibleRows(rows, filters, false)
    expect(visibleRows.map((row) => row.entry.id)).toEqual([101, 102, 103])
  })

  it('reconciles selected ids to visible priceable ids', () => {
    const rows = makeRows()
    const filters: ApprovalFilters = {
      contractFilter: '',
      freelancerFilter: '11',
      startDate: '',
      endDate: '',
    }
    const visibleIds = getVisiblePriceableIds(rows, filters)
    const next = reconcileSelectedIds(new Set([101, 102]), visibleIds)

    expect([...next]).toEqual([101])
  })

  it('calculates visible ids using valid filter combinations', () => {
    const rows = makeRows()
    const filters: ApprovalFilters = {
      contractFilter: '',
      freelancerFilter: '22',
      startDate: '',
      endDate: '',
    }

    expect([...getVisiblePriceableIds(rows, filters)]).toEqual([102])
  })

  it('toggles all visible priceable rows on and off', () => {
    const rows = makeRows()
    const visiblePriceableRows = toPriceableRows(rows)

    const selectedAll = toggleVisiblePriceableSelection(new Set(), visiblePriceableRows)
    expect([...selectedAll].sort()).toEqual([101, 102])

    const cleared = toggleVisiblePriceableSelection(selectedAll, visiblePriceableRows)
    expect([...cleared]).toEqual([])
  })

  it('calculates selection summary totals', () => {
    const rows = makeRows()
    const visiblePriceableRows = toPriceableRows(rows)

    const summary = calculateSelectionSummary(visiblePriceableRows, new Set([101]))
    expect(summary.selectedRows).toHaveLength(1)
    expect(summary.selectedHours).toBe(8)
    expect(summary.selectedCost).toBe(600)
    expect(summary.allVisiblePriceableSelected).toBe(false)
    expect(summary.isSelectAllIndeterminate).toBe(true)
  })
})
