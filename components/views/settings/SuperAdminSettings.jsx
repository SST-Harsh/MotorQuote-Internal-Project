'use client';
import React from 'react';
import AppearanceSettings from '../../settings/AppearanceSettings';
import ProfileSettings from '../../settings/ProfileSettings';
import SecuritySettings from '../../settings/SecuritySettings';
import ConfigurationSettings from '../../settings/ConfigurationSettings';
import GlobalSystemSettings from '../../settings/GlobalSystemSettings';
import UserPreferences from '../../settings/UserPreferences';
import { useAuth } from '@/context/AuthContext';
import OrganizationSettings from '@/components/settings/OrganizationSettings';
import PageHeader from '@/components/common/PageHeader';
// import userService from '@/services/userService';

export default function SuperAdminSettings() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <PageHeader
        title="Global Settings"
        subtitle="Manage system-wide configurations and security preferences."
      />

      <div className="space-y-8">
        <AppearanceSettings />
        <ProfileSettings user={user} />
        <SecuritySettings />
        <OrganizationSettings />
        <ConfigurationSettings />
        <UserPreferences />
        <GlobalSystemSettings />
      </div>
    </div>
  );
}
