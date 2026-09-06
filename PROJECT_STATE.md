# PROJECT_STATE.md — ScholarAura

Compact project memory. Read this first at the start of every task. Keep it short; history goes in CHANGELOG.md, tasks in TODO.md.

## Project

- **Website name:** ScholarAura
- **Purpose:** E-learning + events + competitions + jobs platform for students and professionals, primarily in India. Single admin runs the platform; instructors post courses, recruiters post jobs.
- **Framework:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Database:** PostgreSQL via Prisma (schema in `prisma/schema.prisma`, migrations in `prisma/migrations/`)
- **Authentication:** NextAuth — email/password plus Google sign-in. Roles: `STUDENT`, `INSTRUCTOR`, `ADMIN`, `RECRUITER`.
- **Payments:** Razorpay (one-time payments only, no subscriptions). Multi-currency display via an `ExchangeRate` table; charging in non-INR depends on the Razorpay account.
- **Hosting/deployment:** Vercel. CI on GitHub Actions ("Type check and test") runs on every PR.
- **Other services:** Resend (email), Bunny Stream (course videos — admin pastes a video ID, no upload through the app), Google Drive (stores resumes, course resource files, and generated certificates), Google Slides (certificate templates), Google Forms/Sheets (event attendance), Google Analytics, Sentry (error tracking), Cloudflare Turnstile (signup bot protection), OpenStreetMap Nominatim (free reverse geocoding for the location bar).

## Current Features

- **Courses:** video lectures, free previews, enrollment (free or paid), progress tracking, reviews, Q&A, per-lecture and final quizzes (must pass to get a certificate), downloadable resources, completion certificates.
- **Course bundles / learning paths:** admin groups courses at one price; shows cross-course progress.
- **Events:** conferences, FDPs, hands-on trainings, webinars. Online/offline/hybrid, city, audience, seats + waitlist, paid/free registration, attendance-based certificates.
- **Competitions:** entries (individual or team), submissions, prizes, winners, certificates, optional city.
- **Jobs board:** admin- or recruiter-posted jobs. Recruiters need admin approval; every job is reviewed. Applications with PDF resume, status workflow (Applied → Shortlisted/Rejected/Hired), recruiter↔applicant messaging, internship-specific fields (stipend, duration, start date, perks), paid "Featured" boost (₹999 / 30 days, pins job to top).
- **Save for later:** heart button on courses, events, competitions, jobs; one dashboard page.
- **Referrals:** referral link, credit balance earned when invitees buy, affiliate rates, leaderboard.
- **Location bar:** header widget sets a city (dropdown or "use my location"); pre-filters Events/Competitions/Jobs.
- **Coupons, refund requests, in-app notifications, admin audit log, public verifiable certificates, student portfolio page.**

## Project Structure (important parts only)

- `app/` — pages and API routes (Next.js App Router). Public pages at `app/<section>/`, admin/user pages under `app/dashboard/`, APIs under `app/api/`.
- `components/` — shared UI (Header, LocationPicker, SaveButton, quiz/message/boost components, etc.).
- `lib/` — business logic and helpers (payments, referrals, certificates, quizzes, bundles, location, email, Google integrations).
- `prisma/` — database schema and migrations.
- `test/` — test helpers (Prisma mock). Tests live next to code as `*.test.ts` (Vitest).

## Important Decisions

- **Payments:** every paid thing (course, event, competition, bundle, job boost) uses the same one-time Razorpay flow: create order → pay → verify signature → settle. A Razorpay webhook re-settles if the browser drops. Settlement is idempotent.
- **Bundles grant access by fan-out:** buying a bundle creates a normal course purchase for each course, so all existing course logic works unchanged. Bundles skip coupons/credit (v1 scope).
- **Job boosts** are their own product (`JobBoost` table + `featuredUntil` on Job) so a recruiter subscription tier can be added later without reshaping it.
- **Files** (resumes, course resources) live in Google Drive; only the Drive file ID is stored in the database.
- **Lists of things** stored inside one record (quiz questions, event people, job perks) use a JSON column validated in code, not extra tables.
- **Admin vs recruiter job pages are deliberately duplicated** (separate forms/routes). Adding a job field means editing both.
- **Location cookie** is read only inside the three listing pages, never in the root layout (that would make every page dynamic and slow down static pages).
- **Public listing pages that query the database** need `export const dynamic = "force-dynamic"` or the build fails.

## Known Issues / Caveats

- Job location is free text, so the location filter for jobs is a loose text match (e.g. "Bangalore" won't match "Bengaluru").
- Recruiter subscriptions and job-boost refunds are not built.
- The `/events` and `/competitions` "Clear filters" link resets to the saved location rather than "all cities" — intended, but slightly different from the in-page "Any location" option.

## Do Not Change

- Prisma migrations are hand-written SQL files; never edit an already-applied migration — add a new one.
- Don't add `cookies()`/`headers()` calls to `app/layout.tsx`.
- Don't import `lib/location.ts` from client components — use `lib/locationConstants.ts`.
- Keep all Razorpay settlement functions idempotent (they can run twice).
- Commit messages and PRs need the attribution footer (see workflow below).

## Working Workflow

- Develop on branch `claude/search-results-visibility-dr0eae`, open a PR to `master`, merge (squash) once CI is green.
- Before shipping: `npx tsc --noEmit`, `npx vitest run`, `npx next build`.
- After a schema change: `npx prisma generate`.
