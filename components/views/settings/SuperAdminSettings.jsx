'use client';
import React from 'react';
import AppearanceSettings from '../../settings/AppearanceSettings';
import ProfileSettings from '../../settings/ProfileSettings';
import SecuritySettings from '../../settings/SecuritySettings';
import ChangePasswordSettings from '../../settings/ChangePasswordSettings';
import UserPreferences from '../../settings/UserPreferences';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';

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
        {/* <SecuritySettings /> */}
        <ChangePasswordSettings />
        <UserPreferences />
      </div>
    </div>
  );
}
