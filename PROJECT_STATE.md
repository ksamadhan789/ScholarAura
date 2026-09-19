# PROJECT_STATE.md — ScholarAura

Compact project memory. Read this first at the start of every task. Keep it short; history goes in CHANGELOG.md, tasks in TODO.md.

## Project

- **Website name:** ScholarAura
- **Purpose:** E-learning + events + competitions + jobs + freelance platform for students and professionals, primarily in India. Single admin runs the platform; instructors post courses, recruiters post jobs, students/professionals post their own freelance listings.
- **Framework:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Database:** PostgreSQL via Prisma (schema in `prisma/schema.prisma`, migrations in `prisma/migrations/`)
- **Authentication:** NextAuth — email/password plus Google sign-in. Roles: `STUDENT`, `INSTRUCTOR`, `ADMIN`, `RECRUITER`.
- **Payments:** Razorpay (one-time payments only, no subscriptions). Multi-currency display via an `ExchangeRate` table; charging in non-INR depends on the Razorpay account.
- **Hosting/deployment:** Vercel. CI on GitHub Actions ("Type check and test") runs on every PR.
- **Other services:** Resend (email), Bunny Stream (course videos — admin pastes a video ID, no upload through the app), Google Drive (stores resumes, course resource files, and generated certificates), Google Slides (certificate templates), Google Forms/Sheets (event attendance), Google Analytics, Sentry (error tracking), Cloudflare Turnstile (signup bot protection), OpenStreetMap Nominatim (free reverse geocoding for the location bar).

## Current Features

- **Courses:** video lectures, free previews, enrollment (free or paid), progress tracking, reviews, Q&A, per-lecture and final quizzes (must pass to get a certificate), downloadable resources, completion certificates.
- **Events:** conferences, FDPs, hands-on trainings, webinars, alumni meets. Online/offline/hybrid, city, audience, seats + waitlist, paid/free registration, attendance-based certificates.
- **Competitions:** entries (individual or team), submissions, prizes, winners, certificates, optional city.
- **Jobs board:** admin- or recruiter-posted jobs, including internships (own header tab, filters `/jobs?employmentType=INTERNSHIP`). Recruiters need admin approval; every job is reviewed. Applications with PDF resume, status workflow (Applied → Shortlisted/Rejected/Hired), recruiter↔applicant messaging, internship-specific fields (stipend, duration, start date, perks), paid "Featured" boost (₹999 / 30 days, pins job to top).
- **Freelance marketplace:** any logged-in user posts their own services (design, tutoring, dev work, ...) — the reverse of a job posting. Public browse/search at `/freelance`, managed at `/dashboard/freelance`. Unmoderated — publishes immediately, no admin approval queue. In-app messaging (`FreelanceThread`/`FreelanceMessage`, one thread per listing+interested-person) at `/dashboard/freelance/messages`, plus a `mailto:` link as a fallback.
- **Aura:** a guided helper — not an LLM. Matches queries against a canned-FAQ dictionary (`lib/auraFaq.ts`, ~25 entries covering courses/events/competitions/jobs/freelance/account topics) first, falls back to a live keyword search across courses/events/competitions/jobs/freelance listings (shared logic in `lib/auraSearch.ts`). The live-search fallback tokenizes the query (`extractSearchTerms()`, strips filler words like "how"/"do"/"a") and searches each significant word instead of the whole raw sentence as one literal substring — a natural question like "how do I find a react course" now actually matches, where it previously only worked for queries that were themselves an exact title substring. Shared `components/aura/AuraAvatar.tsx` (a graduation-cap icon echoing the site's own logo mark, `public/favicon-mark.png` — not a robot emoji or a generic person) is used by both the floating widget and the full page. Available two ways: a floating chat widget on every page (`components/aura/AuraWidget.tsx`, backed by `GET /api/aura`, client-side multi-turn, with quick "Browse courses/events/jobs" links when a search finds nothing) and the full standalone page at `/aura` (no header tab — the widget makes it reachable from anywhere already). When neither the FAQ nor the search finds anything, `components/aura/SupportTicketForm.tsx` (shared by both surfaces) lets the person raise a real support ticket — works whether logged in or not (a guest just also gives name/email). `POST /api/support-tickets` creates a `SupportTicket` row, emails every ADMIN user, and gives each an in-app notification. Admin replies from `/dashboard/admin/support-tickets` (`PATCH /api/admin/support-tickets/[id]`), which emails the person back at the address they gave and, if they have an account, notifies them in-app too — `lib/supportTicket.ts` holds the create/resolve logic.
- **Save for later:** heart button on courses, events, competitions, jobs; one dashboard page.
- **Referrals:** referral link, credit balance earned when invitees buy, affiliate rates, leaderboard.
- **Location bar:** header widget sets a city (dropdown or "use my location"); pre-filters Events/Competitions/Jobs.
- **Mobile nav:** the header's mobile menu shows the category list as a static, touch-swipeable horizontal strip (Amazon-app style, dark navy `#131a22`, scrollbar hidden via `.no-scrollbar` in `app/globals.css`) below the sign-in/account block, instead of a vertical list or an auto-scrolling animation. Desktop keeps the dark category strip unchanged.
- **Homepage banner carousel:** `components/HomeBannerCarousel.tsx`, below the Explore section on `/`. Auto-scrolling row of image cards pulled from the homepage's existing featured courses/events/competitions query (2 of each, `app/page.tsx`), with a play/pause button and pause-on-touch. Reuses `components/Thumbnail.tsx` for images/fallback icon.
- **Homepage category carousel:** `components/HomeCategoryCarousel.tsx` + `lib/homeCategories.ts`, "Explore ScholarAura" — the first section on `/` (the old navy hero above it was removed; sign-in is still reachable from the header). One card per platform category (not per listing item), native scroll-snap + prev/next buttons (no auto-scroll), each card a single full-card link to that category's real existing route. The section heading is the page's `<h1>`, carries the "For professionals, academics & students worldwide" badge inherited from the old hero, and sits on a brand-tinted gradient + dot-grid backdrop. Stat badges use real Prisma counts from `getHomeCategoryStats()`, omitted (not zeroed/faked) when a category has none. Add a new category by adding one entry to `HOME_CATEGORIES` and one line to `getHomeCategoryStats()`. A category can set `video` (short looping clip, `public/videos/`) instead of `image`/icon — only loads/plays once its card is in the viewport, skipped for `prefers-reduced-motion`/save-data. Categories with real video so far: Courses, Competitions, Hands-on Training, Freelance, Meet Alumni.
- **`/login`:** two-column navy hero layout (`app/login/page.tsx`, self-contained client component) — the same badge/title/tagline the homepage hero used to show on the left, and a redesigned sign-in card on the right (Google "Continue with" button with the real multicolor G mark, an "Or continue with email" divider, email/password with Show/Hide, a persistent "Forgot password?" link, "New here? Create a free account"). `/register` is unchanged (plain form, no hero).
- **Filter pills:** `components/FilterPill.tsx` (`FilterPill` + `FilterPillBar`) — the shared rounded-pill filter row (light-blue strip, borderless white pills, blue active pill), used on `/jobs`, `/events`, and the courses category filter (`CoursesExplorer.tsx`). `FilterPill` takes either `href` (server-rendered query-param navigation) or `onClick` (client-side filtering) — pass whichever the page's filtering model uses. Competitions has no equivalent tab row (search + city dropdown + team-size filter only).
- **Detail page hero + info cards:** `components/DetailHero.tsx` (big banner — real `thumbnailUrl` image with a dark gradient scrim, or the homepage's dot-grid navy gradient when there's no image, e.g. jobs; optional `actions` slot for hero CTA buttons) and `components/InfoCard.tsx` (rounded shadowed card, `tone="default"|"amber"|"success"`) — used on the competition/event/job/course detail pages (`app/{competitions,events,jobs,courses}/[slug]/page.tsx`) in place of the old plain bordered boxes. `getDeadlineUrgency()` in `lib/eventLabels.ts` derives a real "N days left" badge from an actual deadline field (submission/registration/application) — never a fabricated countdown; returns `{label, variant}` matching `Badge`'s variants. The brochure link is a bordered button, "Who can participate" is an `InfoCard`, the price/CTA sits in a bordered card at the bottom, and `PeopleList` (`components/PeopleList.tsx`) shows an "Organizing Committee" heading above bordered avatar profile cards — same shared components on all four pages.
- **Competition/event landing-page treatment:** `components/CountdownTimer.tsx` (client, ticks a real deadline every 30s, never a fabricated number — `suppressHydrationWarning` since the number legitimately differs between server render and client tick), `components/DateCards.tsx` (milestone date cards, the `emphasize` one gets an accent border + the countdown), `components/PrizeCards.tsx` (3 distinct 🥇🥈🥉 cards instead of one shared list) — used on competitions (`app/competitions/[slug]/page.tsx`, emphasizing `submissionDeadline`) and events (`app/events/[slug]/page.tsx`, emphasizing `registrationDeadline`). The hero has `actions` (a `#register` anchor scrolling to the real, already-functional CTA section further down — not a duplicate stateful button) and a real fee/eligibility badge. `lib/competitionCopy.ts`'s `parseThemeTopic()` splits a competition's free-text `description` into "Theme" / "Poster Topic" cards only when it's literally written with `Theme: "..."` / `Poster Topic: "..."` markers (as one specific competition's description is) — falls back to the plain description otherwise. There's no separate `theme`/`topic` database column; deliberately not added, to avoid a schema + admin-form change for a UI-only ask.
- **Coupons, refund requests, in-app notifications, admin audit log, public verifiable certificates, student portfolio page.**

## Project Structure (important parts only)

- `app/` — pages and API routes (Next.js App Router). Public pages at `app/<section>/`, admin/user pages under `app/dashboard/`, APIs under `app/api/`.
- `components/` — shared UI (Header, LocationPicker, SaveButton, quiz/message/boost components, etc.).
- `lib/` — business logic and helpers (payments, referrals, certificates, quizzes, location, email, Google integrations).
- `prisma/` — database schema and migrations.
- `test/` — test helpers (Prisma mock). Tests live next to code as `*.test.ts` (Vitest).

## Important Decisions

- **Payments:** every paid thing (course, event, competition, job boost) uses the same one-time Razorpay flow: create order → pay → verify signature → settle. A Razorpay webhook re-settles if the browser drops. Settlement is idempotent.
- **Job boosts** are their own product (`JobBoost` table + `featuredUntil` on Job) so a recruiter subscription tier can be added later without reshaping it.
- **Files** (resumes, course resources) live in Google Drive; only the Drive file ID is stored in the database.
- **Lists of things** stored inside one record (quiz questions, event people, job perks) use a JSON column validated in code, not extra tables.
- **Admin vs recruiter job pages are deliberately duplicated** (separate forms/routes). Adding a job field means editing both.
- **Location cookie** is read only inside the three listing pages, never in the root layout (that would make every page dynamic and slow down static pages).
- **Public listing pages that query the database** need `export const dynamic = "force-dynamic"` or the build fails.
- **Default theme is dark.** `app/layout.tsx`'s inline theme-init script applies `dark` unless `localStorage.theme === "light"` — so a first-time visitor gets dark regardless of OS preference, and only an explicit choice via the header toggle (`components/ThemeToggle.tsx`) is remembered otherwise.
- **Freelance listings are unmoderated by design** — unlike recruiter job postings (which need admin approval since they're a company claim), a freelance listing is just the poster describing themselves, so it publishes immediately. If abuse becomes a problem, add a report/moderation flow rather than reusing the job approval queue.
- **Aura is deliberately not an LLM** — it's a keyword-matched FAQ dictionary plus a live DB search, single-turn (no conversation memory). Don't quietly wire it to a real model without the owner explicitly asking — that has ongoing API cost and needs an `ANTHROPIC_API_KEY`.

## Known Issues / Caveats

- **Bundles feature removed from the site (2026-09-07)**, but its database tables (`CourseBundle`, `CourseBundleItem`, `BundlePurchase`) and any existing purchase records were deliberately kept, not dropped. The audit-log `BUNDLE_CREATED/UPDATED/DELETED` action types and labels are also kept so historical audit-log entries stay readable. No new code reads or writes these tables.
- Job location is free text, so the location filter for jobs is a loose text match (e.g. "Bangalore" won't match "Bengaluru").
- Recruiter subscriptions and job-boost refunds are not built.
- The `/events` and `/competitions` "Clear filters" link resets to the saved location rather than "all cities" — intended, but slightly different from the in-page "Any location" option.
- **The database (Neon) is on a plan with a usage quota.** If it's exceeded, every DB-backed page site-wide 500s with `PrismaClientInitializationError: ... Your account or project has exceeded the quota. Upgrade your plan to increase limits.` — pages that don't touch the database (`/login`, `/register`) keep working, which is the tell. This happened once (2026-09-18) and was fixed by upgrading the Neon plan — not a code bug, don't go looking for one if this recurs. Check the Neon dashboard's Usage/Billing tab first.

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

## How Claude Works on This Project

- **The owner is not a programmer.** They describe features in plain language; Claude decides the technical approach, which files matter, how to test, and what to document. The owner is never responsible for managing context or pasting code.
- **Every task starts by reading this file and TODO.md**, then only the files the task actually needs. Never scan the whole codebase unless explicitly asked to audit it.
- **The code is authoritative, not this file.** If PROJECT_STATE.md and the actual code disagree, trust the code, say so, and update this file to match after finishing the task.
- **Keep these memory files in sync with the implementation.** Update PROJECT_STATE.md, TODO.md, and CHANGELOG.md as part of every meaningful change, not as an afterthought.
- **Smallest safe change.** No unrelated refactoring, renaming, or redesign. Reuse what exists instead of building a duplicate.
- **Report in plain language.** Say what changed, what to test, and whether anything manual is needed. Show code only if asked.
