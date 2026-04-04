import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import Chat from '../../src/components/Chat'

// todo: can we move these mocks deeper, say to the boundary with the Deepgram sdk?
vi.mock('../../src/utils/deepgramHelpers', () => ({
  startDeepgramRecording: vi.fn(),
  stopDeepgramRecording: vi.fn(),
  pauseMicrophone: vi.fn(),
  resumeDeepgramMicrophone: vi.fn().mockResolvedValue(undefined),
}))

class MockSpeechRecognition {
  public continuous: boolean = false
  public interimResults: boolean = false
  public lang: string = 'en-US'
  public onresult: ((event: unknown) => void) | null = null
  public onend: (() => void) | null = null
  public onerror: ((event: unknown) => void) | null = null

  start() {
    (globalThis as unknown as Record<string, unknown>).__activeSR = this
  }

  stop() {
    if (this.onend) this.onend()
  }
}

describe('Chat microphone', () => {
  beforeEach(() => {
    ;(globalThis as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition
    ;(globalThis as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition

    const streamBody = '0:"AI response"\nd:{"finishReason":"stop"}\n'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(streamBody))
          controller.close()
        },
      }),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('expands textarea height when transcript text is appended from microphone', async () => {
    render(<Chat />)
    const textarea = screen.getByPlaceholderText('Type your message...')

    // Mock scrollHeight to return 96 when textarea has content, 0 when empty
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get(this: HTMLTextAreaElement) { return this.value ? 96 : 0; },
    })

    // Switch to browser TTS so MockSpeechRecognition is used
    const dropdown = screen.getByRole('combobox', { name: /tts method/i })
    const user = userEvent.setup()
    await user.selectOptions(dropdown, 'browser')

    // Wait for the mic button to be enabled (speechSupported=true after effect)
    const micButton = screen.getByRole('button', { name: /start recording/i })
    await waitFor(() => expect(micButton).not.toBeDisabled())

    // Start recording — this sets globalThis.__activeSR with onresult handler attached
    await user.click(micButton)

    // Fire a transcript as if the user spoke
    const activeSR = (globalThis as unknown as { __activeSR: { onresult: (e: unknown) => void } }).__activeSR
    activeSR.onresult({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: 'hello from mic' } }],
    })

    // Assert — textarea expanded without the user typing
    await waitFor(() => {
      expect(textarea.style.height).toBe('96px')
    })
  })

  it('displays TTS method dropdown with all four microphone options', async () => {
    render(<Chat />)

    // The dropdown should be present underneath the input field
    const dropdown = screen.getByRole('combobox', { name: /tts method/i })
    expect(dropdown).toBeInTheDocument()

    // Should show all four options: Deepgram, Deepgram Medical, Browser, Vosk
    const deepgramOption = screen.getByRole('option', { name: 'Deepgram' })
    const deepgramMedicalOption = screen.getByRole('option', { name: 'Deepgram Medical' })
    const browserOption = screen.getByRole('option', { name: /browser/i })
    const voskOption = screen.getByRole('option', { name: /vosk/i })

    expect(deepgramOption).toBeInTheDocument()
    expect(deepgramMedicalOption).toBeInTheDocument()
    expect(browserOption).toBeInTheDocument()
    expect(voskOption).toBeInTheDocument()

    expect(dropdown).toHaveValue('deepgram')

    // Select Vosk option
    const user = userEvent.setup()
    await user.selectOptions(dropdown, 'vosk')

    // Vosk should now be selected
    expect(dropdown).toHaveValue('vosk')

    const micButton = screen.getByRole('button', { name: /start recording/i })
    expect(micButton).toBeInTheDocument()
  })

  it('stops browser recording when form is submitted', async () => {
    const user = userEvent.setup()

    render(<Chat />)
    const dropdown = screen.getByRole('combobox', { name: /tts method/i })
    await user.selectOptions(dropdown, 'browser')

    const micButton = screen.getByRole('button', { name: /start recording/i })
    await waitFor(() => expect(micButton).not.toBeDisabled())
    await user.click(micButton)

    // After clicking, mic should be active
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
    )

    const textarea = screen.getByPlaceholderText('Type your message...')
    await user.type(textarea, 'hello')
    await user.keyboard('{Enter}')

    // Assert: recording state goes back to Stopped (not Paused)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
    )
  })

  it('pauses deepgram mic on submit and resumes after response, without calling stopDeepgramRecording', async () => {
    const user = userEvent.setup()
    const { pauseMicrophone, stopDeepgramRecording, resumeDeepgramMicrophone } =
      await import('../../src/utils/deepgramHelpers')

    render(<Chat />)
    // Start recording first so there is something to pause on submit
    const micButton = screen.getByRole('button', { name: /start recording/i })
    await waitFor(() => expect(micButton).not.toBeDisabled())
    await user.click(micButton)

    // After clicking, mic should be in Loading state
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /loading microphone/i })).toBeInTheDocument()
    )
    vi.clearAllMocks()

    const textarea = screen.getByPlaceholderText('Type your message...')
    await user.type(textarea, 'test message')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(pauseMicrophone).toHaveBeenCalled()
      expect(stopDeepgramRecording).not.toHaveBeenCalled()
      expect(resumeDeepgramMicrophone).toHaveBeenCalled()
    })

    // After response, mic should be back in Recording state
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
    )
  })

  it('does not pause or resume microphone when submitting without recording', async () => {
    const user = userEvent.setup()
    const { pauseMicrophone, resumeDeepgramMicrophone } =
      await import('../../src/utils/deepgramHelpers')

    render(<Chat />)
    vi.clearAllMocks()

    // Default TTS is Deepgram; mic is in Stopped state (never clicked)
    const textarea = screen.getByPlaceholderText('Type your message...')
    await user.type(textarea, 'hello')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('AI response')).toBeInTheDocument()
    })

    expect(pauseMicrophone).not.toHaveBeenCalled()
    expect(resumeDeepgramMicrophone).not.toHaveBeenCalled()
    // Mic button should still show "Start recording" (Stopped state), not "Stop recording" (Recording state)
    expect(screen.getByRole('button', { name: 'Start recording' })).toBeInTheDocument()
  })
})
