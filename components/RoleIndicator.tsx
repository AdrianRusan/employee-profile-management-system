'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const roleColors = {
  MANAGER: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  EMPLOYEE: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  COWORKER: 'bg-green-100 text-green-800 hover:bg-green-200',
} as const;

export function RoleIndicator() {
  const router = useRouter();
  const { user, switchRole: updateStoreRole } = useAuthStore();

  const switchRoleMutation = trpc.auth.switchRole.useMutation({
    onSuccess: (updatedUser) => {
      updateStoreRole(updatedUser.role);
      router.refresh();
    },
  });

  if (!user) {
    return null;
  }

  const handleRoleChange = (role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER') => {
    switchRoleMutation.mutate({ role });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Current Role:</span>
        <Badge className={roleColors[user.role]}>{user.role}</Badge>
      </div>

      <Select
        value={user.role}
        onValueChange={handleRoleChange}
        disabled={switchRoleMutation.isPending}
      >
        <SelectTrigger className="w-[140px] text-sm">
          <SelectValue placeholder="Switch role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MANAGER">Manager</SelectItem>
          <SelectItem value="EMPLOYEE">Employee</SelectItem>
          <SelectItem value="COWORKER">Coworker</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
