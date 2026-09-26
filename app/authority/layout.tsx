import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRoles={['AUTHORITY']}>{children}</ProtectedRoute>;
}
