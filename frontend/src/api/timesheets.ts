import { api, TimesheetEntry } from './client'

export function fetchTimesheets(params?: { status?: string; contract?: number }): Promise<TimesheetEntry[]> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.contract !== undefined) qs.set('contract', String(params.contract))
  const query = qs.toString() ? `?${qs}` : ''
  return api.get(`/api/timesheets/${query}`)
}

export function createTimesheetEntry(data: {
  contract: number
  date: string
  hours: number | string
}): Promise<TimesheetEntry> {
  return api.post('/api/timesheets/', data)
}

/**
 * Payload used by admin approval actions when deciding a submitted timesheet.
 */
export type TimesheetDecisionPayload =
  | { status: 'approved' }
  | { status: 'rejected'; rejection_reason: string }

/**
 * Updates a timesheet entry with an admin approval decision.
 */
export function patchTimesheetEntry(
  id: number,
  data: TimesheetDecisionPayload
): Promise<TimesheetEntry> {
  return api.patch(`/api/timesheets/${id}/`, data)
}
