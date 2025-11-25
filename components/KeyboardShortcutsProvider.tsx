'use client';

import { useRouter } from 'next/navigation';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { CommandPalette } from './CommandPalette';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  onAction?: (action: string) => void;
}

export function KeyboardShortcutsProvider({ children, onAction }: KeyboardShortcutsProviderProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleAction = (action: string, data?: any) => {
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
    <>
      {children}
      <KeyboardShortcuts onNavigate={handleNavigate} onAction={handleAction} />
      <CommandPalette onAction={handleAction} />
    </>
  );
}
