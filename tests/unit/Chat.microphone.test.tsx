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


