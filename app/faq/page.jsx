'use client';
import React from 'react';
import FAQView from '@/components/common/FAQView';
import cmsService from '@/services/cmsService';

export default function FAQPage() {
  return <FAQView fetcher={cmsService.getFAQs} title="Frequently Asked Questions" />;
}
