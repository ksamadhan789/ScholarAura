-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "city" TEXT;

-- CreateIndex
CREATE INDEX "jobs_city_idx" ON "jobs"("city");

-- Backfill: give existing jobs a structured city when their free-text
-- location clearly names a known city (or an old name for it). The first
-- match wins; anything unrecognized stays NULL and keeps using the loose
-- location-text match in the /jobs filter.
UPDATE "jobs" SET "city" = 'Mumbai' WHERE "city" IS NULL AND ("location" ILIKE '%Mumbai%' OR "location" ILIKE '%Bombay%');
UPDATE "jobs" SET "city" = 'Delhi' WHERE "city" IS NULL AND ("location" ILIKE '%Delhi%');
UPDATE "jobs" SET "city" = 'Bengaluru' WHERE "city" IS NULL AND ("location" ILIKE '%Bengaluru%' OR "location" ILIKE '%Bangalore%');
UPDATE "jobs" SET "city" = 'Pune' WHERE "city" IS NULL AND ("location" ILIKE '%Pune%' OR "location" ILIKE '%Poona%');
UPDATE "jobs" SET "city" = 'Hyderabad' WHERE "city" IS NULL AND ("location" ILIKE '%Hyderabad%');
UPDATE "jobs" SET "city" = 'Chennai' WHERE "city" IS NULL AND ("location" ILIKE '%Chennai%' OR "location" ILIKE '%Madras%');
UPDATE "jobs" SET "city" = 'Kolkata' WHERE "city" IS NULL AND ("location" ILIKE '%Kolkata%' OR "location" ILIKE '%Calcutta%');
UPDATE "jobs" SET "city" = 'Ahmedabad' WHERE "city" IS NULL AND ("location" ILIKE '%Ahmedabad%');
UPDATE "jobs" SET "city" = 'Jaipur' WHERE "city" IS NULL AND ("location" ILIKE '%Jaipur%');
UPDATE "jobs" SET "city" = 'Chandigarh' WHERE "city" IS NULL AND ("location" ILIKE '%Chandigarh%');
UPDATE "jobs" SET "city" = 'Kochi' WHERE "city" IS NULL AND ("location" ILIKE '%Kochi%' OR "location" ILIKE '%Cochin%');
UPDATE "jobs" SET "city" = 'Lucknow' WHERE "city" IS NULL AND ("location" ILIKE '%Lucknow%');
UPDATE "jobs" SET "city" = 'Gurugram' WHERE "city" IS NULL AND ("location" ILIKE '%Gurugram%' OR "location" ILIKE '%Gurgaon%');
UPDATE "jobs" SET "city" = 'Thiruvananthapuram' WHERE "city" IS NULL AND ("location" ILIKE '%Thiruvananthapuram%' OR "location" ILIKE '%Trivandrum%');
UPDATE "jobs" SET "city" = 'Mysuru' WHERE "city" IS NULL AND ("location" ILIKE '%Mysuru%' OR "location" ILIKE '%Mysore%');
UPDATE "jobs" SET "city" = 'Vadodara' WHERE "city" IS NULL AND ("location" ILIKE '%Vadodara%' OR "location" ILIKE '%Baroda%');
UPDATE "jobs" SET "city" = 'Puducherry' WHERE "city" IS NULL AND ("location" ILIKE '%Puducherry%' OR "location" ILIKE '%Pondicherry%');
UPDATE "jobs" SET "city" = 'Visakhapatnam' WHERE "city" IS NULL AND ("location" ILIKE '%Visakhapatnam%' OR "location" ILIKE '%Vizag%');
UPDATE "jobs" SET "city" = 'Prayagraj' WHERE "city" IS NULL AND ("location" ILIKE '%Prayagraj%' OR "location" ILIKE '%Allahabad%');
UPDATE "jobs" SET "city" = 'Mangaluru' WHERE "city" IS NULL AND ("location" ILIKE '%Mangaluru%' OR "location" ILIKE '%Mangalore%');
