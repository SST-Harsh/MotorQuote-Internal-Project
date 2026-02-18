'use client';
import React from 'react';
import AppearanceSettings from '../../settings/AppearanceSettings';
import ProfileSettings from '../../settings/ProfileSettings';
import SecuritySettings from '../../settings/SecuritySettings';
import AdminContentSettings from '../../settings/AdminContentSettings';
import UserPreferences from '../../settings/UserPreferences';
import OrganizationSettings from '../../settings/OrganizationSettings';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';

export default function AdminSettings() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <PageHeader
        title="Admin Settings"
        subtitle="Manage Admin configurations and security preferences."
      />

      <div className="space-y-8">
        <AppearanceSettings />
        <ProfileSettings user={user} />
        <UserPreferences />
        <SecuritySettings />
        <OrganizationSettings />
        <AdminContentSettings />
      </div>
    </div>
  );
}
