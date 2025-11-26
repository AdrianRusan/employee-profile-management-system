'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FolderTree, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DepartmentsStepProps {
  onNext: () => void;
  onBack: () => void;
  departments: string[];
  setDepartments: (departments: string[]) => void;
}

const SUGGESTED_DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Customer Support',
  'Operations',
  'Product',
  'Design',
  'Legal',
];

export function DepartmentsStep({
  onNext,
  onBack,
  departments,
  setDepartments,
}: DepartmentsStepProps) {
  const [customDepartment, setCustomDepartment] = useState('');

  const toggleSuggestedDepartment = (dept: string) => {
    if (departments.includes(dept)) {
      setDepartments(departments.filter((d) => d !== dept));
      toast.success(`Removed ${dept}`);
    } else {
      setDepartments([...departments, dept]);
      toast.success(`Added ${dept}`);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customDepartment.trim();
    if (!trimmed) {
      toast.error('Please enter a department name');
      return;
    }

    if (departments.includes(trimmed)) {
      toast.error('Department already added');
      return;
    }

    setDepartments([...departments, trimmed]);
    setCustomDepartment('');
    toast.success(`Added ${trimmed}`);
  };

  const handleRemoveDepartment = (dept: string) => {
    setDepartments(departments.filter((d) => d !== dept));
    toast.success(`Removed ${dept}`);
  };

  const handleContinue = () => {
    if (departments.length === 0) {
      toast.info('Skipping department setup');
    } else {
      toast.success(`${departments.length} department${departments.length > 1 ? 's' : ''} configured`);
    }
    onNext();
  };

  const customDepartments = departments.filter(
    (d) => !SUGGESTED_DEPARTMENTS.includes(d)
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 mb-2">
          <FolderTree className="h-6 w-6 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Create Departments</h2>
        <p className="text-sm text-muted-foreground">
          Organize your team into departments (optional)
        </p>
      </div>

      <div className="space-y-5">
        {/* Suggested Departments */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Common Departments</Label>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_DEPARTMENTS.map((dept) => {
              const isSelected = departments.includes(dept);
              return (
                <button
                  key={dept}
                  onClick={() => toggleSuggestedDepartment(dept)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all text-left',
                    isSelected
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-muted hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="text-sm font-medium">{dept}</span>
                  <div
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Department Input */}
        <div className="space-y-2">
          <Label htmlFor="custom-dept" className="text-sm font-medium">
            Add Custom Department
          </Label>
          <div className="flex gap-2">
            <Input
              id="custom-dept"
              placeholder="e.g., Research & Development"
              value={customDepartment}
              onChange={(e) => setCustomDepartment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleAddCustom}
              disabled={!customDepartment.trim()}
              className="flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Custom Departments List */}
        {customDepartments.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Custom Departments ({customDepartments.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {customDepartments.map((dept, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm py-1.5 px-3 gap-2"
                  >
                    {dept}
                    <button
                      onClick={() => handleRemoveDepartment(dept)}
                      className="hover:text-destructive transition-colors"
                      aria-label={`Remove ${dept}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {departments.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {departments.length}
                </span>{' '}
                department{departments.length > 1 ? 's' : ''} will be created
              </p>
            </CardContent>
          </Card>
        )}

        {departments.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6 text-center">
              <FolderTree className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No departments selected. You can create them later from settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
          {departments.length > 0 &&
            ` with ${departments.length} department${departments.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}
