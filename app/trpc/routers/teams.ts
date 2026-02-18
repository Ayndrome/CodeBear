import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import {
  createTeam,
  getTeam,
  getUserTeams,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  deleteTeam,
} from "@/lib/services/team-service";
import { canManageTeam } from "@/lib/auth/rbac";

/**
 * Teams Router
 * Epic 3.1: E-004 Team Management
 */

export const teamsRouter = createTRPCRouter({
  // Create a new team
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createTeam({
        name: input.name,
        description: input.description,
        slug: input.slug,
        ownerId: ctx.user.id,
      });
    }),

  // Get team by ID
  get: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input }) => {
      return getTeam(input.teamId);
    }),

  // Get user's teams
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserTeams(ctx.user.id);
  }),

  // Add member to team
  addMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
        role: z.enum(['admin', 'member', 'viewer']),
        permissions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user can manage team
      const canManage = await canManageTeam(ctx.user.id, input.teamId);
      if (!canManage) {
        throw new Error('Insufficient permissions to manage this team');
      }

      return addTeamMember({
        teamId: input.teamId,
        userId: input.userId,
        role: input.role,
        permissions: input.permissions,
        invitedBy: ctx.user.id,
      });
    }),

  // Update team member
  updateMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
        role: z.enum(['admin', 'member', 'viewer']).optional(),
        permissions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user can manage team
      const canManage = await canManageTeam(ctx.user.id, input.teamId);
      if (!canManage) {
        throw new Error('Insufficient permissions to manage this team');
      }

      return updateTeamMember(
        {
          teamId: input.teamId,
          userId: input.userId,
          role: input.role,
          permissions: input.permissions,
        },
        ctx.user.id
      );
    }),

  // Remove member from team
  removeMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user can manage team
      const canManage = await canManageTeam(ctx.user.id, input.teamId);
      if (!canManage) {
        throw new Error('Insufficient permissions to manage this team');
      }

      return removeTeamMember(input.teamId, input.userId, ctx.user.id);
    }),

  // Delete team
  delete: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user can manage team
      const canManage = await canManageTeam(ctx.user.id, input.teamId);
      if (!canManage) {
        throw new Error('Insufficient permissions to delete this team');
      }

      return deleteTeam(input.teamId, ctx.user.id);
    }),
});
