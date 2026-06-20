import { beforeEach, describe, expect, it, vi } from 'vitest'
import PendingApprovals from './PendingApprovals'
import { renderWithProviders, screen, userEvent, within } from '../test/render'
import { contractsFixture, submittedEntriesFixture } from './pendingApprovals/testFixtures'

const { fetchTimesheetsMock, fetchContractsMock, patchTimesheetEntryMock } = vi.hoisted(() => ({
  fetchTimesheetsMock: vi.fn(),
  fetchContractsMock: vi.fn(),
  patchTimesheetEntryMock: vi.fn(),
}))

vi.mock('../api/timesheets', () => ({
  fetchTimesheets: fetchTimesheetsMock,
  patchTimesheetEntry: patchTimesheetEntryMock,
}))

vi.mock('../api/contracts', () => ({
  fetchContracts: fetchContractsMock,
}))

async function renderPage(
  role: 'admin' | 'freelancer' = 'admin',
  options?: { waitForFilters?: boolean }
) {
  renderWithProviders(<PendingApprovals />, {
    route: '/approvals',
    user: { id: 1, email: 'admin@northstar.test', role },
  })
  if (role === 'admin' && options?.waitForFilters !== false) {
    await screen.findByLabelText('Contract')
  }
}

describe('PendingApprovals', () => {
  beforeEach(() => {
    fetchTimesheetsMock.mockReset()
    fetchContractsMock.mockReset()
    patchTimesheetEntryMock.mockReset()
    fetchTimesheetsMock.mockResolvedValue(submittedEntriesFixture)
    fetchContractsMock.mockResolvedValue(contractsFixture)
    patchTimesheetEntryMock.mockImplementation(async (id: number, payload: { status: string }) => {
      const entry = submittedEntriesFixture.find((item) => item.id === id)
      return {
        ...(entry ?? submittedEntriesFixture[0]),
        status: payload.status,
      }
    })
  })

  it('redirects non-admin users away from approvals and does not run queries', async () => {
    await renderPage('freelancer')

    expect(screen.queryByText('Pending approvals')).not.toBeInTheDocument()
    expect(fetchTimesheetsMock).not.toHaveBeenCalled()
    expect(fetchContractsMock).not.toHaveBeenCalled()
  })

  it('shows loading state while data is being fetched', async () => {
    fetchTimesheetsMock.mockImplementation(
      () => new Promise(() => undefined)
    )
    fetchContractsMock.mockImplementation(
      () => new Promise(() => undefined)
    )

    renderWithProviders(<PendingApprovals />, {
      route: '/approvals',
      user: { id: 1, email: 'admin@northstar.test', role: 'admin' },
    })

    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows an error banner when timesheets query fails', async () => {
    fetchTimesheetsMock.mockRejectedValue(new Error('Network error'))
    fetchContractsMock.mockResolvedValue(contractsFixture)

    await renderPage('admin', { waitForFilters: false })

    expect(
      await screen.findByText('Failed to load submitted timesheets. Please try again.')
    ).toBeInTheDocument()
  })

  it('selects only visible priceable rows and updates running totals', async () => {
    await renderPage()

    expect(screen.getByText('2 entries · 12.0h · £850.00 est.')).toBeInTheDocument()

    const selectAll = screen.getByLabelText('Select all visible filtered priceable timesheets')
    await userEvent.click(selectAll)

    expect(screen.getByText('2 selected · 12.0h · £850.00 est.')).toBeInTheDocument()

    const orphanRowCheckbox = screen.getByLabelText(
      'Select entry for Unknown freelancer on 2026-05-03'
    )
    expect(orphanRowCheckbox).toBeDisabled()
    expect(orphanRowCheckbox).not.toBeChecked()
  })

  it('narrows contract options and reconciles selection when freelancer filter changes', async () => {
    await renderPage()

    await userEvent.click(screen.getByLabelText('Select all visible filtered priceable timesheets'))
    await userEvent.selectOptions(screen.getByLabelText('Freelancer'), '11')

    const contractSelect = screen.getByLabelText('Contract')
    const contractOptions = within(contractSelect).getAllByRole('option').map((option) => option.textContent)
    expect(contractOptions).toEqual(['All contracts', 'Contract #1 · Alex Rivera'])

    expect(screen.getByText('1 selected · 8.0h · £600.00 est.')).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Sam Chen' })).not.toBeInTheDocument()
  })

  it('narrows freelancer options when contract filter is selected', async () => {
    await renderPage()

    await userEvent.selectOptions(screen.getByLabelText('Contract'), '2')

    const freelancerSelect = screen.getByLabelText('Freelancer')
    const freelancerOptions = within(freelancerSelect)
      .getAllByRole('option')
      .map((option) => option.textContent)

    expect(freelancerOptions).toEqual(['All freelancers', 'Sam Chen'])
  })

  it('shows and cancels inline approve confirmation before submitting', async () => {
    await renderPage()

    const table = screen.getByRole('table')
    await userEvent.click(
      within(table).getByRole('button', {
        name: 'Approve entry for Alex Rivera on 2026-05-01',
      })
    )
    expect(screen.getByText('Approve this pending timesheet entry?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel approval' }))
    expect(screen.queryByText('Approve this pending timesheet entry?')).not.toBeInTheDocument()
    expect(patchTimesheetEntryMock).not.toHaveBeenCalled()
  })

  it('submits approve only after confirmation', async () => {
    await renderPage()

    const table = screen.getByRole('table')
    await userEvent.click(
      within(table).getByRole('button', {
        name: 'Approve entry for Alex Rivera on 2026-05-01',
      })
    )
    await userEvent.click(screen.getByRole('button', { name: 'Confirm approve' }))

    expect(patchTimesheetEntryMock).toHaveBeenCalledWith(101, { status: 'approved' })
    expect(await screen.findByText('Timesheet approved.')).toBeInTheDocument()
  })

  it('shows date validation and disables selection when range is invalid', async () => {
    await renderPage()

    await userEvent.type(screen.getByLabelText('From date'), '2026-05-10')
    await userEvent.type(screen.getByLabelText('To date'), '2026-05-01')

    expect(screen.getByText('From date must be on or before to date.')).toBeInTheDocument()
    expect(screen.getByLabelText('Select all visible filtered priceable timesheets')).toBeDisabled()
    expect(screen.getByLabelText('Select entry for Alex Rivera on 2026-05-01')).toBeDisabled()
  })

  it('shows filtered-empty state and clears filters from the filter bar', async () => {
    await renderPage()

    await userEvent.selectOptions(screen.getByLabelText('Contract'), '2')
    await userEvent.type(screen.getByLabelText('From date'), '2026-05-01')
    await userEvent.type(screen.getByLabelText('To date'), '2026-05-01')

    expect(
      screen.getByText('No timesheet entries match the current filters.')
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(screen.getByText('2 entries · 12.0h · £850.00 est.')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Alex Rivera' })).toBeInTheDocument()
  })

  it('clears filters from the filter bar while rows are still visible', async () => {
    await renderPage()

    await userEvent.selectOptions(screen.getByLabelText('Freelancer'), '11')

    expect(screen.getByText('1 entry · 8.0h · £600.00 est.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Clear filters' })).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(screen.getByText('2 entries · 12.0h · £850.00 est.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })

  it('disables reject confirmation until a reason is provided', async () => {
    await renderPage()

    const table = screen.getByRole('table')
    await userEvent.click(
      within(table).getByRole('button', {
        name: 'Reject entry for Alex Rivera on 2026-05-01',
      })
    )

    const confirmButton = screen.getByRole('button', { name: 'Confirm rejection' })
    expect(confirmButton).toBeDisabled()
    expect(patchTimesheetEntryMock).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText('Rejection reason'), 'Not approved')
    expect(confirmButton).toBeEnabled()
  })

  it('retries loading after a query failure', async () => {
    fetchTimesheetsMock.mockRejectedValueOnce(new Error('Network error'))
    fetchContractsMock.mockResolvedValue(contractsFixture)

    await renderPage('admin', { waitForFilters: false })

    expect(
      await screen.findByText('Failed to load submitted timesheets. Please try again.')
    ).toBeInTheDocument()

    fetchTimesheetsMock.mockResolvedValue(submittedEntriesFixture)
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByLabelText('Contract')).toBeInTheDocument()
    expect(screen.getByText('2 entries · 12.0h · £850.00 est.')).toBeInTheDocument()
  })
})
