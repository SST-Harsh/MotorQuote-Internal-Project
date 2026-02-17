"use client";

import ProtectedRoute from "../../../components/common/ProtectedRoute";
import SettingsView from "../../../components/dashboard/(ReusableDashboard Pages)/pages/SettingsView";

export default function SettingsPage() {
    return (
        <ProtectedRoute roles={["admin", "super_admin"]}>
            <SettingsView />
        </ProtectedRoute>
    );
}
