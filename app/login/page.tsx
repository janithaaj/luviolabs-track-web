'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../src/store/use-auth-store';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { LuvioLogo } from '../../src/components/common/LuvioLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser, isHydrated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSessionExpired(params.get('reason') === 'session');
    const next = params.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      setNextPath(next);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !currentUser) return;
    if (nextPath) {
      router.replace(nextPath);
      return;
    }
    if (currentUser.role === 'ADMIN') {
      router.replace('/dashboard');
    } else {
      router.replace('/timesheet');
    }
  }, [isHydrated, isAuthenticated, currentUser, router, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
      return;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F5FF] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <LuvioLogo variant="mark" size={72} className="mb-5" />
          <h1 className="font-title text-[28px] font-bold tracking-tight text-[#0C2A43]">
            luvio <span className="brand-gradient-text">track</span>
          </h1>
          <p className="mt-1.5 text-[13px] text-[#64748B]">
            Sign in to track time and manage your team
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          {sessionExpired && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
              Your session expired. Please sign in again.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-5 border-t border-[#F1F5F9] pt-4 text-[12px] text-[#475569]">
            <p className="text-[11px] text-[#64748B]">
              Sign in with your workspace account. Admins invite employees from Team after login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
