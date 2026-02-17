"use client";
import React from 'react';
import QuotesView from '../../../components/dashboard/(ReusableDashboard Pages)/pages/QuotesView';

export default function DealerQuotesPage() {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">My Quotes</h1>
                <p className="text-[rgb(var(--color-text-muted))]">Manage your quotes and customers.</p>
            </div>
            <QuotesView userRole="dealer" />
        </div>
    );
}
