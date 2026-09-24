# TODO.md — ScholarAura

Task tracker. Update whenever status changes. Read alongside PROJECT_STATE.md at the start of every task.

## Completed

- Courses (lectures, previews, enrollment, progress, reviews, Q&A, certificates)
- Course quizzes (per-lecture + final, gating certificates)
- Downloadable course resources
- Events (registration, waitlist, format/city/audience filters, certificates)
- Competitions (entries, teams, prizes, winners, certificates, city)
- Jobs board (admin + recruiter posting, approval workflow, applications with resumes)
- Recruiter–student direct messaging on applications
- Internship-specific job fields (stipend, duration, start date, perks)
- Recruiter monetization — paid "Featured" job boosts
- Universal save-for-later (courses, events, competitions, jobs)
- Referral program with credit balance and leaderboard
- Amazon-style location bar (site-wide city filter)
- Coupons, refund requests, notifications, audit log, multi-currency display
- Persistent project memory files (PROJECT_STATE.md, TODO.md, CHANGELOG.md)
- Amazon-style search bar with category dropdown; two-row Amazon-style header with dark category strip
- Alumni Meet event type; Internships header tab
- Freelance gig marketplace (post/browse/manage own service listings)
- Aura guided helper (canned FAQ + live search, not an LLM), later redesigned as a real chat-bubble interface
- In-app messaging for freelance listings
- Freelance reviews/ratings (1–5 stars + comment, only after the freelancer has replied to you in-app)
- Freelance "Report this listing" + admin moderation page (dismiss / remove / restore)
- Structured city field for jobs (`Job.city`), with old/new city-name matching
- Job alerts: saved /jobs searches emailed daily, managed at /dashboard/job-alerts
- Google for Jobs structured data (JobPosting JSON-LD) on job pages
- Share buttons (WhatsApp/LinkedIn/X/Facebook/email/copy/native share) on detail pages and certificates, plus "Add to LinkedIn" for certificates
- Site revamp, brighter and light-first (2026-09-24): light default theme, icon-based header, navy footer, About/Contact/FAQ/404 pages, new homepage, shared listing layout with sidebar filters, two-column detail pages with a sticky action card
- Floating Aura chat widget (site-wide, like the language picker) alongside the full /aura page
- Mobile nav redesigned as a touch-swipeable horizontal strip (Amazon-app style), replacing the vertical list
- Homepage banner carousel: auto-scrolling featured courses/events/competitions cards below the hero, Amazon-app promo style
- Homepage category carousel ("Explore ScholarAura"): large user-controlled carousel, one card per platform category, linking to real existing routes, real stat counts

## In Progress

- Nothing currently in progress.

## Planned / Ideas (not started, not committed to)

- Set up Google Search Console for scholaraura.com (owner task, ~10 min) to monitor Google for Jobs pickup and indexing

- Recruiter subscription plan (monthly/annual — build on top of the existing JobBoost model)
- Placement-guarantee course tier (pair a course with a job outcome)
- Bundles / learning paths — removed 2026-09-07; revisit only if there's a specific need (see CHANGELOG)
- Homepage trust signals (stats bar, partner logos) once real numbers exist
- Reconnect Google sign-in: the Google Cloud OAuth client was deleted and must be recreated (config task, not code — see CHANGELOG 2026-09-06 note)
- Upgrade Aura to a real LLM-backed chatbot (deliberately kept as canned FAQ + search for now — needs an `ANTHROPIC_API_KEY` and has ongoing per-message cost)

## Known Issues to Revisit

- (Fixed 2026-09-24) Schema changes without migration files — see the catch-up migration note in PROJECT_STATE.md "Do Not Change".

- Jobs posted before 2026-09-24 whose location didn't name a recognizable city still have no structured `city` and use the loose location-text match — an admin/recruiter can fix one by setting City on its edit form
- No refund path for job boosts
