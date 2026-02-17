'use client';
import React from 'react';
import AppearanceSettings from './AppearanceSettings';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import ConfigurationSettings from './ConfigurationSettings';
import GlobalSystemSettings from './GlobalSystemSettings';
import { useAuth } from '../../../context/AuthContext';

export default function SettingsView() {
  const { user } = useAuth();

  const userRole = user?.role?.toLowerCase() || 'visitor';

  const canAccessConfiguration = ['admin', 'super-admin', 'dealer'].includes(userRole);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Settings</h1>
        <p className="text-[rgb(var(--color-text))] text-sm">Manage your account and preferences</p>
      </div>

      {/* Sub-Components Stack */}
      <div className="space-y-8">
        <AppearanceSettings />

        <ProfileSettings user={user} />

        <SecuritySettings />

        {/* Conditional Rendering for Configuration */}
        {canAccessConfiguration && <ConfigurationSettings />}

        {/* Super Admin Global Config */}
        {userRole === 'super_admin' && <GlobalSystemSettings />}
      </div>
    </div>
  );
}
