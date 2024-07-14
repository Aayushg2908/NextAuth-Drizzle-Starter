"use server";

import { signIn } from "@/auth";
import { db } from "@/db/drizzle";
import { users, verificationTokens } from "@/db/schema";
import { DEFAULT_REDIRECT } from "@/lib/constants";
import { sendVerificationEmail } from "@/lib/mail";
import { LoginSchema, RegisterSchema } from "@/lib/schema";
import { generateVerificationToken } from "@/lib/token";
import { getVerificationTokenByToken } from "@/lib/verification-token";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";

export const signUp = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, name, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = await db.select().from(users).where(eq(users.email, email));
  const existingUser = query[0];
  if (existingUser) {
    return { error: "Email already in use!" };
  }

  await db.insert(users).values({
    email,
    name,
    password: hashedPassword,
  });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(
    verificationToken.identifier,
    verificationToken.token
  );

  return { success: "Confirmation Email Sent!" };
};

export const SignIn = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  const query = await db.select().from(users).where(eq(users.email, email));
  const existingUser = query[0];
  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist!" };
  }

  if (!existingUser.emailVerified) {
    const verification_token = await generateVerificationToken(
      existingUser.email
    );
    await sendVerificationEmail(
      verification_token.identifier,
      verification_token.token
    );

    return { success: "Confirmation Email Sent!" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};

export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);
  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const query = await db
    .select()
    .from(users)
    .where(eq(users.email, existingToken.identifier));
  const existingUser = query[0];
  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  await db
    .update(users)
    .set({
      email: existingToken.identifier,
      emailVerified: new Date(),
    })
    .where(eq(users.id, existingUser.id));

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, existingToken.identifier),
        eq(verificationTokens.token, token)
      )
    );

  return { success: "Email verified!" };
};
