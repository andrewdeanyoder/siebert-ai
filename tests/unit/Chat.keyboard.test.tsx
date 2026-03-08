import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Chat from '../../src/components/Chat'
import submitMessages from '../../src/lib/http/submitMessages'

vi.mock('../../src/lib/http/submitMessages', () => ({
  default: vi.fn(),
}))

const mockSubmitMessages = vi.mocked(submitMessages)

class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  onresult: ((event: unknown) => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  start() {}
  stop() {
    if (this.onend) this.onend()
  }
}

describe('Chat keyboard submission', () => {
  beforeEach(() => {
    ;(globalThis as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition
    ;(globalThis as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition
    mockSubmitMessages.mockResolvedValue({
      id: '99',
      role: 'assistant',
      content: 'AI response',
    })
  })

  afterEach(vi.clearAllMocks)

  it('submits the message and shows it in the chat when Enter is pressed', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Chat />)
    const textarea = screen.getByPlaceholderText('Type your message...')

    // Act
    await user.type(textarea, 'hello world')
    await user.keyboard('{Enter}')

    // Assert — submitMessages called with correct args
    expect(mockSubmitMessages).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ role: 'user', content: 'hello world' }),
      expect.any(Function),
      expect.any(Function),
    )

    // Assert — user message and AI response appear in the DOM
    await waitFor(() => {
      expect(screen.getByText('hello world')).toBeInTheDocument()
      expect(screen.getByText('AI response')).toBeInTheDocument()
    })
  })

  it('does not submit when Enter is pressed with an empty input', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Chat />)
    const textarea = screen.getByPlaceholderText('Type your message...')

    // Act
    await user.click(textarea)
    await user.keyboard('{Enter}')

    // Assert
    expect(mockSubmitMessages).not.toHaveBeenCalled()
  })

  it('inserts a newline instead of submitting when Shift+Enter is pressed', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<Chat />)
    const textarea = screen.getByPlaceholderText('Type your message...')

    // Act
    await user.type(textarea, 'hello world')
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    // Assert — submitMessages NOT called
    expect(mockSubmitMessages).not.toHaveBeenCalled()

    // Assert — textarea retains content with a newline appended
    expect(textarea).toHaveValue('hello world\n')
  })
})
