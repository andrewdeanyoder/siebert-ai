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

  it('displays TTS method dropdown with Vosk and Browser VoiceRecognition options', async () => {
    render(<Chat />)

    // The dropdown should be present underneath the input field
    const dropdown = screen.getByRole('combobox', { name: /tts method/i })
    expect(dropdown).toBeInTheDocument()

    // Click to open dropdown
    fireEvent.click(dropdown)

    // Should show both options
    const browserOption = screen.getByRole('option', { name: /browser/i })
    const voskOption = screen.getByRole('option', { name: /vosk \(untrained\)/i })

    expect(browserOption).toBeInTheDocument()
    expect(voskOption).toBeInTheDocument()

    // Browser VoiceRecognition should be selected by default
    expect(dropdown).toHaveValue('browser')

    // Select Vosk option
    fireEvent.change(dropdown, { target: { value: 'vosk' } })

    // Vosk should now be selected
    expect(dropdown).toHaveValue('vosk')

    const micButton = screen.getByRole('button', { name: /start recording/i })
    expect(micButton).toBeInTheDocument()
  })


})


