import { router } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { feedbackRouter } from './routers/feedback';
import { absenceRouter } from './routers/absence';
import { dashboardRouter } from './routers/dashboard';
import { notificationRouter } from './routers/notification';
import { adminRouter } from './routers/admin';
import { organizationRouter } from './routers/organization';
import { invitationRouter } from './routers/invitation';
import { twoFactorRouter } from './routers/two-factor';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  feedback: feedbackRouter,
  absence: absenceRouter,
  dashboard: dashboardRouter,
  notification: notificationRouter,
  admin: adminRouter,
  organization: organizationRouter,
  invitation: invitationRouter,
  twoFactor: twoFactorRouter,
});

export type AppRouter = typeof appRouter;
