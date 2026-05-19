import { z } from 'zod';
import { createTRPCRouter } from '../init';
import { protectedProcedure } from '../procedures/protected';
import prisma from '@/lib/db';
import { canAccessRepository } from '@/lib/auth/rbac';
import { approvePullRequest, listPRFiles, mergePullRequest } from '@/lib/github/client';

export const reviewsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ input }) => {
      return prisma.review.findMany({
        where: { repositoryId: input.repositoryId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.review.findUnique({
        where: { id: input.id },
        include: {
          repository: true,
          feedback: true,
        },
      });
    }),

  getFiles: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .query(async ({ ctx, input }) => {
      const review = await prisma.review.findUnique({
        where: { id: input.reviewId },
        include: { repository: true },
      });

      if (!review) throw new Error('Review not found');

      const allowed = await canAccessRepository(ctx.user.id, review.repositoryId, 'read');
      if (!allowed) throw new Error('Forbidden');

      const fullName = review.repository.fullName;
      const [owner, repo] = fullName.split('/');
      const files = await listPRFiles(owner, repo, review.prNumber);

      return {
        files: files
          .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f.filename) && f.status !== 'removed')
          .map((f) => ({
            filename: f.filename,
            patch: f.patch,
            additions: f.additions,
            deletions: f.deletions,
            status: f.status,
          })),
      };
    }),

  approveOnGitHub: protectedProcedure
    .input(z.object({ reviewId: z.string(), body: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const review = await prisma.review.findUnique({
        where: { id: input.reviewId },
        include: { repository: true },
      });

      if (!review) throw new Error('Review not found');

      const allowed = await canAccessRepository(ctx.user.id, review.repositoryId, 'write');
      if (!allowed) throw new Error('Forbidden');

      const [owner, repo] = review.repository.fullName.split('/');
      await approvePullRequest(owner, repo, review.prNumber, input.body);
      return { success: true };
    }),

  mergeOnGitHub: protectedProcedure
    .input(z.object({ reviewId: z.string(), method: z.enum(['merge', 'squash', 'rebase']).optional() }))
    .mutation(async ({ ctx, input }) => {
      const review = await prisma.review.findUnique({
        where: { id: input.reviewId },
        include: { repository: true },
      });

      if (!review) throw new Error('Review not found');

      const allowed = await canAccessRepository(ctx.user.id, review.repositoryId, 'write');
      if (!allowed) throw new Error('Forbidden');

      const [owner, repo] = review.repository.fullName.split('/');
      await mergePullRequest(owner, repo, review.prNumber, { mergeMethod: input.method });
      return { success: true };
    }),

  stats: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ input }) => {
      const reviews = await prisma.review.findMany({
        where: { repositoryId: input.repositoryId },
        select: {
          score: true,
          issuesCount: true,
          criticalCount: true,
          warningCount: true,
          infoCount: true,
          status: true,
        },
      });

      const totalReviews = reviews.length;
      const avgIssues = totalReviews > 0 
        ? reviews.reduce((acc, r) => acc + r.issuesCount, 0) / totalReviews 
        : 0;
      const criticalTotal = reviews.reduce((acc, r) => acc + r.criticalCount, 0);

      return {
        totalReviews,
        avgIssues,
        criticalTotal,
        reviews,
      };
    }),
});

export type ReviewsRouter = typeof reviewsRouter;
