-- CreateIndex
CREATE INDEX "course_wishlist_courseId_idx" ON "course_wishlist"("courseId");

-- CreateIndex
CREATE INDEX "course_purchases_courseId_idx" ON "course_purchases"("courseId");

-- CreateIndex
CREATE INDEX "event_registrations_eventId_idx" ON "event_registrations"("eventId");

-- CreateIndex
CREATE INDEX "competition_entries_competitionId_idx" ON "competition_entries"("competitionId");

-- CreateIndex
CREATE INDEX "certificates_courseId_idx" ON "certificates"("courseId");

-- CreateIndex
CREATE INDEX "certificates_eventId_idx" ON "certificates"("eventId");

-- CreateIndex
CREATE INDEX "certificates_competitionId_idx" ON "certificates"("competitionId");

-- CreateIndex
CREATE INDEX "job_applications_userId_idx" ON "job_applications"("userId");
