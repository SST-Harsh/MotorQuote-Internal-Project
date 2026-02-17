"use client";
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import SettingsView from "../../../components/dashboard/(ReusableDashboard Pages)/pages/SettingsView";

export default function SuperAdminSettingsPage() {
    return (
        <ProtectedRoute roles={["super_admin"]}>
            <div className="space-y-6">
                <SettingsView />
            </div>
        </ProtectedRoute>
    );
}
