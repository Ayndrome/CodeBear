import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import {
  grantRepositoryPermission,
  getRepositoryPermissions,
  updateRepositoryPermission,
  revokeRepositoryPermission,
  getUserAccessibleRepositories,
} from "@/lib/services/repository-permission-service";
import { canAccessRepository } from "@/lib/auth/rbac";

/**
 * Repository Permissions Router
 * Epic 3.1: E-005 Repository Permissions
 */

export const repositoryPermissionsRouter = createTRPCRouter({
  // Grant permission to user or team
  grant: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        userId: z.string().optional(),
        teamId: z.string().optional(),
        level: z.enum(['admin', 'write', 'read']),
        canReview: z.boolean().optional(),
        canConfigure: z.boolean().optional(),
        canManageKeys: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin access to repository
      const hasAccess = await canAccessRepository(
        ctx.user.id,
        input.repositoryId,
        'admin'
      );

      if (!hasAccess) {
        throw new Error('Insufficient permissions to manage repository access');
      }

      return grantRepositoryPermission({
        ...input,
        grantedBy: ctx.user.id,
      });
    }),

  // Get all permissions for a repository
  list: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user has at least read access
      const hasAccess = await canAccessRepository(
        ctx.user.id,
        input.repositoryId,
        'read'
      );

      if (!hasAccess) {
        throw new Error('Insufficient permissions to view repository permissions');
      }

      return getRepositoryPermissions(input.repositoryId);
    }),

  // Update permission
  update: protectedProcedure
    .input(
      z.object({
        permissionId: z.string(),
        level: z.enum(['admin', 'write', 'read']).optional(),
        canReview: z.boolean().optional(),
        canConfigure: z.boolean().optional(),
        canManageKeys: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { permissionId, ...updates } = input;
      
      return updateRepositoryPermission(
        permissionId,
        updates,
        ctx.user.id
      );
    }),

  // Revoke permission
  revoke: protectedProcedure
    .input(z.object({ permissionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return revokeRepositoryPermission(input.permissionId, ctx.user.id);
    }),

  // Get user's accessible repositories
  accessible: protectedProcedure.query(async ({ ctx }) => {
    return getUserAccessibleRepositories(ctx.user.id);
  }),
});
