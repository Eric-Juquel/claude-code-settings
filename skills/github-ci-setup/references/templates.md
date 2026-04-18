# CI & Dockerfile Templates

## CI YAML — base structure

Substitute `BRANCHES`, `FRONTEND_NAME`, `BACKEND_NAME`, `*_SCRIPT` from the project map.

```yaml
name: CI

on:
  push:
    branches: [BRANCHES]
  pull_request:
    branches: [BRANCHES]

# Opt in to Node.js 24 for actions (Node 20 deprecated Sept 2025)
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  ci-PACKAGE_NAME:        # one job per detected frontend/backend package
    name: CI PACKAGE_LABEL
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      # --- add package-specific steps below ---

  security:
    name: Security Scan (Trivy)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # --- fs scans (always), image scans (only if Dockerfiles exist) ---

  sonarcloud:
    name: SonarCloud
    runs-on: ubuntu-latest
    needs: [ci-PACKAGE_NAME, ...]   # list all ci-* jobs
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      # --- one coverage step per package ---
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@v3
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## CI steps by package type

### Frontend — Vite (React / Vue / Svelte / Solid)

```yaml
      - name: Type check           # only if typecheck script exists
        run: pnpm --filter PKG_NAME typecheck
      - name: Lint
        run: pnpm --filter PKG_NAME LINT_SCRIPT
      - name: Tests
        run: pnpm --filter PKG_NAME TEST_SCRIPT
      - name: Build
        run: pnpm --filter PKG_NAME build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL || 'http://localhost:3001' }}
```

### Frontend — Next.js

```yaml
      - name: Lint
        run: pnpm --filter PKG_NAME lint
      - name: Tests
        run: pnpm --filter PKG_NAME TEST_SCRIPT
      - name: Build
        run: pnpm --filter PKG_NAME build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL || 'http://localhost:3001' }}
```

### Backend — NestJS

```yaml
      # Only include prisma step if "prisma:generate" or "db:generate" exists in package.json
      # - name: Generate Prisma client
      #   run: pnpm --filter PKG_NAME prisma:generate
      - name: Lint
        run: pnpm --filter PKG_NAME lint
      - name: Tests
        run: pnpm --filter PKG_NAME TEST_SCRIPT
        env:
          NODE_ENV: test
          # Add project-specific secrets here (e.g. OPENAI_API_KEY, DATABASE_URL)
      - name: Build
        run: pnpm --filter PKG_NAME build
```

### Backend — Express / Fastify / Hono / other

Same as NestJS but omit `build` unless the script exists in `package.json`.

### Library / shared package

```yaml
      - name: Lint
        run: pnpm --filter PKG_NAME lint
      - name: Tests
        run: pnpm --filter PKG_NAME TEST_SCRIPT
      - name: Build
        run: pnpm --filter PKG_NAME build
```

### Stub (no backend yet)

```yaml
  ci-backend:
    name: CI Backend
    runs-on: ubuntu-latest
    steps:
      - name: Stub
        run: echo "Backend CI will be configured when a backend package is added"
```

---

## Security job — fs scan (always)

One scan block per package:

```yaml
      - name: Scan PKG_NAME npm dependencies
        uses: aquasecurity/trivy-action@0.35.0
        with:
          scan-type: fs
          scan-ref: ./PKG_DIR
          format: table
          severity: CRITICAL,HIGH
          exit-code: "1"
          ignore-unfixed: true
```

## Security job — image scan (only if Dockerfile exists for that package)

```yaml
      - name: Build PKG_NAME Docker image
        run: docker build -t PKG_NAME:${{ github.sha }} -f PKG_DIR/Dockerfile .
        # Build context is always monorepo root — pnpm workspace requires it

      - name: Scan PKG_NAME Docker image
        uses: aquasecurity/trivy-action@0.35.0
        with:
          scan-type: image
          image-ref: PKG_NAME:${{ github.sha }}
          format: table
          severity: CRITICAL,HIGH
          exit-code: "1"
          ignore-unfixed: true
```

---

## SonarCloud — sonar-project.properties

```properties
sonar.projectKey=YOUR_PROJECT_KEY
sonar.organization=YOUR_ORGANIZATION

# Comma-separated source dirs (one per detected frontend/backend package)
sonar.sources=PKG_DIR/src,PKG_DIR2/src
sonar.test.inclusions=**/*.spec.ts,**/*.e2e-spec.ts,**/*.test.tsx,**/*.test.ts
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/.next/**
# Exclude generated files (Orval, Prisma, GraphQL codegen, etc.)
# sonar.exclusions += ,PKG_DIR/src/api/generated/**

# Coverage report paths — one per package that has a coverage script
# IMPORTANT: use sonar.javascript.lcov.reportPaths (not sonar.typescript.*) — the typescript variant is not recognized by SonarCloud
sonar.javascript.lcov.reportPaths=PKG_DIR/coverage/lcov.info,PKG_DIR2/coverage/lcov.info

sonar.sourceEncoding=UTF-8
sonar.qualitygate.wait=false
```

---

## Dockerfile — SPA frontend (Vite + any framework)

Build context = monorepo root. Template uses `PKG_DIR` and `PKG_NAME`.

```dockerfile
# Build context: docker build -f PKG_DIR/Dockerfile .

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
# Copy package.json for every workspace package (pnpm needs all of them)
COPY PKG_DIR/package.json ./PKG_DIR/package.json
# COPY other-package/package.json ./other-package/package.json  (repeat as needed)

RUN pnpm install --frozen-lockfile --filter PKG_NAME
COPY PKG_DIR ./PKG_DIR

ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter PKG_NAME build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:alpine
COPY PKG_DIR/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/PKG_DIR/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Also create `PKG_DIR/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Dockerfile — Next.js frontend (SSR)

```dockerfile
# Build context: docker build -f PKG_DIR/Dockerfile .

FROM node:22-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY PKG_DIR/package.json ./PKG_DIR/package.json

RUN pnpm install --frozen-lockfile --filter PKG_NAME
COPY PKG_DIR ./PKG_DIR

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter PKG_NAME build

FROM node:22-alpine
RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY PKG_DIR/package.json ./PKG_DIR/package.json
RUN pnpm install --frozen-lockfile --filter PKG_NAME --prod

COPY --from=builder /app/PKG_DIR/.next ./PKG_DIR/.next
COPY --from=builder /app/PKG_DIR/public ./PKG_DIR/public

EXPOSE 3000
CMD ["pnpm", "--filter", "PKG_NAME", "start"]
```

---

## Dockerfile — Node.js backend (NestJS / Express / Fastify / Hono)

3-stage: build → pnpm deploy (prod deps) → slim runner.

```dockerfile
# Build context: docker build -f PKG_DIR/Dockerfile .

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY PKG_DIR/package.json ./PKG_DIR/package.json
# COPY other-package/package.json ./other-package/package.json

RUN pnpm install --frozen-lockfile
COPY PKG_DIR ./PKG_DIR
RUN pnpm --filter PKG_NAME build

# ── Stage 2: production deps via pnpm deploy ─────────────────────────────────
FROM node:22-alpine AS prod-deps
RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY PKG_DIR/package.json ./PKG_DIR/package.json
# COPY other-package/package.json ./other-package/package.json

RUN pnpm install --frozen-lockfile
# --legacy required for pnpm v10+ (default requires inject-workspace-packages=true)
RUN pnpm --filter PKG_NAME deploy --prod --legacy /deploy

# ── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine
# Remove npm/npx — not needed at runtime, eliminates CVEs in npm's bundled deps
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app

COPY --from=prod-deps /deploy/node_modules ./node_modules
COPY --from=prod-deps /deploy/package.json ./package.json
COPY --from=builder /app/PKG_DIR/dist ./dist

EXPOSE 3001
# Adjust entrypoint for non-NestJS apps (e.g. "node dist/index.js" for Express)
CMD ["node", "dist/main"]
```

---

## .env.test (frontend only, Vite-based)

```
VITE_API_BASE_URL=http://localhost:3001
```

Safe to commit. Vite loads it automatically in test mode.
Without it, `import.meta.env.VITE_API_BASE_URL` is undefined in CI.
