# Deepgram Speech-to-Text Integration Plan

## Overview
This plan outlines the integration of Deepgram as a third speech-to-text option alongside the existing Web Speech API and Vosk implementations in the anatomy tutoring application.

## Current State Analysis
- **Web Speech API**: Currently working and functional
- **Vosk**: Infrastructure in place but not yet functional
- **Deepgram**: Not yet implemented

## Implementation Plan

### Phase 1: Setup and Dependencies

#### 1.1 Install Deepgram SDK
```bash
pnpm add @deepgram/sdk
```
Status: DONE

#### 1.2 Add Required Dependencies
```bash
pnpm add cross-fetch dotenv
```
Status: DONE

#### 1.3 Environment Configuration
- Add `DEEPGRAM_API_KEY` to environment variables
- Update `env.example` with new variable
- Ensure API key is properly configured for production
Status: DONE

**Security Considerations**:
- **NEVER expose API keys in browser** - This is a major security vulnerability
- **Use server-side proxy**: Create Next.js API route to proxy requests (secure and recommended)

### Phase 2: Core Implementation

#### 2.1 Create Next.js API Proxy Route
**File**: `src/app/api/deepgram/route.ts`

**Purpose**: Secure proxy between browser and Deepgram API
- Keep API key secure on server
- Handle WebSocket connections
- Implement rate limiting and usage monitoring
- Stream audio data bidirectionally

#### 2.2 Create Deepgram Helper Module
**File**: `src/utils/deepgramHelpers.ts`

**Key Functions**:
- `startDeepgramRecording()` - Connect to Next.js proxy route
- `stopDeepgramRecording()` - Clean up connections and resources
- `isDeepgramModelLoaded()` - Check if Deepgram is ready

**Configuration**:
- Model: `nova-3` (latest model)
- Language: `en-US`
- Smart formatting: `true`

#### 2.3 Audio Stream Integration
**Implementation Details**:
- Capture microphone audio using `getUserMedia()`
- Convert to appropriate format for Deepgram (16kHz, mono)
- Stream audio chunks to the server and from there to Deepgram live transcription API (use a proxy route)
- Handle real-time transcription results

**Audio Processing Pipeline**:
```
Browser: Microphone → AudioContext → ScriptProcessorNode → Next.js API Route → Deepgram WebSocket API
```

**Architecture Notes**:
- **Server-side proxy required**: API key must stay secure on the server
- **WebSocket connection**: Deepgram uses WebSocket for real-time streaming
- **Next.js API route**: Acts as secure proxy between browser and Deepgram

**Secure Implementation**:
```
Browser → Next.js API Route → Deepgram WebSocket API (API key on server)
```
- ✅ API key secured on server
- ✅ Rate limiting and usage monitoring
- ✅ Proper authentication and authorization
- ✅ Cost control and abuse prevention

#### 2.4 Server-Side Proxy Implementation Details

**Next.js API Route Structure**:
```typescript
// src/app/api/deepgram/route.ts
export async function POST(request: Request) {
  // 1. Authenticate user session
  // 2. Initialize Deepgram WebSocket connection
  // 3. Stream audio data to Deepgram
  // 4. Stream transcription results back to client
  // 5. Handle connection cleanup
}
```

**WebSocket Proxy Flow**:
1. Browser establishes WebSocket connection to `/api/deepgram`
2. Next.js route authenticates and creates Deepgram WebSocket
3. Audio chunks flow: Browser → Next.js → Deepgram
4. Transcription results flow: Deepgram → Next.js → Browser
5. Connection cleanup when session ends

#### 2.5 Error Handling and Fallbacks
- Network connectivity issues
- API rate limiting
- Audio device access problems
- Graceful fallback to Web Speech API if Deepgram fails

### Phase 3: UI Integration

#### 3.1 Update Model Selection
**File**: `src/components/MicrophoneButton.tsx`

**Changes**:
- Add "Deepgram" option to model dropdown
- Update model switching logic
- Add loading states for Deepgram initialization

**Model Options**:
1. Web Speech API (existing)
2. Vosk (existing, non-functional)
3. Deepgram (new)

#### 3.2 User Experience Enhancements
- Loading indicators during Deepgram connection
- Error messages for failed connections
- Success indicators when Deepgram is ready
- Model switching without interrupting current session


### Phase 4: Testing and Quality Assurance

#### 4.1 Unit Tests
**File**: `tests/unit/Chat.deepgram.test.tsx`

**Test Coverage**:
- Deepgram helper functions
- Model switching with Deepgram
- Error handling scenarios
- Audio stream processing

#### 4.2 Integration Tests
**File**: `tests/integration/deepgram-integration.test.ts`

**Test Scenarios**:
- End-to-end Deepgram transcription
- Model switching between all three options
- Network failure handling

#### 4.3 E2E Tests
**File**: `tests/e2e/deepgram.spec.ts`

**Test Cases**:
- User can select Deepgram model
- Transcription works with Deepgram
- Model switching preserves session state

### Phase 5: Performance Optimization

#### 5.1 Connection Management
- Implement connection pooling
- Handle connection timeouts
- Optimize audio chunk sizes
- Manage memory usage

#### 5.2 Latency Optimization
- Minimize audio processing delays
- Optimize network requests
- Implement local buffering strategies
- Monitor and log performance metrics

### Phase 6: Documentation and Deployment

#### 6.1 Documentation Updates
- Update `docs/instructions.md` with Deepgram setup
- Add API key configuration guide
- Document model selection options
- Create troubleshooting guide

#### 6.2 Production Deployment
- Configure production API keys
- Set up monitoring and logging
- Implement usage analytics
- Plan for scaling considerations

## Technical Architecture

### File Structure
```
src/
├── app/
│   └── api/
│       └── deepgram/
│           └── route.ts            # Secure proxy to Deepgram API
├── utils/
│   ├── deepgramHelpers.ts          # Deepgram client-side implementation
│   ├── voskHelpers.ts              # Existing Vosk (non-functional)
│   └── webSpeechHelpers.ts         # Existing Web Speech API
├── components/
│   └── MicrophoneButton.tsx        # Updated with Deepgram option
└── hooks/
    └── useSpeechRecognition.ts     # Updated for three models
```

### API Integration Flow
```
User Input → Model Selection → Audio Capture → Next.js Proxy → Deepgram API → Results
     ↓              ↓              ↓              ↓              ↓              ↓
  Microphone    Dropdown      AudioContext    Secure Route    WebSocket     UI Update
   Button       Selection      Processing      (API Key)      Live Stream     Display
```

## Success Criteria

### Functional Requirements
- [ ] Deepgram model appears in dropdown
- [ ] Users can switch to Deepgram model
- [ ] Real-time transcription works with Deepgram
- [ ] Biology terms are recognized accurately
- [ ] Model switching doesn't break existing functionality
- [ ] Choosing a new model in the dropdown will properly end the Deepgram stream

### Performance Requirements
- [ ] Transcription latency < 500ms
- [ ] Connection establishment < 2 seconds
- [ ] Memory usage remains stable
- [ ] No audio quality degradation

### User Experience Requirements
- [ ] Clear loading states
- [ ] Helpful error messages
- [ ] Smooth model switching
- [ ] Consistent UI across all models

## Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement exponential backoff and retry logic
- **Network Issues**: Add offline detection and graceful degradation
- **Audio Quality**: Validate audio format and sample rate requirements
- **Browser Compatibility**: Test across target browsers
- **Data Privacy**: Ensure audio data handling complies with privacy requirements
- **Reliability**: Maintain fallback options for critical functionality

## References

- [Deepgram Live Streaming Documentation](https://developers.deepgram.com/docs/live-streaming-audio)
- [Deepgram SDK for JavaScript](https://github.com/deepgram/deepgram-js-sdk)
- [Model Options and Languages](https://developers.deepgram.com/docs/models-and-languages)
