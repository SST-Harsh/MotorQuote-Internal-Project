"use client";
import React, { useState, useEffect } from 'react';
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import DataTable from "../../../components/dashboard/(ReusableDashboardComponents)/DataTable";
import GenericFormModal from "../../../components/dashboard/(ReusableDashboardComponents)/GenericFormModal";
import DetailViewModal from "../../../components/dashboard/(ReusableDashboardComponents)/DetailViewModal";
import { Building2, MapPin, Phone, User, Fingerprint, Ban, CheckCircle, Edit2, Eye } from "lucide-react";
import * as yup from 'yup';
import Swal from 'sweetalert2';

// Validation Schema
const dealershipSchema = yup.object().shape({
    name: yup.string().required('Dealership Name is required'),
    location: yup.string().required('Location is required'),
    phone: yup.string().matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits').required('Phone Number is required'),
    managerId: yup.string().required('Assigned Manager is required'),
    status: yup.string().oneOf(['Active', 'Inactive', 'Pending', 'Suspended']).default('Active')
});

export default function DealershipsPage() {
    const [dealerships, setDealerships] = useState([]);
    const [managers, setManagers] = useState([]);

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewingDealer, setViewingDealer] = useState(null);
    const [editingDealer, setEditingDealer] = useState(null);

    // Load Data
    useEffect(() => {
        let storedDealersTheme = localStorage.getItem('dealerships');
        let storedDealers = storedDealersTheme ? JSON.parse(storedDealersTheme) : [];
        const storedManagers = JSON.parse(localStorage.getItem('managers_data') || '[]');

        // Seed Mock Data if empty
        if (storedDealers.length === 0) {
            storedDealers = [
                {
                    id: 'DLR-1001',
                    name: 'Metro Ford',
                    location: 'Downtown, Springfield',
                    contactPerson: 'Mike Manager',
                    phone: '9876543210',
                    managerId: 'm1',
                    managerName: 'Jay',
                    status: 'Active',
                    joinedDate: '01/01/2024',
                    performance: { quotes: 142, conversion: 72 }
                },
                {
                    id: 'DLR-1002',
                    name: 'City Toyota',
                    location: 'Westside, Metropolis',
                    contactPerson: 'Sarah Sales',
                    phone: '9123456780',
                    managerId: 'm2',
                    managerName: 'John',
                    status: 'Active',
                    joinedDate: '15/02/2024',
                    performance: { quotes: 120, conversion: 69 }
                },
                {
                    id: 'DLR-1003',
                    name: 'Luxury Imports',
                    location: 'Uptown, Gotham',
                    contactPerson: 'Bruce Wayne',
                    phone: '9988776655',
                    managerId: 'm3',
                    managerName: 'James Bond',
                    status: 'Pending',
                    joinedDate: '10/03/2024',
                    performance: { quotes: 98, conversion: 63 }
                }
            ];
            localStorage.setItem('dealerships', JSON.stringify(storedDealers));
        }
        // Data Repair / Enrichment for Stale LocalStorage (Only if missing)
        const enrichedDealers = storedDealers.map(d => {
            if (d.id === 'DLR-1001' && !d.managerName) return { ...d, managerId: 'm1', managerName: 'Jay' };
            if (d.id === 'DLR-1002' && !d.managerName) return { ...d, managerId: 'm2', managerName: 'John' };
            if (d.id === 'DLR-1003' && !d.managerName) return { ...d, managerId: 'm3', managerName: 'James Bond' };
            return d;
        });

        // Only update if changes were made (deep comparison check)
        if (JSON.stringify(enrichedDealers) !== JSON.stringify(storedDealers)) {
            localStorage.setItem('dealerships', JSON.stringify(enrichedDealers));
            setDealerships(enrichedDealers);
        } else {
            setDealerships(storedDealers);
        }

        setManagers(storedManagers.map(m => ({ value: m.id || m.email, label: m.name || m.email })));
    }, [isFormOpen]); // Refresh when form closes

    // Save Data
    const handleSave = (formData) => {
        const isEdit = !!editingDealer;
        let updatedList;

        // Ensure status is valid Title Case
        if (formData.status) {
            formData.status = formData.status.charAt(0).toUpperCase() + formData.status.slice(1).toLowerCase();
        }

        if (isEdit) {
            updatedList = dealerships.map(d => d.id === editingDealer.id ? { ...d, ...formData } : d);
            Swal.fire({ icon: 'success', title: 'Updated', text: 'Dealership updated successfully.', timer: 1500, showConfirmButton: false });
        } else {
            const newDealer = {
                ...formData,
                id: `DLR-${Date.now().toString().slice(-4)}`, // Simple ID gen
                joinedDate: new Date().toLocaleDateString()
            };
            updatedList = [newDealer, ...dealerships];
            Swal.fire({ icon: 'success', title: 'Created', text: `Dealership "${newDealer.name}" added.`, timer: 1500, showConfirmButton: false });
        }

        setDealerships(updatedList);
        localStorage.setItem('dealerships', JSON.stringify(updatedList));
        setIsFormOpen(false);
        setEditingDealer(null);
    };

    // Actions
    const handleAction = (type, row) => {
        if (type === 'toggleStatus') {
            const newStatus = row.status === 'Active' ? 'Inactive' : 'Active';
            const actionVerb = newStatus === 'Active' ? 'Activate' : 'Deactivate';

            Swal.fire({
                title: `${actionVerb} Dealership?`,
                text: `Are you sure you want to ${actionVerb.toLowerCase()} ${row.name}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: newStatus === 'Active' ? '#10B981' : '#EF4444',
                confirmButtonText: `Yes, ${actionVerb}`
            }).then((result) => {
                if (result.isConfirmed) {
                    const updated = dealerships.map(d => d.id === row.id ? { ...d, status: newStatus } : d);
                    setDealerships(updated);
                    localStorage.setItem('dealerships', JSON.stringify(updated));
                    Swal.fire('Updated!', `Dealership is now ${newStatus}.`, 'success');
                }
            });
        }
    };

    return (
        <ProtectedRoute roles={["super_admin"]}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Dealership Management</h1>
                        <p className="text-[rgb(var(--color-text-muted))] text-sm">Onboard and manage dealership partners.</p>
                    </div>
                    <button
                        onClick={() => { setEditingDealer(null); setIsFormOpen(true); }}
                        className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg"
                    >
                        <Building2 size={18} />
                        <span>Add New Dealership</span>
                    </button>
                </div>

                <DataTable
                    data={dealerships}
                    searchKeys={['name', 'location', 'contactPerson']}
                    filterOptions={[
                        {
                            key: 'status',
                            label: 'Status',
                            options: [
                                { value: 'Active', label: 'Active' },
                                { value: 'Inactive', label: 'Inactive' },
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Suspended', label: 'Suspended' }
                            ]
                        }
                    ]}
                    columns={[
                        {
                            header: 'Dealership',
                            accessor: (row) => (
                                <div>
                                    <div className="font-bold text-[rgb(var(--color-text))]">{row.name}</div>
                                    <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                                        <MapPin size={12} />
                                        <span>{row.location}</span>
                                    </div>
                                </div>
                            )
                        },
                        {
                            header: 'Manager',
                            accessor: (row) => {
                                const mgr = managers.find(m => m.value === row.managerId);
                                const mockManagers = { 'm1': 'Jay', 'm2': 'John', 'm3': 'James Bond' };
                                return <div className="text-sm text-[rgb(var(--color-text))]">{row.managerName || mockManagers[row.managerId] || (mgr ? mgr.label : 'Unassigned')}</div>;
                            }
                        },
                        {
                            header: 'Status',
                            accessor: (row) => {
                                const statusKey = row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase();
                                const colors = {
                                    'Active': 'bg-green-50 text-green-700 border-green-200',
                                    'Inactive': 'bg-gray-50 text-gray-700 border-gray-200',
                                    'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                    'Suspended': 'bg-red-50 text-red-700 border-red-200'
                                };
                                return (
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colors[statusKey] || colors['Inactive']}`}>
                                        {statusKey}
                                    </span>
                                );
                            }
                        },
                        {
                            header: 'Performance',
                            accessor: (row) => (
                                <div className="text-sm">
                                    <span className="font-semibold text-[rgb(var(--color-text))]">{row.performance?.quotes || 0} Quotes</span>
                                    <span className="mx-1.5 text-gray-300">•</span>
                                    <span className={`font-medium ${(row.performance?.conversion || 0) >= 70 ? 'text-emerald-600' :
                                        (row.performance?.conversion || 0) >= 50 ? 'text-blue-600' : 'text-orange-600'
                                        }`}>
                                        {row.performance?.conversion || 0}% Conv.
                                    </span>
                                </div>
                            )
                        },
                        {
                            header: 'Actions',
                            className: 'text-right',
                            accessor: (row) => (
                                <div className="flex justify-start gap-2">
                                    <button
                                        onClick={() => setViewingDealer(row)}
                                        className="p-1.5 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-info))/0.1] rounded-lg hover:text-[rgb(var(--color-info))]"
                                        title="View Details"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => { setEditingDealer(row); setIsFormOpen(true); }}
                                        className="p-1.5 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary))/0.1] rounded-lg hover:text-[rgb(var(--color-primary))]"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleAction('toggleStatus', row)}
                                        className={`p-1.5 rounded-lg transition-colors ${row.status === 'Active'
                                            ? 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-error))/0.1] hover:text-[rgb(var(--color-error))]'
                                            : 'text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))/0.1]'}`}
                                        title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
                                    >
                                        {row.status === 'Active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                                    </button>
                                </div>
                            )
                        }
                    ]}
                />

                {/* Form Modal */}
                < GenericFormModal
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setEditingDealer(null); }}
                    onSave={handleSave}
                    title={editingDealer ? "Edit Dealership" : "Register Dealership"}
                    subtitle="Enter dealership details and assign a manager."
                    initialData={editingDealer}
                    validationSchema={dealershipSchema}
                    maxWidth="max-w-xl"
                    fields={[
                        {
                            type: 'group',
                            title: 'Basic Information',
                            className: "grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100",
                            fields: [
                                { name: 'name', label: 'Dealership Name', placeholder: 'e.g. Metro Ford', icon: Building2, className: 'md:col-span-2' },
                                { name: 'location', label: 'Location', placeholder: 'Address / City', icon: MapPin },
                                {
                                    name: 'status',
                                    label: 'Status',
                                    type: 'select',
                                    options: [
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Inactive', label: 'Inactive' },
                                        { value: 'Pending', label: 'Pending' },
                                        { value: 'Suspended', label: 'Suspended' }
                                    ],
                                    icon: CheckCircle
                                }
                            ]
                        },
                        {
                            type: 'group',
                            title: 'Contact & Management',
                            className: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-4",
                            fields: [
                                { name: 'phone', label: 'Phone Number', placeholder: 'xxxxxxxxxx', icon: Phone, className: 'md:col-span-2' },
                                {
                                    name: 'managerId',
                                    label: 'Assign Manager',
                                    type: 'select',
                                    options: managers.length ? managers : [{ value: '', label: 'No Managers Found' }],
                                    icon: Fingerprint,
                                    className: 'md:col-span-2'
                                }
                            ]
                        }
                    ]}
                />
                <DetailViewModal
                    isOpen={!!viewingDealer}
                    onClose={() => setViewingDealer(null)}
                    data={viewingDealer}
                    title={viewingDealer?.name || 'Dealership Details'}
                    sections={[
                        {
                            title: "Overview",
                            icon: Building2,
                            fields: [
                                { label: "ID", key: "id" },
                                { label: "Name", key: "name" },
                                { label: "Location", key: "location" },
                                { label: "Joined", key: "joinedDate" },
                                { label: "Status", key: "status" },
                            ]
                        },
                        {
                            title: "Contact Info",
                            icon: Phone,
                            fields: [
                                { label: "Phone", key: "phone" },
                            ]
                        },
                        {
                            title: "Management",
                            icon: User,
                            fields: [
                                { label: "Assigned Manager ID", key: "managerId" }
                            ]
                        }
                    ]}
                />
            </div>
        </ProtectedRoute>
    );
}
