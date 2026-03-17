'use client';
import StaffDetailView from '@/components/views/users/StaffDetailView';

export default function StaffDetailPage({ params }) {
  const { id } = params;
  return <StaffDetailView id={id} />;
}
