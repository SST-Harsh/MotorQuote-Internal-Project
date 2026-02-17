"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from "../../common/ProtectedRoute";
import ActivityFeed from '../../common/ActivityTimeline';
import DataTable from '../../common/DataTable';
import QuickActionsPanel from '../../common/QuickActionsPanel';
import StatCard from '../../common/StatCard';
import { Building2, FileText, ClipboardCheck, Users, UserCog, Settings, MapPin, Eye, Edit2, Trash2, Phone, Mail } from "lucide-react";
import GenericFormModal from '../../common/FormModal';
import Swal from 'sweetalert2';
import * as yup from 'yup';

const dealershipSchema = yup.object().shape({
    name: yup.string().required('Required'),
    location: yup.string().required('Required'),
    manager: yup.string().required('Required'),
});

const managerSchema = yup.object().shape({
    name: yup.string().required('Required'),
    email: yup.string().email('Invalid email').required('Required'),
    role: yup.string().required('Required'),
});

export default function AdminDashboard() {
    const [isAddDealershipOpen, setIsAddDealershipOpen] = useState(false);
    const [isAddManagerOpen, setISAddManagerOpen] = useState(false);
    const router = useRouter();

    const [managerOptions, setManagerOptions] = useState([]);

    useEffect(() => {
        const storedManagers = localStorage.getItem('managers_data');
        if (storedManagers) {
            try {
                const managers = JSON.parse(storedManagers);
                setManagerOptions(managers.map(m => ({ value: m.name, label: m.name })));
            } catch (e) { console.error("Failed to parse managers", e); }
        } else {
            setManagerOptions([{ value: 'John Doe', label: 'John Doe' }]);
        }
    }, [isAddDealershipOpen]);

    const stats = [
        {
            title: 'Total Dealerships',
            value: '248',
            helperText: '+24 new this month',
            trend: { positive: true, label: '9.3%' },
            icon: '🏢',
            accent: '#675AF0',
        },
        {
            title: 'Total Quotes',
            value: '1,847',
            helperText: '+156 this week',
            trend: { positive: true, label: '4.1%' },
            icon: '📊',
            accent: '#FF7A00',
        },
        {
            title: 'Pending Approvals',
            value: '142',
            helperText: 'Require urgent action',
            trend: { positive: false, label: '2.3%' },
            icon: '⏳',
            accent: '#1ABC9C',
        },
        {
            title: 'Conversion Rate',
            value: '68.4%',
            helperText: 'Above industry avg. (52%)',
            trend: { positive: true, label: '1.8%' },
            icon: '📈',
            accent: '#FF3D71',
        },
    ];

    const activity = [
        {
            id: 'act-1',
            name: 'Dealer Auto Drive',
            action: 'added new quote',
            subject: '#104',
            time: '2 minutes ago',
            avatar: 'https://i.pravatar.cc/80?img=5',
        },
        {
            id: 'act-2',
            name: 'Manager John Smith',
            action: 'approved quote',
            subject: '#98',
            time: '15 minutes ago',
            avatar: 'https://i.pravatar.cc/80?img=7',
        },
        {
            id: 'act-3',
            name: 'User Sarah Johnson',
            action: 'submitted a new quote request',
            subject: '#101',
            time: '32 minutes ago',
            avatar: 'https://i.pravatar.cc/80?img=10',
        },
    ];

    const quickActions = [
        {
            label: 'Add Dealership',
            description: 'Create a new partner account',
            icon: '➕',
            actionType: () => setIsAddDealershipOpen(true)
        },
        { label: 'View Pending Quotes', description: 'See all quotes awaiting approval', icon: '📥', actionType: () => router.push('/quotes') },
        { label: 'Generate Report', description: 'Download latest performance report', icon: '📑' },
        { label: 'Add Manager', description: 'Invite a new team member', icon: '👤', actionType: () => { setISAddManagerOpen(true) } },
    ];

    const initialDealerships = [
        {
            id: 'dealer-1',
            name: 'Premium Motors',
            location: 'Mumbai, Maharashtra',
            manager: 'John Doe',
            quotes: 142,
            conversion: 72,
            status: 'active',
            statusLabel: 'Active',
        },
        {
            id: 'dealer-2',
            name: 'Elite Auto Hub',
            location: 'Bangalore, Karnataka',
            manager: 'Priya Malhotra',
            quotes: 98,
            conversion: 63,
            status: 'pending',
            statusLabel: 'Pending Review',
        },
        {
            id: 'dealer-3',
            name: 'Velocity Motors',
            location: 'Delhi NCR',
            manager: 'Amit Desai',
            quotes: 120,
            conversion: 69,
            status: 'active',
            statusLabel: 'Active',
        },
        {
            id: 'dealer-4',
            name: 'Cityline Cars',
            location: 'Pune, Maharashtra',
            manager: 'Sneha Kapoor',
            quotes: 74,
            conversion: 58,
            status: 'inactive',
            statusLabel: 'On Hold',
        },
    ];

    const handleSaveDealership = (data) => {
        try {
            const currentData = JSON.parse(localStorage.getItem('dealerships') || '[]');
            const newDealer = {
                ...data,
                id: `dealer-${Date.now()}`,
                quotes: 0,
                conversion: 0,
                status: data.status || 'active'
            };
            const updatedData = [newDealer, ...currentData];
            localStorage.setItem('dealerships', JSON.stringify(updatedData));
            setIsAddDealershipOpen(false);
            Swal.fire('Saved!', 'New Partner added successfully', 'success');
        } catch (error) {
            console.error("Error saving dealership:", error);
            Swal.fire('Error', 'Failed to save dealership', 'error');
        }
    };

    const handleSaveManager = (data) => {
        try {
            const currentManagers = JSON.parse(localStorage.getItem('managers_data') || '[]');
            const newManager = {
                ...data,
                id: `m-${Date.now()}`,
                status: 'active',
                joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            };
            const updatedManagers = [newManager, ...currentManagers];
            localStorage.setItem('managers_data', JSON.stringify(updatedManagers));
            setISAddManagerOpen(false);
            Swal.fire('Invited!', 'New Manager invited successfully', 'success');
            setManagerOptions(updatedManagers.map(m => ({ value: m.name, label: m.name })));
        } catch (error) {
            console.error("Error saving manager:", error);
            Swal.fire('Error', 'Failed to save manager', 'error');
        }
    };

    return (
        <ProtectedRoute roles={["admin", "super_admin"]}>
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.title} {...stat} />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <ActivityFeed items={activity} />
                    </div>
                    <QuickActionsPanel actions={quickActions} />
                </div>
                <DataTable
                    data={initialDealerships}
                    columns={[
                        {
                            header: "Dealership",
                            sortable: true,
                            accessor: (row) => (
                                <div>
                                    <div className="font-semibold text-[rgb(var(--color-text))]">{row.name}</div>
                                    <div className="flex items-center gap-1 text-[rgb(var(--color-text-muted))] text-xs">
                                        <MapPin size={12} /> {row.location}
                                    </div>
                                </div>
                            )
                        },
                        { header: "Manager", accessor: "manager", className: "text-[rgb(var(--color-text-muted))]" },
                        {
                            header: "Status",
                            accessor: (row) => {
                                const statusColors = {
                                    active: 'bg-[rgb(var(--color-success))/0.1] text-[rgb(var(--color-success))] border-[rgb(var(--color-success))/0.2]',
                                    inactive: 'bg-[rgb(var(--color-text-muted))/0.1] text-[rgb(var(--color-text-muted))] border-[rgb(var(--color-text-muted))/0.2]',
                                    suspended: 'bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] border-[rgb(var(--color-error))/0.2]',
                                    pending: 'bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))/0.2]'
                                };
                                return (
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${statusColors[row.status] || statusColors.active}`}>
                                        {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Active'}
                                    </span>
                                );
                            },
                        },
                        {
                            header: "Performance",
                            accessor: (row) => (
                                <div className="text-xs">
                                    <span className="text-[rgb(var(--color-text))] font-medium">{row.quotes} Quotes</span>
                                    <span className="text-[rgb(var(--color-text-muted))] mx-1">•</span>
                                    <span className="text-[rgb(var(--color-success))]">{row.conversion}% Conv.</span>
                                </div>
                            )
                        }
                    ]}
                    searchKeys={['name', 'location', 'manager']}
                />
                <GenericFormModal
                    isOpen={isAddDealershipOpen}
                    onClose={() => setIsAddDealershipOpen(false)}
                    onSave={handleSaveDealership}
                    title="Add Dealership"
                    validationSchema={dealershipSchema}
                    fields={[
                        { name: 'name', label: 'Dealership Name', placeholder: 'e.g. Premium Motors', icon: Building2 },
                        { name: 'location', label: 'Location', placeholder: 'City, State', icon: MapPin },
                        {
                            type: 'row',
                            fields: [
                                { name: 'manager', label: 'Manager Name', type: 'select', options: managerOptions, placeholder: 'Select Manager', icon: Users },
                                { name: 'phone', label: 'Contact Number', placeholder: '10-digit mobile', icon: Phone, format: 'phone', maxLength: 10 },
                            ]
                        },
                        { name: 'email', label: 'Email Address', placeholder: 'manager@example.com', icon: Mail },
                        {
                            name: 'status',
                            label: 'Account Status',
                            type: 'select',
                            defaultValue: 'active',
                            options: [
                                { value: 'active', label: 'Active' },
                                { value: 'pending', label: 'Pending Review' },
                                { value: 'inactive', label: 'Inactive' },
                                { value: 'suspended', label: 'Suspended' }
                            ]
                        }
                    ]}
                />
                <GenericFormModal
                    isOpen={isAddManagerOpen}
                    onClose={() => setISAddManagerOpen(false)}
                    onSave={handleSaveManager}
                    title="Add Manager"
                    validationSchema={managerSchema}
                    fields={[
                        { name: 'name', label: 'Full Name', placeholder: 'Enter full name', icon: Users },
                        { name: 'email', label: 'Email Address', placeholder: 'Enter email address', icon: MapPin },
                        {
                            name: 'role',
                            label: 'Role',
                            type: 'select',
                            defaultValue: 'Manager',
                            options: [{ value: 'Manager', label: 'Manager' }, { value: 'Admin', label: 'Admin' }],
                            icon: UserCog
                        },
                    ]}
                />
            </div>
        </ProtectedRoute>
    );
}
