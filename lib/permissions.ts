import { User, Feedback, AbsenceRequest, Role } from '@prisma/client';

/**
 * Session user interface for permission checks
 * Contains minimal user information needed for authorization
 */
export interface SessionUser {
  id: string;
  role: Role;
  email: string;
}

/**
 * Centralized permission checking system.
 * All authorization logic lives here for consistency and auditability.
 *
 * This is the single source of truth for all permissions in the application.
 * Client-side and server-side code MUST use these functions to ensure
 * consistent permission enforcement and prevent security bypasses.
 *
 * @security IMPORTANT: Never implement permission checks inline.
 * Always use this centralized system to prevent drift between client and server.
 */
export const Permissions = {
  user: {
    /**
     * Can view sensitive fields (salary, SSN, address, performanceRating)
     * Rules:
     * - Managers can view all sensitive data
     * - Users can view their own sensitive data
     * - Coworkers cannot view sensitive data (unless it's their own)
     */
    viewSensitive: (viewer: SessionUser, target: Pick<User, 'id'>): boolean => {
      return viewer.role === 'MANAGER' || viewer.id === target.id;
    },

    /**
     * Can edit user profile (basic fields like name, title, department)
     * Rules:
     * - Managers can edit all profiles
     * - Users can edit their own profile
     */
    edit: (viewer: SessionUser, target: Pick<User, 'id'>): boolean => {
      return viewer.role === 'MANAGER' || viewer.id === target.id;
    },

    /**
     * Can delete user account
     * Rules:
     * - Only managers can delete accounts
     * - Managers cannot delete themselves (safety check)
     */
    delete: (viewer: SessionUser, target: Pick<User, 'id'>): boolean => {
      return viewer.role === 'MANAGER' && viewer.id !== target.id;
    },

    /**
     * Can view user profile (basic check)
     * Rules:
     * - All authenticated users can view profiles
     * - Sensitive fields are filtered separately via viewSensitive()
     */
    view: (_viewer: SessionUser, _target: Pick<User, 'id'>): boolean => {
      // Everyone can view profiles (sensitive fields filtered separately)
      return true;
    },

    /**
     * Can update sensitive fields (salary, SSN, performanceRating)
     * Rules:
     * - Only managers can update sensitive fields
     */
    updateSensitive: (viewer: SessionUser): boolean => {
      return viewer.role === 'MANAGER';
    },
  },

  feedback: {
    /**
     * Can give feedback to a user
     * Rules:
     * - All authenticated users can give feedback
     * - Cannot give feedback to yourself
     */
    give: (viewer: SessionUser, receiver: Pick<User, 'id'>): boolean => {
      return viewer.id !== receiver.id;
    },

    /**
     * Can view specific feedback
     * Rules:
     * - Managers can view all feedback
     * - Feedback receivers can view feedback they received
     * - Feedback givers can view feedback they gave
     */
    view: (viewer: SessionUser, feedback: Pick<Feedback, 'giverId' | 'receiverId'>): boolean => {
      return (
        viewer.id === feedback.giverId ||
        viewer.id === feedback.receiverId ||
        viewer.role === 'MANAGER'
      );
    },

    /**
     * Can view all feedback for a specific user
     * Rules:
     * - Managers can view all feedback
     * - Users can view feedback they received
     * - Users can view feedback they gave (filtered separately)
     */
    viewForUser: (viewer: SessionUser, targetUserId: string): boolean => {
      return viewer.role === 'MANAGER' || viewer.id === targetUserId;
    },

    /**
     * Can edit/delete feedback
     * Rules:
     * - Managers can edit/delete any feedback
     * - Feedback givers can edit/delete their own feedback
     */
    edit: (viewer: SessionUser, feedback: Pick<Feedback, 'giverId'>): boolean => {
      return viewer.id === feedback.giverId || viewer.role === 'MANAGER';
    },

    /**
     * Can delete feedback (alias for edit for clarity)
     */
    delete: (viewer: SessionUser, feedback: Pick<Feedback, 'giverId'>): boolean => {
      return viewer.id === feedback.giverId || viewer.role === 'MANAGER';
    },
  },

  absence: {
    /**
     * Can create absence request
     * Rules:
     * - All authenticated users can create absence requests
     */
    create: (_viewer: SessionUser): boolean => {
      return true;
    },

    /**
     * Can view specific absence request
     * Rules:
     * - Managers can view all absence requests
     * - Users can view their own absence requests
     */
    view: (viewer: SessionUser, absence: Pick<AbsenceRequest, 'userId'>): boolean => {
      return viewer.role === 'MANAGER' || viewer.id === absence.userId;
    },

    /**
     * Can view all absence requests for a user
     * Rules:
     * - Managers can view all absence requests
     * - Users can view their own absence requests
     */
    viewForUser: (viewer: SessionUser, targetUserId: string): boolean => {
      return viewer.role === 'MANAGER' || viewer.id === targetUserId;
    },

    /**
     * Can view all absence requests (manager-only)
     * Rules:
     * - Only managers can view all absence requests across all users
     */
    viewAll: (viewer: SessionUser): boolean => {
      return viewer.role === 'MANAGER';
    },

    /**
     * Can approve/reject absence requests
     * Rules:
     * - Only managers can approve/reject absence requests
     */
    approve: (viewer: SessionUser): boolean => {
      return viewer.role === 'MANAGER';
    },

    /**
     * Can edit absence request
     * Rules:
     * - Users can edit their own pending requests only
     * - Managers can edit any pending requests
     */
    edit: (viewer: SessionUser, absence: Pick<AbsenceRequest, 'userId' | 'status'>): boolean => {
      if (viewer.role === 'MANAGER') {
        return absence.status === 'PENDING';
      }
      return viewer.id === absence.userId && absence.status === 'PENDING';
    },

    /**
     * Can delete absence request
     * Rules:
     * - Users can delete their own pending requests
     * - Managers can delete any pending requests
     */
    delete: (viewer: SessionUser, absence: Pick<AbsenceRequest, 'userId' | 'status'>): boolean => {
      if (viewer.role === 'MANAGER') {
        return absence.status === 'PENDING';
      }
      return viewer.id === absence.userId && absence.status === 'PENDING';
    },
  },
} as const;

/**
 * Helper to assert permission and throw if denied
 * Use this in server-side code (tRPC routers) to enforce permissions
 *
 * @param allowed - Boolean indicating if permission is granted
 * @param message - Custom error message to throw if permission denied
 * @throws Error if permission is denied
 *
 * @example
 * ```typescript
 * assertPermission(
 *   Permissions.user.delete(ctx.session, user),
 *   'You do not have permission to delete this user'
 * );
 * ```
 */
export function assertPermission(
  allowed: boolean,
  message = 'You do not have permission to perform this action'
): asserts allowed {
  if (!allowed) {
    throw new Error(message);
  }
}

// Legacy function exports for backwards compatibility
// TODO: Phase out these functions in favor of Permissions object

/**
 * @deprecated Use Permissions.user.viewSensitive() instead
 */
export function canViewSensitiveData(
  viewerRole: Role,
  viewerId: string,
  targetUserId: string
): boolean {
  return Permissions.user.viewSensitive(
    { id: viewerId, role: viewerRole, email: '' },
    { id: targetUserId }
  );
}

/**
 * @deprecated Use Permissions.user.edit() instead
 */
export function canEditProfile(
  editorRole: Role,
  editorId: string,
  targetUserId: string
): boolean {
  return Permissions.user.edit(
    { id: editorId, role: editorRole, email: '' },
    { id: targetUserId }
  );
}

/**
 * @deprecated Use Permissions.feedback.viewForUser() instead
 */
export function canViewFeedback(
  viewerRole: Role,
  viewerId: string,
  feedbackReceiverId: string,
  feedbackGiverId?: string
): boolean {
  const viewer = { id: viewerId, role: viewerRole, email: '' };

  // Check if can view feedback for user
  if (!Permissions.feedback.viewForUser(viewer, feedbackReceiverId)) {
    // If not, check if they're the giver
    if (feedbackGiverId) {
      return viewerId === feedbackGiverId;
    }
    return false;
  }

  return true;
}

/**
 * @deprecated Use Permissions.absence.approve() instead
 */
export function canApproveAbsence(approverRole: Role): boolean {
  return Permissions.absence.approve({ id: '', role: approverRole, email: '' });
}

/**
 * @deprecated Use Permissions.feedback.give() instead
 */
export function canGiveFeedback(): boolean {
  return true; // Basic check, receiver check happens in Permissions.feedback.give()
}

/**
 * @deprecated Use Permissions.feedback.delete() instead
 */
export function canDeleteFeedback(
  userRole: Role,
  userId: string,
  feedbackGiverId: string
): boolean {
  return Permissions.feedback.delete(
    { id: userId, role: userRole, email: '' },
    { giverId: feedbackGiverId }
  );
}
