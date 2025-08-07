'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

/**
 * This page now serves as a redirector to the default dashboard page.
 * If the user is logged in, it redirects to '/dashboard/lots'.
 * If not, it can show a loading message or redirect to login.
 */
export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait until the authentication state is determined
    if (!loading) {
      if (user) {
        // If user is authenticated, redirect to the main functional page
        router.replace('/dashboard/lots');
      } else {
        // If not authenticated, you might want to redirect to a login page
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Display a loading state while checking auth and redirecting
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Завантаження панелі керування...</p>
    </div>
  );
}
