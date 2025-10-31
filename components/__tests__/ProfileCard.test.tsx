import { describe, it, expect } from '@jest/globals'
import { render, screen } from '../../lib/test-utils'
import ProfileCard from '../ProfileCard'
import { mockUsers } from '../../lib/test-utils'

describe('ProfileCard', () => {
  it('should render user name and title', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="MANAGER"
        viewerId={mockUsers.manager.id}
      />
    )

    expect(screen.getByText(mockUsers.employee.name)).toBeInTheDocument()
    expect(screen.getByText(mockUsers.employee.title!)).toBeInTheDocument()
  })

  it('should render user department', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="MANAGER"
        viewerId={mockUsers.manager.id}
      />
    )

    expect(screen.getByText(mockUsers.employee.department!)).toBeInTheDocument()
  })

  it('should show sensitive fields for MANAGER viewing any user', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="MANAGER"
        viewerId={mockUsers.manager.id}
      />
    )

    expect(screen.getByText(/salary/i)).toBeInTheDocument()
    expect(screen.getByText(/performance/i)).toBeInTheDocument()
  })

  it('should hide sensitive fields for COWORKER viewing other user', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="COWORKER"
        viewerId={mockUsers.coworker.id}
      />
    )

    expect(screen.queryByText(/salary/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ssn/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/performance/i)).not.toBeInTheDocument()
  })

  it('should show sensitive fields for user viewing their own profile', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="EMPLOYEE"
        viewerId={mockUsers.employee.id}
      />
    )

    expect(screen.getByText(/salary/i)).toBeInTheDocument()
  })

  it('should show edit button for user viewing their own profile', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="EMPLOYEE"
        viewerId={mockUsers.employee.id}
      />
    )

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('should show edit button for MANAGER viewing any profile', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="MANAGER"
        viewerId={mockUsers.manager.id}
      />
    )

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('should not show edit button for COWORKER viewing other profile', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="COWORKER"
        viewerId={mockUsers.coworker.id}
      />
    )

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })

  it('should render bio if provided', () => {
    render(
      <ProfileCard
        user={mockUsers.employee}
        viewerRole="EMPLOYEE"
        viewerId={mockUsers.employee.id}
      />
    )

    expect(screen.getByText(mockUsers.employee.bio!)).toBeInTheDocument()
  })
})
