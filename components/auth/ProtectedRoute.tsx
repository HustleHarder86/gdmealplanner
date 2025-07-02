'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiresProfile?: boolean;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login',
  requiresProfile = false 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { firebaseUser, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!firebaseUser) {
        router.push(redirectTo);
        return;
      }

      // Requires complete profile but doesn't have one
      if (requiresProfile && userData && !userData.pregnancyProfile) {
        router.push('/auth/complete-profile');
        return;
      }
    }
  }, [firebaseUser, userData, loading, router, redirectTo, requiresProfile]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!firebaseUser) {
    return null;
  }

  // Requires profile but doesn't have one
  if (requiresProfile && userData && !userData.pregnancyProfile) {
    return null;
  }

  return <>{children}</>;
}