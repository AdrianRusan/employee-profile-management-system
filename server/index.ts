import { router } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { feedbackRouter } from './routers/feedback';
import { absenceRouter } from './routers/absence';
import { dashboardRouter } from './routers/dashboard';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  feedback: feedbackRouter,
  absence: absenceRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
