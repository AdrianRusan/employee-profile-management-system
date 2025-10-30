import { router } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { feedbackRouter } from './routers/feedback';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  feedback: feedbackRouter,
});

export type AppRouter = typeof appRouter;
