import { z } from "zod";
import { createTRPCRouter } from "../init";
import { protectedProcedure } from "../procedures/protected";
import {
  scanForSecrets,
  getScanResults,
  getRepositoryScans,
  getScanStatistics,
} from "@/lib/services/secret-scanning-service";
import {
  scanDependencies,
  getVulnerabilityScan,
  getRepositoryVulnerabilityScans,
  getVulnerabilityStatistics,
  checkPackageVulnerability,
} from "@/lib/services/vulnerability-scanning-service";
import {
  addIPToAllowlist,
  removeIPFromAllowlist,
  getOrganizationIPAllowlist,
  isIPAllowed,
  createRetentionPolicy,
  updateRetentionPolicy,
  getOrganizationRetentionPolicies,
  applyRetentionPolicies,
  registerEncryptionKey,
  rotateEncryptionKey,
  getOrganizationEncryptionKeys,
  getActiveEncryptionKey,
} from "@/lib/services/security-service";

/**
 * Security Router
 * Epic 3.3: Security & Compliance
 */

export const securityRouter = createTRPCRouter({
  // ═══════════════════════════════════════════════════════════
  // Secret Scanning (SC-004)
  // ═══════════════════════════════════════════════════════════

  scanSecrets: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
        commitSha: z.string(),
        files: z.array(
          z.object({
            path: z.string(),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return scanForSecrets(input);
    }),

  getSecretScan: protectedProcedure
    .input(z.object({ scanId: z.string() }))
    .query(async ({ input }) => {
      return getScanResults(input.scanId);
    }),

  getRepositorySecretScans: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return getRepositoryScans(input.repositoryId, input.limit);
    }),

  getSecretScanStats: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ input }) => {
      return getScanStatistics(input.repositoryId);
    }),

  // ═══════════════════════════════════════════════════════════
  // Vulnerability Scanning (SC-005)
  // ═══════════════════════════════════════════════════════════

  scanVulnerabilities: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        commitSha: z.string(),
        dependencies: z.array(
          z.object({
            name: z.string(),
            version: z.string(),
            type: z.enum(['npm', 'pip', 'maven', 'nuget', 'go']),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return scanDependencies(input);
    }),

  getVulnerabilityScan: protectedProcedure
    .input(z.object({ scanId: z.string() }))
    .query(async ({ input }) => {
      return getVulnerabilityScan(input.scanId);
    }),

  getRepositoryVulnerabilityScans: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return getRepositoryVulnerabilityScans(input.repositoryId, input.limit);
    }),

  getVulnerabilityStats: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ input }) => {
      return getVulnerabilityStatistics(input.repositoryId);
    }),

  checkPackageVulnerability: protectedProcedure
    .input(
      z.object({
        packageName: z.string(),
        version: z.string(),
      })
    )
    .query(async ({ input }) => {
      return checkPackageVulnerability(input.packageName, input.version);
    }),

  // ═══════════════════════════════════════════════════════════
  // IP Allowlisting (SC-006)
  // ═══════════════════════════════════════════════════════════

  addIPToAllowlist: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        ipAddress: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return addIPToAllowlist({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  removeIPFromAllowlist: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return removeIPFromAllowlist(input.entryId, ctx.user.id);
    }),

  getIPAllowlist: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return getOrganizationIPAllowlist(input.organizationId);
    }),

  checkIPAllowed: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        ipAddress: z.string(),
      })
    )
    .query(async ({ input }) => {
      return isIPAllowed(input.organizationId, input.ipAddress);
    }),

  // ═══════════════════════════════════════════════════════════
  // Data Retention (SC-007)
  // ═══════════════════════════════════════════════════════════

  createRetentionPolicy: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        resourceType: z.enum(['reviews', 'audit_logs', 'usage_metrics']),
        retentionDays: z.number().min(1).max(3650),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createRetentionPolicy({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  updateRetentionPolicy: protectedProcedure
    .input(
      z.object({
        policyId: z.string(),
        retentionDays: z.number().min(1).max(3650),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateRetentionPolicy(
        input.policyId,
        input.retentionDays,
        ctx.user.id
      );
    }),

  getRetentionPolicies: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return getOrganizationRetentionPolicies(input.organizationId);
    }),

  applyRetentionPolicies: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ input }) => {
      return applyRetentionPolicies(input.organizationId);
    }),

  // ═══════════════════════════════════════════════════════════
  // Encryption Keys (SC-003)
  // ═══════════════════════════════════════════════════════════

  registerEncryptionKey: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        keyId: z.string(),
        keyType: z.enum(['kms', 'vault', 'local']),
        algorithm: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return registerEncryptionKey({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  rotateEncryptionKey: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return rotateEncryptionKey(input.keyId, ctx.user.id);
    }),

  getEncryptionKeys: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return getOrganizationEncryptionKeys(input.organizationId);
    }),

  getActiveEncryptionKey: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return getActiveEncryptionKey(input.organizationId);
    }),
});
