"use client";
import React from 'react';
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import { LifeBuoy, Mail, ExternalLink, MessageSquare } from "lucide-react";

export default function DealerPage() {
    return (
        <ProtectedRoute roles={["super_admin"]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Dealer & Help Desk</h1>
                    <p className="text-[rgb(var(--color-text-muted))] text-sm">Manage dealer tickets and platform inquiries.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ticket System Placeholder */}
                    <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                            <LifeBuoy size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">dealer Ticket System Coming Soon</h2>
                        <p className="text-gray-600 max-w-lg">
                            We are integrating a dedicated ticketing system (Zendesk/Freshdesk API) to allow you to manage customer and dealership inquiries directly from this dashboard.
                        </p>
                        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition-colors">
                            View Integration Roadmap
                        </button>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Mail size={18} className="text-gray-500" /> Technical dealer
                        </h3>
                        <p className="text-sm text-gray-600">
                            For immediate platform issues, please contact the development team directly.
                        </p>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm font-mono text-gray-700 select-all">
                            dev-team@motorquote.com
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare size={18} className="text-gray-500" /> Live Chat
                        </h3>
                        <p className="text-sm text-gray-600">
                            Live chat is currently disabled for Super Admins. Enable it in Global Settings  Communication.
                        </p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
