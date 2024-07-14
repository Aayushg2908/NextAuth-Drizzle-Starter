import { db } from "@/db/drizzle";
import { verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getVerificationTokenByToken = async (token: string) => {
  try {
    const query = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token));
    const verification_token = query[0];

    return verification_token;
  } catch (error) {
    return null;
  }
};

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const query = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.identifier, email));
    const verificationToken = query[0];

    return verificationToken;
  } catch (error) {
    return null;
  }
};
