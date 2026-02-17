"use client";
import React from 'react';
import { useAuth } from "../../../context/AuthContext";
import AdminDashboard from "../../../components/views/dashboard/AdminDashboard";
import DealerDashboard from "../../../components/views/dashboard/DealerDashboard";
import SuperAdminDashboard from "../../../components/views/dashboard/SuperAdminDashboard";
import Loader from "../../../components/common/Loader";

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) {
        return <Loader />;
    }

    if (user.role === 'super_admin') {
        return <SuperAdminDashboard />;
    }

    if (user.role === 'admin') {
        return <AdminDashboard />;
    }

    if (user.role === 'dealer') {
        return <DealerDashboard />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Redirecting or Access Denied...</p>
        </div>
    );
}
