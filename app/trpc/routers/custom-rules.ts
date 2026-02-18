import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import {
  createCustomRule,
  getOrganizationRules,
  getCustomRule,
  updateCustomRule,
  deleteCustomRule,
  testCustomRule,
  applyRuleToRepository,
  removeRuleFromRepository,
} from "@/lib/services/custom-rules-service";

/**
 * Custom Rules Router
 * Epic 3.2: O-002 Custom Rules
 */

export const customRulesRouter = createTRPCRouter({
  // Create custom rule
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        category: z.enum(['react', 'typescript', 'security', 'performance', 'accessibility', 'custom']),
        severity: z.enum(['error', 'warning', 'info']),
        pattern: z.string(),
        message: z.string(),
        suggestion: z.string().optional(),
        appliesTo: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createCustomRule({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  // List organization rules
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { organizationId, ...filters } = input;
      return getOrganizationRules(organizationId, filters);
    }),

  // Get rule by ID
  get: protectedProcedure
    .input(z.object({ ruleId: z.string() }))
    .query(async ({ input }) => {
      return getCustomRule(input.ruleId);
    }),

  // Update rule
  update: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        severity: z.enum(['error', 'warning', 'info']).optional(),
        pattern: z.string().optional(),
        message: z.string().optional(),
        suggestion: z.string().optional(),
        appliesTo: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ruleId, ...updates } = input;
      return updateCustomRule(ruleId, updates, ctx.user.id);
    }),

  // Delete rule
  delete: protectedProcedure
    .input(z.object({ ruleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return deleteCustomRule(input.ruleId, ctx.user.id);
    }),

  // Test rule against code
  test: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return testCustomRule(input.ruleId, input.code);
    }),

  // Apply rule to repository
  applyToRepository: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        repositoryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return applyRuleToRepository(input.ruleId, input.repositoryId, ctx.user.id);
    }),

  // Remove rule from repository
  removeFromRepository: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        repositoryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return removeRuleFromRepository(input.ruleId, input.repositoryId, ctx.user.id);
    }),
});
