import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./prisma";
import { sendEmail } from "./email";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {  
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 64,
    autoSignIn: true,
    account: {
      accountLinking: {
        enabled: true,
      },
    },
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
    resetPasswordTokenExpiresIn: 60 * 60
  },
  
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 Days. This refers to how long a user stays logged in (in seconds). Can be configured.
  },
  socialProviders: { 
      google: { 
        clientId: process.env.GOOGLE_CLIENT_ID as string, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
      }, 
  }, 
  plugins: [nextCookies()],
});