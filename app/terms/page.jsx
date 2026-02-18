'use client';
import React from 'react';
import PublicPolicyView from '@/components/common/PublicPolicyView';
import cmsService from '@/services/cmsService';

export default function TermsPage() {
  return <PublicPolicyView title="Terms of Service" type="terms" fetcher={cmsService.getTerms} />;
}
