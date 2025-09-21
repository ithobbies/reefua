
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is a Higher-Order Component (HOC)
const withAdminAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithAdminAuthComponent = (props: P) => {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          // If not logged in, redirect to login page
          router.replace('/login');
        } else if (!isAdmin) {
          // If logged in but not an admin, redirect to home page
          router.replace('/');
        }
      }
    }, [user, loading, isAdmin, router]);

    // While loading or if user is not an admin yet, show a full-screen loader
    if (loading || !isAdmin) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    // If user is an admin, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  WithAdminAuthComponent.displayName = `withAdminAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAdminAuthComponent;
};

export default withAdminAuth;
