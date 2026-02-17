"use client";

import ProtectedRoute from "../../../components/common/ProtectedRoute";
import SellersView from "../../../components/dashboard/(ReusableDashboard Pages)/pages/SellersView";

export default function SellersPage() {
    return (
        <ProtectedRoute roles={["admin", "super_admin"]}>
            <SellersView />
        </ProtectedRoute>
    );
}
