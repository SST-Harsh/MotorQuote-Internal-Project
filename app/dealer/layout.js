"use client";
import React from 'react';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import DashboardLayout from '../../components/dashboard/(ReusableDashboardComponents)/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, MessageSquare, BookOpen, Users } from 'lucide-react';

export default function DealerLayout({ children }) {
    const { user } = useAuth();

    const sidebarSections = [
        {
            title: 'Menu',
            items: [
                { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dealer/dashboard' },
                { label: 'My Quotes', icon: <MessageSquare size={20} />, href: '/dealer/quotes' },
                { label: 'Inventory', icon: <BookOpen size={20} />, href: '/dealer/inventory' },
            ],
        },
        {
            title: 'Account',
            items: [
                { label: 'Settings', icon: <Users size={20} />, href: '/dealer/settings' },
            ],
        },
    ];

    const displayUser = user ? {
        name: user.name || 'Dealer Agent',
        role: user.role || 'Dealer Staff',
        avatar: user.avatar || 'https://i.pravatar.cc/80?img=47'
    } : {
        name: 'Dealer Agent',
        role: 'Dealer Staff',
        avatar: 'https://i.pravatar.cc/80?img=47'
    };

    return (
        <ProtectedRoute roles={['dealer']}>
            <DashboardLayout user={displayUser} sidebarSections={sidebarSections} title="Dealer Portal">
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
