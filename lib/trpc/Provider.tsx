'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState, useEffect } from 'react';
import type { AppRouter } from '@/server';
import { queryConfig } from '@/lib/config';
import { ensureCsrfToken, getCsrfTokenFromCookie } from '@/lib/csrf-client';

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: queryConfig.staleTime,
        gcTime: queryConfig.gcTime,
        refetchOnWindowFocus: queryConfig.refetchOnWindowFocus,
        refetchOnMount: false, // Use cached data on mount - reduces unnecessary refetches
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/trpc`,
          headers: async () => {
            // Get CSRF token from cookie for all requests
            const csrfToken = getCsrfTokenFromCookie();

            if (csrfToken) {
              return {
                'x-csrf-token': csrfToken,
              };
            }

            return {};
          },
        }),
      ],
    })
  );

  // Ensure CSRF token is available on mount
  useEffect(() => {
    ensureCsrfToken().catch(() => {
      // CSRF initialization errors are handled by the API layer
    });
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
