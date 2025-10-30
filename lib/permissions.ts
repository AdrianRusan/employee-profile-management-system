type Role = 'EMPLOYEE' | 'MANAGER' | 'COWORKER';

/**
 * Check if viewer can view sensitive data (salary, SSN, address, performanceRating)
 * Rules:
 * - Managers can view all sensitive data
 * - Users can view their own sensitive data
 * - Coworkers cannot view sensitive data (unless it's their own)
 */
export function canViewSensitiveData(
  viewerRole: Role,
  viewerId: string,
  targetUserId: string
): boolean {
  // Managers can view all sensitive data
  if (viewerRole === 'MANAGER') {
    return true;
  }

  // Users can view their own sensitive data
  if (viewerId === targetUserId) {
    return true;
  }

  // Otherwise, cannot view sensitive data
  return false;
}

/**
 * Check if user can edit a profile
 * Rules:
 * - Managers can edit all profiles
 * - Users can edit only their own profile
 */
export function canEditProfile(
  editorRole: Role,
  editorId: string,
  targetUserId: string
): boolean {
  // Managers can edit all profiles
  if (editorRole === 'MANAGER') {
    return true;
  }

  // Users can edit their own profile
  if (editorId === targetUserId) {
    return true;
  }

  // Otherwise, cannot edit
  return false;
}

/**
 * Check if user can view feedback
 * Rules:
 * - Managers can view all feedback
 * - Users can view feedback they received
 * - Feedback givers can view feedback they gave
 */
export function canViewFeedback(
  viewerRole: Role,
  viewerId: string,
  feedbackReceiverId: string,
  feedbackGiverId?: string
): boolean {
  // Managers can view all feedback
  if (viewerRole === 'MANAGER') {
    return true;
  }

  // Recipients can view their feedback
  if (viewerId === feedbackReceiverId) {
    return true;
  }

  // Givers can view feedback they gave
  if (feedbackGiverId && viewerId === feedbackGiverId) {
    return true;
  }

  // Otherwise, cannot view
  return false;
}

/**
 * Check if user can approve absence requests
 * Rules:
 * - Only managers can approve absence requests
 */
export function canApproveAbsence(approverRole: Role): boolean {
  return approverRole === 'MANAGER';
}

/**
 * Check if user can give feedback
 * Rules:
 * - All authenticated users can give feedback
 */
export function canGiveFeedback(): boolean {
  return true;
}

/**
 * Check if user can delete feedback
 * Rules:
 * - Managers can delete any feedback
 * - Feedback givers can delete their own feedback
 */
export function canDeleteFeedback(
  userRole: Role,
  userId: string,
  feedbackGiverId: string
): boolean {
  // Managers can delete any feedback
  if (userRole === 'MANAGER') {
    return true;
  }

  // Givers can delete their own feedback
  if (userId === feedbackGiverId) {
    return true;
  }

  return false;
}
