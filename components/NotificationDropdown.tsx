'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  MessageSquare,
  CalendarCheck,
  CalendarX,
  AlertCircle,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type NotificationType =
  | 'FEEDBACK_RECEIVED'
  | 'ABSENCE_APPROVED'
  | 'ABSENCE_REJECTED'
  | 'ABSENCE_PENDING'
  | 'SYSTEM';

interface NotificationIconConfig {
  icon: typeof Bell;
  color: string;
  bgColor: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, NotificationIconConfig> = {
  FEEDBACK_RECEIVED: {
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  ABSENCE_APPROVED: {
    icon: CalendarCheck,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  ABSENCE_REJECTED: {
    icon: CalendarX,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  ABSENCE_PENDING: {
    icon: AlertCircle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  SYSTEM: {
    icon: Bell,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notification.getAll.useQuery(
    { limit: 10 },
    {
      enabled: true,
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    }
  );

  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  const handleNotificationClick = (notificationId: string, read: boolean) => {
    if (!read) {
      markAsReadMutation.mutate({ notificationId });
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1 animate-in zoom-in duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              We&apos;ll notify you when something happens
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="p-1">
              {notifications.map((notification) => {
                const config = NOTIFICATION_ICONS[notification.type as NotificationType];
                const Icon = config?.icon ?? Bell;

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 p-3 cursor-pointer',
                      !notification.read && 'bg-primary/5'
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.read)}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0',
                        config?.bgColor ?? 'bg-muted'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', config?.color ?? 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            'text-sm truncate',
                            !notification.read ? 'font-semibold' : 'font-medium'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
