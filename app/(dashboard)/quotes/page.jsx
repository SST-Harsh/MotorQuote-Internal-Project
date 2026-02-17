"use client";
import React from 'react';
import { useAuth } from "../../../context/AuthContext";
import QuotesView from "../../../components/views/quotes/QuotesView";

export default function QuotesPage() {
    const { user } = useAuth();
    return <QuotesView userRole={user?.role} />;
}
