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
  User,
  Search,
  Zap,
  FileText,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';

interface CommandPaletteProps {
  onAction?: (action: string, data?: any) => void;
}

export function CommandPalette({ onAction }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Fetch users for quick search
  const { data: users } = trpc.user.getAll.useInfiniteQuery(
    { limit: 20 },
    {
      enabled: open && search.length > 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const allUsers = users?.pages.flatMap((page) => page.users) || [];

  // Toggle command palette with Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  const handleAction = useCallback(
    (action: string, data?: any) => {
      setOpen(false);
      if (onAction) {
        onAction(action, data);
      } else {
        // Emit custom event
        window.dispatchEvent(
          new CustomEvent('keyboard-shortcut-action', {
            detail: { action, data },
          })
        );
      }
    },
    [onAction]
  );

  const handleUserSelect = useCallback(
    (userId: string) => {
      handleNavigate(`/dashboard/profiles/${userId}`);
    },
    [handleNavigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation Commands */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => handleNavigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleNavigate('/dashboard/profiles')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span>Profiles</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleNavigate('/dashboard/feedback')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Feedback</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleNavigate('/dashboard/absences')}
            className="flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Absences</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => handleAction('new-feedback')}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Give Feedback</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleAction('new-absence')}
            className="flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span>Request Time Off</span>
          </CommandItem>
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
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-gray-500">
                      {user.title} • {user.department}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
