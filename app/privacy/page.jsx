'use client';
import React from 'react';
import PublicPolicyView from '@/components/common/PublicPolicyView';
import cmsService from '@/services/cmsService';

export default function PrivacyPage() {
  return <PublicPolicyView title="Privacy Policy" type="privacy" fetcher={cmsService.getPrivacy} />;
}
