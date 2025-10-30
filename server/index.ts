import { router } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { feedbackRouter } from './routers/feedback';
import { absenceRouter } from './routers/absence';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  feedback: feedbackRouter,
  absence: absenceRouter,
});

export type AppRouter = typeof appRouter;
