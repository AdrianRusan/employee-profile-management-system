'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { trpc } from '@/lib/trpc/Provider';
import { Role } from '@prisma/client';

interface PermissionGateProps {
  children: ReactNode;
  /** Required role to view this content */
  requiredRole?: Role;
  /** Required roles (any of these roles can view) */
  requiredRoles?: Role[];
  /** Custom permission check function */
  permissionCheck?: (userId: string, userRole: Role) => boolean;
  /** Content to show when permission is denied */
  fallback?: ReactNode;
  /** User ID for custom permission checks (e.g., checking if user owns resource) */
  resourceOwnerId?: string;
  /** Allow access if user owns the resource */
  allowOwner?: boolean;
}

/**
 * PermissionGate component for conditional rendering based on user permissions
 *
 * @example
 * // Show content only to managers
 * <PermissionGate requiredRole="MANAGER">
 *   <AdminPanel />
 * </PermissionGate>
 *
 * @example
 * // Show content to managers or employees
 * <PermissionGate requiredRoles={['MANAGER', 'EMPLOYEE']}>
 *   <SensitiveData />
 * </PermissionGate>
 *
 * @example
 * // Show content to owner or managers
 * <PermissionGate resourceOwnerId={profileUserId} allowOwner>
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * // Custom permission check
 * <PermissionGate
 *   permissionCheck={(userId, role) => role === 'MANAGER' || userId === currentUserId}
 *   fallback={<p>Access denied</p>}
 * >
 *   <PrivateContent />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  requiredRole,
  requiredRoles,
  permissionCheck,
  fallback = null,
  resourceOwnerId,
  allowOwner = false,
}: PermissionGateProps) {
  const { user } = useAuthStore();
  const { data: currentUser } = trpc.auth.getCurrentUser.useQuery();

  const activeUser = currentUser || user;

  if (!activeUser) {
    return <>{fallback}</>;
  }

  // Check if user is the resource owner
  if (allowOwner && resourceOwnerId && activeUser.id === resourceOwnerId) {
    return <>{children}</>;
  }

  // Check custom permission function
  if (permissionCheck) {
    const hasPermission = permissionCheck(activeUser.id, activeUser.role);
    if (!hasPermission) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Check single required role
  if (requiredRole && activeUser.role !== requiredRole) {
    return <>{fallback}</>;
  }

  // Check multiple required roles
  if (requiredRoles && !requiredRoles.includes(activeUser.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
