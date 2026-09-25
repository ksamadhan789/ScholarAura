# CLAUDE.md — ScholarAura

ScholarAura is a Next.js 14 (App Router) + TypeScript + Tailwind + Prisma/PostgreSQL site for courses, events, competitions, jobs and freelance listings, deployed on Vercel.

## Start every task here

The project's memory lives in three files. Read the first two before doing anything else; they are imported below so they load automatically.

- `PROJECT_STATE.md`: what the project is, key decisions, caveats, and what not to change.
- `TODO.md`: what's done, in progress and planned.
- `CHANGELOG.md`: history, newest first. Read it only when the history matters for the task.

The code wins over these notes. If they disagree, trust the code, then fix the notes. Update all three files as part of every meaningful change.

@PROJECT_STATE.md
@TODO.md

## Who you're working for

The owner is not a programmer. They describe what they want in plain language, and you choose the technical approach. Report back in plain language: what changed, what to test, and anything they need to do by hand (Vercel env vars, Google Cloud, DNS). Show code only if asked.

## Commands

Dependencies are installed automatically in cloud sessions by `.claude/hooks/session-start.sh`.

| What | Command |
|---|---|
| Type check (CI runs this) | `npx tsc --noEmit` |
| All tests (CI runs this) | `npm test` |
| One test file | `npx vitest run lib/<name>.test.ts` |
| Production build check | `npx next build` (not `npm run build`, which also runs `prisma migrate deploy` against the database) |
| Regenerate Prisma client after a schema change | `npx prisma generate` |
| Dev server | `npm run dev` (needs a real `.env`, see `.env.example`) |

`npm run lint` isn't usable yet: ESLint was never configured, so `next lint` stops to ask an interactive setup question. Don't set it up unless asked, because doing so would also turn on linting inside `next build`.

## Conventions

- Tests are Vitest files next to the code (`lib/foo.test.ts`). Database access is mocked with `test/prismaMock.ts` (import it before the code under test). Business logic goes in `lib/` so it can be tested there.
- Import paths use the `@/` alias for the repo root (`@/lib/prisma`).
- Every schema change needs a new hand-written SQL migration in `prisma/migrations/<timestamp>_<name>/migration.sql`. Never edit an applied migration, and never run `prisma db push` against the live database.
- Make the smallest safe change. No unrelated refactors, and reuse what already exists.

## Git

- Work on the branch the session assigns, open a PR to `master`, and squash-merge once CI (type check + tests) is green.
- Before pushing, run `npx tsc --noEmit` and `npm test`, plus `npx next build` for anything that touches pages or config.
