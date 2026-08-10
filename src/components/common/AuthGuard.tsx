'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/use-auth-store';
import { apiStorage } from '../../services/api-client';
import { Role } from '../../types';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Required role to view this area */
  allowedRoles: Role[];
}

/**
 * Client-side route guard for admin vs employee areas.
 * Redirects unauthenticated users to /login.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const router = useRouter();
  const { isAuthenticated, currentUser, isHydrated, logout } = useAuthStore();
  const [hasSessionToken, setHasSessionToken] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    const token = apiStorage.getToken();
    setHasSessionToken(!!token);

    if (!isAuthenticated || !currentUser || !token) {
      if (isAuthenticated) logout();
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(currentUser.role)) {
      if (currentUser.role === 'ADMIN') {
        router.replace('/dashboard');
      } else {
        router.replace('/timesheet');
      }
    }
  }, [isHydrated, isAuthenticated, currentUser, allowedRoles, router, logout]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[13px] text-[#475569]">
        Loading…
      </div>
    );
  }

  if (
    !isAuthenticated ||
    !currentUser ||
    !hasSessionToken ||
    !allowedRoles.includes(currentUser.role)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[13px] text-[#475569]">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
};
