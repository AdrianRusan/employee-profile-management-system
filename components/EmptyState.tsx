import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Main title */
  title: string;
  /** Descriptive text */
  description: string;
  /** Call-to-action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional content to render */
  children?: ReactNode;
}

/**
 * EmptyState component for displaying a message when no data is available
 *
 * @example
 * <EmptyState
 *   icon={Users}
 *   title="No employees found"
 *   description="Add your first employee to get started"
 *   action={{ label: "Add Employee", onClick: handleAddEmployee }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {/* Animated Icon Container */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 blur-2xl opacity-50 animate-pulse"></div>
          <div className="relative rounded-full bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm">
            <Icon className="h-12 w-12 text-blue-600" aria-hidden="true" />
          </div>
        </div>

        {/* Title with gradient */}
        <h3 className="mt-6 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
          {description}
        </p>

        {/* Action Button */}
        {action && (
          <Button
            className="mt-8 shadow-sm hover:shadow-md transition-shadow"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}

        {/* Additional Content */}
        {children && (
          <div className="mt-6 w-full max-w-md">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
