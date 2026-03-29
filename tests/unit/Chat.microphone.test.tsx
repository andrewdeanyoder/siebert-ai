import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import Chat from '../../src/components/Chat'

class MockSpeechRecognition {
  public continuous: boolean = false
  public interimResults: boolean = false
  public lang: string = 'en-US'
  public onresult: ((event: any) => void) | null = null
  public onend: (() => void) | null = null
  public onerror: ((event: any) => void) | null = null

  start() {
    ;(globalThis as any).__activeSR = this
  }

  stop() {
    if (this.onend) this.onend()
  }
}

describe('Chat microphone', () => {
  beforeEach(() => {
    ;(globalThis as any).SpeechRecognition = MockSpeechRecognition as any
    ;(globalThis as any).webkitSpeechRecognition = MockSpeechRecognition as any
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
    fireEvent.change(dropdown, { target: { value: 'browser' } })

    // Wait for the mic button to be enabled (speechSupported=true after effect)
    const micButton = screen.getByRole('button', { name: /start recording/i })
    await waitFor(() => expect(micButton).not.toBeDisabled())

    // Start recording — this sets globalThis.__activeSR with onresult handler attached
    fireEvent.click(micButton)

    // Fire a transcript as if the user spoke
    const activeSR = (globalThis as unknown as { __activeSR: { onresult: (e: unknown) => void } }).__activeSR
    act(() => {
      activeSR.onresult({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'hello from mic' } }],
      })
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
    fireEvent.change(dropdown, { target: { value: 'vosk' } })

    // Vosk should now be selected
    expect(dropdown).toHaveValue('vosk')

    const micButton = screen.getByRole('button', { name: /start recording/i })
    expect(micButton).toBeInTheDocument()
  })


})


