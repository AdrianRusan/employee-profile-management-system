'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { CommandPalette } from './CommandPalette';
import { CommandPaletteProvider } from './CommandPaletteContext';
import { KeyboardShortcutsContextProvider } from './KeyboardShortcutsContext';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  onAction?: (action: string) => void;
}

export function KeyboardShortcutsProvider({ children, onAction }: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const [keySequence, setKeySequence] = useState<string[]>([]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleAction = (action: string, data?: unknown) => {
    if (onAction) {
      onAction(action);
    } else {
      // Emit a custom event that components can listen to
      window.dispatchEvent(
        new CustomEvent('keyboard-shortcut-action', {
          detail: { action, data },
        })
      );
    }
  };

  return (
    <CommandPaletteProvider>
      <KeyboardShortcutsContextProvider>
        {children}
        <KeyboardShortcuts
          onNavigate={handleNavigate}
          onAction={handleAction}
          keySequence={keySequence}
          setKeySequence={setKeySequence}
        />
        <CommandPalette onAction={handleAction} />
      </KeyboardShortcutsContextProvider>
    </CommandPaletteProvider>
  );
}
