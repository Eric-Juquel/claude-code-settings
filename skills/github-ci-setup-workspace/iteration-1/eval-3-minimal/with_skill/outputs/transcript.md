# Eval 3 — With Skill (minimal prompt)

## Detection (avant toute question)
- pnpm-workspace.yaml trouvé ✓
- apps/frontend: React + Vite détecté, name="frontend" ✓
- apps/backend: stub détecté ✓

## Questions posées
"J'ai détecté la structure suivante :
- Frontend : `frontend` (React + Vite) avec scripts typecheck/lint/test:run/build
- Backend : `backend` (stub)

Est-ce correct ? Quelles branches voulez-vous protéger ? (défaut : main, develop)"

Réponse utilisateur : oui, main et develop

## Files generated
1. .github/workflows/ci.yml
2. apps/frontend/.env.test
