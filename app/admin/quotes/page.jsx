"use client";

import ProtectedRoute from "../../../components/common/ProtectedRoute";
import QuotesView from "../../../components/dashboard/(ReusableDashboard Pages)/pages/QuotesView";

export default function QuotesPage() {
    return (
        <ProtectedRoute roles={["admin", "super_admin"]}>
            <QuotesView />
        </ProtectedRoute>
    );
}
