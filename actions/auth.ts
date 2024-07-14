"use server";

import { signIn } from "@/auth";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { DEFAULT_REDIRECT } from "@/lib/constants";
import { LoginSchema, RegisterSchema } from "@/lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
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
