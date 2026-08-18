import { auth } from "@/lib/auth";
import { apiError, forbidden, unauthorized } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import type { Session } from "next-auth";

export type AppSession = Session;

/** Returns the session or an NextResponse error. Must be used inside route handlers. */
export async function requireSession(): Promise<
  { session: AppSession; error: null } | { session: null; error: ReturnType<typeof apiError> }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: unauthorized() };
  }
  await connectToDatabase();
  return { session, error: null };
}

export async function requireAdmin(): Promise<
  { session: AppSession; error: null } | { session: null; error: ReturnType<typeof apiError> }
> {
  const result = await requireSession();
  if (result.error) return result;
  if (result.session.user.role !== "ADMIN") {
    return { session: null, error: forbidden() };
  }
  return result;
}
