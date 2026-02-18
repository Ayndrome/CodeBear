import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import { auth } from '@/lib/auth';
export const createTRPCContext = cache(async (opts: any) => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  const { req, resHeaders } = opts;
  
  // Get session from request
  const session = await auth.api.getSession({
    headers: new Headers(),
  });
  
  return {
    session,
    user: session?.user,
    headers: req.headers,
  };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;