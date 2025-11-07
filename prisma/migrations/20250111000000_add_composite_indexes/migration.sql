-- CreateIndex
CREATE INDEX "User_department_role_idx" ON "User"("department", "role");

-- CreateIndex
CREATE INDEX "User_performanceRating_idx" ON "User"("performanceRating");

-- CreateIndex
CREATE INDEX "Feedback_giverId_createdAt_idx" ON "Feedback"("giverId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Feedback_isPolished_idx" ON "Feedback"("isPolished");

-- CreateIndex
CREATE INDEX "Feedback_receiverId_isPolished_idx" ON "Feedback"("receiverId", "isPolished");

-- CreateIndex
CREATE INDEX "AbsenceRequest_userId_status_idx" ON "AbsenceRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "AbsenceRequest_startDate_endDate_idx" ON "AbsenceRequest"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "AbsenceRequest_status_startDate_idx" ON "AbsenceRequest"("status", "startDate");
