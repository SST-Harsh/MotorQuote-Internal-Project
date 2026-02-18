'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminQuotes = dynamic(() => import('@/components/views/quotes/SuperAdminQuotes'));
const AdminQuotes = dynamic(() => import('@/components/views/quotes/AdminQuotes'));
const DealerQuote = dynamic(() => import('@/components/views/quotes/DealerQuote'));

export default function QuotesPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in to view quotes.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminQuotes />;
    case 'admin':
      return <AdminQuotes />;
    case 'dealer':
    case 'dealer_manager':
    case 'dealer_admin':
      return <DealerQuote />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
