"use client";
import React from 'react';
import SettingsView from '../../../components/dashboard/(ReusableDashboard Pages)/pages/SettingsView';
import { LayoutDashboard, MessageSquare, BookOpen, Users } from 'lucide-react';

export default function DealerSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Account Settings</h1>
                <p className="text-[rgb(var(--color-text-muted))]">Manage your profile and preferences.</p>
            </div>
            <SettingsView />
        </div>
    );
}
