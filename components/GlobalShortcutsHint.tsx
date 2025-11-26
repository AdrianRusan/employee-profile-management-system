'use client';

import { useState, useEffect } from 'react';
import { Command, Keyboard, Settings, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ShortcutHint {
  keys: string[];
  label: string;
  action?: () => void;
}

const SHORTCUTS: ShortcutHint[] = [
  { keys: ['Ctrl', 'K'], label: 'Search' },
  { keys: ['?'], label: 'Shortcuts' },
  { keys: ['Shift', 'D'], label: 'Customize' },
  { keys: ['G', 'P'], label: 'Profiles' },
];

export function GlobalShortcutsHint() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has dismissed the hints before
  useEffect(() => {
    const dismissed = localStorage.getItem('shortcuts-hint-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('shortcuts-hint-dismissed', 'true');
  };

  const handleShow = () => {
    setIsVisible(true);
    setIsDismissed(false);
    localStorage.removeItem('shortcuts-hint-dismissed');
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShow}
        className="fixed bottom-4 right-4 z-40 h-8 w-8 rounded-full bg-muted/80 p-0 shadow-lg backdrop-blur-sm hover:bg-muted"
        title="Show keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 md:left-64">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="h-3.5 w-3.5" />
            <span className="font-medium">Quick shortcuts:</span>
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            {SHORTCUTS.map((shortcut, index) => (
              <ShortcutPill key={index} keys={shortcut.keys} label={shortcut.label} />
            ))}
          </div>

          {/* Mobile: Show only search shortcut */}
          <div className="flex items-center gap-4 sm:hidden">
            <ShortcutPill keys={['Ctrl', 'K']} label="Search" />
            <ShortcutPill keys={['?']} label="All shortcuts" />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Dismiss shortcuts hint</span>
        </Button>
      </div>
    </div>
  );
}

function ShortcutPill({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-0.5">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
              {key === 'Ctrl' ? (
                <span className="flex items-center">
                  <Command className="h-2.5 w-2.5" />
                </span>
              ) : (
                key
              )}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-[10px] text-muted-foreground/50">+</span>
            )}
          </span>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// Compact version for header
export function HeaderShortcutsHint() {
  return (
    <button
      onClick={() => {
        // Trigger the ? key handler
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
      }}
      className="hidden items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search or press</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}
