# Eval 2 — With Skill (Vue + NestJS)

## Detection
- pnpm-workspace.yaml ✓
- apps/web: Vue 3 + Vite, name="web", scripts typecheck/lint/test:run/build ✓
- apps/api: NestJS (@nestjs/core), name="api", scripts lint/test:run/build ✓

## User provided
- Frontend: web, Backend: api (NestJS), Branches: main, staging

## Files generated
1. .github/workflows/ci.yml — ci-frontend (--filter web), ci-backend NestJS (--filter api), security
2. apps/web/.env.test

## Key correctness
- --filter web (pas frontend)
- --filter api avec vraies étapes NestJS
- branches main + staging uniquement
