import { Contract, TimesheetEntry } from '../../api/client'

export const contractsFixture: Contract[] = [
  {
    id: 1,
    company: { id: 1, name: 'NorthStar Consulting', billing_email: 'billing@northstar.example.com' },
    freelancer: { id: 11, name: 'Alex Rivera' },
    daily_rate: '600.00',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    status: 'active',
  },
  {
    id: 2,
    company: { id: 1, name: 'NorthStar Consulting', billing_email: 'billing@northstar.example.com' },
    freelancer: { id: 22, name: 'Sam Chen' },
    daily_rate: '500.00',
    start_date: '2026-02-01',
    end_date: '2026-07-31',
    status: 'active',
  },
]

export const submittedEntriesFixture: TimesheetEntry[] = [
  {
    id: 101,
    contract: 1,
    contract_id: 1,
    date: '2026-05-01',
    hours: '8',
    status: 'submitted',
    rejection_reason: null,
  },
  {
    id: 102,
    contract: 2,
    contract_id: 2,
    date: '2026-05-02',
    hours: '4',
    status: 'submitted',
    rejection_reason: null,
  },
  {
    id: 103,
    contract: 999,
    contract_id: 999,
    date: '2026-05-03',
    hours: '6',
    status: 'submitted',
    rejection_reason: null,
  },
]
