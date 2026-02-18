'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const SystemSettingsView = dynamic(
  () => import('@/components/views/super-admin/SystemSettingsView')
);

export default function CmsPage() {
  return (
    <>
      <SystemSettingsView />
    </>
  );
}
