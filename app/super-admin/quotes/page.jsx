"use client";
import React, { useState, useEffect } from 'react';
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import DataTable from "../../../components/dashboard/(ReusableDashboardComponents)/DataTable";
import DetailViewModal from "../../../components/dashboard/(ReusableDashboardComponents)/DetailViewModal";
import { FileText, Eye, ShieldAlert, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import Swal from 'sweetalert2';

export default function GlobalQuotesPage() {
    const [quotes, setQuotes] = useState([]);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [viewingQuote, setViewingQuote] = useState(null);
    const [dealerships, setDealerships] = useState([]);


    useEffect(() => {
        let storedQuotesTheme = localStorage.getItem('quotes_data');
        let storedQuotes = storedQuotesTheme ? JSON.parse(storedQuotesTheme) : [];
        let storedDealers = JSON.parse(localStorage.getItem('dealerships') || '[]');

        // Seed Mock Dealerships if missing (ensures lookup works)


        if (storedQuotes.length === 0 || !storedQuotes[0].vehicleName) {
            storedQuotes = [
                {
                    id: 'Q-2024-001',
                    vehicleName: '2024 Ford Mustang GT',
                    basePrice: 4500000,
                    condition: 'New',
                    mileage: '0 km',
                    dealershipId: 'DLR-1001',
                    dealershipName: 'Metro Ford',
                    customerName: 'Rahul Sharma',
                    customerEmail: 'rahul@example.com',
                    customerPhone: '9876543210',
                    status: 'Pending',
                    createdAt: '2024-03-10'
                },
                {
                    id: 'Q-2024-002',
                    vehicleName: '2023 Toyota Fortuner Legender',
                    basePrice: 5200000,
                    condition: 'Used',
                    mileage: '12,500 km',
                    dealershipId: 'DLR-1002',
                    dealershipName: 'City Toyota',
                    customerName: 'Priya Singh',
                    customerEmail: 'priya@example.com',
                    customerPhone: '9123456780',
                    status: 'Approved',
                    createdAt: '2024-03-12'
                },
                {
                    id: 'Q-2024-003',
                    vehicleName: '2024 BMW X5 xDrive40i',
                    basePrice: 9500000,
                    condition: 'New',
                    mileage: '0 km',
                    dealershipId: 'DLR-1003',
                    dealershipName: 'Luxury Imports',
                    customerName: 'Amit Patel',
                    customerEmail: 'amit@example.com',
                    customerPhone: '9988776655',
                    status: 'Sold',
                    createdAt: '2024-03-14'
                },
                {
                    id: 'Q-2024-004',
                    vehicleName: '2022 Honda City ZX',
                    basePrice: 1500000,
                    condition: 'Used',
                    mileage: '25,000 km',
                    dealershipId: 'DLR-1001',
                    dealershipName: 'Metro Ford',
                    customerName: 'Sneha Gupta',
                    customerEmail: 'sneha@example.com',
                    customerPhone: '8877665544',
                    status: 'Rejected',
                    createdAt: '2024-03-15'
                }
            ];
            localStorage.setItem('quotes_data', JSON.stringify(storedQuotes));
        }

        const enriched = storedQuotes.map(q => {
            const dealer = storedDealers.find(d => d.id === q.dealershipId) || {};
            const mockNames = {
                'DLR-1001': 'Metro Ford',
                'DLR-1002': 'City Toyota',
                'DLR-1003': 'Luxury Imports'
            };

            const existingName = (q.dealershipName && q.dealershipName !== q.dealershipId) ? q.dealershipName : null;

            // Priority: Name from Live Data -> Valid Existing Name -> Mock Name -> ID
            const resolvedName = dealer.name || existingName || mockNames[q.dealershipId] || q.dealershipId || 'Unknown Dealer';
            return { ...q, dealershipName: resolvedName };
        });

        setQuotes(enriched);
        setFilteredQuotes(enriched);
        setDealerships(storedDealers);
    }, []);

    const [openActionMenu, setOpenActionMenu] = useState(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openActionMenu && !event.target.closest('.action-menu-trigger')) {
                setOpenActionMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openActionMenu]);

    const handleUpdateStatus = (quoteId, newStatus) => {
        const updatedQuotes = quotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q);
        setQuotes(updatedQuotes);
        setFilteredQuotes(updatedQuotes);
        localStorage.setItem('quotes_data', JSON.stringify(updatedQuotes));

        Swal.fire({
            icon: 'success',
            title: 'Status Updated',
            text: `Quote marked as ${newStatus}`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
        setOpenActionMenu(null);
    };

    // Columns
    const columns = [
        { header: 'ID', accessor: 'id', className: 'text-xs font-mono text-gray-500' },
        { header: 'Vehicle', accessor: 'vehicleName', sortable: true, className: 'font-bold' },
        { header: 'Price', sortable: true, sortKey: 'basePrice', accessor: (row) => `₹${Number(row.basePrice).toLocaleString()}` },
        { header: 'Dealership', accessor: 'dealershipName', className: 'text-sm text-gray-600' },
        { header: 'Customer', accessor: 'customerName' },
        {   
            header: 'Status',
            sortable: true,
            sortKey: 'status',
            accessor: (row) => {
                const statusKey = row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase();
                const colors = {
                    'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
                    'Approved': 'bg-green-50 text-green-700 border-green-200',
                    'Rejected': 'bg-red-50 text-red-700 border-red-200',
                    'Sold': 'bg-blue-50 text-blue-700 border-blue-200'
                };
                return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[statusKey] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {statusKey}
                    </span>
                );
            }
        },
        {
            header: 'Actions',
            className: 'text-right',
            accessor: (row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewingQuote(row);
                        }}
                        className="p-1.5 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface))] rounded-lg hover:text-[rgb(var(--color-info))]"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setOpenActionMenu({
                                id: row.id,
                                top: rect.bottom + window.scrollY + 5,
                                left: rect.left + window.scrollX - 140 // Align dropdown to the left
                            });
                        }}
                        className={`action-menu-trigger p-1.5 rounded-lg transition-colors ${openActionMenu?.id === row.id ? 'bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-error))/0.1] hover:text-[rgb(var(--color-error))]'}`}
                        title="Override Status"
                    >
                        <ShieldAlert size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <ProtectedRoute roles={["super_admin"]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Global Quote Management</h1>
                    <p className="text-[rgb(var(--color-text-muted))] text-sm">Oversee and manage quotes from all dealerships.</p>
                </div>

                <DataTable
                    data={filteredQuotes}
                    searchKeys={['vehicleName', 'customerName', 'dealershipName']}
                    filterOptions={[
                        { key: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected', 'Sold'].map(s => ({ value: s, label: s })) },
                        { key: 'dealershipName', label: 'Dealership', options: dealerships.map(d => ({ value: d.name, label: d.name })) }
                    ]}
                    columns={columns}
                />

                {/* Fixed Position Dropdown using Portal-like behavior */}
                {openActionMenu && (
                    <div
                        className="fixed w-48 bg-[rgb(var(--color-surface))] rounded-lg shadow-xl border border-[rgb(var(--color-border))] z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: openActionMenu.top,
                            left: openActionMenu.left
                        }}
                    >
                        <div className="bg-[rgb(var(--color-background))] px-4 py-2 border-b border-[rgb(var(--color-border))] text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                            Set Status
                        </div>
                        {['Pending', 'Approved', 'Rejected', 'Sold'].map(status => (
                            <button
                                key={status}
                                onClick={() => handleUpdateStatus(openActionMenu.id, status)}
                                className="w-full text-left px-4 py-2.5 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2 transition-colors"
                            >
                                <span className={`w-2 h-2 rounded-full ${status === 'Pending' ? 'bg-yellow-500' : status === 'Approved' ? 'bg-green-500' : status === 'Rejected' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                {status}
                            </button>
                        ))}
                    </div>
                )}

                {/* Detail View with Mock Chat Log */}
                {viewingQuote && (
                    <DetailViewModal
                        isOpen={!!viewingQuote}
                        onClose={() => setViewingQuote(null)}
                        data={{
                            ...viewingQuote,
                            name: viewingQuote.customerName,
                            role: 'Customer',
                            joinedDate: viewingQuote.createdAt
                        }}
                        title={`Quote #${viewingQuote.id} - ${viewingQuote.vehicleName}`}
                        sections={[
                            {
                                title: "Quote Details",
                                icon: FileText,
                                fields: [
                                    { label: "Quote ID", key: "id" },
                                    { label: "Vehicle", key: "vehicleName" },
                                    { label: "Price", key: "basePrice", format: (v) => `₹${Number(v).toLocaleString()}` },
                                    { label: "Dealership", key: "dealershipName" },
                                    { label: "Customer", key: "customerName" },
                                    { label: "Status", key: "status" },
                                ]
                            },
                            {
                                title: "Vehicle Details",
                                icon: FileText,
                                fields: [
                                    { label: "Model", key: "vehicleName" },
                                    { label: "Base Price", key: "basePrice", format: (v) => `₹${Number(v).toLocaleString()}` },
                                    { label: "Condition", key: "condition" },
                                    { label: "Mileage", key: "mileage" },
                                ]
                            },
                            {
                                title: "Customer Info",
                                icon: MessageSquare,
                                fields: [
                                    { label: "Name", key: "customerName" },
                                    { label: "Email", key: "customerEmail" },
                                    { label: "Phone", key: "customerPhone" },
                                ]
                            }
                        ]}
                        activityContent={(
                            <div className="space-y-4">
                                <h3 className="text-[rgb(var(--color-text))] font-semibold text-lg flex items-center gap-2">
                                    <Clock size={18} className="text-[rgb(var(--color-primary))]" />
                                    Communication Log (Audit)
                                </h3>
                                <div className="space-y-3 bg-[rgb(var(--color-background))] p-4 rounded-lg border border-[rgb(var(--color-border))] text-sm">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">DM</div>
                                        <div>
                                            <p className="font-semibold text-[rgb(var(--color-text))]">Dealer Manager <span className="text-[rgb(var(--color-text-muted))] font-normal text-xs ml-2">2 days ago</span></p>
                                            <p className="text-[rgb(var(--color-text-muted))]">Quote created and sent to customer.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">CS</div>
                                        <div>
                                            <p className="font-semibold text-[rgb(var(--color-text))]">Customer <span className="text-[rgb(var(--color-text-muted))] font-normal text-xs ml-2">1 day ago</span></p>
                                            <p className="text-[rgb(var(--color-text-muted))]">Requested a discount on the base price.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">SA</div>
                                        <div>
                                            <p className="font-semibold text-[rgb(var(--color-text))]">Super Admin (System) <span className="text-[rgb(var(--color-text-muted))] font-normal text-xs ml-2">Just now</span></p>
                                            <p className="text-[rgb(var(--color-text-muted))] italic">Viewing quote details.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                )}
                {/* drop down ststaus chnage  */}
            </div>
        </ProtectedRoute>
    );
}
