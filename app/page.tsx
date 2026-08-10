'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../src/store/use-auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, currentUser, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !currentUser) {
      router.replace('/login');
      return;
    }
    if (currentUser.role === 'ADMIN') {
      router.replace('/dashboard');
    } else {
      router.replace('/timesheet');
    }
  }, [isHydrated, isAuthenticated, currentUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-[13px] text-[#475569]">
      Loading workspace…
    </div>
  );
}
