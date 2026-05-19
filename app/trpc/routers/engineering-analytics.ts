import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import { EngineeringAnalyticsService } from "@/lib/services/engineering-analytics-service";

/**
 * Engineering Analytics Router
 * Provides APIs for the premium Monitoring & Reporting dashboards
 */

export const engineeringAnalyticsRouter = createTRPCRouter({
  // Get main dashboard overview stats
  getOverview: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return EngineeringAnalyticsService.getInstance().getOverviewStats(input.organizationId);
    }),

  // Get PR lifecycle analytics
  getPRAnalytics: protectedProcedure
    .input(z.object({ 
      organizationId: z.string(),
      days: z.number().default(30)
    }))
    .query(async ({ input }) => {
      return EngineeringAnalyticsService.getInstance().getPullRequestAnalytics(input.organizationId, input.days);
    }),

  // Get review comment distribution and acceptance
  getCommentAnalytics: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return EngineeringAnalyticsService.getInstance().getReviewCommentAnalytics(input.organizationId);
    }),

  // Get user and team performance
  getUserTeamAnalytics: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return EngineeringAnalyticsService.getInstance().getUserTeamAnalytics(input.organizationId);
    }),

  // Get AI usage and trends
  getAIAnalytics: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return EngineeringAnalyticsService.getInstance().getAIAnalytics(input.organizationId);
    }),

  // Get system observability history
  getObservability: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return EngineeringAnalyticsService.getInstance().getSystemObservability(input.organizationId);
    }),
});
