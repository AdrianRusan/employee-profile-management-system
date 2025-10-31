import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, waitFor } from '../../lib/test-utils'
import userEvent from '@testing-library/user-event'
import FeedbackForm from '../FeedbackForm'
import { mockUsers } from '../../lib/test-utils'

describe('FeedbackForm', () => {
  it('should render feedback form with textarea', () => {
    render(<FeedbackForm receiverId={mockUsers.employee.id} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('should show character count', () => {
    render(<FeedbackForm receiverId={mockUsers.employee.id} />)

    expect(screen.getByText(/0.*2000/)).toBeInTheDocument()
  })

  it('should validate minimum content length', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm receiverId={mockUsers.employee.id} />)

    const textarea = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /submit/i })

    await user.type(textarea, 'Short')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument()
    })
  })

  it('should validate maximum content length', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm receiverId={mockUsers.employee.id} />)

    const textarea = screen.getByRole('textbox')
    const longText = 'a'.repeat(2001)

    await user.type(textarea, longText)

    await waitFor(() => {
      expect(screen.getByText(/maximum.*2000 characters/i)).toBeInTheDocument()
    })
  })

  it('should show Polish with AI button', () => {
    render(<FeedbackForm receiverId={mockUsers.employee.id} />)

    expect(screen.getByRole('button', { name: /polish.*ai/i })).toBeInTheDocument()
  })

  it('should disable submit button when content is too short', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm receiverId={mockUsers.employee.id} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Short')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when content is valid', async () => {
    const user = userEvent.setup()
    render(<FeedbackForm receiverId={mockUsers.employee.id} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'This is valid feedback content that meets the minimum length requirement')

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /submit/i })
      expect(submitButton).toBeEnabled()
    })
  })

  it('should call onSubmit with feedback data', async () => {
    const mockOnSubmit = jest.fn()
    const user = userEvent.setup()

    render(
      <FeedbackForm receiverId={mockUsers.employee.id} onSubmit={mockOnSubmit} />
    )

    const textarea = screen.getByRole('textbox')
    const feedbackContent = 'Great work on the recent project! Very impressed.'

    await user.type(textarea, feedbackContent)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        receiverId: mockUsers.employee.id,
        content: feedbackContent,
      })
    })
  })
})
