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
import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['G', 'P'], description: 'Go to Profiles', category: 'Navigation' },
  { keys: ['G', 'F'], description: 'Go to Feedback', category: 'Navigation' },
  { keys: ['G', 'A'], description: 'Go to Absences', category: 'Navigation' },

  // Actions
  { keys: ['N', 'F'], description: 'New Feedback', category: 'Actions' },
  { keys: ['N', 'A'], description: 'New Absence Request', category: 'Actions' },
  { keys: ['?'], description: 'Show Keyboard Shortcuts', category: 'Help' },
  { keys: ['Esc'], description: 'Close Dialog/Modal', category: 'Help' },
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

  return (
    <>
      {/* Show current key sequence indicator */}
      {keySequence.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            <span className="font-mono text-sm">{keySequence.join(' ')}</span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate and perform actions quickly
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{category}</h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <Badge
                            key={keyIndex}
                            variant="outline"
                            className="font-mono font-semibold"
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>Tip:</strong> Press <Badge variant="outline" className="mx-1 font-mono">?</Badge>
              anytime to view this shortcuts dialog
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
