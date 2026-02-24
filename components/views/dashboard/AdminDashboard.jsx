'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { Calendar, Users, ChevronDown } from 'lucide-react';
import ActivityTimeline from '@/components/common/ActivityTimeline';
import {
  SalesBySegmentChart,
  InventoryChart,
  SalesVelocityChart,
  UnitSoldDonutChart,
  TopDealersChart,
} from './DashboardCharts';

const DesignWidget = ({
  title,
  value,
  helperText,
  trend,
  chart: ChartComponent,
  chartData,
  color = 'red',
  dropdownLabel = 'Segment',
}) => (
  <div className="bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))] flex flex-col h-full transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-sm font-semibold text-[rgb(var(--color-text-muted))]">{title}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          {value && (
            <span className="text-4xl font-bold text-[rgb(var(--color-text))]">{value}</span>
          )}
          {helperText && (
            <span className="text-sm text-[rgb(var(--color-text-muted))]">{helperText}</span>
          )}
        </div>
        {trend && (
          <div
            className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                ${trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {trend.value} {trend.label}
          </div>
        )}
      </div>
      <button className="text-xs font-medium bg-[rgb(var(--color-background))] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-100 transition-colors">
        {dropdownLabel} <ChevronDown size={14} />
      </button>
    </div>

    <div className="flex-1 w-full min-h-[100px] mt-2">
      {ChartComponent && <ChartComponent data={chartData} color={color} />}
    </div>
  </div>
);

export default function AdminDashboard({ stats, recentActivity = [], loading = false }) {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');

  // Mock Data for Design
  const topDealersData = [
    { name: 'Motor4U', sales: '85%', trend: '+12%', color: '#CCFF00' },
    { name: 'BINCA', sales: '72%', trend: '+5%', color: '#8b5cf6' },
    { name: 'TT50', sales: '64%', trend: '-2%', color: '#ec4899' },
  ];

  if (loading) return <div className="p-12 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6 animate-fade-in p-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">
            Welcome <span className="text-[#6a7150cb] font-bold">{user.name}</span>
          </h1>
          <p className="text-[rgb(var(--color-text-muted))] text-sm mt-1">
            Here&apos;s what&apos;s happening with your dealership today.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Dealers & Donut */}
        <div className="space-y-6 flex flex-col">
          {/* Top Dealers List */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))] flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Top Dealers</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 rounded-lg font-medium">This Week</span>
                <span className="px-2 py-1 bg-gray-100 rounded-lg text-gray-500">Kent</span>
              </div>
            </div>
            {/* Mini Chart for Dealers */}
            <div className="mb-4">
              <TopDealersChart />
            </div>
            <div className="space-y-4">
              {topDealersData.map((dealer, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: dealer.color }}
                    ></span>
                    <span className="font-medium text-sm text-[rgb(var(--color-text))]">
                      {dealer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">{dealer.sales}</span>
                    <span
                      className={`text-xs ${dealer.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {dealer.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Selling Model (Green Card) - Optional/Placeholder */}
          <div className="bg-[#CCFF00] rounded-3xl p-6 shadow-sm relative overflow-hidden text-black min-h-[160px]">
            <h3 className="font-bold text-lg mb-1">Best Selling Model</h3>
            <div className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Users size={20} />
            </div>
            <div className="mt-6">
              <div className="text-4xl font-extrabold">
                {stats?.topDealership || 'Toyota Corolla E210'}
              </div>
              <div className="text-sm font-medium opacity-80">Best Performing</div>
            </div>
          </div>

          {/* Unit Sold Segment Donut */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))]">
            <h3 className="font-bold text-lg text-[rgb(var(--color-text))] mb-4">
              Unit Sold/Segment
            </h3>
            <UnitSoldDonutChart />
          </div>
        </div>

        {/* Column 2: Sales Charts */}
        <div className="space-y-6 flex flex-col">
          <DesignWidget
            title="Sales By Segment"
            value={stats?.quotes || '398'}
            trend={{
              value: `${stats?.monthlyGrowth || -4.3}%`,
              label: 'month over month',
              isPositive: (stats?.monthlyGrowth || -4.3) > 0,
            }}
            chart={SalesBySegmentChart}
            color="red"
          />

          <DesignWidget
            title="Sales Velocity"
            value={stats?.conversionRate ? `${stats.conversionRate}%` : '26%'}
            helperText="Conversion Rate"
            trend={{ value: '+5%', label: 'vs last month', isPositive: true }}
            chart={SalesVelocityChart}
            color="green"
            dropdownLabel="Maker"
          />
        </div>

        {/* Column 3: Inventory Charts */}
        <div className="space-y-6 flex flex-col">
          <DesignWidget
            title="Overview"
            value={`${stats?.dealers || 15} Dealers`}
            helperText="Active Dealerships"
            trend={{ value: '+2', label: 'new this month', isPositive: true }}
            chart={InventoryChart}
            color="red"
          />

          <DesignWidget
            title="Sales Velocity"
            value="14"
            helperText="days"
            trend={{ value: '-2', label: 'days this month', isPositive: false }}
            chart={(props) => <SalesVelocityChart {...props} color="red" />}
            color="red"
            dropdownLabel="Model"
          />
        </div>
      </div>

      {/* Bottom Section: Units Sold & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))]">
          <h3 className="font-bold text-lg text-[rgb(var(--color-text))] mb-6">
            Units Sold and Inventory
          </h3>
          <div className="space-y-4">
            {/* Custom Bar/Progress Rows */}
            {['Toyota', 'Honda', 'Nissan'].map((brand) => (
              <div key={brand} className="flex items-center gap-4">
                <div className="w-20 font-bold text-sm">{brand}</div>
                <div className="flex-1 space-y-1">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: '70%' }}
                    ></div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#CCFF00] rounded-full"
                      style={{ width: '45%' }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 w-12 text-right">
                  <div>319k</div>
                  <div>250k</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Recent Activity moved to bottom right */}
        <div className="bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))] flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Recent Activity</h3>
            <Link href="#" className="text-xs text-blue-500 font-bold">
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2">
            <ActivityTimeline activities={recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}
