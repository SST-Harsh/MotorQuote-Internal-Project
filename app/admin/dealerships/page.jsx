"use client";

import ProtectedRoute from "../../../components/common/ProtectedRoute";
import DealershipsView from "../../../components/dashboard/(ReusableDashboard Pages)/pages/DealershipsView";

export default function DealershipsPage() {
    return (
        <ProtectedRoute roles={["admin", "super_admin"]}>
            <DealershipsView />
        </ProtectedRoute>
    );
}
