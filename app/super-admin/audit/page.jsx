'use client';
import React, { useState, useEffect } from 'react';
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import DataTable from "../../../components/dashboard/(ReusableDashboardComponents)/DataTable";
import DetailViewModal from "../../../components/dashboard/(ReusableDashboardComponents)/DetailViewModal";
import FilterDrawer from "../../../components/dashboard/(ReusableDashboardComponents)/FilterDrawer";
import { ShieldAlert, Lock, DollarSign, Download, AlertTriangle, CheckCircle, Search, Filter, Eye, Calendar, SlidersHorizontal, User } from "lucide-react";

export default function AuditLogPage() {
    const [allLogs, setAllLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [stats, setStats] = useState({ critical: 0, failedLogins: 0, exports: 0 });
    const [viewingLog, setViewingLog] = useState(null);

    // Filters
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [filters, setFilters] = useState({ severity: 'all', category: 'all', user: 'all' });

    // Load Logs
    useEffect(() => {
        let storedLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');

        if (storedLogs.length === 0) {
            storedLogs = [
                { id: 'LOG-1001', action: 'Login Failed', user: 'Mike Seller', role: 'Seller', category: 'Auth', severity: 'Critical', details: '5 failed attempts from IP 192.168.1.50', timestamp: 'Just now' },
                { id: 'LOG-1002', action: 'Bulk Data Export', user: 'Sarah Manager', role: 'Manager', category: 'Data', severity: 'Warning', details: 'Downloaded "All Customers" CSV', timestamp: '10 mins ago' },
                { id: 'LOG-1003', action: 'Price Override', user: 'Mike Seller', role: 'Seller', category: 'Finance', severity: 'Warning', details: 'Changed Quote #Q-992 price by -15%', timestamp: '1 hour ago' },
                { id: 'LOG-1004', action: 'System Config Change', user: 'Super Admin', role: 'Super Admin', category: 'System', severity: 'Info', details: 'Updated global retention policy', timestamp: '2 hours ago' },
                { id: 'LOG-1005', action: 'Login Success', user: 'Sarah Manager', role: 'Manager', category: 'Auth', severity: 'Info', details: 'Login from new device (MacBook Pro)', timestamp: '3 hours ago' }
            ];
            localStorage.setItem('audit_logs', JSON.stringify(storedLogs));
        }

        setAllLogs(storedLogs);
        setFilteredLogs(storedLogs);

      
        setStats({
            critical: storedLogs.filter(l => l.severity === 'Critical').length,
            failedLogins: storedLogs.filter(l => l.action.includes('Login Failed')).length,
            exports: storedLogs.filter(l => l.action.includes('Export')).length
        });
    }, []);

    useEffect(() => {
        let result = allLogs;
        if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            result = result.filter(log => new Date(log.timestamp) >= startDate);
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            result = result.filter(log => new Date(log.timestamp) <= endDate);
        }

        // Dropdown Filters
        if (filters.severity !== 'all') {
            result = result.filter(log => log.severity === filters.severity);
        }
        if (filters.category !== 'all') {
            result = result.filter(log => log.category === filters.category);
        }
        if (filters.user !== 'all') {
            result = result.filter(log => log.user === filters.user);
        }

        setFilteredLogs(result);
    }, [dateRange, filters, allLogs]);

    const resetFilters = () => {
        setDateRange({ start: '', end: '' });
        setFilters({ severity: 'all', category: 'all', user: 'all' });
    };

    const getSeverityBadge = (severity) => {
        const styles = {
            'Critical': 'bg-red-50 text-red-700 border-red-200',
            'Warning': 'bg-amber-50 text-amber-700 border-amber-200',
            'Info': 'bg-blue-50 text-blue-700 border-blue-200'
        };
        return (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[severity] || 'bg-gray-100'}`}>
                {severity}
            </span>
        );
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Auth': return <Lock size={14} className="text-purple-600" />;
            case 'Finance': return <DollarSign size={14} className="text-emerald-600" />;
            case 'Data': return <Download size={14} className="text-orange-600" />;
            default: return <AlertTriangle size={14} className="text-gray-500" />;
        }
    };

    return (
        <ProtectedRoute roles={["super_admin"]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">System Audit Log</h1>
                    <p className="text-[rgb(var(--color-text-muted))] text-sm">Track security events, data access, and critical system changes.</p>
                </div>

                {/* Risk Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[rgb(var(--color-surface))] p-4 rounded-xl border border-[rgb(var(--color-border))] shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-[rgb(var(--color-surface))] rounded-lg text-red-600">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Critical Alerts (24h)</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.critical}</p>
                        </div>
                    </div>
                    <div className="bg-[rgb(var(--color-surface))] p-4 rounded-xl border border-[rgb(var(--color-border))] shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-[rgb(var(--color-surface))] rounded-lg text-yellow-600">
                            <Lock size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-[rgb(var(--color-text-muted))] uppercase font-bold">Failed Logins</p>
                            <p className="text-2xl font-bold text-[rgb(var(--color-text))]">{stats.failedLogins}</p>
                        </div>
                    </div>
                    <div className="bg-[rgb(var(--color-surface))] p-4 rounded-xl border border-[rgb(var(--color-border))] shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-[rgb(var(--color-surface))] rounded-lg text-blue-400">
                            <Download size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-[rgb(var(--color-text-muted))] uppercase font-bold">Data Exports</p>
                            <p className="text-2xl font-bold text-[rgb(var(--color-text))]">{stats.exports}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Drawer */}
                <FilterDrawer
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    onReset={resetFilters}
                    onApply={() => setIsFilterOpen(false)}
                >
                    <div className="space-y-6">
                        {/* Date Range */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
                                <Calendar size={16} /> Date Range
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-[rgb(var(--color-text-muted))]">Start Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[rgb(var(--color-text-muted))]">End Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* User Filter */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
                                <User size={16} /> User
                            </h3>
                            <select
                                value={filters.user}
                                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] outline-none"
                            >
                                <option value="all">All Users</option>
                                {[...new Set(allLogs.map(l => l.user))].map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
                                <ShieldAlert size={16} /> Severity
                            </h3>
                            <select
                                value={filters.severity}
                                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] outline-none"
                            >
                                <option value="all">All Severities</option>
                                <option value="Critical">Critical</option>
                                <option value="Warning">Warning</option>
                                <option value="Info">Info</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
                                <Filter size={16} /> Category
                            </h3>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] outline-none"
                            >
                                <option value="all">All Categories</option>
                                <option value="Auth">Authentication</option>
                                <option value="Finance">Financial</option>
                                <option value="Data">Data Access</option>
                                <option value="System">System</option>
                            </select>
                        </div>
                    </div>
                </FilterDrawer>

                <DataTable
                    data={filteredLogs}
                    searchKeys={['action', 'user', 'details']}
                    filterOptions={[]}
                    extraControls={
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] font-medium rounded-xl hover:bg-[rgb(var(--color-surface))] transition-colors shadow-sm whitespace-nowrap"
                        >
                            <SlidersHorizontal size={18} />
                            Filters
                            {(filters.severity !== 'all' || filters.category !== 'all' || filters.user !== 'all' || dateRange.start || dateRange.end) && (
                                <span className="w-2 h-2 rounded-full bg-[rgb(var(--color-primary))]" />
                            )}
                        </button>
                    }
                    columns={[
                        {
                            header: 'User / Source',
                            accessor: (row) => (
                                <div>
                                    <p className="text-sm font-semibold text-[rgb(var(--color-text))]">{row.user}</p>
                                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{row.role}</p>
                                </div>
                            )
                        },
                        {
                            header: 'Event',
                            accessor: (row) => (
                                <div className="flex items-center gap-2">
                                    {getCategoryIcon(row.category)}
                                    <span className="font-medium text-[rgb(var(--color-text))]">{row.action}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Severity',
                            accessor: (row) => getSeverityBadge(row.severity)
                        },
                        { header: 'Details', accessor: 'details', className: 'text-sm text-[rgb(var(--color-text-muted))]' },
                        { header: 'Time', accessor: 'timestamp', className: 'text-xs text-[rgb(var(--color-text-muted))] whitespace-nowrap' },
                        {
                            header: 'Actions',
                            className: 'text-right',
                            accessor: (row) => (
                                <button
                                    onClick={() => setViewingLog(row)}
                                    className="p-1.5 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-info))/0.1] rounded-lg hover:text-[rgb(var(--color-info))]"
                                    title="View Details"
                                >
                                    <Eye size={16} />
                                </button>
                            )
                        },
                        
                    ]}
                     itemsPerPage={5}
                />

                {viewingLog && (
                    <DetailViewModal
                        isOpen={!!viewingLog}
                        onClose={() => setViewingLog(null)}
                        data={viewingLog}
                        title="Audit Log Detail"
                        sections={[
                            {
                                title: "Event Information",
                                icon: ShieldAlert,
                                fields: [
                                    { label: "Action", key: "action" },
                                    { label: "Category", key: "category" },
                                    { label: "Severity", key: "severity" },
                                    { label: "Timestamp", key: "timestamp" },
                                    { label: "Log ID", key: "id", copyable: true }
                                ]
                            },
                            {
                                title: "User & Security",
                                icon: Lock,
                                fields: [
                                    { label: "User", key: "user" },
                                    { label: "Role", key: "role" },
                                    { label: "Details", key: "details" }
                                ]
                            }
                        ]}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
