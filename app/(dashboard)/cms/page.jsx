'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const ContentManagerView = dynamic(
  () => import('@/components/views/super-admin/ContentManagerView')
);
export default function CmsPage() {
  return (
    <>
      <ContentManagerView />
    </>
  );
}
