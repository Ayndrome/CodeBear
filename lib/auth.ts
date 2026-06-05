import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { dash } from "@better-auth/infra";
import prisma from "./db";
import { nextCookies } from "better-auth/next-js";

function normalizeBaseUrl(value: string) {
    return value.replace(/\/+$/, "");
}

function getAppBaseUrl() {
    const raw =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.BETTER_AUTH_URL ||
        "https://codebear.space";

    return normalizeBaseUrl(raw);
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    apiKey: process.env.BETTER_AUTH_API_KEY,
    baseURL: getAppBaseUrl(),
    
    trustedOrigins: [
        "http://localhost:3000",
        "https://codebear.space",
    ],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        autoSignIn: false, // Don't auto sign in after signup (require verification)
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // 5 minutes
        }
    },
    socialProviders: {
        github: {
            
            clientId: process.env.GITHUB_CLIENT_ID as string,
            // GitHub OAuth App secret is typically provided as GITHUB_CLIENT_SECRET
            clientSecret: (process.env.GITHUB_CLIENT_SECRET ||
                process.env.GITHUB_CLIENT_OAUTH_SECRET) as string,
            // Map to user info fields
            scope: ["user:email", "read:user"],

          
            
        }
    },
    // Default redirect after OAuth
    advanced: {
        
        useSecureCookies: false,
        trustedProxyHeaders: true,
        defaultCookieAttributes: {
            secure: false,
            sameSite: "lax",
            path: "/",
        }
    },
    account: {
            // skipStateCookieCheck: true,
        accountLinking: {
            enabled: true,
            trustedProviders: ["github"],
        }
    },
    
    plugins: [
        dash({
            apiKey: process.env.BETTER_AUTH_API_KEY,
            
        }),

        nextCookies(),

    ],
});
