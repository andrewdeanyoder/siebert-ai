# Current Architecture - Siebert Science AI

## System Overview

```mermaid
graph TB
    subgraph "Frontend (Next.js App Router)"
        A[page.tsx - Main Page] --> B[Chat Component]
        B --> C[Messages Component]
        B --> D[MicrophoneButton Component]
        D --> E[useSpeechRecognition Hook]
        E --> F[Web Speech API]
        B --> G[submitMessages.ts]
        A --> H[Layout.tsx]
        H --> I[globals.css]
        H --> J[Analytics]
    end

    subgraph "Backend API"
        K[api/chat/route.ts] --> L[OpenAI API]
        K --> M[prompts.ts - System Prompt]
        K --> N[constants.ts]
    end

    subgraph "External Services"
        L --> O[OpenAI Models]
        F --> P[Browser Speech Recognition]
        J --> Q[Vercel Analytics]
    end

    subgraph "Data Flow"
        R[User Input - Text/Speech] --> B
        B --> G
        G --> K
        K --> O
        O --> K
        K --> B
        B --> C
    end

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style K fill:#fff3e0
    style O fill:#e8f5e8
    style R fill:#fff3e0
    style F fill:#ffebee
```

## Component Architecture

```mermaid
graph LR
    subgraph "App Structure"
        A[RootLayout] --> B[page.tsx]
        B --> C[Chat.tsx]
        C --> D[Messages.tsx]
        C --> E[MicrophoneButton.tsx]
        E --> F[useSpeechRecognition Hook]
    end

    subgraph "State Management"
        G[useState - messages] --> C
        H[useState - input] --> C
        I[useState - isLoading] --> C
        J[useState - isRecording] --> F
        K[useState - speechSupported] --> F
    end

    subgraph "API Layer"
        L[submitMessages.ts] --> M[route.ts]
        M --> N[generateText]
        N --> O[OpenAI Models]
    end

    subgraph "Speech Recognition"
        F --> P[Web Speech API]
        P --> Q[Speech Recognition Events]
        Q --> R[Transcript Callback]
        R --> C
    end

    style A fill:#e3f2fd
    style B fill:#e1f5fe
    style C fill:#f3e5f5
    style M fill:#fff3e0
    style P fill:#ffebee
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant P as page.tsx
    participant C as Chat.tsx
    participant MB as MicrophoneButton
    participant SR as Speech Recognition
    participant M as Messages.tsx
    participant A as API Route
    participant O as OpenAI Models

    Note over U,O: Text Input Flow
    U->>P: Type message
    P->>C: handleInputChange
    U->>P: Submit form
    P->>P: Add user message to state
    P->>A: POST /api/chat
    A->>A: Load system prompt
    A->>O: generateText()
    O->>A: AI response
    A->>P: JSON response
    P->>P: Add AI message to state
    P->>M: Render messages
    M->>U: Display conversation

    Note over U,O: Speech Input Flow
    U->>MB: Click microphone
    MB->>SR: Start recording
    SR->>SR: Process speech
    SR->>MB: onTranscript callback
    MB->>C: Update input with transcript
    C->>P: Text appears in input
    U->>MB: Click microphone (stop)
    MB->>SR: Stop recording
    Note over U,O: Continue with text flow above
```

## Speech Recognition Architecture

```mermaid
graph TB
    subgraph "Speech Recognition Flow"
        A[User Clicks Microphone] --> B[MicrophoneButton Component]
        B --> C[useSpeechRecognition Hook]
        C --> D[Check Browser Support]
        D --> E[Create SpeechRecognition Instance]
        E --> F[Configure Recognition Settings]
        F --> G[Start Recording]
        G --> H[Web Speech API]
        H --> I[Process Audio]
        I --> J[Generate Transcript]
        J --> K[onTranscript Callback]
        K --> L[Update Input Field]
        L --> M[User Sees Text]
        M --> N[User Clicks Stop]
        N --> O[Stop Recording]
    end

    subgraph "Component Structure"
        P[Chat.tsx] --> Q[MicrophoneButton.tsx]
        Q --> R[useSpeechRecognition.ts]
        R --> S[Web Speech API]
    end

    subgraph "State Management"
        T[isRecording] --> R
        U[speechSupported] --> R
        V[toggleRecording] --> R
        W[onTranscript] --> P
    end

    style A fill:#fff3e0
    style H fill:#ffebee
    style L fill:#e8f5e8
    style R fill:#e3f2fd
```

## Authentication Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js App Router)"
        A[page.tsx - Main Page] --> B[Middleware Check]
        B --> C[Login Page]
        C --> D[Login Form]
        D --> E[Login Actions]
        A --> F[Logout Button]
    end

    subgraph "Backend & Auth"
        E --> G[Supabase Auth]
        G --> H[User Session]
        H --> I[Protected Routes]
        F --> J[Logout Action]
        J --> G
    end

    subgraph "Data Flow"
        K[User Credentials] --> D
        D --> E
        E --> G
        G --> H
        H --> I
        I --> A
    end

    style A fill:#e1f5fe
    style C fill:#f3e5f5
    style G fill:#e8f5e8
    style K fill:#fff3e0
```

## Login Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant M as Middleware
    participant L as Login Page
    participant S as Supabase
    participant P as Protected Page

    U->>M: Access protected route
    M->>M: Check session
    M->>L: Redirect to login (if no session)
    U->>L: Enter credentials
    L->>S: Authenticate user
    S->>L: Return session
    L->>P: Redirect to protected page
    P->>U: Display authenticated content
```
