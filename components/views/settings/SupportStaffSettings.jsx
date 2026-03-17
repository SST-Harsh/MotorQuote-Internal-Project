'use client';
import React from 'react';
import AppearanceSettings from '../../settings/AppearanceSettings';
import ProfileSettings from '../../settings/ProfileSettings';
import ChangePasswordSettings from '../../settings/ChangePasswordSettings';
import UserPreferences from '../../settings/UserPreferences';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';

export default function SupportStaffSettings() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, appearance and account security."
      />

      <div className="space-y-8">
        <AppearanceSettings />
        <ProfileSettings user={user} />
        <ChangePasswordSettings />
        <UserPreferences />
      </div>
    </div>
  );
}
