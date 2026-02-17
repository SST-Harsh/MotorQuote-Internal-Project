"use client";
import React, { useState } from 'react';
import DataTable from '../../(ReusableDashboardComponents)/DataTable';
import GenericFormModal from '../../(ReusableDashboardComponents)/GenericFormModal';
import { Plus, Car, Calendar, DollarSign, Tag, Info } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../../../context/AuthContext';
import * as Yup from 'yup';

export default function InventoryView() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCar, setEditingCar] = useState(null);

    // Initial Mock Data
    const [inventory, setInventory] = useState([
        { id: 'INV-001', make: 'Ford', model: 'Focus', year: '2020', price: '14500', mileage: '25000', status: 'Available', type: 'Hatchback' },
        { id: 'INV-002', make: 'BMW', model: '3 Series', year: '2021', price: '28000', mileage: '15000', status: 'Reserved', type: 'Sedan' },
        { id: 'INV-003', make: 'Audi', model: 'Q5', year: '2019', price: '32000', mileage: '35000', status: 'Sold', type: 'SUV' },
    ]);

    // Validation Schema
    const validationSchema = Yup.object().shape({
        make: Yup.string().required('Make is required'),
        model: Yup.string().required('Model is required'),
        year: Yup.number().required('Year is required').min(1900).max(new Date().getFullYear() + 1),
        price: Yup.number().required('Price is required').positive(),
        mileage: Yup.number().required('Mileage is required').min(0),
        status: Yup.string().required('Status is required'),
    });

    // Form Fields
    const formFields = [
        { name: 'make', label: 'Make', type: 'text', placeholder: 'e.g. Ford', icon: Car },
        { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g. Fiesta', icon: Tag },
        { name: 'year', label: 'Year', type: 'number', placeholder: '2023', icon: Calendar },
        { name: 'price', label: 'Price (£)', type: 'number', placeholder: '15000', icon: DollarSign },
        { name: 'mileage', label: 'Mileage', type: 'number', placeholder: '10000', icon: Info },
        {
            name: 'status', label: 'Status', type: 'select',
            options: [
                { value: 'Available', label: 'Available' },
                { value: 'Reserved', label: 'Reserved' },
                { value: 'Sold', label: 'Sold' },
            ]
        },
    ];

    const handleSave = async (formData) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        if (editingCar) {
            setInventory(prev => prev.map(item => item.id === editingCar.id ? { ...formData, id: item.id } : item));
            Swal.fire({ icon: 'success', title: 'Vehicle Updated', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        } else {
            const newCar = { ...formData, id: `INV-${Date.now()}` };
            setInventory(prev => [newCar, ...prev]);
            Swal.fire({ icon: 'success', title: 'Vehicle Added', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        }
        setIsModalOpen(false);
        setEditingCar(null);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Remove Vehicle?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setInventory(prev => prev.filter(item => item.id !== id));
                Swal.fire('Deleted!', 'Vehicle has been removed.', 'success');
            }
        });
    };

    const columns = [
        { header: 'ID', accessor: 'id', className: 'text-xs font-mono text-gray-500' },
        { header: 'Make', accessor: 'make', sortable: true, className: 'font-bold' },
        { header: 'Model', accessor: 'model', sortable: true },
        { header: 'Year', accessor: 'year', sortable: true },
        {
            header: 'Price',
            accessor: (row) => `£${Number(row.price).toLocaleString()}`,
            sortable: true,
            className: 'font-medium text-[rgb(var(--color-primary))]'
        },
        { header: 'Mileage', accessor: (row) => `${Number(row.mileage).toLocaleString()} mi` },
        {
            header: 'Status',
            accessor: (row) => {
                const colors = { Available: 'green', Reserved: 'orange', Sold: 'gray' }; // Basic mapping
                const color = colors[row.status] || 'blue';
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-${color}-100 text-${color}-700`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            header: 'Actions',
            accessor: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => { setEditingCar(row); setIsModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Inventory Management</h1>
                    <p className="text-[rgb(var(--color-text-muted))]">Manage your vehicle stock and listings.</p>
                </div>
                <button
                    onClick={() => { setEditingCar(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.2)]"
                >
                    <Plus size={18} />
                    <span>Add Vehicle</span>
                </button>
            </div>

            <div className="bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden">
                <DataTable
                    data={inventory}
                    columns={columns}
                    searchKeys={['make', 'model', 'id']}
                    rowsPerPage={10}
                />
            </div>

            <GenericFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCar ? "Edit Vehicle" : "Add New Vehicle"}
                fields={formFields}
                initialData={editingCar || { status: 'Available' }}
                validationSchema={validationSchema}
                onSubmit={handleSave}
            />
        </div>
    );
}
