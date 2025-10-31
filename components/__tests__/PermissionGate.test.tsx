import { describe, it, expect } from '@jest/globals'
import { render, screen } from '../../lib/test-utils'
import PermissionGate from '../PermissionGate'

// Mock the auth store
jest.mock('../../stores/authStore', () => ({
  __esModule: true,
  default: (selector: any) => {
    if (typeof selector === 'function') {
      return selector({
        user: {
          id: '1',
          role: 'MANAGER',
        },
      })
    }
    return {
      user: {
        id: '1',
        role: 'MANAGER',
      },
    }
  },
}))

describe('PermissionGate', () => {
  it('should render children when user has required role', () => {
    render(
      <PermissionGate requiredRole="MANAGER">
        <div>Protected Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should not render children when user lacks required role', () => {
    // Temporarily change the mock to return EMPLOYEE
    jest.mock('../../stores/authStore', () => ({
      __esModule: true,
      default: () => ({
        user: {
          id: '2',
          role: 'EMPLOYEE',
        },
      }),
    }))

    render(
      <PermissionGate requiredRole="MANAGER">
        <div>Protected Content</div>
      </PermissionGate>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render fallback when user lacks permissions', () => {
    render(
      <PermissionGate requiredRole="EMPLOYEE" fallback={<div>No Access</div>}>
        <div>Protected Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('No Access')).toBeInTheDocument()
  })
})
