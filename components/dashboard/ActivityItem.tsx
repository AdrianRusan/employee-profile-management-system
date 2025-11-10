import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ActivityType = 'feedback' | 'absence';

type ActivityMetadata = {
  giverName?: string;
  isPolished?: boolean;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
};

interface ActivityItemProps {
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date | string;
  metadata?: ActivityMetadata;
}

/**
 * ActivityItem component displays a single activity in the recent activity feed
 * Supports feedback and absence activity types with appropriate icons and styling
 */
export function ActivityItem({
  type,
  title,
  description,
  timestamp,
  metadata = {},
}: ActivityItemProps) {
  // Get the appropriate icon based on activity type
  const getIcon = () => {
    if (type === 'feedback') {
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    }

    // For absences, use status-specific icons
    if (type === 'absence') {
      switch (metadata.status) {
        case 'APPROVED':
          return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case 'REJECTED':
          return <XCircle className="h-5 w-5 text-red-500" />;
        case 'PENDING':
          return <Clock className="h-5 w-5 text-yellow-500" />;
        default:
          return <Calendar className="h-5 w-5 text-gray-500" />;
      }
    }

    return <Calendar className="h-5 w-5 text-gray-500" />;
  };

  // Get badge for feedback if polished
  const renderBadge = () => {
    if (type === 'feedback' && metadata.isPolished) {
      return (
        <Badge variant="secondary" className="ml-2">
          ✨ Polished
        </Badge>
      );
    }

    if (type === 'absence' && metadata.status) {
      const statusColors = {
        APPROVED: 'bg-green-100 text-green-800 hover:bg-green-100',
        REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
        PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      };

      return (
        <Badge
          className={statusColors[metadata.status as keyof typeof statusColors] || ''}
        >
          {metadata.status}
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Icon container */}
      <div className="flex-shrink-0 mt-1">{getIcon()}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {renderBadge()}
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
