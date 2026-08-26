#!/bin/bash
# ONE-TIME bootstrap: every migration under prisma/migrations was applied to
# production by hand (pasted into the Neon SQL console) before this project
# started using `prisma migrate deploy`, so Prisma's own tracking table
# (_prisma_migrations) doesn't know any of them happened yet.
#
# This marks each existing migration as already-applied (via Prisma's own
# CLI, so it computes the checksum correctly rather than guessing) without
# re-running its SQL, then runs a normal `prisma migrate deploy` so any
# genuinely new migration still gets applied. Safe to run more than once —
# resolving an already-resolved migration is a harmless no-op here since we
# don't abort the loop on its error.
#
# Delete this script (and the build step that calls it) once one deploy has
# gone through cleanly — from then on, plain `prisma migrate deploy` is
# enough for every future migration.
set -e

for dir in prisma/migrations/*/; do
  name=$(basename "$dir")
  echo "Baselining migration: $name"
  npx prisma migrate resolve --applied "$name" || echo "  (already resolved or skipped: $name)"
done

echo "Running prisma migrate deploy for any migration not yet applied..."
npx prisma migrate deploy
