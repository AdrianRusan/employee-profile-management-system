import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'

// Create a custom render function that includes providers
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

interface AllTheProvidersProps {
  children: React.ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const testQueryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      <SessionProvider session={null}>{children}</SessionProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock user data for testing
export const mockUsers = {
  manager: {
    id: '1',
    email: 'emily@example.com',
    name: 'Emily Manager',
    role: 'MANAGER' as const,
    department: 'Engineering',
    title: 'Engineering Manager',
    bio: 'Passionate about building great teams',
    avatar: null,
    salary: 120000,
    ssn: '123-45-6789',
    address: '123 Main St',
    performanceRating: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  employee: {
    id: '2',
    email: 'david@example.com',
    name: 'David Developer',
    role: 'EMPLOYEE' as const,
    department: 'Engineering',
    title: 'Senior Software Engineer',
    bio: 'Full-stack developer',
    avatar: null,
    salary: 100000,
    ssn: '987-65-4321',
    address: '456 Oak Ave',
    performanceRating: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  coworker: {
    id: '3',
    email: 'sarah@example.com',
    name: 'Sarah Designer',
    role: 'COWORKER' as const,
    department: 'Design',
    title: 'Senior UX Designer',
    bio: 'Creating delightful user experiences',
    avatar: null,
    salary: 95000,
    ssn: '111-22-3333',
    address: '789 Pine Rd',
    performanceRating: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

// Mock feedback data
export const mockFeedback = {
  id: '1',
  content: 'Great work on the project!',
  polishedContent: 'Excellent work on the project. Your attention to detail was impressive.',
  isPolished: true,
  giverId: mockUsers.coworker.id,
  receiverId: mockUsers.employee.id,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock absence request data
export const mockAbsenceRequest = {
  id: '1',
  startDate: new Date('2024-02-01'),
  endDate: new Date('2024-02-05'),
  reason: 'Family vacation',
  status: 'PENDING' as const,
  userId: mockUsers.employee.id,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}
