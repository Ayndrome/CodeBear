import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import {
  createOrganization,
  getOrganization,
  getUserOrganizations,
  updateOrganization,
  deleteOrganization,
  addOrganizationMember,
  updateOrganizationMemberRole,
  removeOrganizationMember,
  getOrganizationStats,
} from "@/lib/services/organization-service";

/**
 * Organizations Router
 * Epic 3.2: O-001 Organization Dashboard
 */

export const organizationsRouter = createTRPCRouter({
  // Create new organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
        description: z.string().max(500).optional(),
        website: z.string().url().optional(),
        plan: z.enum(['free', 'pro', 'enterprise']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createOrganization({
        ...input,
        ownerId: ctx.user.id,
      });
    }),

  // Get organization by ID
  get: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return getOrganization(input.organizationId);
    }),

  // List user's organizations
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserOrganizations(ctx.user.id);
  }),

  // Update organization
  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        website: z.string().url().optional(),
        plan: z.enum(['free', 'pro', 'enterprise']).optional(),
        billingEmail: z.string().email().optional(),
        settings: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, ...updates } = input;
      return updateOrganization(organizationId, updates, ctx.user.id);
    }),

  // Delete organization
  delete: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return deleteOrganization(input.organizationId, ctx.user.id);
    }),

  // Add member to organization
  addMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(['admin', 'member', 'viewer']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return addOrganizationMember(
        input.organizationId,
        input.userId,
        input.role,
        ctx.user.id
      );
    }),

  // Update member role
  updateMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(['admin', 'member', 'viewer']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateOrganizationMemberRole(
        input.organizationId,
        input.userId,
        input.role,
        ctx.user.id
      );
    }),

  // Remove member
  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return removeOrganizationMember(
        input.organizationId,
        input.userId,
        ctx.user.id
      );
    }),

  // Get organization statistics
  stats: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return getOrganizationStats(input.organizationId);
    }),
});
