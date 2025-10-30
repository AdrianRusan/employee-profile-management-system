import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server';

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/trpc`,
    }),
  ],
});
