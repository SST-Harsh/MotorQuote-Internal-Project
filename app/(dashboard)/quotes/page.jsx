'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminQuotes = dynamic(() => import('@/components/views/quotes/SuperAdminQuotes'));
const DealerQuote = dynamic(() => import('@/components/views/quotes/DealerQuote'));
const SupportStaffQuotes = dynamic(() => import('@/components/views/quotes/SupportStaffQuotes'));

export default function QuotesPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in to view quotes.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminQuotes />;
    case 'dealer':
    case 'dealer_manager':
    case 'dealer_admin':
      return <DealerQuote />;
    case 'support_staff':
      return <SupportStaffQuotes />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
