import { PrismaClient } from "../node_modules/prisma/prisma-client";

// Doing this ensures multiple instances of prismaClient does not create. Only problem in development
const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
}

const prisma = globalForPrisma.prisma || new PrismaClient();

if(process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


export default prisma;


