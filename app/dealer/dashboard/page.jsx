"use client";
import React from "react";
import ProtectedRoute from "../../../components/common/ProtectedRoute";
import DashboardLayout from "../../../components/dashboard/(ReusableDashboardComponents)/DashboardLayout";
import StatCard from "../../../components/dashboard/(ReusableDashboardComponents)/StatCard";
import DataTable from "../../../components/dashboard/(ReusableDashboardComponents)/DataTable";
import { LayoutDashboard, MessageSquare, BookOpen, Users, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function dealerDashboard() {
  const stats = [
    {
      title: 'Active Quotes',
      value: '24',
      helperText: '8 pending approval',
      trend: { positive: true, label: '+4' },
      icon: '💬',
      accent: '#FF7A00',
    },
    {
      title: 'Total Inventory',
      value: '145',
      helperText: 'Vehicles in stock',
      trend: { positive: true, label: '+12' },
      icon: '🚗',
      accent: '#1ABC9C',
    },
    {
      title: 'Monthly Sales',
      value: '£42.5k',
      helperText: 'Target: £50k',
      trend: { positive: true, label: '85%' },
      icon: '📈',
      accent: '#675AF0',
    },
    {
      title: 'Customer Rating',
      value: '4.9/5',
      helperText: 'Based on 12 reviews',
      trend: { positive: true, label: '0.1' },
      icon: '⭐',
      accent: '#FF3D71',
    },
  ];

  const urgentTickets = [
    { id: 'T-1023', subject: 'Login Issue at Metro Ford', customer: 'John Manager', priority: 'High', status: 'Open', created: '10 mins ago' },
    { id: 'T-1022', subject: 'Quote Sync Error', customer: 'Alice (Velocity)', priority: 'High', status: 'In Progress', created: '25 mins ago' },
    { id: 'T-1021', subject: 'Billing Question', customer: 'Finance Dept', priority: 'Medium', status: 'Open', created: '1 hour ago' },
    { id: 'T-1020', subject: 'Feature Request: Dark Mode', customer: 'Tech Team', priority: 'Low', status: 'Open', created: '2 hours ago' },
    { id: 'T-1019', subject: 'Account Activation', customer: 'New Dealer', priority: 'Medium', status: 'In Progress', created: '3 hours ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Dealer Dashboard</h1>
        <p className="text-[rgb(var(--color-text-muted))] text-sm">Overview and performance stats</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Ticket Queue */}
      <div>
        <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4">Latest Activity</h2>
        <DataTable
          data={urgentTickets}
          searchKeys={['subject', 'customer']}
          columns={[
            { header: 'ID', accessor: 'id', className: 'font-mono text-xs text-[rgb(var(--color-text-muted))]' },
            { header: 'Subject', accessor: 'subject', sortable: true, className: 'font-medium' },
            { header: 'Customer', accessor: 'customer' },
            {
              header: 'Priority',
              accessor: (row) => {
                const colors = {
                  High: 'text-[rgb(var(--color-error))] bg-[rgb(var(--color-error))/0.1] border-[rgb(var(--color-error))/0.2]',
                  Medium: 'text-[rgb(var(--color-warning))] bg-[rgb(var(--color-warning))/0.1] border-[rgb(var(--color-warning))/0.2]',
                  Low: 'text-[rgb(var(--color-info))] bg-[rgb(var(--color-info))/0.1] border-[rgb(var(--color-info))/0.2]',
                };
                return (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[row.priority] || ''}`}>
                    {row.priority}
                  </span>
                );
              },
              sortable: true
            },
            { header: 'Created', accessor: 'created', className: 'text-sm text-[rgb(var(--color-text-muted))]' },
            {
              header: 'Action',
              accessor: () => (
                <button className="text-[rgb(var(--color-primary))] hover:underline text-sm font-medium">
                  View
                </button>
              )
            }
          ]}
        />
      </div>
    </div>
  );
}
