import { baseProcedure } from '../init';
import { TRPCError } from '@trpc/server';

export const protectedProcedure = baseProcedure.use(({ ctx, next }: any) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
