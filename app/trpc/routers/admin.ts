import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import prisma from "@/lib/db";
import { hasPermission, getUserRole } from "@/lib/auth/rbac";
import { createAuditLog } from "@/lib/services/audit-service";

/**
 * Admin Router
 * Epic 3.1: Admin-only operations
 */

export const adminRouter = createTRPCRouter({
  // List all users (admin only)
  listUsers: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        role: z.enum(['admin', 'developer', 'viewer']).optional(),
        tier: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      const role = await getUserRole(ctx.user.id);
      if (!hasPermission(role, 'manage_users')) {
        throw new Error('Admin access required');
      }

      const where: any = {};
      if (input.role) where.role = input.role;
      if (input.tier) where.tier = input.tier;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            role: true,
            tier: true,
            githubLogin: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                repositories: true,
                apiKeys: true,
                teamMemberships: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit || 50,
          skip: input.offset || 0,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        hasMore: total > (input.offset || 0) + users.length,
      };
    }),

  // Update user role (admin only)
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['admin', 'developer', 'viewer']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const role = await getUserRole(ctx.user.id);
      if (!hasPermission(role, 'manage_users')) {
        throw new Error('Admin access required');
      }

      // Prevent self-demotion
      if (ctx.user.id === input.userId && input.role !== 'admin') {
        throw new Error('Cannot change your own admin role');
      }

      const user = await prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: 'user.role.update',
        resource: 'user',
        resourceId: input.userId,
        metadata: {
          targetUserId: input.userId,
          newRole: input.role,
        },
      });

      return user;
    }),

  // Update user tier (admin only)
  updateUserTier: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        tier: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const role = await getUserRole(ctx.user.id);
      if (!hasPermission(role, 'manage_users')) {
        throw new Error('Admin access required');
      }

      const user = await prisma.user.update({
        where: { id: input.userId },
        data: { tier: input.tier },
        select: {
          id: true,
          name: true,
          email: true,
          tier: true,
        },
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: 'user.tier.update',
        resource: 'user',
        resourceId: input.userId,
        metadata: {
          targetUserId: input.userId,
          newTier: input.tier,
        },
      });

      return user;
    }),

  // Get system statistics (admin only)
  systemStats: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    const role = await getUserRole(ctx.user.id);
    if (!hasPermission(role, 'manage_users')) {
      throw new Error('Admin access required');
    }

    const [
      totalUsers,
      totalRepositories,
      totalReviews,
      totalTeams,
      totalApiKeys,
      usersByRole,
      usersByTier,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.repository.count(),
      prisma.review.count(),
      prisma.team.count(),
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['tier'],
        _count: true,
      }),
    ]);

    return {
      totalUsers,
      totalRepositories,
      totalReviews,
      totalTeams,
      totalApiKeys,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as Record<string, number>),
      usersByTier: usersByTier.reduce((acc, item) => {
        acc[item.tier] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }),

  // Deactivate user (admin only)
  deactivateUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const role = await getUserRole(ctx.user.id);
      if (!hasPermission(role, 'manage_users')) {
        throw new Error('Admin access required');
      }

      // Prevent self-deactivation
      if (ctx.user.id === input.userId) {
        throw new Error('Cannot deactivate your own account');
      }

      // Deactivate all user's sessions
      await prisma.session.deleteMany({
        where: { userId: input.userId },
      });

      // Deactivate all user's API keys
      await prisma.apiKey.updateMany({
        where: { userId: input.userId },
        data: { isActive: false },
      });

      // Create audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: 'user.deactivate',
        resource: 'user',
        resourceId: input.userId,
        metadata: {
          targetUserId: input.userId,
        },
      });

      return { success: true };
    }),
});
