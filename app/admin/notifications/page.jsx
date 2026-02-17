import NotificationsView from "../../../components/dashboard/(ReusableDashboard Pages)/pages/NotificationsView";
import ProtectedRoute from "../../../components/common/ProtectedRoute";
export default function NotificationsPage() {
    return (
        <ProtectedRoute roles={["admin", "super_admin"]}>
            <NotificationsView />
        </ProtectedRoute>
    );
}
