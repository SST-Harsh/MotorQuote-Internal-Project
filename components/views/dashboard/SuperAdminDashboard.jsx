'use client';
import React from "react";
import Link from "next/link";
import ProtectedRoute from "../../common/ProtectedRoute";
import StatCard from "../../common/StatCard";
import DataTable from "../../common/DataTable";
import { Plus, Clock } from "lucide-react";

export default function SuperAdminDashboard() {

    const [stats, setStats] = React.useState([
        { title: 'Total Quotes', value: '0', helperText: 'All time', trend: { positive: true, label: '--' }, icon: '📄', accent: '#675AF0' },
        { title: 'Pending Approvals', value: '0', helperText: 'Require action', trend: { positive: false, label: '--' }, icon: '⏳', accent: '#FF7A00' },
        { title: 'Total Conversions', value: '0', helperText: 'Approved/Sold', trend: { positive: true, label: '--' }, icon: '✅', accent: '#1ABC9C' },
        { title: 'Total Dealerships', value: '0', helperText: 'Active partners', trend: { positive: true, label: '--' }, icon: '🏢', accent: '#FF3D71' },
    ]);

    React.useEffect(() => {
        const quotes = JSON.parse(localStorage.getItem('quotes_data') || '[]');
        const dealerships = JSON.parse(localStorage.getItem('dealerships') || '[]');
        const totalQuotes = quotes.length;
        const pending = quotes.filter(q => q.status === 'Pending').length;
        const conversions = quotes.filter(q => ['Approved', 'Sold'].includes(q.status)).length;
        const totalDealers = dealerships.length;

        setStats([
            {
                title: 'Total Quotes',
                value: totalQuotes.toString(),
                helperText: 'Submitted system-wide',
                trend: { positive: true, label: 'All time' },
                icon: '📄',
                accent: '#675AF0',
            },
            {
                title: 'Pending Approvals',
                value: pending.toString(),
                helperText: 'Waiting for dealer action',
                trend: { positive: false, label: 'Critical' },
                icon: '⏳',
                accent: '#FF7A00',
            },
            {
                title: 'Total Conversions',
                value: conversions.toString(),
                helperText: 'Approved quotes',
                trend: { positive: true, label: `${((conversions / (totalQuotes || 1)) * 100).toFixed(1)}% Rate` },
                icon: '✅',
                accent: '#1ABC9C',
            },
            {
                title: 'Total Dealerships',
                value: totalDealers.toString(),
                helperText: 'Active partners',
                trend: { positive: true, label: 'Platform' },
                icon: '🏢',
                accent: '#FF3D71',
            },
        ]);
    }, []);

    const auditLogs = [
        { id: 1, action: 'Quote Submitted', user: 'Dealer Manager A', timestamp: '5 mins ago', status: 'Success', detail: 'New quote #1055 created' },
        { id: 2, action: 'Price Updated', user: 'Dealer Manager B', timestamp: '20 mins ago', status: 'Success', detail: 'Updated price for Quote #1042' },
        { id: 3, action: 'Dealership Pending', user: 'System', timestamp: '1 hour ago', status: 'Warning', detail: 'New registration request: "City Motors"' },
        { id: 4, action: 'User Login', user: 'Support Staff', timestamp: '2 hours ago', status: 'Success', detail: 'Session started' },
    ];

    return (
        <ProtectedRoute roles={["super_admin"]}>
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Super Admin Overview</h1>
                        <p className="text-[rgb(var(--color-text-muted))] text-sm">System-wide monitoring and management</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.title} {...stat} />
                    ))}
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[rgb(var(--color-text))]">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/dealerships?action=add" className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-5 py-3 rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg shadow-[rgb(var(--color-primary)/0.3)] font-medium">
                            <Plus size={20} />
                            Add New Dealership
                        </Link>
                        <Link href="/quotes?status=Pending" className="flex items-center gap-2 bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] px-5 py-3 rounded-xl hover:bg-[rgb(var(--color-background))] transition-all font-medium">
                            <Clock size={20} className="text-[rgb(var(--color-warning))]" />
                            View Pending Quotes
                        </Link>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4">Activity Feed</h2>
                    <DataTable
                        data={auditLogs}
                        searchKeys={['action', 'user', 'detail']}
                        columns={[
                            { header: 'Action', accessor: 'action', sortable: true, className: 'font-medium' },
                            { header: 'User', accessor: 'user' },
                            { header: 'Detail', accessor: 'detail', className: 'text-[rgb(var(--color-text-muted))]' },
                            { header: 'Time', accessor: 'timestamp', className: 'text-sm' },
                            {
                                header: 'Status',
                                accessor: (row) => {
                                    const colors = {
                                        Success: 'text-[rgb(var(--color-success))] bg-[rgb(var(--color-success))/0.1]',
                                        Warning: 'text-[rgb(var(--color-warning))] bg-[rgb(var(--color-warning))/0.1]',
                                        Error: 'text-[rgb(var(--color-error))] bg-[rgb(var(--color-error))/0.1]',
                                    };
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[row.status] || ''}`}>
                                            {row.status}
                                        </span>
                                    )
                                }
                            }
                        ]}
                    />
                </div>
            </div>
        </ProtectedRoute>
    );
}
