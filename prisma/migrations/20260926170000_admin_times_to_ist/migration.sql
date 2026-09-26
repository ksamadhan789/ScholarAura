-- One-off data fix (2026-09-26). Admin forms send datetime-local values with
-- no time zone ("2026-09-30T17:00"), and the UTC server stored them as UTC,
-- so every event/competition/coupon time typed by an admin was saved 5h30m
-- late (typed 5:00 pm IST, stored 5:00 pm UTC = 10:30 pm IST). The APIs now
-- read those values as IST (fromIstInput in lib/istDate.ts); this moves the
-- times saved before that fix back to what the admin actually typed.
-- These rows are only ever written through those admin forms. Runs once.

UPDATE "events" SET
  "startDate" = "startDate" - INTERVAL '5 hours 30 minutes',
  "endDate" = "endDate" - INTERVAL '5 hours 30 minutes',
  "registrationStartDate" = "registrationStartDate" - INTERVAL '5 hours 30 minutes',
  "registrationDeadline" = "registrationDeadline" - INTERVAL '5 hours 30 minutes',
  "resultDate" = "resultDate" - INTERVAL '5 hours 30 minutes';

UPDATE "competitions" SET
  "startDate" = "startDate" - INTERVAL '5 hours 30 minutes',
  "endDate" = "endDate" - INTERVAL '5 hours 30 minutes',
  "submissionDeadline" = "submissionDeadline" - INTERVAL '5 hours 30 minutes',
  "registrationStartDate" = "registrationStartDate" - INTERVAL '5 hours 30 minutes',
  "registrationDeadline" = "registrationDeadline" - INTERVAL '5 hours 30 minutes',
  "resultDate" = "resultDate" - INTERVAL '5 hours 30 minutes';

UPDATE "coupons" SET
  "expiresAt" = "expiresAt" - INTERVAL '5 hours 30 minutes'
WHERE "expiresAt" IS NOT NULL;
