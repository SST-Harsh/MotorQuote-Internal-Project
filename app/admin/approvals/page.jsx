"use client";

import ProtectedRoute from "../../../components/common/ProtectedRoute";
import ApprovalsView from "../../../components/dashboard/(ReusableDashboard Pages)/pages/ApprovalsView";

export default function ApprovalsPage() {
    return (
        <ProtectedRoute roles={["admin", "super_admin"]}>
            <ApprovalsView />
        </ProtectedRoute>
    );
}
