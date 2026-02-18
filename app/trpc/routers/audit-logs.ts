import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import {
  getUserAuditLogs,
  getResourceAuditLogs,
  getAuditLogStats,
} from "@/lib/services/audit-service";
import { hasPermission, getUserRole } from "@/lib/auth/rbac";

/**
 * Audit Logs Router
 * Epic 3.1: E-007 Audit Logs
 */

export const auditLogsRouter = createTRPCRouter({
  // Get user's audit logs
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        action: z.string().optional(),
        resource: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getUserAuditLogs(ctx.user.id, input);
    }),

  // Get audit logs for a specific resource
  resource: protectedProcedure
    .input(
      z.object({
        resource: z.string(),
        resourceId: z.string(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      return getResourceAuditLogs(
        input.resource,
        input.resourceId,
        {
          limit: input.limit,
          offset: input.offset,
        }
      );
    }),

  // Get audit log statistics
  stats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getAuditLogStats(ctx.user.id, input.days);
    }),

  // Get all audit logs (admin only)
  all: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        userId: z.string().optional(),
        action: z.string().optional(),
        resource: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      const role = await getUserRole(ctx.user.id);
      if (!hasPermission(role, 'manage_users')) {
        throw new Error('Admin access required to view all audit logs');
      }

      // If userId is provided, get logs for that user
      if (input.userId) {
        return getUserAuditLogs(input.userId, {
          limit: input.limit,
          offset: input.offset,
          action: input.action,
          resource: input.resource,
        });
      }

      // Otherwise, this would need a new service function to get all logs
      // For now, return the current user's logs
      return getUserAuditLogs(ctx.user.id, {
        limit: input.limit,
        offset: input.offset,
        action: input.action,
        resource: input.resource,
      });
    }),
});
