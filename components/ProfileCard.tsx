'use client';

import { useState } from 'react';
import { SerializedUser } from '@/lib/types/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Permissions, PermissionUser } from '@/lib/permissions';
import { Edit, Mail, Briefcase, Building2, DollarSign, Shield, MapPin, TrendingUp, Eye, EyeOff } from 'lucide-react';

interface ProfileCardProps {
  user: SerializedUser;
  currentUserId: string;
  currentUserRole: 'EMPLOYEE' | 'MANAGER' | 'COWORKER';
  onEdit?: () => void;
}

/**
 * ProfileCard component displays user profile information
 * with role-based field visibility
 */
export function ProfileCard({ user, currentUserId, currentUserRole, onEdit }: ProfileCardProps) {
  const [showSSN, setShowSSN] = useState(false);
  const viewer: PermissionUser = { id: currentUserId, role: currentUserRole, email: '' };
  const canEdit = Permissions.user.edit(viewer, { id: user.id });

  // Check if there's actually any sensitive data to show
  // Server filters sensitive data based on permissions, so we just check if data exists
  const hasSensitiveData = !!(user.salary || user.performanceRating || user.address || user.ssn);

  // Mask SSN (show only last 4 digits)
  const maskSSN = (ssn: string): string => {
    if (!ssn) return '';
    // Handle different SSN formats (with or without dashes)
    const digits = ssn.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `***-**-${digits.slice(-4)}`;
    }
    return '***-**-****';
  };

  // Get user initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'default';
      case 'EMPLOYEE':
        return 'secondary';
      case 'COWORKER':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </CardDescription>
              <div className="mt-2">
                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
              </div>
            </div>
          </div>
          {canEdit && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4">
          {/* Non-sensitive fields - visible to all */}
          {user.title && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Title:</span>
              <span className="text-sm">{user.title}</span>
            </div>
          )}

          {user.department && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Department:</span>
              <span className="text-sm">{user.department}</span>
            </div>
          )}

          {user.bio && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Bio</p>
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            </div>
          )}

          {/* Sensitive fields - only shown if data exists (server filters based on permissions) */}
          {hasSensitiveData && (
            <>
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Sensitive Information</span>
                </div>

                {user.salary && (
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Salary:</span>
                    <span className="text-sm">${user.salary}</span>
                  </div>
                )}

                {user.performanceRating && (
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Performance Rating:</span>
                    <span className="text-sm">{user.performanceRating}/5</span>
                  </div>
                )}

                {user.address && (
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Address:</span>
                    <span className="text-sm">{user.address}</span>
                  </div>
                )}

                {user.ssn && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">SSN:</span>
                    <span className="text-sm font-mono">{showSSN ? user.ssn : maskSSN(user.ssn)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowSSN(!showSSN)}
                      aria-label={showSSN ? "Hide SSN" : "Show SSN"}
                    >
                      {showSSN ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 mt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
              <p>Last updated: {new Date(user.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
