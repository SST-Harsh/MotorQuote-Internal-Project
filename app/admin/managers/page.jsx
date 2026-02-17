"use client";

import ProtectedRoute from "../../../components/common/ProtectedRoute";
import ManagersView from "../../../components/dashboard/(ReusableDashboard Pages)/pages/ManagersView";

export default function ManagersPage() {
    return (
        <ProtectedRoute roles={["admin", "super_admin"]}>
            <ManagersView />
        </ProtectedRoute>
    );
}
