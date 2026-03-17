'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import SuspendedUsersView from '@/components/views/users/SuspendedUsersView';

export default function SuspendedUsersPage() {
  return (
    <ProtectedRoute roles={['super_admin']}>
      <SuspendedUsersView />
    </ProtectedRoute>
  );
}
