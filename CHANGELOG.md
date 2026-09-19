# CHANGELOG.md — ScholarAura

Short entries for meaningful changes. Newest first. No source code here.

## 2026-09-18

### Added
- Freelance gig marketplace: any logged-in user can post their own services (design, tutoring, dev work, ...) — the reverse of a job posting. Public browse/search at `/freelance`, managed at `/dashboard/freelance`. Deliberately unmoderated (publishes immediately, unlike recruiter jobs which need approval), contact via `mailto:` link. New header tab.
- Aura: a guided helper at `/aura` — not an LLM, by deliberate choice. Matches a query against a small canned-FAQ dictionary first, falls back to a live keyword search across courses/events/competitions/jobs/freelance listings. New header tab.
- In-app messaging for freelance listings: a "Message `<name>`" button starts a real conversation (`FreelanceThread`/`FreelanceMessage`) instead of just opening an email client — `mailto:` stays as a fallback. Managed at `/dashboard/freelance/messages`, notifies the other participant on each reply.
- Aura floating widget: a chat bubble in the bottom-right corner (mirroring the Translate widget's bottom-left placement) on every page, backed by a new `GET /api/aura` endpoint and real client-side multi-turn state — no more one full-page reload per question. The full `/aura` page still exists alongside it.
- Homepage banner carousel: a large auto-scrolling row of image cards ("Featured on ScholarAura") below the hero, pulling from the same featured courses/events/competitions the page already queries — Amazon-app-style promo carousel, with a play/pause control and pause-on-touch so a tap reliably lands on a card.
- Homepage category carousel ("Explore ScholarAura"): a large, user-controlled (prev/next + swipe, no auto-scroll) horizontal carousel of 11 category cards — Courses, Competitions, International/National Conferences, Faculty Development, Jobs, Internships, Webinars, Hands-on Training, Freelance, Meet Alumni — each linking to its real existing listing route (conferences/webinars/FDPs/training all route to `/events?type=...`, there's no separate page for them). Stat badges ("124 courses", "18 active competitions", ...) come from real Prisma counts (`lib/homeCategories.ts`), never fabricated, and are simply omitted when a category has zero. No stock photos — cards use the same dot-grid gradient as the hero plus a large category icon, kept deliberately consistent rather than a different random color per card.

### Changed
- Competition and event detail pages redesigned into a full landing-page treatment: hero gets real fee/eligibility badges plus `actions` (a "Register Now" button that scrolls to the real, already-functional CTA card — not a duplicate stateful button — and a "Download Brochure" button), a live `CountdownTimer` (updates every 30s from the real deadline, never fabricated) emphasizing the submission deadline (competitions) / registration deadline (events) inside new `DateCards` milestone cards, prizes now render as 3 distinct 🥇🥈🥉 `PrizeCards` instead of one shared list, "Who can participate" got a green `InfoCard` tone, and `PeopleList`'s avatars are now full bordered profile cards. Competitions additionally split its free-text description into "Competition Theme" / "Poster Topic" cards when the text is literally written with `Theme: "..."` / `Poster Topic: "..."` markers (`lib/competitionCopy.ts`'s `parseThemeTopic()`), falling back to the plain description otherwise — deliberately not a new database column, to keep this a UI-only change.
- Polished the rest of the redesigned detail pages: the brochure link is now a proper bordered button instead of a bare underlined link, "Who can participate" is an `InfoCard` instead of a plain text line, the price/CTA sits together in a bordered card at the bottom (bigger, bolder price), and `PeopleList` gained an "Organizing Committee" heading plus a subtle ring/shadow on each avatar. Same treatment on competitions, events, jobs, and courses.
- Redesigned the competition/event/job/course detail pages: a big hero banner (real `thumbnailUrl` photo with a gradient scrim, or the homepage's dot-grid navy gradient when there's no image — jobs have no thumbnail field, only a small company logo) with the title, category/type, and a real deadline-derived "N days left" urgency badge overlaid; the old plain bordered boxes for dates/prizes/requirements are now proper shadowed cards (`components/InfoCard.tsx`), side-by-side on a widened `max-w-3xl` layout. New shared `components/DetailHero.tsx` + `components/InfoCard.tsx`, and `getDeadlineUrgency()` in `lib/eventLabels.ts`. Competitions was the original prompt (plain layout felt flat); applied the same treatment to events, jobs, and courses for consistency.
- Unified filter-tab pills across `/jobs`, `/events`, and the courses category filter: light-blue tinted strip, borderless white pills with a subtle shadow, blue active pill — new shared `components/FilterPill.tsx` (`FilterPill` + `FilterPillBar`). Courses' category filter changed from circular icon buttons to text pills (icon kept as an inline emoji prefix, matching the other two pages) for consistency. Competitions left unchanged — it has no comparable tab row today.
- Category carousel: the "Meet Alumni" card now plays a short looping video (`public/videos/meet-alumni.mp4`) instead of the icon+gradient panel. Added real video support to `HomeCategoryCarousel.tsx` — muted/loop/playsInline, only loads and plays once the card scrolls into the viewport (`IntersectionObserver`, pauses when scrolled away), and is skipped entirely (falls back to image/icon) for `prefers-reduced-motion` or a save-data connection. `HomeCategory` gained an optional `video` field, checked before `image`.
- Category carousel: the "Freelance Opportunities" card now also plays a video (`public/videos/freelance.mp4`), reusing the same video support added for Meet Alumni above.
- Category carousel: the "Courses" card now also plays a video (`public/videos/courses.mp4`), same lazy/reduced-motion-aware playback.
- Category carousel: the "Competitions" card now also plays a video (`public/videos/competitions.mp4`), same lazy/reduced-motion-aware playback.
- Category carousel: the "Hands-on Training" card now also plays a video (`public/videos/hands-on-training.mp4`), same lazy/reduced-motion-aware playback.
- Uplifted the "Explore ScholarAura" section now that it opens the homepage: heading promoted to the page's `<h1>` and enlarged, the "For professionals, academics & students worldwide" badge moved up from the deleted hero, a subtle brand-tinted gradient + dot-grid backdrop replaces the visual weight the old hero carried, and the cards themselves got taller media panels, bolder titles, a stronger shadow/hover lift, and solid (not just outlined) prev/next buttons.
- Tightened the gap above the "Explore ScholarAura" badge — it inherited the old hero's generous `py-12/16` top-and-bottom padding, which left an oversized blank strip below the top sign-in banner now that there's no hero pushing it down. Split into `pt-6/8` (top) and unchanged `pb-12/16` (bottom, before the cards).
- `/login` gained the navy hero treatment that used to live on the homepage: the badge/title/tagline on the left, and a redesigned sign-in card on the right (Google button with the real multicolor "G" mark, an "Or continue with email" divider, then email/password) — recreated from the deleted `HeroSignInCard.tsx`, with the page's existing persistent "Forgot password?" link kept (the original hero widget only surfaced a reset link after 2 failed attempts, but the real login page already had it always visible, so that stayed).

- Aura can now raise a real support ticket when it genuinely can't help — a "🎫 Still stuck? Raise a support ticket" prompt appears whenever both the FAQ and live search come up empty, on both the floating widget and the full `/aura` page (shared `components/aura/SupportTicketForm.tsx`). Works logged in or logged out (a guest also gives name/email). New `SupportTicket` model + `lib/supportTicket.ts`; `POST /api/support-tickets` emails every admin and gives each an in-app notification; admins reply from a new `/dashboard/admin/support-tickets` page (mirroring the refund-requests admin page), which emails the person back and notifies them in-app if they have an account.
- Aura got a friendlier avatar — a person-silhouette icon (`components/aura/AuraAvatar.tsx`, shared by the floating widget and the full `/aura` page) instead of a 🤖 robot emoji.
- Aura's live-search fallback now tokenizes the query instead of matching the whole raw sentence as one literal substring — `extractSearchTerms()` in `lib/auraSearch.ts` strips filler words ("how", "do", "a", "for", ...) and searches each remaining significant word, so a natural question like "how do I find a react course" actually surfaces React courses where it previously only worked for queries that happened to be an exact substring of a real title. Also roughly tripled the canned-FAQ dictionary (`lib/auraFaq.ts`) — enrollment, quizzes, resources, waitlists, team competitions, job applications, recruiter registration, job boosts, messaging, the location picker, notifications, portfolios, dark mode, password reset, Google sign-in, currency display, cancelling a registration, and posting a freelance listing. The floating widget also gained the same "Browse courses/events/jobs" fallback links the full page already had when a search comes up empty.

### Fixed
- Scrolling the homepage showed "Explore ScholarAura"'s heading rendering on top of the sticky header instead of cleanly underneath it. The section's content wrapper had `relative z-10` (added to sit above its own dot-grid overlay), which tied with the header's own `z-10` — same stacking level means later-in-DOM wins, so the section (which comes after the header) painted over it once they visually overlapped during scroll. The section didn't need that `z-10` at all: a plain `relative` already stacks above its `absolute` sibling overlay by paint-order rules, without competing with the header. Dropped the `z-10`.

### Removed
- The homepage's pill-tab "Discover" section (`components/HomeExploreTabs.tsx`, the row of Courses/Competitions/event-type pill buttons + a filtered listing below) — it duplicated the new "Explore ScholarAura" category carousel above it, which does the same category-browsing job with larger, more visual cards. Deleted the component outright (nothing else referenced it); `app/page.tsx` no longer fetches jobs or course ratings, since those were only used by this section.
- The homepage's navy hero section (badge, "ScholarAura" title/tagline, and the sign-in/welcome-back card) — signing in is still available from the header on every page, so this was a redundant second entry point right above the "Explore ScholarAura" carousel. Deleted the now-unreferenced `components/HeroSignInCard.tsx`.

### Changed
- Default theme changed to dark: a first-time visitor (no stored preference in `localStorage`) now sees dark mode regardless of their OS/browser color-scheme setting. Anyone who explicitly picked light via the header toggle keeps seeing light on their next visit — only the no-preference default flipped, not the toggle's memory (`app/layout.tsx`'s inline theme-init script).
- Terms of Service §8 (Intellectual Property): added an explicit clause covering the Platform's own name, logo, design, and source code as ScholarAura's copyright — the existing clause only covered content licensed *to* users (course videos, competition briefs), not the Platform itself. "Last updated" date bumped.
- Renamed the "Alumni Meet" label to "Meet Alumni" everywhere it appears in the UI (event type value and URL unchanged).
- Redesigned Aura's page as an actual chat interface (avatar, message bubbles, quick-reply chips) — the original form-and-results-cards layout read as a plain search page, not a chat bot.
- Removed the "Aura" header tab — now redundant since the Aura floating widget is available on every page already.
- Mobile menu: replaced the tall vertical Courses/Competitions/Jobs/Internships/Freelance/Meet Alumni/Events list with a single dark horizontal strip (Amazon-app style, `#131a22` navy), sitting below the sign-in/account block. Started as an auto-scrolling ticker, then changed same-day to a static, touch-swipeable row (no auto-animation) to match the real Amazon app strip more closely. Desktop header unchanged.

### Incident
- Site-wide outage: every page that queries the database (home, `/events`, `/jobs`, etc.) returned a 500 for about half an hour. Root cause was the Neon database hitting its plan's usage quota (`PrismaClientInitializationError: ... exceeded the quota`) — nothing to do with the day's code changes, no redeploy needed. Fixed by upgrading the Neon plan. See PROJECT_STATE.md "Known Issues / Caveats" for how to recognize this again.

## 2026-09-17

### Changed
- Restructured the header into a two-row layout: main row (logo, search, location, sign-in) plus a second, always-dark category strip holding the nav links — matching the structure of a reference marketplace header the owner shared. Sign-in area restyled to a two-line "Hello, sign in / Log in" block.
- Added Internships (filters `/jobs?employmentType=INTERNSHIP`) and Alumni Meet (new `EventType`) as their own header tabs, alongside the existing Courses/Competitions/Jobs/Events.

## 2026-09-16

### Changed
- Added a country-code picker to the onboarding mobile number field — started as a fixed +91, then expanded to all ~190 countries with names/flags per the owner's request, defaulting to India.

## 2026-09-11

### Added
- An Amazon.in-style search bar in the header: category dropdown (All/Courses/Events/Competitions/Jobs) + input + search button, with `/search` filtering by the selected category via a `type` param.

## 2026-09-07

### Changed
- Removed the Bundles / learning-paths feature: public bundle pages, admin bundle management, the bundle checkout/purchase flow, and all "Bundles" links across the header and admin dashboard are gone. The database tables and any existing purchase records were kept (not dropped), as were the audit-log entries for historical bundle actions, so nothing here is a data deletion — just removing the feature from the live site.
- The homepage also went through several redesign attempts today (an Amazon-style layout, then a larger "premium academic ecosystem" redesign, then a smaller rebuild) — all were reverted the same day. Net effect: the homepage is unchanged from its Sep 6 form.

## 2026-09-06

### Changed
- Added persistent project memory files: PROJECT_STATE.md, TODO.md, CHANGELOG.md.
- Added an Amazon-style location bar in the header (PR #137). Sets a city via dropdown or browser location; pre-filters Events/Competitions/Jobs. Added a `city` field to competitions.
- Added recruiter monetization — one-time paid "Featured" job boosts, ₹999 for 30 days, pinned to the top of the jobs page (PR #136).
- Added internship-specific job fields: stipend, duration, start date, perks (PR #135).
- Added recruiter–student direct messaging on job applications (PR #134).
- Added a referral leaderboard to the Refer & earn page (PR #133).
- Extended save-for-later from courses to events, competitions, and jobs (PR #132).
- Added course bundles / learning paths with cross-course progress (PR #131).
- Added downloadable course resources, stored in Google Drive (PR #130).
- Added course quizzes (per-lecture and final) that gate certificates (PR #129).
- Added an Audience filter to events (PR #128) and Event Type / Payment / Location filters plus a Team Size filter for competitions (PR #127).

### Files Changed (main areas)
- `prisma/schema.prisma` + new migrations (quizzes, resources, bundles, wishlists, messages, internship fields, boosts, competition city)
- `lib/` — quiz.ts, certificate.ts, bundlePurchase.ts, jobBoost.ts, referralLeaderboard.ts, location.ts, locationConstants.ts, courseResourceStorage.ts
- `app/api/` — new routes for quizzes, resources, bundles, wishlists, messages, boosts, location
- `app/dashboard/` and public `app/` pages for each feature above
- `components/` — LocationPicker, SaveButton, MessageThread, BoostJobButton, quiz components, ResourceManager, BundleCourseSelector

### Important Notes
- Two real build problems were caught and fixed while building the location bar: reading the location cookie in the root layout would have made every static page (login, register, terms…) dynamic; and a server-only module was accidentally pulled into the browser bundle. Both fixed before merge — see PROJECT_STATE.md "Do Not Change".
- Google sign-in is currently broken in production: the Google Cloud OAuth client was deleted ("Error 401: deleted_client"). Fix is in Google Cloud Console, not code: create a new OAuth Client ID, set redirect URI `https://<domain>/api/auth/callback/google`, update `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, redeploy.

## Earlier

Ten review/bug-fix passes (PRs up to #126) hardened existing features before the work above. Details are in the git history.
