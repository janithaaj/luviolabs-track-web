'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { LuvioLogoBadge } from '../../src/components/common/LuvioLogo';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <LuvioLogoBadge size={48} className="rounded-2xl shadow-xl shadow-[#9333EA]/30" iconSize={28} />
          <h1 className="text-2xl font-extrabold text-white">Reset Password</h1>
          <p className="text-xs text-slate-400">Enter your email to receive recovery instructions</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          {!submitted ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <Input label="Work Email" type="email" placeholder="user@luviolabs.com" required />
              <Button type="submit" variant="primary" className="w-full">
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm font-semibold text-emerald-400">Recovery email sent!</p>
              <p className="text-xs text-slate-400">Check your inbox for instructions to reset your password.</p>
            </div>
          )}

          <div className="pt-2 text-center">
            <Link href="/login" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
