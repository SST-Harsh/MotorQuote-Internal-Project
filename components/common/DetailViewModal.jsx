"use client";
import React, { useState } from 'react';
import { X, Shield, Activity, Edit2, Trash2, Calendar } from 'lucide-react';

export default function DetailViewModal({
    isOpen,
    onClose,
    data,
    title = "Details",
    onEdit,
    onDelete,
    sections = [], 
    statusMap = {}, 
    activityContent = null
}) {
    const [activeTab, setActiveTab] = useState('profile');

    if (!isOpen || !data) return null;

    const defaultStatusColors = {
        active: 'bg-[rgb(var(--color-success))/0.1] text-[rgb(var(--color-success))] border-[rgb(var(--color-success))/0.2]',
        pending: 'bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))/0.2]',
        inactive: 'bg-[rgb(var(--color-text))/0.1] text-[rgb(var(--color-text))] border-[rgb(var(--color-text))/0.2]',
        suspended: 'bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] border-[rgb(var(--color-error))/0.2]',
    };

    const colors = { ...defaultStatusColors, ...statusMap };
    const status = data.status?.toLowerCase();
    const statusStyle = colors[status] || colors.active;

    const displayName = data.name || 'Unknown';
    const displayRole = data.role || 'N/A';
    const displayId = data.id || 'N/A';
    const joinedDate = data.joinedDate || data.createdAt || 'Recent';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative bg-[rgb(var(--color-surface))] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-[rgb(var(--color-border))] flex flex-col max-h-[90vh]">

                {/* --- HEADER --- */}
                <div className="relative bg-[rgb(var(--color-background))] border-b border-[rgb(var(--color-border))] p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-1 right-1 p-2 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] rounded-full hover:text-[rgb(var(--color-text))] transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-purple-100 p-0.5 shadow-lg shadow-purple-100/20">
                            <div className="w-full h-full bg-[rgb(var(--color-surface))] rounded-[14px] flex items-center justify-center">
                                <span className="text-3xl font-bold bg-gradient-to-br from-[rgb(var(--color-text))] to-[rgb(var(--color-text))] bg-clip-text text-transparent uppercase">
                                    {displayName.charAt(0)}
                                </span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-[rgb(var(--color-text))] mb-1">{displayName}</h2>
                                    <div className="flex items-center gap-3 justify-center md:justify-start text-[rgb(var(--color-text))] text-sm">
                                        <span className="flex items-center gap-1"><Shield size={14} /> {displayRole}</span>
                                        <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-border))]"></span>
                                        <span>ID: #{displayId}</span>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusStyle}`}>
                                    {data.status || 'Unknown'}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
                                <span className="px-3 py-1 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-xs text-[rgb(var(--color-text))] flex items-center gap-1">
                                    <Calendar size={12} /> Joined {joinedDate}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 self-start mt-2 md:mt-0">
                            {onEdit && (
                                <button
                                    onClick={() => { onEdit(data); onClose(); }}
                                    className="px-4 py-2 bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)]"
                                >
                                    <Edit2 size={16} /> Edit
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => { onDelete(data.id); onClose(); }}
                                    className="px-4 py-2 bg-[rgb(var(--color-error)/0.1)] hover:bg-[rgb(var(--color-error)/0.2)] text-[rgb(var(--color-error))] border border-[rgb(var(--color-error)/0.2)] text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex border-b border-[rgb(var(--color-border))] px-8 bg-[rgb(var(--color-surface))]">
                    {['profile', 'activity'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-text))]'
                                : 'border-transparent text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-text))]'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)} Details
                        </button>
                    ))}
                </div>
                <div className="p-8 overflow-y-auto bg-[rgb(var(--color-surface))] flex-1">
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {sections.map((section, idx) => {
                                const SectionIcon = section.icon || Shield;
                                return (
                                    <div key={idx} className="space-y-6">
                                        <h3 className="text-[rgb(var(--color-text))] font-semibold text-lg flex items-center gap-2">
                                            <SectionIcon size={18} className="text-[rgb(var(--color-primary))]" />
                                            {section.title}
                                        </h3>
                                        <div className="space-y-4">
                                            {section.customContent ? (
                                                section.customContent
                                            ) : (
                                                section.fields?.map((field, fIdx) => (
                                                    <DetailRow
                                                        key={fIdx}
                                                        label={field.label}
                                                        value={data[field.key] || field.value}
                                                        isCopyable={field.copyable}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        activityContent ? (
                            <div className="space-y-6">
                                {activityContent}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-[rgb(var(--color-background))] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity size={32} className="text-[rgb(var(--color-text))]" />
                                </div>
                                <h3 className="text-[rgb(var(--color-text))] text-lg font-semibold">No recent activity</h3>
                                <p className="text-[rgb(var(--color-text))] text-sm mt-2">This entity hasn&apos;t performed any actions lately.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value, isCopyable }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-[rgb(var(--color-border))] last:border-0 hover:bg-[rgb(var(--color-background))] px-2 rounded-lg transition-colors -mx-2">
            <span className="text-[rgb(var(--color-text))] text-sm font-medium">{label}</span>
            <span className={`text-[rgb(var(--color-text))] text-sm font-medium text-right ${isCopyable ? 'select-all cursor-pointer' : ''}`}>
                {value || '-'}
            </span>
        </div>
    );
}
