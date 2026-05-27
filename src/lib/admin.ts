import { auth } from '@clerk/nextjs/server';

/**
 * Returns true if the currently authenticated user is an admin.
 * Admin user IDs are set via the ADMIN_USER_IDS env var (comma-separated Clerk user IDs).
 */
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const adminIds = (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return adminIds.includes(userId);
}
