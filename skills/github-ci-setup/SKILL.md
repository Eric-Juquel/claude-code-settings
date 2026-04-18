---
name: github-ci-setup
description: >
  Use when the user wants to add CI, set up GitHub Actions, create a ci.yml,
  configure automated testing on pull requests, or add a pipeline to a JS/TS
  project — even if they just say "I want tests to run automatically" or "set up
  CI for me". Triggers: no .github/workflows/ directory, missing branch protection,
  first CI setup for any pnpm / npm / yarn project regardless of stack or topology.
compatibility:
  tools:
    - Agent
    - Read
    - Write
    - Glob
    - Grep
    - Bash
---

# github-ci-setup

Scaffold a complete GitHub Actions CI pipeline for any JS/TS project.
**GitHub Actions specific** — not compatible with GitLab CI or Bitbucket Pipelines.

> **Detail references** (read when needed, not upfront):
> - `references/project-analysis.md` — how to detect, classify, and map packages
> - `references/templates.md` — all CI YAML, Dockerfile, and config file templates

---

## Step 1 — Build the project map

**Before writing a single line of YAML, understand the project completely.**

Read `references/project-analysis.md` for the full detection algorithm. In summary:

1. **Find all packages** — read `pnpm-workspace.yaml` (or `package.json#workspaces`).
   Resolve every glob to real directories. Never assume `apps/`, `packages/`, or any path.

2. **Classify each package** — read its `package.json` to detect:
   - Type: `frontend` / `backend` / `library`
   - Framework: vite-react, nextjs, nestjs, express, fastify, hono, angular, nuxt, …
   - Scripts: map logical roles (test, testCov, lint, build, typecheck) to actual names

3. **Check what already exists** — for each package:
   - `Dockerfile` present?
   - `.env.test` present?
   - `.github/workflows/ci.yml` present? (warn before overwriting)

4. **Show the project map** to the user before generating anything:

```
PROJECT MAP
===========
Topology: frontend + backend

[frontend] my-app  (packages/web)   framework: vite-react
  lint: lint ✓ | test: test:run ✓ | testCov: test:coverage ✓
  typecheck: typecheck ✓ | build: build ✓
  Dockerfile: ✗ | .env.test: ✗

[backend] my-api  (packages/api)    framework: nestjs
  lint: lint ✓ | test: test ✓ | testCov: test:cov ✓
  build: build ✓ | prisma: ✗
  Dockerfile: ✗
```

---

## Step 2 — Ask only what can't be detected

| Unknown | Ask |
|---|---|
| Package type ambiguous | "What does `{name}` do — frontend, backend, or shared?" |
| Protected branches | "Which branches should require PRs and passing CI? (default: main, develop)" |
| Dockerfiles missing | "Should I create Dockerfiles for deployment?" |
| Backend needs secrets to test | "Does the backend need env vars to run tests? (e.g. DATABASE_URL, API keys)" |

If everything is clear from the project map, skip asking and proceed.

---

## Step 3 — Generate files

See `references/templates.md` for every template. Generate in this order:

### 3a. `.github/workflows/ci.yml`

Rules:
- One `ci-{name}` job per detected frontend and backend package
- Use the **actual script names** from the project map — never assume `test:run` or `test:cov`
- Include `typecheck` step only if that script exists
- Include `prisma:generate` step only if that script exists
- Add `env:` to the backend test step for any secrets the user confirmed
- Security job: fs scan for every package (always) + image scan only for packages with a Dockerfile
- SonarCloud job: one coverage step per package, `needs` all `ci-*` jobs, `continue-on-error: true`
- `pnpm/action-setup@v4` everywhere — consistent version, no mix of v4/v5
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` at the top-level `env:`

### 3b. `sonar-project.properties`

At the monorepo root. List `sonar.sources` for all detected frontend/backend packages.
Exclude generated files (`dist/`, `coverage/`, codegen outputs like `src/api/generated/`).

**Coverage property — critical:** always use `sonar.javascript.lcov.reportPaths` (not `sonar.typescript.lcov.reportPaths` — that variant is not recognized by SonarCloud and results in 0.0% coverage in the dashboard).

### 3c. `.env.test` (Vite-based frontends only)

Create `{pkg-dir}/.env.test` if it doesn't exist. Content: `VITE_API_BASE_URL=http://localhost:3001`.
Safe to commit. Not needed for Next.js or non-Vite projects.

### 3d. Dockerfiles (if user confirmed)

Per package, pick the right template from `references/templates.md`:
- Vite SPA → `Dockerfile — SPA frontend` + `nginx.conf`
- Next.js → `Dockerfile — Next.js frontend`
- Node.js backend → `Dockerfile — Node.js backend`

**Build context is always the monorepo root** (`docker build -f pkg/Dockerfile .`).
pnpm workspace resolution requires `pnpm-workspace.yaml` at the root.
COPY all workspace `package.json` files before running `pnpm install`.

---

## Step 4 — Create protected branches if missing

Check if each listed protected branch exists locally or on the remote. If not:

```bash
git checkout -b develop && git push origin develop && git checkout -
```

Never create `main`. Always return to the original branch.

---

## Step 5 — Display the manual steps checklist

```
Manual steps to complete:

1. Verify all scripts exist in package.json
   CI fails silently with ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT if a script is absent.
   Check each package for: lint, TEST_SCRIPT, TESTCOV_SCRIPT, build, typecheck (if used)

2. Verify .env.test is not caught by .gitignore
   Standard .gitignore excludes .env and .env.local — NOT .env.test. Check anyway.

3. Add backend secrets to GitHub Actions (if needed)
   repo → Settings → Secrets and variables → Actions → New repository secret

4. Configure branch protection rules on GitHub
   repo → Settings → Branches → Add branch ruleset
   For each protected branch:
   ✅ Require a pull request before merging
   ✅ Require status checks → add all ci-* job names + Security Scan (Trivy) + SonarCloud
   ✅ Block force pushes
   ✅ Restrict deletions
   ℹ️  Solo dev: leave "Require approvals" unchecked (GitHub blocks self-approval)
   ℹ️  For develop: uncheck "Do not allow bypassing" to enable the "Update branch" button

5. SonarCloud setup
   - Create project at sonarcloud.io (import from GitHub)
   - Replace YOUR_PROJECT_KEY and YOUR_ORGANIZATION in sonar-project.properties
   - Add SONAR_TOKEN secret in GitHub → Settings → Secrets → Actions
     (generate at: sonarcloud.io → My Account → Security → Generate Tokens)
   - **Disable Automatic Analysis** in SonarCloud:
     project → Administration → Analysis Method → toggle off "Automatic Analysis"
     (if left enabled, CI scan fails with "You are running CI analysis while Automatic Analysis is enabled")
```

---

## Common mistakes

| Mistake | Fix |
|---|---|
| Hardcoding `apps/` or `packages/` | Always read workspace config first |
| Assuming `test:run` or `test:cov` exist | Check actual scripts in each `package.json` |
| Adding Prisma step unconditionally | Only if `prisma:generate` script is in `package.json` |
| Docker build context = package dir | Always use monorepo root — pnpm needs workspace manifests |
| Mixed `pnpm/action-setup` versions (v4/v5) | Use `@v4` everywhere |
| Prisma/Orval generated files in SonarCloud | Exclude `**/generated/**` in `sonar-project.properties` |
| Creating Dockerfiles without `nginx.conf` | SPA always needs nginx.conf for client-side routing |
| Missing `GITHUB_TOKEN` in SonarCloud step | `sonarcloud-github-action@v3` requires both `SONAR_TOKEN` and `GITHUB_TOKEN` — add `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` (auto-provided, no secret to create) |
| SonarCloud "Automatic Analysis" still enabled | CI scan fails with "You are running CI analysis while Automatic Analysis is enabled" — disable in SonarCloud → project → Administration → Analysis Method |
| CVEs in npm/npx bundled inside runtime Docker image | npm is not needed at runtime (`node dist/main`) — remove it: `RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx` |
| `npm install -g npm --ignore-scripts` to patch npm CVEs | Breaks npm itself (MODULE_NOT_FOUND for bundled deps) — remove npm instead, or don't use `--ignore-scripts` for npm self-update |
| Transitive dep CVEs in Trivy scan | Use `pnpm.overrides` in root `package.json` to force patched versions: `{ "pnpm": { "overrides": { "lodash": ">=4.18.0" } } }` then run `pnpm install` |
