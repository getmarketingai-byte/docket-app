import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
const isPublicAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Redirect authenticated users away from landing and auth pages
  if (userId && (request.nextUrl.pathname === '/' || isPublicAuthRoute(request))) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(
  req: Parameters<typeof clerkHandler>[0],
  event: Parameters<typeof clerkHandler>[1],
) {
  if (!process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
