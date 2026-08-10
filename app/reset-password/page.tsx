'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { LuvioLogoBadge } from '../../src/components/common/LuvioLogo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <LuvioLogoBadge size={48} className="rounded-2xl shadow-xl shadow-[#9333EA]/30" iconSize={28} />
          <h1 className="text-2xl font-extrabold text-white">Create New Password</h1>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          {!success ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSuccess(true);
              }}
              className="space-y-4"
            >
              <Input label="New Password" type="password" required />
              <Input label="Confirm New Password" type="password" required />
              <Button type="submit" variant="primary" className="w-full">
                Update Password
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm font-semibold text-emerald-400">Password updated successfully!</p>
              <Button variant="primary" className="w-full" onClick={() => router.push('/login')}>
                Go to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
