'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('AUTHORITY' | 'CITIZEN' | 'RESPONSE')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Verifying Session & Security Context...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl mb-4 text-red-400">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">Access Restricted</h1>
        <p className="text-xs text-slate-400 mt-2 max-w-md">
          Your account role ({user.role}) does not have permission to view this section ({pathname}).
        </p>
        <button
          onClick={() => router.push(user.role === 'CITIZEN' ? '/citizen' : user.role === 'RESPONSE' ? '/response' : '/')}
          className="mt-6 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all"
        >
          Return to Authorized Portal
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
