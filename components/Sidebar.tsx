'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  MessageSquare,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Keyboard,
  Command,
  Sparkles,
  Settings,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/Provider';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    shortcut: ['G', 'D'],
    description: 'Overview & metrics',
  },
  {
    name: 'Profiles',
    href: '/dashboard/profiles',
    icon: Users,
    shortcut: ['G', 'P'],
    description: 'Employee directory',
  },
  {
    name: 'Feedback',
    href: '/dashboard/feedback',
    icon: MessageSquare,
    shortcut: ['G', 'F'],
    description: 'Peer reviews',
  },
  {
    name: 'Absences',
    href: '/dashboard/absences',
    icon: CalendarDays,
    shortcut: ['G', 'A'],
    description: 'Time off requests',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    shortcut: ['G', 'S'],
    description: 'Preferences',
  },
  {
    name: 'Security',
    href: '/dashboard/settings/security',
    icon: Shield,
    shortcut: ['G', 'X'],
    description: '2FA & security',
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  // Check if user is super admin
  const { data: adminCheck } = trpc.admin.checkSuperAdmin.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes - admin status rarely changes
    gcTime: 30 * 60 * 1000,
  });
  const isSuperAdmin = adminCheck?.isSuperAdmin ?? false;

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
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

  // Show keyboard shortcuts dialog
  const showShortcuts = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-gradient-to-b from-gray-900 to-gray-950',
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">EPMS</h1>
            <p className="text-[10px] text-gray-400">Employee Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 space-y-1 px-3 py-4"
        aria-label="Primary navigation"
        role="navigation"
      >
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Navigation
        </p>

        {(() => {
          const activeItem = navigation.reduce<(typeof navigation)[number] | undefined>(
            (best, current) => {
              const isExactMatch = pathname === current.href;
              const isChildPath =
                current.href !== '/' && pathname.startsWith(current.href + '/');
              if (isExactMatch || isChildPath) {
                if (!best) return current;
                return current.href.length > best.href.length ? current : best;
              }
              return best;
            },
            undefined
          );

          return navigation.map((item) => {
            const isActive = item.href === activeItem?.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                      {item.description}
                    </span>
                  </div>
                </div>

                {/* Keyboard shortcut hint */}
                <div className="hidden items-center gap-0.5 lg:flex">
                  {item.shortcut.map((key, index) => (
                    <kbd
                      key={index}
                      className={cn(
                        'inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[10px]',
                        isActive
                          ? 'border-white/20 bg-white/10 text-white/70'
                          : 'border-white/10 bg-white/5 text-gray-500 group-hover:border-white/20 group-hover:text-gray-400'
                      )}
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </Link>
            );
          });
        })()}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 p-3 space-y-2">
        {/* Admin Panel Link - Only for Super Admins */}
        {isSuperAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-300'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-medium">Admin Panel</span>
            </div>
          </Link>
        )}

        {/* Keyboard Shortcuts */}
        <button
          onClick={showShortcuts}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5">
              <Keyboard className="h-4 w-4" />
            </div>
            <span>Shortcuts</span>
          </div>
          <kbd className="inline-flex h-5 items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] text-gray-500">
            ?
          </kbd>
        </button>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          aria-label="Logout from the application"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5">
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </div>
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </Button>

        {/* Pro Tip */}
        <div className="mt-2 rounded-lg bg-primary/10 p-3">
          <p className="text-[10px] text-primary">
            <span className="font-semibold">Pro tip:</span> Press{' '}
            <kbd className="mx-0.5 rounded border border-primary/30 bg-primary/20 px-1 font-mono text-[9px]">
              <Command className="inline h-2.5 w-2.5" />K
            </kbd>{' '}
            for quick search
          </p>
        </div>
      </div>
    </div>
  );
}
