'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const CreateEmailTemplateView = dynamic(
  () => import('@/components/views/super-admin/CreateEmailTemplateView')
);
const AdminEmailEditorView = dynamic(() => import('@/components/views/admin/AdminEmailEditorView'));

export default function CreateEmailTemplatePage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return <CreateEmailTemplateView />;
    case 'admin':
      return <AdminEmailEditorView />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied. This page is for Admins and Super Admins only.
        </div>
      );
  }
}
