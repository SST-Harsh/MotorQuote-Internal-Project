"use client";

import DashboardLayout from "../../components/dashboard/(ReusableDashboardComponents)/DashboardLayout";
import { LayoutDashboard, Users, Building2, Settings, FileText, Bell, Megaphone, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function SuperAdminLayout({ children }) {
    const { user } = useAuth();

    const sidebarSections = [
        {
            title: 'System',
            items: [
                { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/super-admin/dashboard' },
                { label: 'Audit Logs', icon: <FileText size={20} />, href: '/super-admin/audit' },
                {
                    label: 'Notification Center', icon: <Bell size={20} />,
                    subItems: [
                        { label: 'Broadcasting Messages', icon: <Megaphone size={18} />, href: '/super-admin/notifications' },
                        { label: 'Email Notification', icon: <Mail size={18} />, href: '/super-admin/notifications/email' }
                    ]
                },
            ],
        },
        {
            title: 'Management',
            items: [
                { label: 'Global Users', icon: <Users size={20} />, href: '/super-admin/users' },
                { label: 'All Dealerships', icon: <Building2 size={20} />, href: '/super-admin/dealerships' },
                { label: 'Global Settings', icon: <Settings size={20} />, href: '/super-admin/settings' },
            ],
        },
    ];

    const displayUser = user ? {
        name: user.name || 'Super Admin',
        role: user.role || 'Super Admin',
        avatar: user.avatar || 'https://i.pravatar.cc/80?img=33'
    } : {
        name: 'Super Admin',
        role: 'Super Admin',
        avatar: 'https://i.pravatar.cc/80?img=33'
    };

    return (
        <DashboardLayout sidebarSections={sidebarSections} user={displayUser}>
            {children}
        </DashboardLayout>
    );
}
