import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ResponseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRoles={['RESPONSE', 'AUTHORITY']}>{children}</ProtectedRoute>;
}
