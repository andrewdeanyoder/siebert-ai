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
17. [ ] SKIP - update the existing e2e test to reflect that most routes are now protected. Update them to login
18. [ ] SKIP- create new e2e tests of the login flow
19. [ ] debug and make improvements for authentication
    a. [x] when signup or login is not successful, actually redirect to the error
    b. [x] when signup is not successful, display the appropriate error message
    c. [x] when signup is successful, display a message to check your email
    e. [x] after a user has confirmed their email, they should be able to sign in again with the same password
    f. [ ] validate and sanitize all form inputs.
    g. [ ] logout button
    h. [ ] reset password button
    i. [ ] button to make password visible
    j. [ ] enforce some sort of minimum password standards
    k. [ ] delete the error route
    d. [ ] when login is not successful, display more detailed error messages based on the possibilties from Supabase
    l. [ ] refactor the query params redirect to use cookies or server-side state management instead
21. [ ] Debug errors for why we can't use a better model