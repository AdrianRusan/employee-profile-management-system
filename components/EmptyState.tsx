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
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        {action && (
          <Button className="mt-6" onClick={action.onClick} aria-label={action.label}>
            {action.label}
          </Button>
        )}
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}
