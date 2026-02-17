"use client";
import { useState, useEffect } from 'react';
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import DataTable from "../../../components/dashboard/(ReusableDashboardComponents)/DataTable";
import GenericFormModal from "../../../components/dashboard/(ReusableDashboardComponents)/GenericFormModal";
import DetailViewModal from "../../../components/dashboard/(ReusableDashboardComponents)/DetailViewModal";
import { Ban, KeyRound, UserPlus, Mail, Shield, Lock, User, MoreVertical, Trash2, Eye, Edit } from "lucide-react";
import Swal from 'sweetalert2';
import * as yup from 'yup';

const createUserSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email address').matches(
        /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[A-Za-z]{2,}$/,
        "Enter a valid email address"
    ).required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').when('$isEditing', {
        is: true,
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.required('Password is required'),
    }),
    role: yup.string().oneOf(['admin', 'support', 'manager', 'seller'], 'Invalid role').required('Role is required'),
    status: yup.string().oneOf(['Active', 'Inactive', 'Pending', 'Suspended'], 'Invalid status'),
});

export default function GlobalUsersPage() {

    const [allUsers, setAllUsers] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);


    useEffect(() => {
        const handleClickOutside = () => setOpenActionMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const loadUsers = () => {
        let mockDB = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
        let managers = JSON.parse(localStorage.getItem('managers_data') || '[]');
        let sellers = JSON.parse(localStorage.getItem('sellers_data') || '[]');

        if (mockDB.length === 0 && managers.length === 0 && sellers.length === 0) {
            mockDB = [
                { id: 'u1', name: 'John Admin', email: 'admin@dealership.com', role: 'admin', status: 'Active' },
                { id: 'u2', name: 'Support Staff', email: 'support@motorquote.com', role: 'support', status: 'Active' }
            ];
            managers = [
                { id: 'm1', label: 'Mike Manager', value: 'm1', email: 'mike@dealership.com', status: 'Active' },
                { id: 'm2', label: 'Sarah Sales', value: 'm2', email: 'sarah@dealership.com', status: 'Inactive' }
            ];
            sellers = [
                { id: 's1', name: 'Sam Seller', email: 'sam@dealership.com', status: 'Pending' }
            ];

            localStorage.setItem('mock_users_db', JSON.stringify(mockDB));
            localStorage.setItem('managers_data', JSON.stringify(managers));
            localStorage.setItem('sellers_data', JSON.stringify(sellers));
        }

        const systemUsers = mockDB.map((u, idx) => ({
            id: u.id || `sys-${idx}`,
            name: u.name || (u.email.split('@')[0].charAt(0).toUpperCase() + u.email.split('@')[0].slice(1)),
            email: u.email,
            role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1).replace('_', ' ')) : 'User',
            work: 'System',
            status: u.status || 'Active',
            type: 'Work',
            sourceKey: 'mock_users_db'
        }))
            .filter(u => u.role !== 'Super admin');

        const formattedManagers = managers.map(m => ({
            id: m.id || m.value,
            name: m.label || m.name,
            email: m.email || 'N/A',
            role: 'Manager',
            work: 'Dealership (Mock)',
            status: m.status || 'Active',
            type: 'Work',
            sourceKey: 'managers_data'
        }));

        const formattedSellers = sellers.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            role: 'Seller',
            work: 'Dealership (Mock)',
            status: s.status || 'Active',
            type: 'Work',
            sourceKey: 'sellers_data'
        }));

        setAllUsers([...systemUsers, ...formattedManagers, ...formattedSellers]);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleSaveUser = (formData) => {

        if (editingUser) {
            const sourceKey = editingUser.sourceKey || 'mock_users_db';
            let sourceDB = JSON.parse(localStorage.getItem(sourceKey) || '[]');

            const updatedDB = sourceDB.map(u =>
                (u.id === editingUser.id || u.value === editingUser.id || u.email === editingUser.email)
                    ? { ...u, ...formData, label: formData.name, value: u.value || u.id }
                    : u
            );

            localStorage.setItem(sourceKey, JSON.stringify(updatedDB));

            Swal.fire({
                icon: 'success',
                title: 'User Updated',
                text: 'User details updated successfully.',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            let targetKey = 'mock_users_db';
            if (formData.role === 'manager') targetKey = 'managers_data';
            else if (formData.role === 'seller') targetKey = 'sellers_data';

            let sourceDB = JSON.parse(localStorage.getItem(targetKey) || '[]');

            const newUser = {
                id: `u-${Date.now()}`,
                value: `u-${Date.now()}`,
                label: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                name: formData.name,
                status: formData.status || 'Active'
            };
            sourceDB.push(newUser);
            localStorage.setItem(targetKey, JSON.stringify(sourceDB));

            Swal.fire({
                icon: 'success',
                title: 'User Created',
                text: `New ${formData.role} added.`,
                timer: 1500,
                showConfirmButton: false
            });
        }

        setIsCreateOpen(false);
        setEditingUser(null);
        loadUsers();
    };

    const handleAction = (action, user) => {
        setOpenActionMenu(null);

        if (action === 'suspend') {
            const isSuspended = user.status === 'Suspended';
            Swal.fire({
                title: isSuspended ? 'Activate User?' : 'Suspend User?',
                text: isSuspended ? `Re-activate ${user.name}?` : `Suspend ${user.name}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: isSuspended ? '#10B981' : '#d33',
                confirmButtonText: isSuspended ? 'Activate' : 'Suspend',
            }).then((result) => {
                if (result.isConfirmed) {
                    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: isSuspended ? 'Active' : 'Suspended' } : u));

                    const sourceKey = user.sourceKey || 'mock_users_db';
                    const db = JSON.parse(localStorage.getItem(sourceKey) || '[]');
                    const newDb = db.map(u => (u.id === user.id || u.email === user.email || u.value === user.id) ? { ...u, status: isSuspended ? 'Active' : 'Suspended' } : u);
                    localStorage.setItem(sourceKey, JSON.stringify(newDb));

                    Swal.fire(isSuspended ? 'Activated!' : 'Suspended!', '', 'success');
                }
            });
        } else if (action === 'password') {
            Swal.fire('Sent!', `Password reset link sent.`, 'success');
        } else if (action === 'delete') {
            Swal.fire({
                title: 'Delete User?',
                text: "Permanently delete this user?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Yes, delete'
            }).then((result) => {
                if (result.isConfirmed) {
                    setAllUsers(prev => prev.filter(u => u.id !== user.id));

                    const sourceKey = user.sourceKey || 'mock_users_db';
                    const db = JSON.parse(localStorage.getItem(sourceKey) || '[]');
                    const newDb = db.filter(u => u.id !== user.id && u.value !== user.id && u.email !== user.email);
                    localStorage.setItem(sourceKey, JSON.stringify(newDb));

                    Swal.fire('Deleted!', 'User deleted.', 'success');
                }
            });
        } else if (action === 'view') {
            setViewingUser(user);
        } else if (action === 'edit') {
            setEditingUser(user);
            setIsCreateOpen(true);
        }
    };

    return (
        <ProtectedRoute roles={["super_admin"]}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Global Users</h1>
                        <p className="text-[rgb(var(--color-text-muted))] text-sm">Monitor and manage all users across the entire platform.</p>
                    </div>
                    <button
                        onClick={() => { setEditingUser(null); setIsCreateOpen(true); }}
                        className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg"
                    >
                        <UserPlus size={18} />
                        <span>Create New User</span>
                    </button>
                </div>

                <DataTable
                    data={allUsers}
                    searchKeys={['name', 'email', 'work']}
                    filterOptions={[
                        {
                            key: 'role', label: 'Role', options: [
                                { value: 'Admin', label: 'Admin' },
                                { value: 'Support', label: 'Support' },
                                { value: 'Manager', label: 'Manager' },
                                { value: 'Seller', label: 'Seller' }
                            ]
                        },
                        {
                            key: 'status', label: 'Status', options: [
                                { value: 'Active', label: 'Active' },
                                { value: 'Inactive', label: 'Inactive' },
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Suspended', label: 'Suspended' }
                            ]
                        }
                    ]}
                    columns={[
                        { header: 'Name', accessor: 'name', sortable: true, className: 'font-bold' },
                        { header: 'Email', accessor: 'email', className: 'text-[rgb(var(--color-text-muted))]' },
                        {
                            header: 'Role',
                            accessor: (row) => (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                                    ${row.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                        row.role === 'Support' ? 'bg-blue-100 text-blue-700' :
                                            row.role === 'Manager' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}
                                `}>
                                    {row.role}
                                </span>
                            )
                        },
                        { header: 'Work', accessor: 'work' },
                        {
                            header: 'Status',
                            accessor: (row) => {
                                const colors = {
                                    'Active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                    'Inactive': 'bg-slate-100 text-slate-600 border-slate-200',
                                    'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
                                    'Suspended': 'bg-red-100 text-red-700 border-red-200'
                                };
                                const status = row.status ? (row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase()) : 'Inactive';
                                return (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors['Inactive']}`}>
                                        {status}
                                    </span>
                                );
                            }
                        },
                        {
                            header: 'Actions',
                            className: 'text-right',
                            accessor: (row) => (
                                <div className="relative flex justify-end">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            if (openActionMenu?.id === row.id) {
                                                setOpenActionMenu(null);
                                            } else {
                                                setOpenActionMenu({
                                                    id: row.id,
                                                    top: rect.bottom - 12, // Just a tiny gap for aesthetics
                                                    left: rect.left - 160 // Adjust for width (w-48 = 12rem = 192px approx, shifting left to align)
                                                });
                                            }
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${openActionMenu?.id === row.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    itemsPerPage={5}
                />
                {openActionMenu && (
                    <div
                        className="fixed w-48 bg-[rgb(var(--color-surface))] rounded-lg shadow-xl border border-[rgb(var(--color-border))] z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: openActionMenu.top,
                            left: openActionMenu.left
                        }}
                    >
                        <button onClick={() => handleAction('view', allUsers.find(u => u.id === openActionMenu.id))} className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2">
                            <Eye size={14} /> View Details
                        </button>
                        <button onClick={() => handleAction('edit', allUsers.find(u => u.id === openActionMenu.id))} className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2">
                            <Edit size={14} /> Edit User
                        </button>
                        <button onClick={() => handleAction('password', allUsers.find(u => u.id === openActionMenu.id))} className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2">
                            <KeyRound size={14} /> Reset Password
                        </button>
                        <div className="h-px bg-[rgb(var(--color-border))] my-1"></div>
                        <button onClick={() => handleAction('suspend', allUsers.find(u => u.id === openActionMenu.id))} className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-2">
                            <Ban size={14} /> {allUsers.find(u => u.id === openActionMenu.id)?.status === 'Suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        <button onClick={() => handleAction('delete', allUsers.find(u => u.id === openActionMenu.id))} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={14} /> Delete User
                        </button>
                    </div>
                )}

                <GenericFormModal
                    isOpen={isCreateOpen}
                    onClose={() => { setIsCreateOpen(false); setEditingUser(null); }}
                    onSave={handleSaveUser}
                    title={editingUser ? "Edit User" : "Create New User"}
                    subtitle={editingUser ? "Update user details and role." : "Add a new Admin or Support staff member."}
                    initialData={editingUser || { status: 'Active', role: 'admin' }}
                    validationSchema={createUserSchema}
                    maxWidth="max-w-md"
                    fields={[
                        { name: 'name', label: 'Full Name', placeholder: 'John Doe', icon: User },
                        { name: 'email', label: 'Email Address', placeholder: 'john@example.com', icon: Mail },
                        {
                            name: 'role',
                            label: 'Role',
                            type: 'select',
                            options: [
                                { value: 'admin', label: 'Admin' },
                                { value: 'manager', label: 'Sales Manager' },
                                { value: 'seller', label: 'Sales Person' },
                                { value: 'support', label: 'Support Staff' }
                            ],
                            icon: Shield
                        },
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
                            icon: Ban
                        },
                        { name: 'password', label: 'Password', type: 'password', placeholder: '••••••', icon: Lock },
                    ]}
                />

                {/* Detail View Modal */}
                {viewingUser && (
                    <DetailViewModal
                        isOpen={!!viewingUser}
                        onClose={() => setViewingUser(null)}
                        data={{
                            ...viewingUser,
                            name: viewingUser.name,
                            role: viewingUser.role,
                            status: viewingUser.status,
                            designation: viewingUser.designation || 'N/A',
                            joinedDate: viewingUser.createdAt || 'Recent'
                        }}
                        title="User Profile"
                        sections={[
                            {
                                title: 'Account Info',
                                fields: [
                                    { label: 'Full Name', key: 'name' },
                                    { label: 'Email Address', key: 'email' },
                                    { label: 'Role', key: 'role' },
                                    { label: 'Status', key: 'status' }
                                ]
                            },
                            {
                                title: 'Organization',
                                fields: [
                                    { label: 'Designation', key: 'designation' },
                                    { label: 'Joined Date', key: 'joinedDate' }
                                ]
                            }
                        ]}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
