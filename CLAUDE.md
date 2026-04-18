Personal informations :

- Name : Eric
- career : Software Engineer
- experience : 5 years
- skills : Javascript, Typescript, React, Node.js, Tailwind CSS, REST APIs, Git, Agile methodologies

Security :

IMPORTANT: NEVER expose credentials in any files (code files, scripts, documentation files). This includes API keys, tokens, passwords, secrets, private keys, and any other sensitive data. Always use environment variables or a secrets manager, and never hardcode credentials.

npm Security (GLOBAL — applies to ALL projects) :

IMPORTANT: BEFORE running any npm/pnpm/yarn install, add, or update command:
1. ALWAYS invoke the /npm-security-check skill first.
2. ONLY proceed with the install if the result is GO ✅.
3. If a package is flagged NO-GO ❌, do NOT install it — inform the user and suggest a safe pinned alternative version instead.
4. When installing, always pin to the specific safe version identified by the security check (e.g. `npm install foo@1.2.3`), never install unpinned (e.g. never `npm install foo` without a version).
5. Use `--ignore-scripts` whenever native rebuild is not strictly required, to reduce attack surface from postinstall scripts.
