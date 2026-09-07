# TODO.md — ScholarAura

Task tracker. Update whenever status changes. Read alongside PROJECT_STATE.md at the start of every task.

## Completed

- Courses (lectures, previews, enrollment, progress, reviews, Q&A, certificates)
- Course quizzes (per-lecture + final, gating certificates)
- Downloadable course resources
- Course bundles / learning paths
- Events (registration, waitlist, format/city/audience filters, certificates)
- Competitions (entries, teams, prizes, winners, certificates, city)
- Jobs board (admin + recruiter posting, approval workflow, applications with resumes)
- Recruiter–student direct messaging on applications
- Internship-specific job fields (stipend, duration, start date, perks)
- Recruiter monetization — paid "Featured" job boosts
- Universal save-for-later (courses, events, competitions, jobs)
- Referral program with credit balance and leaderboard
- Site-wide location bar (city filter) with "Delivering to `<city>`" header control
- Premium homepage redesign (hero, mega-menu nav, platform categories, dynamic opportunity explorer, featured courses, why/audience/certificate-verification sections, employer + closing CTAs, multi-column footer)
- Persistent project memory files (PROJECT_STATE.md, TODO.md, CHANGELOG.md)

## In Progress

- Nothing currently in progress.

## Planned / Ideas (not started, not committed to)

- Recruiter subscription plan (monthly/annual — build on top of the existing JobBoost model)
- Structured city field for jobs (would replace the loose text match)
- Placement-guarantee course tier (pair a course/bundle with a job outcome)
- Homepage testimonials, partner/institution logos, instructor "experts" section — once real data exists for any of these (no tables for them yet, deliberately not built with placeholder content)
- Dedicated persona landing pages (For Students / For Faculty / For Institutions) if the current links to existing pages aren't enough
- Reconnect Google sign-in: the Google Cloud OAuth client was deleted and must be recreated (config task, not code — see CHANGELOG 2026-09-06 note)

## Known Issues to Revisit

- Job location filter is a loose text match (spelling variants like Bengaluru/Bangalore don't match)
- No refund path for job boosts
