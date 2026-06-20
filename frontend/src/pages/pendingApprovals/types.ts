import { Contract, TimesheetEntry } from '../../api/client'

export type ApprovalRow = {
  entry: TimesheetEntry
  contract: Contract | undefined
}

export type PriceableApprovalRow = {
  entry: TimesheetEntry
  contract: Contract
}

export type ApprovalFilters = {
  contractFilter: string
  freelancerFilter: string
  startDate: string
  endDate: string
}
