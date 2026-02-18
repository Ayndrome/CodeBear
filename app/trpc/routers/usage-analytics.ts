import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import {
  trackUsage,
  getUsageStats,
  getUsageHistory,
  getTeamUsage,
  getCostBreakdown,
  exportUsageReport,
  getCurrentMonthUsage,
  checkUsageLimits,
} from "@/lib/services/usage-analytics-service";

/**
 * Usage Analytics Router
 * Epic 3.2: O-005 Usage Analytics, O-006 Cost Management
 */

export const usageAnalyticsRouter = createTRPCRouter({
  // Track usage (internal use)
  track: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        period: z.string(),
        reviewsCount: z.number().optional(),
        filesAnalyzed: z.number().optional(),
        issuesFound: z.number().optional(),
        llmTokensUsed: z.number().optional(),
        apiCallsCount: z.number().optional(),
        teamId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return trackUsage(input);
    }),

  // Get usage stats for a period
  getStats: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        period: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getUsageStats(input.organizationId, input.period);
    }),

  // Get usage history
  getHistory: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        startPeriod: z.string(),
        endPeriod: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getUsageHistory(
        input.organizationId,
        input.startPeriod,
        input.endPeriod
      );
    }),

  // Get team usage
  getTeamStats: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        teamId: z.string(),
        period: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getTeamUsage(input.organizationId, input.teamId, input.period);
    }),

  // Get cost breakdown
  getCosts: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        period: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getCostBreakdown(input.organizationId, input.period);
    }),

  // Export usage report
  export: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        startPeriod: z.string(),
        endPeriod: z.string(),
      })
    )
    .query(async ({ input }) => {
      return exportUsageReport(
        input.organizationId,
        input.startPeriod,
        input.endPeriod
      );
    }),

  // Get current month usage
  getCurrentMonth: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return getCurrentMonthUsage(input.organizationId);
    }),

  // Check usage limits
  checkLimits: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return checkUsageLimits(input.organizationId);
    }),
});
