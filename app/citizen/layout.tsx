import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute allowedRoles={['CITIZEN', 'AUTHORITY']}>{children}</ProtectedRoute>;
}
