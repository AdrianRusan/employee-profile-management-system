'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, MessageSquare, CalendarDays, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/Provider';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Profiles', href: '/dashboard/profiles', icon: Users },
  { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
  { name: 'Absences', href: '/dashboard/absences', icon: CalendarDays },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Use window.location for logout to ensure hard navigation
      // Do NOT await invalidate - just redirect immediately
      window.location.href = '/login';
    },
    onError: (error) => {
      toast.error(error?.message || 'Logout failed. Please try again.');
    },
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Error is handled by onError callback
    }
  };

  return (
    <div className={cn('flex h-full flex-col bg-gray-900', className)}>
      <div className="flex h-16 items-center border-b border-gray-800 px-6">
        <h1 className="text-lg font-semibold text-white">EPMS</h1>
      </div>
      <nav
        className="flex-1 space-y-1 px-3 py-4"
        aria-label="Primary navigation"
        role="navigation"
      >
        {(() => {
          const activeItem = navigation.reduce<(typeof navigation)[number] | undefined>((best, current) => {
            const isExactMatch = pathname === current.href;
            const isChildPath = current.href !== '/' && pathname.startsWith(current.href + '/');
            if (isExactMatch || isChildPath) {
              if (!best) return current;
              return current.href.length > best.href.length ? current : best;
            }
            return best;
          }, undefined);

          return navigation.map((item) => {
            const isActive = item.href === activeItem?.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 shrink-0',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
          });
        })()}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          aria-label="Logout from the application"
        >
          <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  );
}
