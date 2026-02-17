"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Send, Trash2, Edit, Activity, User } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

const EmailNotifications = () => {
    const [templates, setTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            const storedTemplates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
            if (storedTemplates.length === 0) {
                const seed = {
                    id: '1',
                    name: 'New Member Welcome',
                    subject: 'Welcome to MotorQuote!',
                    category: 'Onboarding',
                    type: 'Welcome Email',
                    body: "Hi {{first_name}},\n\nThanks for joining MotorQuote.",
                    lastUpdated: new Date().toISOString(),
                    status: 'Active',
                    triggerEvent: 'Dealer Onboarded',
                    lastModifiedBy: 'System',
                    audience: 'All Users'
                };
                setTemplates([seed]);
                localStorage.setItem('emailTemplates', JSON.stringify([seed]));
            } else {
                setTemplates(storedTemplates);
            }
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const handleDelete = (id, status, e) => {
        e.stopPropagation();
        e.preventDefault();

        if (status === 'System Locked') {
            Swal.fire('Locked', 'Cannot delete a System Locked template.', 'error');
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = templates.filter(t => t.id !== id);
                setTemplates(updated);
                localStorage.setItem('emailTemplates', JSON.stringify(updated));
                Swal.fire('Deleted!', 'Template has been deleted.', 'success');
            }
        });
    };

    const [showSendModal, setShowSendModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isSending, setIsSending] = useState(false);

    // Specific Targeting State
    const [recipientType, setRecipientType] = useState('all');
    const [targetValue, setTargetValue] = useState('');

    const handleSend = (template, e) => {
        e.stopPropagation();
        e.preventDefault();

        if (template.status === 'Disabled') {
            Swal.fire('Disabled', 'This template is disabled and cannot be sent.', 'error');
            return;
        }

        setSelectedTemplate(template);
        setRecipientType('all'); // Reset
        setTargetValue('');       // Reset
        setShowSendModal(true);
    };

    const confirmSend = () => {
        setIsSending(true);

        // Simulate Network Delay
        setTimeout(() => {
            setIsSending(false);
            setShowSendModal(false);
            setSelectedTemplate(null);

            const targetDisplay = recipientType === 'specific_user' ? `User: ${targetValue}` :
                recipientType === 'specific_dealer' ? `Dealer: ${targetValue}` :
                    recipientType;

            Swal.fire({
                title: 'Emails Sent!',
                text: `Successfully broadcasted to ${targetDisplay}.`,
                icon: 'success'
            });
        }, 1500);
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Active': 'bg-green-100 text-green-700 border-green-200',
            'Draft': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'Disabled': 'bg-gray-100 text-gray-500 border-gray-200',
            'System Locked': 'bg-red-50 text-red-600 border-red-200'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status] || styles['Draft']}`}>
                {status}
            </span>
        );
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[rgb(var(--color-text-muted))] text-sm font-medium animate-pulse">Loading Templates...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text))] ">Email Templates</h1>
                    <p className="text-sm text-[rgb(var(--color-text-muted))]">Manage your automated email templates and layouts.</p>
                </div>
                <Link
                    href="/super-admin/notifications/email/create"
                    className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition-colors font-medium shadow-lg shadow-[rgb(var(--color-primary)/0.2)]"
                >
                    <Plus size={18} />
                    Create New Template
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--color-primary))] text-sm transition-colors"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                    <div key={template.id} className="group flex flex-col bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] p-5 hover:border-[rgb(var(--color-primary))] transition-all duration-300 hover:shadow-lg hover:shadow-[rgb(var(--color-primary)/0.05)] cursor-pointer">

                        {/* Header: Status & Category */}
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))] bg-gray-100 px-2 py-0.5 rounded">
                                {template.category || 'General'}
                            </span>
                            <StatusBadge status={template.status || 'Draft'} />
                        </div>

                        <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-1 group-hover:text-[rgb(var(--color-primary))] transition-colors truncate">
                            {template.name}
                        </h3>

                        {/* Trigger Info */}
                        <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-text-muted))] mb-4">
                            <Activity size={12} className="text-[rgb(var(--color-primary))]" />
                            <span>Trigger: {template.triggerEvent || 'Manual'}</span>
                        </div>

                        {/* Preview Body */}
                        <p className="text-xs text-[rgb(var(--color-text-muted))] mb-4 line-clamp-2 min-h-[32px] opacity-70">
                            {template.body.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, '')}
                        </p>

                        {/* Footer: Audit & Actions */}
                        <div className="mt-auto pt-4 border-t border-[rgb(var(--color-border))] flex items-center justify-between">
                            <div className="flex flex-col text-[10px] text-[rgb(var(--color-text-muted))]">
                                <span className="flex items-center gap-1">
                                    <User size={10} /> {template.lastModifiedBy || 'Super Admin'}
                                </span>
                                <span>{new Date(template.lastUpdated).toLocaleDateString()}</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => handleSend(template, e)}
                                    title="Send Email"
                                    className="p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-white hover:bg-[rgb(var(--color-primary))] transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                                <Link
                                    href={`/super-admin/notifications/email/create?id=${template.id}`}
                                    title="Edit Template"
                                    className={`p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] transition-colors ${template.status === 'System Locked' ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'hover:text-white hover:bg-[rgb(var(--color-primary))]'}`}
                                >
                                    <Edit size={16} />
                                </Link>
                                <button
                                    onClick={(e) => handleDelete(template.id, template.status || 'Draft', e)}
                                    title="Delete"
                                    disabled={template.status === 'System Locked'}
                                    className={`p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] transition-colors ${template.status === 'System Locked' ? 'opacity-30 cursor-not-allowed' : 'hover:text-white hover:bg-red-500'}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredTemplates.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-surface))] rounded-2xl border border-dashed border-[rgb(var(--color-border))]">
                        <p>No templates found.</p>
                        <Link href="/super-admin/notifications/email/create" className="text-[rgb(var(--color-primary))] hover:underline mt-2">Create your first template</Link>
                    </div>
                )}
            </div>
            {/* Send Modal */}
            {showSendModal && selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[rgb(var(--color-border))]">
                            <h2 className="text-xl font-bold font-racing">Send "{selectedTemplate.name}"?</h2>
                            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">Configure your broadcast settings below.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <p className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider mb-1">Subject</p>
                                <p className="text-sm font-medium text-[rgb(var(--color-text))]">{selectedTemplate.subject}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">Select Recipients</label>
                                    <select
                                        value={recipientType}
                                        onChange={(e) => setRecipientType(e.target.value)}
                                        className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                                    >
                                        <option value="all">All Users (Global)</option>
                                        <option value="dealers">All Dealerships</option>
                                        <option value="admins">All Admins</option>
                                        <option value="test">Test Email (Me only)</option>
                                        <option value="specific_user">Specific User</option>
                                        <option value="specific_dealer">Specific Dealer</option>
                                    </select>
                                </div>
                                {(recipientType === 'specific_user' || recipientType === 'specific_dealer') && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                                            {recipientType === 'specific_user' ? 'User Email Address' : 'Dealer ID / Name'}
                                        </label>
                                        <input
                                            type="text"
                                            value={targetValue}
                                            onChange={(e) => setTargetValue(e.target.value)}
                                            placeholder={recipientType === 'specific_user' ? 'e.g. user@example.com' : 'e.g. DLR-12345'}
                                            className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>


                        </div>

                        <div className="p-4 border-t border-[rgb(var(--color-border))] bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSendModal(false)}
                                disabled={isSending}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSend}
                                disabled={isSending}
                                className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSending ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Send Email
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailNotifications;
