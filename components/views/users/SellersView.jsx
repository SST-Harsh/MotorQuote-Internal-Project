"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import DataTable from "../../common/DataTable";
import * as yup from 'yup';
import GenericFormModal from "../../common/FormModal";
import DetailViewModal from "../../common/DetailViewModal";
import Swal from "sweetalert2";
import { Search, Filter, Plus, LayoutDashboard, Building2, FileText, ClipboardCheck, Users, UserCog, Settings, Shield, CheckCircle, XCircle, Trash2, Edit2, Eye, Activity, Mail, Phone } from "lucide-react";

const sellerSchema = yup.object().shape({
    name: yup.string().required('Full Name is required').min(3),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().matches(/^[0-9]{10}$/, 'Phone must be 10 digits').required('Phone is required'),
});
const initialSellers = [
    { id: 's-1', name: 'Alice Springer', email: 'alice@example.com', status: 'active', phone: '1234567890', joinedDate: 'Apr 05, 2024' },
    { id: 's-2', name: 'Bob Dealer', email: 'bob@example.com', status: 'active', phone: '0987654321', joinedDate: 'May 12, 2024' },
    { id: 's-3', name: 'Charlie Sales', email: 'charlie@example.com', status: 'inactive', phone: '1122334455', joinedDate: 'Jun 20, 2024' },
];

export default function SellersView() {
    const searchParams = useSearchParams();
    const highlightId = searchParams.get('highlight');
    // --- STATE ---
    const [users, setUsers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);

    const [dealershipOptions, setDealershipOptions] = useState([]);

    // --- DATA FETCHING (LocalStorage) ---
    useEffect(() => {
        const stored = localStorage.getItem('sellers_data');
        if (stored) setUsers(JSON.parse(stored));
        else setUsers(initialSellers);
    }, []);

    useEffect(() => {
        if (users.length > 0) localStorage.setItem('sellers_data', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        const storedDealers = localStorage.getItem('dealerships');
        if (storedDealers) {
            try {
                const dealers = JSON.parse(storedDealers);
                setDealershipOptions(dealers.map(d => ({ value: d.name, label: d.name })));
            } catch (e) { console.error("Failed to parse dealerships", e); }
        } else {
            setDealershipOptions([{ value: 'Premium Motors', label: 'Premium Motors' }]);
        }
    }, [isAddModalOpen]);

    const handleSave = (userData) => {
        const dataWithRole = { ...userData, role: 'Seller' };

        if (dataWithRole.id && users.some(u => u.id === dataWithRole.id)) {
            setUsers(prev => prev.map(u => u.id === dataWithRole.id ? { ...u, ...dataWithRole } : u));
            Swal.fire('Updated!', 'Seller details updated.', 'success');
        } else {

            const newUser = { ...dataWithRole, id: `s-${Date.now()}` };
            setUsers(prev => [newUser, ...prev]);
            Swal.fire('Created!', 'New seller added.', 'success');
        }
        setIsAddModalOpen(false);
        setEditingUser(null);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setUsers(prev => prev.filter(u => u.id !== id));
                Swal.fire('Deleted!', 'Seller has been removed.', 'success');
            }
        });
    };

    const handleStatusChange = (id, newStatus) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    };

    return (

        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Sellers</h1>
                    <p className="text-[rgb(var(--color-text))] text-sm">Manage sales team and performance</p>
                </div>
                <button
                    onClick={() => { setEditingUser(null); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)]"
                >
                    <Plus size={18} />
                    <span>Add Seller</span>
                </button>
            </div>
            <DataTable
                data={users}
                highlightId={highlightId}
                searchKeys={['name', 'email']}
                filterOptions={[
                    { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }, { value: 'pending', label: 'Pending' }] }
                ]}
                columns={[
                    {
                        header: "User",
                        sortable: true,
                        accessor: (user) => (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[rgb(var(--color-primary))] text-white flex items-center justify-center font-bold text-sm uppercase">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-[rgb(var(--color-text))]">{user.name}</p>
                                    <p className="text-xs text-[rgb(var(--color-text))]">{user.email}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: "Role",
                        accessor: (user) => (
                            <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text))]">
                                <UserCog size={14} className="text-[rgb(var(--color-primary))]" />
                                {user.role}
                            </div>
                        )
                    },
                    {
                        header: "Joined",
                        accessor: "joinedDate",
                        sortable: true,
                        className: "text-sm text-[rgb(var(--color-text))]"
                    },
                    {
                        header: "Status",
                        accessor: (user) => {
                            const statusStyles = {
                                active: 'bg-[rgb(var(--color-success))/0.1] text-[rgb(var(--color-success))] border-[rgb(var(--color-success))/0.2]',
                                inactive: 'bg-[rgb(var(--color-text-muted))/0.1] text-[rgb(var(--color-text-muted))] border-[rgb(var(--color-text-muted))/0.2]',
                                pending: 'bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))/0.2]',
                                suspended: 'bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] border-[rgb(var(--color-error))/0.2]',
                            };
                            return (
                                <select
                                    value={user.status}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                    className={`appearance-none cursor-pointer outline-none px-2.5 py-0.5 rounded-full text-xs font-medium border text-center w-24 ${statusStyles[user.status] || 'bg-gray-100 text-gray-500'}`}
                                >
                                    <option value="active" className="bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]">Active</option>
                                    <option value="inactive" className="bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]">Inactive</option>
                                    <option value="pending" className="bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]">Pending</option>
                                    <option value="suspended" className="bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))]">Suspended</option>
                                </select>
                            );
                        },
                        className: "text-center"
                    },
                    {
                        header: "Actions",
                        accessor: (user) => (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setViewingUser(user); }}
                                    className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.1)] rounded-lg transition-colors" title="View Profile">
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingUser(user); setIsAddModalOpen(true); }}
                                    className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-info))] hover:bg-[rgb(var(--color-info)/0.1)] rounded-lg transition-colors" title="Edit User">
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                                    className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error)/0.1)] rounded-lg transition-colors" title="Delete User">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ),
                        className: "text-center"
                    }
                ]}
            />

            {/* Modals */}
            <GenericFormModal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setEditingUser(null); }}
                onSave={handleSave}
                title={editingUser ? "Edit Seller" : "Add New Seller"}
                initialData={editingUser}
                validationSchema={sellerSchema}
                fields={[
                    { name: 'name', label: 'Full Name', placeholder: 'Alice Springer', icon: Users },
                    { name: 'email', label: 'Email Address', placeholder: 'seller@example.com', icon: Mail },
                    { name: 'phone', label: 'Phone', placeholder: '10-digit mobile', icon: Phone, format: 'phone', maxLength: 10 },
                    { name: 'dealership', label: 'Assign Dealership', type: 'select', options: dealershipOptions, placeholder: 'Select Dealership', icon: Building2 },
                    {
                        name: 'status',
                        label: 'Account Status',
                        type: 'select',
                        defaultValue: 'active',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'suspended', label: 'Suspended' }
                        ]
                    }
                ]}
            />

            <DetailViewModal
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(null)}
                data={viewingUser}
                title="Seller Details"
                onEdit={(u) => { setViewingUser(null); setEditingUser(u); setIsAddModalOpen(true); }}
                onDelete={handleDelete}
                sections={[
                    {
                        title: 'Personal Info',
                        icon: Shield,
                        fields: [
                            { label: 'Full Name', key: 'name' },
                            { label: 'Role', key: 'role' },
                            { label: 'Account Status', key: 'status' }
                        ]
                    },
                    {
                        title: 'Contact Details',
                        icon: Activity,
                        fields: [
                            { label: 'Email Address', key: 'email', copyable: true },
                            { label: 'Phone Number', key: 'phone' },
                            { label: 'Dealership', key: 'dealership' }
                        ]
                    }
                ]}
            />
        </div>
    );
}
