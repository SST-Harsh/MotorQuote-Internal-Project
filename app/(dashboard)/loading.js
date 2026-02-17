"use client";
import Loader from "../../components/common/Loader";

export default function DashboardLoading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader />
        </div>
    );
}
