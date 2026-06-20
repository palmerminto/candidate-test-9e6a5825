import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../hooks/useAuth'
import { AuthUser } from '../api/client'

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  user?: AuthUser
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function AllProviders({
  children,
  route = '/',
  user,
}: {
  children: ReactNode
  route?: string
  user?: AuthUser
}) {
  if (user) {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify(user))
  }

  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  { route, user, ...options }: RenderWithProvidersOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders route={route} user={user}>
        {children}
      </AllProviders>
    ),
    ...options,
  })
}
