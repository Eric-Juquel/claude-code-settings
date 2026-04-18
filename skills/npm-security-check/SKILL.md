---
name: npm-security-check
description: >
  Security gate that MUST run before any npm, pnpm, or yarn install/add/update command is executed by any skill, agent, or tool call. Use this skill whenever you are about to install, add, or upgrade npm packages — including when scaffolding projects, running `npm install`, `pnpm add`, `yarn add`, `npx`, or updating dependencies. Also use it when reviewing a package.json that is about to be installed. Do NOT skip this check, even for well-known packages — supply chain attacks target popular packages (axios, event-stream, ua-parser-js, etc.).
---

# npm Security Check

You are acting as a security gate before any npm package installation. Your job is to fetch the current list of known compromised packages from the web, cross-reference it against the packages about to be installed, and give a clear GO / NO-GO decision before any install command runs.

## Step 1 — Identify packages to check

Extract the full list of packages that are about to be installed. Sources to check:
- The explicit install command (e.g. `npm install axios react`)
- Any `package.json` `dependencies` / `devDependencies` / `peerDependencies` that will be installed
- Any lockfile being restored (`npm ci`, `pnpm install`, etc.) — in this case, extract names from `package.json`

If packages come from a command, parse the package names and their requested versions.

## Step 2 — Fetch the live threat intelligence (do this in parallel)

Run all three of these web searches **simultaneously** to get the most current data:

**Search A — Socket.dev supply chain alerts:**
Search: `site:socket.dev/blog compromised malicious npm package 2025 OR 2026`

**Search B — Recent npm supply chain attacks:**
Search: `npm package supply chain attack compromised malicious 2025 OR 2026`

**Search C — Per-package spot check** (for each package being installed, if ≤ 5 packages):
Search: `"<package-name>" npm malicious OR compromised OR supply chain attack OR backdoor`

Also fetch the socket.dev page for any package you're uncertain about:
`https://socket.dev/npm/package/<package-name>`

## Step 3 — Cross-reference

Compare the packages being installed against everything found in Step 2. Flag a package if **any** of the following are true:
- It appears by name in a known compromise report
- The **specific version** being installed matches a reported compromised version
- It has an unexpected dependency on a suspicious package (e.g. a crypto package suddenly appearing as a dependency of an HTTP client)
- It was published very recently with no GitHub release counterpart (a red flag for account takeover attacks)

## Step 4 — Report and decide

Output a concise security report using this format:

```
## npm Security Check

**Packages scanned:** <count>
**Threat sources checked:** socket.dev, npm advisories, web search (<date>)

### Results

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| axios   | 1.14.1  | ❌ BLOCKED | Compromised — RAT injected via plain-crypto-js (Apr 2026) |
| react   | 19.1.0  | ✅ Safe | No known issues |

### Decision: GO ✅ / NO-GO ❌

<If NO-GO: explain what to do instead — e.g. pin to a safe version, use an alternative>
```

**GO** — proceed with the install, no action needed.

**NO-GO** — DO NOT run the install command. Inform the user clearly, show which packages are flagged and why, and suggest safe alternatives (older clean version, fork, alternative package).

## Permanently flagged packages (known bad at time of skill creation)

These packages were confirmed compromised — treat them as NO-GO regardless of web search results:

| Package | Bad Version(s) | Date | Details |
|---------|---------------|------|---------|
| `axios` | 1.14.1, 0.30.4 | Apr 2026 | RAT via `plain-crypto-js` dep; C2: sfrclak.com |
| `plain-crypto-js` | 4.2.0, 4.2.1 | Apr 2026 | Malicious package injected into axios |
| `@shadanai/openclaw` | 2026.3.31-1, 2026.3.31-2 | Apr 2026 | Related malicious package |
| `@qqbrowser/openclaw-qbot` | 0.0.130 | Apr 2026 | Related malicious package |
| `event-stream` | 3.3.6 | Nov 2018 | Backdoor targeting bitpay wallets |
| `ua-parser-js` | 0.7.29, 0.8.0, 1.0.0 | Oct 2021 | Cryptominer + password stealer |
| `coa` | 2.0.3, 2.0.4 | Nov 2021 | Malicious postinstall script |
| `rc` | 1.2.9 | Nov 2021 | Malicious postinstall script |
| `node-ipc` | 10.1.1, 10.1.2 | Mar 2022 | Protestware wiping files |
| `faker` | 6.6.6 | Jan 2022 | Protestware (intentional breakage) |
| `colors` | 1.4.44-liberty-2 | Jan 2022 | Protestware (infinite loop) |
| `xz` / `liblzma` | 5.6.0, 5.6.1 | Mar 2024 | Backdoor in sshd (CVE-2024-3094) |

> This list is a baseline — the live web search in Step 2 always takes priority and will surface newer threats.

## Important notes

- **Always run Step 2** even if a package isn't in the static list above. Supply chain attacks happen fast and the static list goes stale.
- **Version specificity matters.** `axios@1.14.0` is clean; `axios@1.14.1` is not. Always check the exact version, not just the package name.
- **Transitive dependencies** are also a vector. If you can inspect the lockfile or dependency tree, flag suspicious new transitive deps (e.g. an HTTP library suddenly pulling in a crypto package).
- **When in doubt, block.** A false positive (blocking a safe package) is far less costly than a false negative (installing a RAT).
