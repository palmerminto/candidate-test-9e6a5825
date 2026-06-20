import { beforeEach, describe, expect, it, vi } from 'vitest'
import { patchTimesheetEntry } from './timesheets'

const { patchMock } = vi.hoisted(() => ({
  patchMock: vi.fn(),
}))

vi.mock('./client', () => ({
  api: {
    patch: patchMock,
  },
}))

describe('patchTimesheetEntry', () => {
  beforeEach(() => {
    patchMock.mockReset()
    patchMock.mockResolvedValue({ id: 1, status: 'approved' })
  })

  it('sends an approved decision to the timesheet endpoint', async () => {
    await patchTimesheetEntry(42, { status: 'approved' })

    expect(patchMock).toHaveBeenCalledWith('/api/timesheets/42/', { status: 'approved' })
  })

  it('sends a rejected decision with a reason to the timesheet endpoint', async () => {
    await patchTimesheetEntry(7, {
      status: 'rejected',
      rejection_reason: 'Hours exceed contract scope',
    })

    expect(patchMock).toHaveBeenCalledWith('/api/timesheets/7/', {
      status: 'rejected',
      rejection_reason: 'Hours exceed contract scope',
    })
  })
})
