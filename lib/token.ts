import { db } from "@/db/drizzle";
import { getVerificationTokenByEmail } from "./verification-token";
import { verificationTokens } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const generateVerificationToken = async (email: string) => {
  const token = crypto.randomUUID();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);
  if (existingToken) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, existingToken.token)
        )
      );
  }

  const query = await db
    .insert(verificationTokens)
    .values({
      identifier: email,
      token,
      expires,
    })
    .returning({
      identifier: verificationTokens.identifier,
      token: verificationTokens.token,
      expires: verificationTokens.expires,
    });

  return query[0];
};
