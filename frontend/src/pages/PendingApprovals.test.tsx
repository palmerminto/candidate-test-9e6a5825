import { beforeEach, describe, expect, it, vi } from 'vitest'
import PendingApprovals from './PendingApprovals'
import { renderWithProviders, screen, userEvent, within } from '../test/render'
import { contractsFixture, submittedEntriesFixture } from './pendingApprovals/testFixtures'

const { fetchTimesheetsMock, fetchContractsMock } = vi.hoisted(() => ({
  fetchTimesheetsMock: vi.fn(),
  fetchContractsMock: vi.fn(),
}))

vi.mock('../api/timesheets', () => ({
  fetchTimesheets: fetchTimesheetsMock,
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
    fetchTimesheetsMock.mockResolvedValue(submittedEntriesFixture)
    fetchContractsMock.mockResolvedValue(contractsFixture)
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

    const selectAll = screen.getByLabelText('Select all visible filtered priceable timesheets')
    await userEvent.click(selectAll)

    expect(screen.getByText('2 selected')).toBeInTheDocument()
    expect(screen.getByText('12h total')).toBeInTheDocument()
    expect(screen.getByText('£850.00 est.')).toBeInTheDocument()

    const orphanRowCheckbox = screen.getByLabelText(
      'Select timesheet for Unknown freelancer on 2026-05-03'
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
    expect(contractOptions).toEqual(['All contracts', 'Alex Rivera @ NorthStar Consulting'])

    const summaryRow = screen.getByText('1 selected').closest('tr')
    expect(summaryRow).not.toBeNull()
    expect(within(summaryRow as HTMLElement).getByText('8h total')).toBeInTheDocument()
    expect(within(summaryRow as HTMLElement).getByText('£600.00 est.')).toBeInTheDocument()
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

  it('shows date validation and disables selection when range is invalid', async () => {
    await renderPage()

    await userEvent.type(screen.getByLabelText('From date'), '2026-05-10')
    await userEvent.type(screen.getByLabelText('To date'), '2026-05-01')

    expect(screen.getByText('From date must be on or before to date.')).toBeInTheDocument()
    expect(screen.getByLabelText('Select all visible filtered priceable timesheets')).toBeDisabled()
    expect(screen.getByLabelText('Select timesheet for Alex Rivera on 2026-05-01')).toBeDisabled()
  })
})
