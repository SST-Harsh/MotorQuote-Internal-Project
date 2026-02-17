"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import * as yup from 'yup';
import GenericFormModal from "../../(ReusableDashboardComponents)/GenericFormModal";
import DetailViewModal from "../../(ReusableDashboardComponents)/DetailViewModal";
import DataTable from "../../(ReusableDashboardComponents)/DataTable";
import StatCard from "../../(ReusableDashboardComponents)/StatCard";
import Button from "../../../common/Button";
import Swal from "sweetalert2";
import { useNotifications } from "../../../../context/NotificationContext";
import { Plus, LayoutDashboard, Building2, FileText, ClipboardCheck, Users, UserCog, Settings, Eye, Edit2, Trash2, Shield, Activity, Mail, Phone, MapPin, CheckCircle } from "lucide-react";

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
        email: 'contact@premiummotors.com',
        phone: '9876543210'
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
        email: 'hello@eliteauto.com',
        phone: '8765432109'
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
        email: 'sales@velocity.in',
        phone: '7654321098'
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
        email: 'info@cityline.com',
        phone: '6543210987'
    },
    {
        id: 'dealer-5',
        name: 'Galaxy Cars',
        location: 'Hyderabad, Telangana',
        manager: 'Rajesh Kumar',
        quotes: 210,
        conversion: 81,
        status: 'active',
        statusLabel: 'Active',
        email: 'support@galaxycars.com',
        phone: '5432109876'
    },
];

const dealershipSchema = yup.object().shape({
    name: yup.string().required('Dealership Name is required').min(3, 'Name must be at least 3 characters'),
    location: yup.string().required('Location is required'),
    manager: yup.string().required('Manager Name is required'),
    email: yup.string().email('Invalid email address').required('Manager Email is required'),
    phone: yup.string().matches(/^[0-9]{10}$/, 'Phone number must be 10 digits').required('Contact Number is required'),
});

import { useAuth } from "../../../../context/AuthContext";
import FileUploader from "../../../common/FileUploader";

export default function DealershipsView() {
    const searchParams = useSearchParams();
    const highlightId = searchParams.get('highlight');
    const { createNotification } = useNotifications();
    const { user } = useAuth(); // Access user role

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDealer, setEditingDealer] = useState(null);
    const [viewingDealer, setViewingDealer] = useState(null);
    const [dealerships, setDealerships] = useState(initialDealerships);
    const [dealerFiles, setDealerFiles] = useState([]); // State for files

    // Role-based permissions
    const userRole = user?.role?.toLowerCase() || 'visitor';
    const canUpload = ['admin', 'super_admin', 'manager', 'dealer'].includes(userRole);
    const canDeleteFiles = ['super_admin'].includes(userRole);

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
    }, [isModalOpen]);

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
            title: 'Pending Dealerships',
            value: '1,847',
            helperText: 'Require urgent action',
            trend: { positive: false, label: '4.1%' },
            icon: '⏳',
            accent: '#FFB800',
        },
        {
            title: 'Inactive Dealerships',
            value: '142',
            helperText: 'Require urgent action',
            trend: { positive: false, label: '2.3%' },
            icon: '📉',
            accent: '#FF8C00',
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

    useEffect(() => {
        const storedData = localStorage.getItem('dealerships');
        if (storedData) {
            setDealerships(JSON.parse(storedData));
        }
    }, []);

    useEffect(() => {
        if (dealerships !== initialDealerships) {
            localStorage.setItem('dealerships', JSON.stringify(dealerships));
        }
    }, [dealerships]);

    const handleSaveDealership = (dealerData) => {
        // In a real app, upload 'dealerFiles' here
        const dataWithFiles = { ...dealerData, documents: dealerFiles };

        if (dealerData.id && dealerships.some(d => d.id === dealerData.id)) {
            setDealerships(prev => prev.map(d => d.id === dealerData.id ? { ...d, ...dataWithFiles } : d));
            Swal.fire({ icon: 'success', title: 'Updated!', text: `${dealerData.name} has been updated successfully.`, timer: 2000, showConfirmButton: false });
        } else {
            const newDealer = { ...dataWithFiles, id: `dealer-${Date.now()}`, quotes: 0, conversion: 0 };
            setDealerships(prev => [newDealer, ...prev]);

            // --- NOTIFICATION TRIGGER ---
            createNotification({
                title: 'New Dealership Added 🏢',
                message: `${newDealer.name} has been added to the network.`,
                type: 'success',
                targetRole: 'super_admin'
            });

            Swal.fire({ icon: 'success', title: 'Added!', text: `${newDealer.name} has been registered successfully.`, timer: 2000, showConfirmButton: false });
        }
        setIsModalOpen(false);
        setEditingDealer(null);
        setViewingDealer(null);
        setDealerFiles([]); // Reset files
    };

    const handleEdit = (dealer) => {
        setEditingDealer(dealer);
        setDealerFiles(dealer.documents || []); // Load existing files
        setIsModalOpen(true);
    };
    const handleView = (dealer) => { setViewingDealer(dealer); };

    const handleDelete = (id) => {
        Swal.fire({ title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#3b82f6', confirmButtonText: 'Yes, delete it!' }).then((result) => {
            if (result.isConfirmed) {
                setDealerships(prev => prev.filter(d => d.id !== id));
                Swal.fire('Deleted!', 'The dealership has been removed.', 'success');
            }
        })
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingDealer(null); setDealerFiles([]); };

    const [selectedIds, setSelectedIds] = useState([]);

    const handleBulkAction = (action) => {
        if (action === 'delete') {
            Swal.fire({
                title: 'Are you sure?',
                text: `You are about to delete ${selectedIds.length} dealerships. This cannot be undone!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Yes, delete all!'
            }).then((result) => {
                if (result.isConfirmed) {
                    setDealerships(prev => prev.filter(d => !selectedIds.includes(d.id)));
                    setSelectedIds([]);
                    Swal.fire('Deleted!', 'Selected dealerships have been removed.', 'success');
                }
            });
        } else if (action === 'suspend') {
            setDealerships(prev => prev.map(d => selectedIds.includes(d.id) ? { ...d, status: 'suspended', statusLabel: 'Suspended' } : d));
            setSelectedIds([]);
            Swal.fire('Suspended!', 'Selected dealerships have been suspended.', 'success');
        } else if (action === 'activate') {
            setDealerships(prev => prev.map(d => selectedIds.includes(d.id) ? { ...d, status: 'active', statusLabel: 'Active' } : d));
            setSelectedIds([]);
            Swal.fire('Activated!', 'Selected dealerships have been activated.', 'success');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Dealerships</h1>
                    <p className="text-[rgb(var(--color-text))] text-sm">Manage all your dealership partners</p>
                </div>
                <Button
                    onClick={() => { setEditingDealer(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-blue-500/20">
                    <Plus size={18} />
                    <span>Add Dealership</span>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>


            <DataTable
                data={dealerships}
                highlightId={highlightId}
                searchKeys={['name', 'location', 'manager']}
                onSelectionChange={setSelectedIds}
                filterOptions={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'inactive', label: 'Inactive' },
                        ]
                    }
                ]}
                columns={[
                    { header: 'Dealership', accessor: 'name', sortable: true, className: 'font-semibold text-[rgb(var(--color-text))] ' },
                    { header: 'Location', accessor: 'location', sortable: true, className: 'text-[rgb(var(--color-text))] ' },
                    { header: 'Manager', accessor: 'manager', sortable: true, className: 'font-medium text-[rgb(var(--color-text))] ' },
                    {
                        header: 'Status',
                        accessor: (item) => {
                            const statusStyles = {
                                active: 'bg-[rgb(var(--color-success))/0.1] text-[rgb(var(--color-success))] border-[rgb(var(--color-success))/0.2]',
                                pending: 'bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))/0.2]',
                                inactive: 'bg-[rgb(var(--color-text))/0.1] text-[rgb(var(--color-text))] border-[rgb(var(--color-text))/0.2]',
                                suspended: 'bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] border-[rgb(var(--color-error))/0.2]',
                            };
                            return (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[item.status?.toLowerCase()] || statusStyles.pending}`}>
                                    {item.statusLabel || (item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown')}
                                </span>
                            );
                        },
                        sortable: true,
                        className: 'text-center'
                    },
                    {
                        header: 'Actions',
                        accessor: (item) => (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleView(item)}
                                    className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-info))] hover:bg-[rgb(var(--color-info))/0.1] rounded-lg transition-colors"
                                    title="View Details"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))/0.1] rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))/0.1] rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ),
                        className: 'text-center'
                    }
                ]}
            />
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-[rgb(var(--color-surface))] p-4 rounded-xl shadow-md border border-[rgb(var(--color-border))] flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text))]">
                        <div className="bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] px-3 py-1 rounded-full">
                            {selectedIds.length} Selected
                        </div>
                        <span className="text-[rgb(var(--color-text))]">dealerships selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkAction('activate')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                        >
                            <CheckCircle size={16} />
                            Activate
                        </button>
                        <button
                            onClick={() => handleBulkAction('suspend')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                            <Activity size={16} />
                            Suspend
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                </div>
            )}

            <GenericFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveDealership}
                title={editingDealer ? "Edit Dealership" : "Add New Dealership"}
                initialData={editingDealer}
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
                    },
                    {
                        type: 'custom',
                        label: 'Dealership Documents',
                        component: (
                            <FileUploader
                                files={dealerFiles}
                                onFilesChange={setDealerFiles}
                                enableUpload={canUpload}
                                enableDelete={canDeleteFiles}
                                label="Upload Contracts / Licenses"
                                acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
                            />
                        )
                    }
                ]}
            />

            <DetailViewModal
                isOpen={!!viewingDealer}
                onClose={() => setViewingDealer(null)}
                data={viewingDealer}
                title="Dealership Details"
                onEdit={(dealer) => {
                    setViewingDealer(null);
                    handleEdit(dealer);
                }}
                onDelete={handleDelete}
                sections={[
                    {
                        title: 'Dealership Info',
                        icon: Shield,
                        fields: [
                            { label: 'Name', key: 'name' },
                            { label: 'Type', key: 'role', value: 'Dealership' }, // Assuming role might not be set or defaults
                            { label: 'Status', key: 'status' },
                            { label: 'Location', key: 'location' }
                        ]
                    },
                    {
                        title: 'Contact Details',
                        icon: Activity,
                        fields: [
                            { label: 'Manager', key: 'manager' },
                            { label: 'Email Address', key: 'email', copyable: true },
                            { label: 'Phone Number', key: 'phone' }
                        ]
                    }
                ]}
            />
        </div>
    );
}
