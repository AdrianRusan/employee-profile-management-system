'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  {
    name: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Platform metrics',
  },
  {
    name: 'Organizations',
    href: '/admin/organizations',
    icon: Building2,
    description: 'Manage tenants',
  },
  {
    name: 'All Users',
    href: '/admin/users',
    icon: Users,
    description: 'Cross-org users',
  },
  {
    name: 'Activity',
    href: '/admin/activity',
    icon: Activity,
    description: 'Audit logs',
  },
];

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-background border-r border-border',
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Admin Panel</h1>
            <p className="text-[10px] text-muted-foreground">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 space-y-1 px-3 py-4"
        aria-label="Admin navigation"
        role="navigation"
      >
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Admin Menu
        </p>

        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-[10px] text-muted-foreground group-hover:text-muted-foreground/80">
                    {item.description}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Back to Dashboard */}
        <Link href="/dashboard" passHref legacyBehavior>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            asChild
          >
            <a>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </div>
              Back to Dashboard
            </a>
          </Button>
        </Link>

        {/* Warning Notice */}
        <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <p className="text-[10px] text-amber-400">
            <span className="font-semibold">Warning:</span> Admin actions are logged and audited
          </p>
        </div>
      </div>
    </div>
  );
}
