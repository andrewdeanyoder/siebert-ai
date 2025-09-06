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

  it('toggles recording and streams transcription into the input', async () => {
    render(<Chat />)

    const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement

    // Initially the microphone toggle should be present
    const micButtonStart = screen.getByRole('button', { name: /start recording/i })

    // Wait until speech support effect enables the button
    await waitFor(() => expect(micButtonStart).not.toBeDisabled())

    // Start recording
    fireEvent.click(micButtonStart)

    // After starting, the button should indicate stop state
    const micButtonStop = await screen.findByRole('button', { name: /stop recording/i })

    // Simulate recognition results streaming
    const active = (globalThis as any).__activeSR as MockSpeechRecognition
    expect(active).toBeTruthy()

    await act(async () => {
      active.onresult?.({
        resultIndex: 0,
        results: [
          { 0: { transcript: 'hello ' }, isFinal: true },
        ],
      } as any)
    })

    await waitFor(() => expect(input.value.toLowerCase()).toContain('hello'))

    await act(async () => {
      active.onresult?.({
        resultIndex: 1,
        results: [
          { 0: { transcript: 'world' }, isFinal: true },
        ],
      } as any)
    })

    await waitFor(() => expect(input.value.toLowerCase()).toContain('world'))

    // Stop recording
    fireEvent.click(micButtonStop)
    // Button should revert to start state
    await screen.findByRole('button', { name: /start recording/i })
  })
})


