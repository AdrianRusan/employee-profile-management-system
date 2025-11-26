'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CalendarDays,
  Zap,
  Settings,
  Keyboard,
  Sparkles,
  Shield,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { cn } from '@/lib/utils';
import { useCommandPalette } from './CommandPaletteContext';
import { useKeyboardShortcutsContext } from './KeyboardShortcutsContext';

interface CommandPaletteProps {
  onAction?: (action: string, data?: unknown) => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  shortcut: string[];
  color: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: ['G', 'D'], color: 'text-blue-500' },
  { path: '/dashboard/profiles', label: 'Profiles', icon: Users, shortcut: ['G', 'P'], color: 'text-emerald-500' },
  { path: '/dashboard/feedback', label: 'Feedback', icon: MessageSquare, shortcut: ['G', 'F'], color: 'text-amber-500' },
  { path: '/dashboard/absences', label: 'Absences', icon: CalendarDays, shortcut: ['G', 'A'], color: 'text-purple-500' },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings, shortcut: ['G', 'S'], color: 'text-gray-500' },
  { path: '/dashboard/settings/security', label: 'Security', icon: Shield, shortcut: ['G', 'X'], color: 'text-red-500' },
];

interface ActionItem {
  action: string;
  label: string;
  description: string;
  icon: React.ElementType;
  shortcut: string[];
  color: string;
}

const ACTION_ITEMS: ActionItem[] = [
  { action: 'new-feedback', label: 'Give Feedback', description: 'Share peer feedback', icon: Zap, shortcut: ['N', 'F'], color: 'text-yellow-500' },
  { action: 'new-absence', label: 'Request Time Off', description: 'Submit absence request', icon: CalendarDays, shortcut: ['N', 'A'], color: 'text-blue-500' },
];

interface UtilityItem {
  action: string;
  label: string;
  description: string;
  icon: React.ElementType;
  shortcut: string[];
}

const UTILITY_ITEMS: UtilityItem[] = [
  { action: 'shortcuts', label: 'Keyboard Shortcuts', description: 'View all shortcuts', icon: Keyboard, shortcut: ['?'] },
  { action: 'customize', label: 'Customize Dashboard', description: 'Toggle widgets', icon: Settings, shortcut: ['Shift', 'D'] },
];

export function CommandPalette({ onAction }: CommandPaletteProps) {
  const { isOpen, close, toggle } = useCommandPalette();
  const { openDialog: openShortcutsDialog } = useKeyboardShortcutsContext();
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Fetch users for quick search
  const { data: users } = trpc.user.getAll.useInfiniteQuery(
    { limit: 20 },
    {
      enabled: isOpen && search.length > 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const allUsers = users?.pages.flatMap((page) => page.users) || [];

  // Toggle command palette with Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  const handleNavigate = useCallback(
    (path: string) => {
      close();
      router.push(path);
    },
    [router, close]
  );

  const handleAction = useCallback(
    (action: string, data?: unknown) => {
      close();
      if (onAction) {
        onAction(action, data);
      } else {
        // Handle utility actions
        if (action === 'shortcuts') {
          // Use context to open shortcuts dialog directly
          setTimeout(() => openShortcutsDialog(), 100);
        } else if (action === 'customize') {
          // Dispatch event for dashboard customization
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-dashboard-customization'));
          }, 100);
        } else {
          // Emit custom event for other actions
          window.dispatchEvent(
            new CustomEvent('keyboard-shortcut-action', {
              detail: { action, data },
            })
          );
        }
      }
    },
    [onAction, close, openShortcutsDialog]
  );

  const handleUserSelect = useCallback(
    (userId: string) => {
      handleNavigate(`/dashboard/profiles/${userId}`);
    },
    [handleNavigate]
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => open ? undefined : close()}>
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <CommandInput
            placeholder="Search anything..."
            value={search}
            onValueChange={setSearch}
            className="border-0 p-0 focus:ring-0"
          />
        </div>
      </div>
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No results found</p>
            <p className="text-xs text-muted-foreground/60">Try a different search term</p>
          </div>
        </CommandEmpty>

        {/* Navigation Commands */}
        <CommandGroup heading="Navigation">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.path}
                onSelect={() => handleNavigate(item.path)}
                className="group flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-aria-selected:bg-primary/10')}>
                    <Icon className={cn('h-4 w-4 text-muted-foreground group-aria-selected:text-primary', item.color)} />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {item.shortcut.map((key, index) => (
                    <kbd
                      key={index}
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {ACTION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.action}
                onSelect={() => handleAction(item.action)}
                className="group flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-aria-selected:bg-primary/10">
                    <Icon className={cn('h-4 w-4', item.color)} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {item.shortcut.map((key, index) => (
                    <kbd
                      key={index}
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Utilities */}
        <CommandGroup heading="Utilities">
          {UTILITY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.action}
                onSelect={() => handleAction(item.action)}
                className="group flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-aria-selected:bg-primary/10">
                    <Icon className="h-4 w-4 text-muted-foreground group-aria-selected:text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {item.shortcut.map((key, index) => (
                    <kbd
                      key={index}
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* User Search Results */}
        {search.length > 0 && allUsers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="People">
              {allUsers.slice(0, 5).map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleUserSelect(user.id)}
                  className="group flex items-center gap-3 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium text-sm text-muted-foreground">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.title} • {user.department}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer with hints */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border bg-muted px-1 font-mono text-[9px]">↑</kbd>
            <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border bg-muted px-1 font-mono text-[9px]">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border bg-muted px-1 font-mono text-[9px]">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border bg-muted px-1 font-mono text-[9px]">esc</kbd>
            close
          </span>
        </div>
      </div>
    </CommandDialog>
  );
}
