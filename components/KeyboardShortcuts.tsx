'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Keyboard,
  Navigation,
  Plus,
  HelpCircle,
  Command,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'help';
}

interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  navigation: {
    label: 'Navigation',
    icon: Navigation,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  actions: {
    label: 'Actions',
    icon: Plus,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  help: {
    label: 'Help',
    icon: HelpCircle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
};

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'navigation' },
  { keys: ['G', 'P'], description: 'Go to Profiles', category: 'navigation' },
  { keys: ['G', 'F'], description: 'Go to Feedback', category: 'navigation' },
  { keys: ['G', 'A'], description: 'Go to Absences', category: 'navigation' },

  // Actions
  { keys: ['N', 'F'], description: 'New Feedback', category: 'actions' },
  { keys: ['N', 'A'], description: 'New Absence Request', category: 'actions' },

  // Help
  { keys: ['?'], description: 'Show Keyboard Shortcuts', category: 'help' },
  { keys: ['Esc'], description: 'Close Dialog / Modal', category: 'help' },
  { keys: ['Ctrl', 'K'], description: 'Open Command Palette', category: 'help' },
];

interface KeyboardShortcutsProps {
  onNavigate?: (path: string) => void;
  onAction?: (action: string) => void;
}

export function KeyboardShortcuts({ onNavigate, onAction }: KeyboardShortcutsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);

  const handleShortcut = useCallback(
    (keys: string[]) => {
      const keyString = keys.join('');

      // Navigation shortcuts
      if (keyString === 'GD' && onNavigate) {
        onNavigate('/dashboard');
      } else if (keyString === 'GP' && onNavigate) {
        onNavigate('/dashboard/profiles');
      } else if (keyString === 'GF' && onNavigate) {
        onNavigate('/dashboard/feedback');
      } else if (keyString === 'GA' && onNavigate) {
        onNavigate('/dashboard/absences');
      }
      // Action shortcuts
      else if (keyString === 'NF' && onAction) {
        onAction('new-feedback');
      } else if (keyString === 'NA' && onAction) {
        onAction('new-absence');
      }

      setKeySequence([]);
    },
    [onNavigate, onAction]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle ? key to show shortcuts
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault();
        setShowDialog(true);
        return;
      }

      // Handle Escape to close shortcuts dialog
      if (e.key === 'Escape' && showDialog) {
        setShowDialog(false);
        return;
      }

      // Build key sequence for shortcuts (G, N, etc.)
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        const newSequence = [...keySequence, key];

        // Check if we have a complete shortcut
        const shortcutKey = newSequence.join('');
        const matchingShortcut = shortcuts.find(
          (s) => s.keys.join('') === shortcutKey
        );

        if (matchingShortcut) {
          handleShortcut(newSequence);
        } else {
          // Keep sequence if it could be the start of a shortcut
          const hasPartialMatch = shortcuts.some((s) =>
            s.keys.join('').startsWith(shortcutKey)
          );

          if (hasPartialMatch) {
            setKeySequence(newSequence);
            // Clear after 1 second of inactivity
            setTimeout(() => setKeySequence([]), 1000);
          } else {
            setKeySequence([]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keySequence, showDialog, handleShortcut]);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const categoryOrder: Array<'navigation' | 'actions' | 'help'> = ['navigation', 'actions', 'help'];

  return (
    <>
      {/* Show current key sequence indicator */}
      {keySequence.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center gap-3 bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/20">
              <Command className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              {keySequence.map((key, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-background/20 px-2 font-mono text-sm font-semibold">
                    {key}
                  </kbd>
                  {index < keySequence.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-background/60" />
                  )}
                </span>
              ))}
            </div>
            <div className="h-4 w-px bg-background/30" />
            <span className="text-sm text-background/70">waiting...</span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Keyboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Keyboard Shortcuts</DialogTitle>
                <DialogDescription>
                  Navigate and perform actions quickly
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {categoryOrder.map((category) => {
              const categoryShortcuts = groupedShortcuts[category];
              if (!categoryShortcuts) return null;

              const config = CATEGORY_CONFIGS[category];
              const Icon = config.icon;

              return (
                <div key={category} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-2">
                    <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', config.bgColor)}>
                      <Icon className={cn('h-3.5 w-3.5', config.color)} />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {config.label}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Shortcuts List */}
                  <div className="grid gap-1.5">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="group flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center gap-1">
                              <kbd
                                className={cn(
                                  'pointer-events-none inline-flex h-6 min-w-6 select-none items-center justify-center rounded-md border px-2 font-mono text-xs font-medium transition-colors',
                                  'bg-muted text-muted-foreground',
                                  'group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/30'
                                )}
                              >
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-xs text-muted-foreground/50 mx-0.5">then</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Tip */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t">
            <span className="text-xs text-muted-foreground">Press</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ?
            </kbd>
            <span className="text-xs text-muted-foreground">anytime to view shortcuts</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
