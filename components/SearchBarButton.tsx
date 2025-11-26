'use client';

import { Search, Command } from 'lucide-react';
import { useCommandPalette } from './CommandPaletteContext';

export function SearchBarButton() {
  const { open } = useCommandPalette();

  return (
    <button
      onClick={open}
      className="group flex w-full max-w-md items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search anything...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}
