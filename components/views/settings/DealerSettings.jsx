'use client';
import React from 'react';
import AppearanceSettings from '../../settings/AppearanceSettings';
import ProfileSettings from '../../settings/ProfileSettings';
import SecuritySettings from '../../settings/SecuritySettings';
import HelpSettings from '../../settings/HelpSettings';
import UserPreferences from '../../settings/UserPreferences';

import { useAuth } from '@/context/AuthContext';
import DealerNotificationSettings from '../notifications/DealerNotificationSettings';
import DealershipInfoSettings from './DealershipInfoSettings';
import PageHeader from '@/components/common/PageHeader';

export default function DealerSettings() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <PageHeader
        title="Dealer Settings"
        subtitle="Manage your account preferences, security, and activity tracking."
      />

      <div className="space-y-8 animate-fade-in-up">
        <AppearanceSettings />
        <ProfileSettings user={user} />
        <UserPreferences />
        <SecuritySettings />
        <DealerNotificationSettings />
        <DealershipInfoSettings />
        <HelpSettings />
      </div>
    </div>
  );
}
