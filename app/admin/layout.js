"use client";

import DashboardLayout from "../../components/dashboard/(ReusableDashboardComponents)/DashboardLayout";
import { LayoutDashboard, Building2, FileText, ClipboardCheck, Users, UserCog, Settings, Edit2, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useMemo } from "react";
export default function AdminLayout({ children }) {
    const { user } = useAuth();

    const sidebarSections = useMemo(() => [
        {
            title: 'Management',
            items: [
                { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin/dashboard' },
                { label: 'Dealerships', icon: <Building2 size={20} />, badge: 12, href: '/admin/dealerships' },
                { label: 'Quotes', icon: <FileText size={20} />, badge: 58, href: '/admin/quotes' },
                { label: 'Approvals', icon: <ClipboardCheck size={20} />, badge: 7, href: '/admin/approvals' },
            ],
        },
        {
            title: 'Users',
            items: [
                { label: 'Managers', icon: <Users size={20} />, href: '/admin/managers' },
                { label: 'Sellers', icon: <UserCog size={20} />, href: '/admin/sellers' },
                { label: 'Roles & Permissions', icon: <Edit2 size={20} />, href: '/admin/roles' },
                { label: 'Notifications', icon: <Bell size={20} />, href: '/admin/notifications' },
                { label: 'Settings', icon: <Settings size={20} />, href: '/admin/settings' },
            ],
        },
    ], []);

    const displayUser = user ? {
        name: user.name,
        role: user.role,
        avatar: user.avatar || 'https://i.pravatar.cc/80?img=33'
    } : null;

    return (
        <DashboardLayout sidebarSections={sidebarSections} user={displayUser}>
            {children}
        </DashboardLayout>
    );
}
