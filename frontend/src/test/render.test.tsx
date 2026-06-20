import { useAuth } from '../hooks/useAuth'
import { renderWithProviders, screen } from './render'

function AuthProbe() {
  const { user, isAdmin } = useAuth()
  return (
    <div>
      <span>{user?.email ?? 'anonymous'}</span>
      <span>{isAdmin ? 'admin' : 'not-admin'}</span>
    </div>
  )
}

describe('renderWithProviders', () => {
  it('wraps components with auth, routing, and query providers', () => {
    renderWithProviders(<AuthProbe />, {
      route: '/contracts',
      user: { id: 1, email: 'admin@example.com', role: 'admin' },
    })

    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })
})
