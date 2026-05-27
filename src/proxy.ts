import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/inngest(.*)',
  '/api/webhooks(.*)',
  '/shared/(.*)',
  '/api/shares/(.*)',
  '/offline(.*)',
]);

// Simple in-memory rate limiter (per-IP, resets on cold start — sufficient for serverless)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/receipts/upload': { max: 20, windowMs: 60_000 },
  '/api/receipts':        { max: 60, windowMs: 60_000 },
  '/api/exports':         { max: 10, windowMs: 60_000 },
  '/api/':               { max: 120, windowMs: 60_000 },
};

function getRateLimit(pathname: string) {
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) return limit;
  }
  return null;
}

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  if (entry.count > max) return false;
  return true;
}

let lastPurge = Date.now();
function maybePurge() {
  const now = Date.now();
  if (now - lastPurge < 60_000) return;
  lastPurge = now;
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  maybePurge();

  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/')) {
    const limit = getRateLimit(pathname);
    if (limit) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        'unknown';
      const key = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`;
      const allowed = checkRateLimit(key, limit.max, limit.windowMs);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please slow down.' },
          { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Limit': String(limit.max) } },
        );
      }
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
