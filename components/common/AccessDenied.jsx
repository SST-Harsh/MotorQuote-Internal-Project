'use client';

import React from 'react';
import { ShieldAlert, Home, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccessDenied({
  title = 'Access Denied',
  message = "You don't have access to this page, contact administrator for solution",
  showHome = true,
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center p-4 py-20 animate-fade-in">
      <div className="max-w-md w-full text-center space-y-8 bg-[rgb(var(--color-surface))] p-10 rounded-[2.5rem] border border-[rgb(var(--color-border))] shadow-xl relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[rgb(var(--color-error))]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[rgb(var(--color-primary))]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative inline-block">
          <div className="w-20 h-20 bg-[rgb(var(--color-error))]/10 rounded-2xl flex items-center justify-center text-[rgb(var(--color-error))] shadow-inner">
            <ShieldAlert size={40} strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[rgb(var(--color-surface))] rounded-xl shadow-md border border-[rgb(var(--color-border))] flex items-center justify-center text-[rgb(var(--color-text-muted))]">
            <Lock size={16} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))] tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-[rgb(var(--color-text-muted))] leading-relaxed font-medium px-4">
            {message}
          </p>
        </div>

        {showHome && (
          <div className="pt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[rgb(var(--color-primary))] text-white font-bold rounded-xl shadow-lg shadow-[rgb(var(--color-primary))]/20 hover:bg-[rgb(var(--color-primary-dark))] hover:shadow-[rgb(var(--color-primary))]/30 transition-all active:scale-95"
            >
              <Home size={18} />
              <span>Return Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
