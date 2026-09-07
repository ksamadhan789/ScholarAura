# CHANGELOG.md — ScholarAura

Short entries for meaningful changes. Newest first. No source code here.

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
