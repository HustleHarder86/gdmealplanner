import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin email whitelist
const ADMIN_EMAILS = [
  'admin@gdmealplanner.com',
  // Add more admin emails here
];

export function middleware(request: NextRequest) {
  // Only check admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // In development, allow access without authentication
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }

    // In production, implement proper authentication check
    // This is a placeholder - you should implement proper JWT verification
    // using Firebase Admin SDK or similar
    
    // For now, we'll just pass through
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};