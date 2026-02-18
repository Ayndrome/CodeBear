import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { protectedProcedure } from '../procedures/protected';
import { auth } from '@/lib/auth';
import { TRPCError } from '@trpc/server';
import prisma from '@/lib/db';

export const authRouter = createTRPCRouter({
  checkEmail: baseProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }: any) => {
      const { email } = input;
      
      try {
        
        const user = await prisma.user.findUnique({
          where: { email },
        });

        return {
          exists: !!user,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check email',
        });
      }
    }),

  signUp: baseProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2).max(50),
      })
    )
    .mutation(async ({ input }: any) => {
      const { email, password, name } = input;
      
      try {
        // Use Better Auth server API - correct method name is signUpEmail
        const user = await auth.api.signUpEmail({
          body: {
            email,
            password,
            name,
          },
        });

        return {
          success: true,
          user: {
            id: user.user.id,
            email: user.user.email,
            name: user.user.name,
          },
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to sign up',
        });
      }
    }),

  signIn: baseProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }: any) => {
      const { email, password } = input;
      
      try {
        // Use Better Auth server API - correct method name is signInEmail
        const session = await auth.api.signInEmail({
          body: {
            email,
            password,
          },
        });

        return {
          success: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          },
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message || 'Invalid credentials',
        });
      }
    }),

  signOut: protectedProcedure
    .mutation(async ({ ctx }: any) => {
      await auth.api.signOut({
        headers: ctx.headers,
      });

      return { success: true };
    }),

    me: protectedProcedure
    .query(async ({ ctx }: any) => {
      // Use session from context (already fetched in init.ts)
      if (!ctx.user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        user: {
          id: ctx.user.id,
          email: ctx.user.email,
          name: ctx.user.name,
          image: ctx.user.image,
          tier: 'free', // Default tier
          lastLoginAt: new Date().toISOString(), // TODO: Get from profile
        },
      };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const { currentPassword, newPassword } = input;

      try {
        // Use Better Auth server API - correct method name is changePassword
        await auth.api.changePassword({
          body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
          },
          headers: ctx.headers,
        });

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to change password',
        });
      }
    }),
});

export type AuthRouter = typeof authRouter;
