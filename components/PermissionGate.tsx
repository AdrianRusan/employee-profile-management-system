'use client';

import { ReactNode } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Permissions, PermissionUser } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';

interface PermissionGateProps {
  children: ReactNode;
  /** Content to show when permission is denied */
  fallback?: ReactNode;
  /** Custom permission check function using centralized Permissions object */
  check: (permissions: typeof Permissions, user: PermissionUser) => boolean;
}

/**
 * PermissionGate component for conditional rendering based on centralized permissions
 *
 * This component uses the centralized Permissions object to ensure consistent
 * permission enforcement between client and server. Always use the Permissions
 * object from @/lib/permissions for authorization checks.
 *
 * @example
 * // Show content only if user can delete target user
 * <PermissionGate
 *   check={(perms, user) => perms.user.delete(user, targetUser)}
 *   fallback={<div>Access Denied</div>}
 * >
 *   <DeleteButton />
 * </PermissionGate>
 *
 * @example
 * // Show content only if user can view sensitive data
 * <PermissionGate
 *   check={(perms, user) => perms.user.viewSensitive(user, targetUser)}
 * >
 *   <SalaryField salary={user.salary} />
 * </PermissionGate>
 *
 * @example
 * // Show content only if user can approve absences
 * <PermissionGate check={(perms, user) => perms.absence.approve(user)}>
 *   <ApprovalButtons />
 * </PermissionGate>
 *
 * @example
 * // Show content only if user can give feedback to target
 * <PermissionGate
 *   check={(perms, user) => perms.feedback.give(user, targetUser)}
 *   fallback={<p>You cannot give feedback to yourself</p>}
 * >
 *   <FeedbackForm />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  fallback = null,
  check,
}: PermissionGateProps) {
  const { data: currentUser, isLoading } = trpc.auth.getCurrentUser.useQuery();

  if (isLoading) {
    return <Skeleton className="h-8 w-full" />;
  }

  if (!currentUser) {
    return <>{fallback}</>;
  }

  // Use centralized permission check
  const hasPermission = check(Permissions, currentUser);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
