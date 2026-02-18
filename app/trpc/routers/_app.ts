import { z } from 'zod';
import { baseProcedure, createCallerFactory, createTRPCRouter } from '../init';
import { authRouter } from './auth';
import { teamsRouter } from './teams';
import { repositoryPermissionsRouter } from './repository-permissions';
import { apiKeysRouter } from './api-keys';
import { auditLogsRouter } from './audit-logs';
import { adminRouter } from './admin';
import { organizationsRouter } from './organizations';
import { customRulesRouter } from './custom-rules';
import { usageAnalyticsRouter } from './usage-analytics';
import { securityRouter } from './security';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  teams: teamsRouter,
  repositoryPermissions: repositoryPermissionsRouter,
  apiKeys: apiKeysRouter,
  auditLogs: auditLogsRouter,
  admin: adminRouter,
  organizations: organizationsRouter,
  customRules: customRulesRouter,
  usageAnalytics: usageAnalyticsRouter,
  security: securityRouter,
});


export type AppRouter = typeof appRouter;