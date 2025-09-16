This file lists completed and upcoming units of work.

## Completed Tasks

1. [x] Add chat functionality to frontend
2. [x] Add chat route
3. [x] Provide an openapi key; refactor system prompt to be in separate file
4. [x] Add border and submit button around the input box, Remove vercel links; add memory lab banner
5. [x] Display messages in markdown
6. [x] Update system prompt
7. [x] Replace the banner with a brain and title
8. [x] Scroll to the bottom when a new message comes in
9. [x] Add a banner to the top of the page when user scrolls down far enough
10. [x] Install analytics
11. [x] Display what model the app is using;
12. [x] bug fix- feed all messages to the model so that it doesn't get stuck in a loop
13. [x] Update the logo
14. [x] Add architectural diagrams for AI to reference
15. [x] Install eslint & prettier with standard rule set for nextjs
16. [x] Create test directories and scripts for vitest and playwright; install vitest and playwright; create a test plan; create tests for the first user flow
17. [x] Add logout buttons (top right and sticky header)
18. [x] Update e2e tests for the login flow
19. [ ] Debug and make improvements for authentication
    a. [x] when signup or login is not successful, actually redirect to the error
    b. [x] when signup is not successful, display the appropriate error message
    c. [x] when signup is successful, display a message to check your email
    d. [ ] when login is not successful, display more detailed error messages based on the possibilties from Supabase
    e. [x] after a user has confirmed their email, they should be able to sign in again with the same password
    f. [x] validate and sanitize all form inputs.
    g. [x] logout button
    h. [ ] reset password button
    i. [x] add a button to in the form input to make the password visible. It should toggle on and off with each click.
    j. [ ] enforce some sort of minimum password standards
    k. [x] delete the error route
    l. [ ] refactor the query params redirect to use cookies or server-side state management instead
20. [x] Debug errors for why we can't use a better model
21. [ ] spike basic TTS
    a. [x] basic implementation through browser api
    b. [ ] add a small dropdown menu component inside the chat component, underneath the input field that allows the user to select TTS method - either Vosk (untrained) or Browser VoiceRecognition; when the user selects Vosk, nothing should happen for now.
    c. [ ] create a new hook for  When the user selects Vosk menu, use Vosk voice recognition hook to listen and transcribe to the text area
    d. [ ] make the text area expand as interim results come in
22. [ ] productionize chosen TTS metho
    b. [ ] help me understand all implementations in detail
    c. [ ] discard code and write failing unit tests
    e. [ ] have interim results come in more frequently?
22. [ ] Update e2e tests to cover chat functionality
    a. [ ] Actually type messages into the input field
    b. [ ] Submit messages to test the chat functionality
    c. [ ] Verify message sending/receiving
    f. [ ] Test error states and loading states
