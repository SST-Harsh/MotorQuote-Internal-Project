'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

/**
 * Unauthorized Access Page
 * Shows when a user tries to access a route they don't have permissions for.
 */
export default function UnauthorizedPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-background))] p-4 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-500 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-[rgb(var(--color-surface))] backdrop-blur-xl border border-[rgb(var(--color-border))] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="p-8 md:p-12 text-center">
            {/* Icon */}
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 shadow-inner">
                <ShieldAlert size={48} strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-gray-400 border border-gray-100">
                <Lock size={20} />
              </div>
            </div>

            {/* Text */}
            <h1 className="text-4xl font-bold text-[rgb(var(--color-text))] mb-4 tracking-tight">
              Unauthorized Access
            </h1>
            <p className="text-lg text-[rgb(var(--color-text-muted))] mb-10 leading-relaxed font-medium">
              You don&apos;t have the necessary permissions to access this page. If you believe this
              is an error, please contact your administrator.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGoBack}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95 group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Go Back</span>
              </button>

              <button
                onClick={handleGoHome}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[rgb(var(--color-primary))] text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-[rgb(var(--color-primary-dark))] hover:shadow-primary/30 transition-all active:scale-95 group"
              >
                <Home size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50/50 p-6 border-t border-[rgb(var(--color-border))] text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Security Protocol 403 • MotorQuote ERP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
