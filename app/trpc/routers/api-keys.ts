import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import {
  createApiKey,
  getUserApiKeys,
  revokeApiKey,
  deleteApiKey,
  updateApiKeyScopes,
  getApiKeyStats,
} from "@/lib/services/apikey-service";
import { hasPermission, getUserRole } from "@/lib/auth/rbac";

/**
 * API Keys Router
 * Epic 3.1: E-006 API Key Management
 */

export const apiKeysRouter = createTRPCRouter({
  // Create new API key
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        scopes: z.array(z.string()).optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to manage API keys
      const role = await getUserRole(ctx.user.id);
      if (!hasPermission(role, 'manage_api_keys')) {
        throw new Error('Insufficient permissions to create API keys');
      }

      return createApiKey({
        userId: ctx.user.id,
        name: input.name,
        scopes: input.scopes,
        expiresAt: input.expiresAt,
      });
    }),

  // List user's API keys
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserApiKeys(ctx.user.id);
  }),

  // Revoke API key
  revoke: protectedProcedure
    .input(z.object({ apiKeyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return revokeApiKey(input.apiKeyId, ctx.user.id);
    }),

  // Delete API key
  delete: protectedProcedure
    .input(z.object({ apiKeyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return deleteApiKey(input.apiKeyId, ctx.user.id);
    }),

  // Update API key scopes
  updateScopes: protectedProcedure
    .input(
      z.object({
        apiKeyId: z.string(),
        scopes: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateApiKeyScopes(
        input.apiKeyId,
        ctx.user.id,
        input.scopes
      );
    }),

  // Get API key statistics
  stats: protectedProcedure.query(async ({ ctx }) => {
    return getApiKeyStats(ctx.user.id);
  }),
});
