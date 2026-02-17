"use client";
import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Monitor, CheckCircle2 } from "lucide-react";

export default function NotificationSettings() {
    const [channels, setChannels] = useState({
        email: true,
        sms: false,
        push: true
    });

    const [preferences, setPreferences] = useState({
        quotes: true,
        approvals: true,
        dealerships: false,
        system: true
    });

    const toggleChannel = (key) => {
        setChannels(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const togglePref = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8">
            <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
                <Bell size={20} className="text-[rgb(var(--color-primary))]" />
                Notification Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Channels */}
                <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] uppercase tracking-wider opacity-80">Channels</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-[rgb(var(--color-text))]">Email Notifications</p>
                                    <p className="text-xs text-[rgb(var(--color-text-muted))]">Receive updates via email.</p>
                                </div>
                            </div>
                            <Toggle checked={channels.email} onChange={() => toggleChannel('email')} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                    <MessageSquare size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-[rgb(var(--color-text))]">SMS Notifications</p>
                                    <p className="text-xs text-[rgb(var(--color-text-muted))]">Receive updates via SMS.</p>
                                </div>
                            </div>
                            <Toggle checked={channels.sms} onChange={() => toggleChannel('sms')} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                    <Monitor size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-[rgb(var(--color-text))]">Push Notifications</p>
                                    <p className="text-xs text-[rgb(var(--color-text-muted))]">Desktop and browser alerts.</p>
                                </div>
                            </div>
                            <Toggle checked={channels.push} onChange={() => toggleChannel('push')} />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] uppercase tracking-wider opacity-80">Preferences</h3>

                    <div className="bg-[rgb(var(--color-background))] rounded-xl p-4 border border-[rgb(var(--color-border))] space-y-3">
                        <Checkbox label="Quote Requests" checked={preferences.quotes} onChange={() => togglePref('quotes')} />
                        <Checkbox label="Approval Updates" checked={preferences.approvals} onChange={() => togglePref('approvals')} />
                        <Checkbox label="New Dealership Applications" checked={preferences.dealerships} onChange={() => togglePref('dealerships')} />
                        <Checkbox label="System Maintenance" checked={preferences.system} onChange={() => togglePref('system')} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <div
            onClick={onChange}
            className={`cursor-pointer w-11 h-6 rounded-full relative transition-colors duration-200 ${checked ? 'bg-[rgb(var(--color-primary))]' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <div className={`absolute top-[2px] left-[2px] bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-full' : 'translate-x-0'}`}></div>
        </div>
    );
}

function Checkbox({ label, checked, onChange }) {
    return (
        <div onClick={onChange} className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">{label}</span>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]' : 'border-[rgb(var(--color-border))] bg-transparent'}`}>
                {checked && <CheckCircle2 size={14} className="text-white" />}
            </div>
        </div>
    );
}
