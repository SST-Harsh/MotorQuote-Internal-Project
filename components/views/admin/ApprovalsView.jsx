"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Building2, FileText, ClipboardCheck, Users, UserCog, Settings, Check, X, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

export default function ApprovalsView() {

    const [activeTab, setActiveTab] = useState('quotes');

    // Initial mock data to show something if DB is empty
    const [pendingQuotes, setPendingQuotes] = useState([
        { id: '#1052', vehicle: '2023 Tata Nexon EV', dealer: 'Premium Motors', amount: '₹14,50,000', status: 'Pending', date: '22 Dec, 2025' },
    ]);

    const [pendingDealerships, setPendingDealerships] = useState([
        { id: 'dealer-2', name: 'Elite Auto Hub', location: 'Bangalore, Karnataka', manager: 'Priya Malhotra', status: 'pending', date: '20 Dec, 2025' },
    ]);

    const [pendingManagers, setPendingManagers] = useState([
        { id: 'mgr-pending-1', name: 'Amit Verma', email: 'amit.verma@example.com', role: 'Sales Manager', status: 'Pending', joinedDate: '24 Dec, 2025' }
    ]);

    const [pendingSellers, setPendingSellers] = useState([
        { id: 'sel-pending-1', name: 'Sneha Gupta', email: 'sneha.g@example.com', role: 'Seller', status: 'Pending', joinedDate: '24 Dec, 2025' }
    ]);

    // Load real data to sync status
    useEffect(() => {
        const storedQuotes = JSON.parse(localStorage.getItem('quotes_data') || '[]');
        const storedDealers = JSON.parse(localStorage.getItem('dealerships') || '[]');
        const storedManagers = JSON.parse(localStorage.getItem('managers_data') || '[]');
        const storedSellers = JSON.parse(localStorage.getItem('sellers_data') || '[]');

        const syncData = (storedList, currentList, type) => {
            const dbPending = storedList.filter(item => item.status?.toLowerCase() === 'pending');
            const handledIds = new Set(storedList.filter(item => item.status?.toLowerCase() !== 'pending').map(item => item.id));
            const remainingCurrent = currentList.filter(item => !handledIds.has(item.id));
            const combined = [...remainingCurrent];
            dbPending.forEach(item => {
                if (!combined.some(existing => existing.id === item.id)) {
                    let newItem = { ...item };
                    if (type === 'quote') {
                        newItem.dealer = item.dealer || item.dealership;
                        newItem.amount = item.amount || item.price;
                    }
                    combined.push(newItem);
                }
            });
            return combined;
        };

        setPendingQuotes(prev => syncData(storedQuotes, prev, 'quote'));
        setPendingDealerships(prev => syncData(storedDealers, prev, 'dealer'));
        setPendingManagers(prev => syncData(storedManagers, prev, 'manager'));
        setPendingSellers(prev => syncData(storedSellers, prev, 'seller'));

    }, []);

    const handleApprove = (id, type) => {
        let storageKey = '';
        let currentList = [];
        let setList = null;
        let successMsg = '';

        if (type === 'quote') {
            storageKey = 'quotes_data';
            currentList = pendingQuotes;
            setList = setPendingQuotes;
            successMsg = `Quote ${id} has been approved.`;
        } else if (type === 'dealer') {
            storageKey = 'dealerships';
            currentList = pendingDealerships;
            setList = setPendingDealerships;
            successMsg = 'Dealership has been activated.';
        } else if (type === 'manager') {
            storageKey = 'managers_data';
            currentList = pendingManagers;
            setList = setPendingManagers;
            successMsg = 'Manager account activated.';
        } else if (type === 'seller') {
            storageKey = 'sellers_data';
            currentList = pendingSellers;
            setList = setPendingSellers;
            successMsg = 'Seller account activated.';
        }

        const itemToApprove = currentList.find(i => i.id === id);
        if (!itemToApprove) return;

        const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');

        // Check duplicate
        if (storedData.some(i => i.id === id)) {
            setList(prev => prev.filter(i => i.id !== id)); // Remove from view
            Swal.fire({ title: 'Already Processed', text: 'This item is already in the database.', icon: 'info', timer: 1500, showConfirmButton: false });
            return;
        }

        let newItem = { ...itemToApprove };

        if (type === 'quote') {
            newItem.status = 'Approved';
            // ensure keys
            newItem.dealer = itemToApprove.dealer || itemToApprove.dealership;
            newItem.amount = itemToApprove.amount || itemToApprove.price;
        } else if (type === 'dealer') {
            newItem.status = 'active';
            if (!newItem.quotes) newItem.quotes = 0;
            if (!newItem.conversion) newItem.conversion = 0;
        } else {
            // Managers and Sellers
            newItem.status = 'Active'; // Use Title Case for consistency or match existing
        }

        localStorage.setItem(storageKey, JSON.stringify([newItem, ...storedData]));
        setList(prev => prev.filter(i => i.id !== id));
        Swal.fire({ title: 'Approved', text: successMsg, icon: 'success', timer: 1500, showConfirmButton: false });
    };

    const handleReject = (id, type) => {
        let setList = null;
        if (type === 'quote') setList = setPendingQuotes;
        else if (type === 'dealer') setList = setPendingDealerships;
        else if (type === 'manager') setList = setPendingManagers;
        else if (type === 'seller') setList = setPendingSellers;

        Swal.fire({
            title: 'Reject Request?',
            text: "Please provide a reason for rejection:",
            input: 'text',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Reject'
        }).then((result) => {
            if (result.isConfirmed) {
                // Here we might want to also save the rejection status to DB so it persists as 'Rejected' or removed?
                // For now, removing from pending view as requested.
                // Ideally, update status to 'Suspended' or 'Rejected' in DB if it was already there?
                // Assuming these "Pending" items might not be in the main DB yet (except via the useEffect sync).

                // Let's update the status in DB to 'Suspended' (since 'Rejected' was removed by user in QuotesView)
                // This ensures it doesn't reappear on reload.

                let storageKey = '';
                if (type === 'quote') storageKey = 'quotes_data';
                else if (type === 'dealer') storageKey = 'dealerships';
                else if (type === 'manager') storageKey = 'managers_data';
                else if (type === 'seller') storageKey = 'sellers_data';

                const storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const itemIndex = storedData.findIndex(i => i.id === id);

                if (itemIndex >= 0) {
                    storedData[itemIndex].status = 'Suspended';
                    localStorage.setItem(storageKey, JSON.stringify(storedData));
                }

                setList(prev => prev.filter(i => i.id !== id));
                Swal.fire('Rejected', 'The request has been rejected.', 'info');
            }
        });
    };

    const TabButton = ({ id, label, count, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`pb-3 px-4 sm:px-6 text-sm font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === id ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))]'}`}
        >
            <span className="hidden sm:inline">{Icon && <Icon size={16} className="inline mr-1" />}</span>
            {label} ({count})
            {activeTab === id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[rgb(var(--color-primary))] rounded-t-full"></div>}
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Approvals</h1>
                <p className="text-[rgb(var(--color-text))] text-sm">Manage pending approvals for all entities</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[rgb(var(--color-border))] overflow-x-auto scrollbar-hide">
                <TabButton id="quotes" label="Quotes" count={pendingQuotes.length} icon={FileText} />
                <TabButton id="dealerships" label="Dealerships" count={pendingDealerships.length} icon={Building2} />
                <TabButton id="managers" label="Managers" count={pendingManagers.length} icon={UserCog} />
                <TabButton id="sellers" label="Sellers" count={pendingSellers.length} icon={Users} />
            </div>

            {/* Content */}
            <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
                {activeTab === 'quotes' && (
                    <ApprovalList
                        items={pendingQuotes}
                        type="quote"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        renderItem={(item) => (
                            <div>
                                <h4 className="font-semibold text-[rgb(var(--color-text))]">{item.id} - {item.vehicle}</h4>
                                <div className="text-sm text-[rgb(var(--color-text))] flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                    <span>Dealer: <span className="font-medium text-[rgb(var(--color-text))]">{item.dealer}</span></span>
                                    <span>Amount: <span className="font-medium text-[rgb(var(--color-text))]">{item.amount}</span></span>
                                    <span>Date: {item.date}</span>
                                </div>
                            </div>
                        )}
                        icon={FileText}
                    />
                )}

                {activeTab === 'dealerships' && (
                    <ApprovalList
                        items={pendingDealerships}
                        type="dealer"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        renderItem={(item) => (
                            <div>
                                <h4 className="font-semibold text-[rgb(var(--color-text))]">{item.name}</h4>
                                <div className="text-sm text-[rgb(var(--color-text))] flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                    <span>Location: {item.location}</span>
                                    <span>Manager: {item.manager}</span>
                                    <span>Date: {item.date}</span>
                                </div>
                            </div>
                        )}
                        icon={Building2}
                    />
                )}

                {activeTab === 'managers' && (
                    <ApprovalList
                        items={pendingManagers}
                        type="manager"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        renderItem={(item) => (
                            <div>
                                <h4 className="font-semibold text-[rgb(var(--color-text))]">{item.name}</h4>
                                <div className="text-sm text-[rgb(var(--color-text))] flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                    <span>Role: {item.role}</span>
                                    <span>Email: {item.email}</span>
                                    <span>Joined: {item.joinedDate}</span>
                                </div>
                            </div>
                        )}
                        icon={UserCog}
                    />
                )}

                {activeTab === 'sellers' && (
                    <ApprovalList
                        items={pendingSellers}
                        type="seller"
                        onApprove={handleApprove}
                        onReject={handleReject}
                        renderItem={(item) => (
                            <div>
                                <h4 className="font-semibold text-[rgb(var(--color-text))]">{item.name}</h4>
                                <div className="text-sm text-[rgb(var(--color-text))] flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                    <span>Role: {item.role}</span>
                                    <span>Email: {item.email}</span>
                                    <span>Joined: {item.joinedDate}</span>
                                </div>
                            </div>
                        )}
                        icon={Users}
                    />
                )}
            </div>
        </div>
    );
}

// Reusable List Component
function ApprovalList({ items, type, onApprove, onReject, renderItem, icon: Icon }) {
    if (items.length === 0) return <EmptyState message={`No pending ${type}s`} />;

    return (
        <div className="divide-y divide-[rgb(var(--color-border))]">
            {items.map((item) => (
                <div key={item.id} className="p-4 flex items-start sm:items-center justify-between gap-4 hover:bg-[rgb(var(--color-background))] transition-colors">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] rounded-lg">
                            <Icon size={20} />
                        </div>
                        {renderItem(item)}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onReject(item.id, type)} className="p-2 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))/0.1] rounded-lg transition-colors" title="Reject">
                            <X size={20} />
                        </button>
                        <button onClick={() => onApprove(item.id, type)} className="p-2 text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))/0.1] rounded-lg transition-colors" title="Approve">
                            <Check size={20} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="p-12 text-center text-[rgb(var(--color-text))]">
            <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">{message}</p>
        </div>
    );
}
