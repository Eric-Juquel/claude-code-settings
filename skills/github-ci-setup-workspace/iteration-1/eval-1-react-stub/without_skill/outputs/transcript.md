# Eval 1 — Without Skill

## Approche
Génération directe d'un ci.yml sans detection ni questions.

## Ce qui manque vs with_skill
- Un seul job (pas de parallélisme frontend/backend/security)
- Pas de job Trivy
- Node 20 au lieu de 22
- pnpm installé via npm install -g (pas pnpm/action-setup@v4)
- Pas de FORCE_JAVASCRIPT_ACTIONS_TO_NODE24
- Pas de .env.test créé
- Pas de checklist manuel
- Pas de typecheck step
- Pas de lint step
- Branches: main seulement (develop manquant)
