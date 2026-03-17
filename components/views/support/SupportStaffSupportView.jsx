'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Ticket,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  MoreHorizontal,
  User,
  MessageSquare,
  ChevronRight,
  File,
  Send,
  Tag,
  Calendar,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Shield,
  Flag,
  Trash2,
  Clock,
  Building2,
} from 'lucide-react';
import Loader from '@/components/common/Loader';
import Input from '@/components/common/Input';
import StatCard from '@/components/common/StatCard';
import Swal from 'sweetalert2';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import supportService from '@/services/supportService';
import tagService from '@/services/tagService';
import TagInput from '@/components/common/tags/TagInput';
import TagBadge from '@/components/common/tags/TagBadge';
import TagList from '@/components/common/tags/TagList';
import TabNavigation from '@/components/common/TabNavigation';
import PageHeader from '@/components/common/PageHeader';
import CustomSelect from '@/components/common/CustomSelect';
import LinkifiedText from '@/components/common/LinkifiedText';
import { formatDate } from '@/utils/i18n';
import { canManageTickets, canViewReports } from '@/utils/roleUtils';
import AccessDenied from '@/components/common/AccessDenied';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SupportStaffSupportView() {
  const { user } = useAuth();
  const canManageTickets_perm = canManageTickets(user);
  const canViewAnalytics_perm = canViewReports(user);

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    summary: [],
    trends: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketFilter, setTicketFilter] = useState('All');
  const [recentlyChangedIds, setRecentlyChangedIds] = useState(new Set());
  const [replyText, setReplyText] = useState('');
  const [trendsTimeframe, setTrendsTimeframe] = useState(7);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');

  // Filter State
  const normalizeTicket = useCallback((t) => {
    if (!t) return null;
    const clean = (val) => (val === 'N/A' || val === 'undefined' || val === 'null' ? '' : val);

    const fallback = {
      user: 'Unknown User',
      role: 'Dealer',
      status: 'open',
      priority: 'medium',
      subject: 'No Subject',
      dealership: '',
      sla: '',
      date: 'N/A',
      created_at: new Date().toISOString(),
    };
    return {
      ...t,
      id: t.id?.toString(),
      user: clean(t.user_name || t.user || t.user_email) || fallback.user,
      email: clean(t.user_email) || '',
      role: clean(t.role || t.user_role) || fallback.role,
      status: clean(t.status) || fallback.status,
      priority: clean(t.priority) || fallback.priority,
      subject: clean(t.subject || t.title) || fallback.subject,
      dealership: clean(t.dealership_name || t.dealership) || fallback.dealership,
      sla: clean(t.sla || t.sla_status) || fallback.sla,
      date: clean(t.date) || (t.created_at ? formatDate(t.created_at) : fallback.date),
      created_at: t.created_at || fallback.created_at,
      resolved_at: t.resolved_at || null,
    };
  }, []);

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const ticketsData = await supportService.getTickets();

        const rawTickets = Array.isArray(ticketsData)
          ? ticketsData
          : ticketsData?.data?.list || ticketsData?.data?.tickets || ticketsData?.list || [];
        const loadedTickets = rawTickets.map(normalizeTicket).filter(Boolean);
        setTickets(loadedTickets);

        // 2. Calculate Trends
        const calculateTrends = (allTickets, days) => {
          const timeframe = [...Array(days)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            return {
              date: d.toISOString().split('T')[0],
              name: d.toLocaleDateString('en-US', { weekday: 'short' }),
              created: 0,
              resolved: 0,
            };
          });

          allTickets.forEach((t) => {
            const createdDate = new Date(t.created_at).toISOString().split('T')[0];
            // Fallback: if status is resolved but resolved_at is missing, use updated_at or created_at
            const resolvedDateStr =
              t.resolved_at || (t.status === 'resolved' ? t.updated_at || t.created_at : null);
            const resolvedDate = resolvedDateStr
              ? new Date(resolvedDateStr).toISOString().split('T')[0]
              : null;

            const creationDay = timeframe.find((d) => d.date === createdDate);
            if (creationDay) creationDay.created++;

            if (resolvedDate) {
              const resolutionDay = timeframe.find((d) => d.date === resolvedDate);
              if (resolutionDay) resolutionDay.resolved++;
            }
          });

          return timeframe;
        };

        const summary = ticketsData?.data?.summary || {
          total_tickets: loadedTickets.length,
          open: loadedTickets.filter((t) => t.status === 'open').length,
          closed: loadedTickets.filter((t) => t.status === 'closed').length,
          resolved: loadedTickets.filter((t) => t.status === 'resolved').length,
          in_progress: loadedTickets.filter((t) => t.status === 'in_progress').length,
        };

        const trends = calculateTrends(loadedTickets, trendsTimeframe);

        setStats({
          summary: [
            {
              title: 'Total Tickets',
              value: summary.total_tickets || 0,
              trend: { positive: true, label: '+0%' },
              icon: <Ticket size={24} />,
              accent: 'rgb(var(--color-primary))',
            },
            {
              title: 'Open',
              value: summary.open || 0,
              trend: { positive: false, label: '+0%' },
              icon: <Clock size={24} />,
              accent: 'rgb(var(--color-warning))',
            },
            {
              title: 'Closed',
              value: summary.closed || 0,
              trend: { positive: true, label: '+0%' },
              icon: <XCircle size={24} />,
              accent: 'rgb(var(--color-info))',
            },
            {
              title: 'Resolved',
              value: summary.resolved || 0,
              trend: { positive: true, label: '+0%' },
              icon: <CheckCircle size={24} />,
              accent: 'rgb(var(--color-success))',
            },
          ],
          trends: trends,
        });
      } catch (error) {
        console.warn('Failed to load data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [trendsTimeframe, normalizeTicket]);

  const loadTicketDetails = useCallback(
    async (ticket) => {
      try {
        setSelectedTicket(ticket);
        const fullTicket = await supportService.getTicketById(ticket.id);
        const ticketData = normalizeTicket(fullTicket?.data || fullTicket);

        // Fetch Tags for the ticket
        try {
          const ticketTags = await tagService.getEntityTags('support_ticket', ticket.id);
          ticketData.tags = ticketTags;
        } catch (tagError) {
          console.error('Failed to fetch ticket tags', tagError);
        }

        setSelectedTicket(ticketData);
      } catch (error) {
        console.error('Failed to load ticket details', error);
      }
    },
    [setSelectedTicket, normalizeTicket]
  );

  // Handle highlightId
  useEffect(() => {
    if (highlightId && tickets.length > 0) {
      const ticket = tickets.find((t) => t.id === highlightId);
      if (ticket) {
        loadTicketDetails(ticket);
        setActiveTab('tickets');
        // Optional: scroll to the ticket element if needed
        setTimeout(() => {
          const element = document.getElementById(`ticket-${highlightId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setRecentlyChangedIds((prev) => new Set(prev).add(highlightId));
            // Clear highlight after some time
            setTimeout(() => {
              setRecentlyChangedIds((prev) => {
                const next = new Set(prev);
                next.delete(highlightId);
                return next;
              });
            }, 2000);
          }
        }, 500);
      }
    }
  }, [highlightId, tickets, loadTicketDetails, setActiveTab, setRecentlyChangedIds]);

  const handleAddMessage = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      await supportService.addResponse(selectedTicket.id, {
        comment: replyText,
        is_internal: false,
      });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Comment added',
        showConfirmButton: false,
        timer: 1500,
      });
      setReplyText('');
      loadTicketDetails(selectedTicket);
    } catch (error) {
      console.error('Failed to add comment', error);
      Swal.fire('Error', 'Could not add comment', 'error');
    }
  };

  const [openActionMenu, setOpenActionMenu] = useState(null);

  const handleTicketAction = async (action, ticketId) => {
    const title =
      action === 'De-escalate'
        ? 'De-escalate Ticket?'
        : action === 'Delete'
          ? 'Close Ticket?'
          : `Mark as ${action}?`;

    const confirmText =
      action === 'De-escalate'
        ? 'This will return the ticket to medium priority.'
        : action === 'Delete'
          ? 'This will mark the ticket as closed.'
          : `Set status to ${action.toLowerCase()}?`;

    Swal.fire({
      title: title,
      text: confirmText,
      icon: action === 'Delete' ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'Delete' ? '#d33' : 'rgb(var(--color-primary))',
      confirmButtonText: 'Confirm',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let statusUpdate = { status: action.toLowerCase() };

          if (action === 'De-escalate') {
            statusUpdate = { status: 'open', priority: 'medium' };
          } else if (action === 'Delete' || action === 'Closed') {
            statusUpdate = { status: 'closed' };
          } else if (action === 'Resolved') {
            statusUpdate = { status: 'resolved', resolution_note: 'Resolved by Support Team' };
          }

          await supportService.deleteTicket(ticketId);

          const now = new Date().toISOString();
          const updatedTickets = tickets.map((t) => {
            if (t.id === ticketId) {
              const updated = { ...t, ...statusUpdate };
              if (action === 'Resolved') updated.resolved_at = now;
              return updated;
            }
            return t;
          });
          setTickets(updatedTickets);

          if (selectedTicket?.id === ticketId) {
            const updatedSelected = { ...selectedTicket, ...statusUpdate };
            if (action === 'Resolved') updatedSelected.resolved_at = now;
            setSelectedTicket(updatedSelected);
          }
          setRecentlyChangedIds((prev) => new Set(prev).add(ticketId));
          Swal.fire('Updated!', `Ticket updated successfully.`, 'success');
        } catch (error) {
          console.error('Action failed', error);
          Swal.fire('Error', 'Failed to update ticket', 'error');
        }
      }
    });
  };

  const StatusBadge = ({ status }) => {
    const styles =
      {
        open: 'bg-blue-50 text-blue-700 border-blue-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        closed: 'bg-gray-50 text-gray-700 border-gray-200',
      }[status.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';

    const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles}`}>
        {label}
      </span>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const styles =
      {
        critical: 'text-red-600 bg-red-50 border-red-100',
        high: 'text-orange-600 bg-orange-50 border-orange-100',
        medium: 'text-blue-600 bg-blue-50 border-blue-100',
        low: 'text-gray-600 bg-gray-50 border-gray-100',
      }[priority.toLowerCase()] || 'text-gray-600';
    return (
      <span
        className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${styles}`}
      >
        <Flag size={10} strokeWidth={3} /> {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <PageHeader
        title="Support Management"
        subtitle="Support ticketing, performance analytics, and helpdesk."
        actions={
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { key: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
              { key: 'tickets', label: 'Helpdesk', icon: Ticket },
            ]}
          />
        }
      />

      {/* --- DASHBOARD (ANALYTICS) --- */}
      {activeTab === 'dashboard' &&
        (!canViewAnalytics_perm ? (
          <div className="min-h-[400px] flex items-center justify-center bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl shadow-sm">
            <AccessDenied
              title="Analytics Access Denied"
              message="You do not have the required permissions to view support analytics. Please contact your administrator to enable 'View Reports' permission."
              showAction={false}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                <div className="col-span-4 flex justify-center py-12">
                  <Loader />
                </div>
              ) : (Array.isArray(stats) ? stats : stats?.summary || []).length > 0 ? (
                (Array.isArray(stats) ? stats : stats.summary).map((stat, i) => (
                  <StatCard
                    key={i}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    trend={stat.trend}
                    accent={stat.accent}
                  />
                ))
              ) : (
                <div className="col-span-4 text-center py-10 text-gray-500">
                  No stats available...
                </div>
              )}
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Trends */}
              <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] p-6 rounded-3xl border border-[rgb(var(--color-border))] shadow-sm">
                {loading ? (
                  <div className="h-[350px] w-full flex items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">
                        Weekly Ticket Trends
                      </h3>
                      <CustomSelect
                        value={trendsTimeframe}
                        onChange={(e) => setTrendsTimeframe(Number(e.target.value))}
                        options={[
                          { value: 7, label: 'Last 7 Days' },
                          { value: 30, label: 'Last 30 Days' },
                        ]}
                        className="w-28"
                        size="sm"
                      />
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.trends || []}>
                          <defs>
                            <linearGradient id="colorSupportCreated" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="rgb(var(--color-primary))"
                                stopOpacity={0.1}
                              />
                              <stop
                                offset="95%"
                                stopColor="rgb(var(--color-primary))"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient id="colorSupportResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="rgb(var(--color-success))"
                                stopOpacity={0.1}
                              />
                              <stop
                                offset="95%"
                                stopColor="rgb(var(--color-success))"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgb(var(--color-border))"
                          />
                          <XAxis
                            dataKey="name"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'rgb(var(--color-text-muted))' }}
                          />
                          <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'rgb(var(--color-text-muted))' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgb(var(--color-surface))',
                              borderRadius: '16px',
                              border: '1px solid rgb(var(--color-border))',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="created"
                            stroke="rgb(var(--color-primary))"
                            fillOpacity={1}
                            fill="url(#colorSupportCreated)"
                            strokeWidth={3}
                          />
                          <Area
                            type="monotone"
                            dataKey="resolved"
                            stroke="rgb(var(--color-success))"
                            fillOpacity={1}
                            fill="url(#colorSupportResolved)"
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>

              {/* Priority Distribution */}
              <div className="bg-[rgb(var(--color-surface))] p-6 rounded-3xl border border-[rgb(var(--color-border))] shadow-sm flex flex-col">
                {loading ? (
                  <div className="h-[350px] w-full flex items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6">
                      Priority Distribution
                    </h3>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={(() => {
                                const counts = { critical: 0, high: 0, medium: 0, low: 0 };
                                tickets.forEach((t) => {
                                  const p = (t.priority || 'medium').toLowerCase();
                                  if (counts[p] !== undefined) counts[p]++;
                                });
                                const data = [
                                  { name: 'Critical', value: counts.critical, color: '#ef4444' },
                                  { name: 'High', value: counts.high, color: '#f59e0b' },
                                  { name: 'Medium', value: counts.medium, color: '#3b82f6' },
                                  {
                                    name: 'Low',
                                    value: counts.low,
                                    color: 'rgb(var(--color-text-muted))',
                                  },
                                ].filter((d) => d.value > 0);
                                return data;
                              })()}
                              innerRadius={65}
                              outerRadius={85}
                              paddingAngle={5}
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={1000}
                            >
                              {(() => {
                                const counts = { critical: 0, high: 0, medium: 0, low: 0 };
                                tickets.forEach((t) => {
                                  const p = (t.priority || 'medium').toLowerCase();
                                  if (counts[p] !== undefined) counts[p]++;
                                });
                                return [
                                  { name: 'Critical', value: counts.critical, color: '#ef4444' },
                                  { name: 'High', value: counts.high, color: '#f59e0b' },
                                  { name: 'Medium', value: counts.medium, color: '#3b82f6' },
                                  {
                                    name: 'Low',
                                    value: counts.low,
                                    color: 'rgb(var(--color-text-muted))',
                                  },
                                ].filter((d) => d.value > 0);
                              })().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgb(var(--color-surface))',
                                borderRadius: '12px',
                                border: '1px solid rgb(var(--color-border))',
                                fontSize: '12px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-8 grid grid-cols-1 gap-3">
                        {[
                          { label: 'Critical', color: 'bg-red-500', key: 'critical' },
                          { label: 'High', color: 'bg-amber-500', key: 'high' },
                          { label: 'Medium', color: 'bg-blue-500', key: 'medium' },
                          { label: 'Low', color: 'bg-[rgb(var(--color-text-muted))]', key: 'low' },
                        ].map((item, i) => {
                          const count = tickets.filter(
                            (t) => (t.priority || '').toLowerCase() === item.key
                          ).length;
                          const percentage =
                            tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
                          return (
                            <div key={i} className="flex items-center group">
                              <div
                                className={`w-3 h-3 rounded-full ${item.color} mr-3 shadow-sm group-hover:scale-110 transition-transform`}
                              />
                              <span className="text-xs font-bold text-[rgb(var(--color-text))] flex-1">
                                {item.label}
                              </span>
                              <span className="text-[rgb(var(--color-text-muted))] text-xs font-mono bg-[rgb(var(--color-background))] px-2 py-0.5 rounded-lg border border-[rgb(var(--color-border))]">
                                {percentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* --- HELPDESK (TICKETS) --- */}
      {activeTab === 'tickets' &&
        (!canManageTickets_perm ? (
          <div className="min-h-[400px] flex items-center justify-center bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl shadow-sm">
            <AccessDenied
              title="Helpdesk Access Denied"
              message="You do not have the required permissions to view or manage support tickets. Please contact your administrator to enable 'Manage Tickets' permission."
              showAction={false}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
            {/* Ticket List Panel */}
            <div
              className={`flex flex-col flex-1 lg:flex-none ${selectedTicket ? 'hidden lg:flex lg:w-1/3' : 'w-full lg:w-1/3'} bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden shadow-sm`}
            >
              <div className="p-4 border-b border-[rgb(var(--color-border))] space-y-3">
                <div className="flex gap-2 relative">
                  <Input
                    type="text"
                    placeholder="Search details..."
                    icon={Search}
                    rightIcon={searchQuery ? X : null}
                    onRightIconClick={() => setSearchQuery('')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-0 w-full"
                    inputClassName="h-10 pl-10 pr-10"
                  />
                </div>
                <div className="flex gap-2 text-xs overflow-x-auto no-scrollbar pb-1">
                  {['All', 'Open', 'Closed', 'Resolved'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTicketFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${ticketFilter === filter ? 'bg-[rgb(var(--color-primary))] text-white border-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] text-[rgb(var(--color-text-muted))]'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader />
                  </div>
                ) : (
                  (() => {
                    const filteredTickets = tickets.filter((ticket) => {
                      const matchesFilter =
                        ticketFilter === 'All' ||
                        (ticketFilter === 'Open' && ticket.status?.toLowerCase() === 'open') ||
                        (ticketFilter === 'Closed' && ticket.status?.toLowerCase() === 'closed') ||
                        (ticketFilter === 'Resolved' &&
                          ticket.status?.toLowerCase() === 'resolved') ||
                        recentlyChangedIds.has(ticket.id);

                      const matchesSearch =
                        !searchQuery.trim() ||
                        ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ticket.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ticket.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ticket.dealership?.toLowerCase().includes(searchQuery.toLowerCase());

                      return matchesFilter && matchesSearch;
                    });

                    if (filteredTickets.length === 0) {
                      return (
                        <div className="p-8 text-center text-[rgb(var(--color-text-muted))] opacity-60">
                          <Ticket size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-bold">No tickets found</p>
                          <p className="text-[10px] uppercase mt-1">Try adjusting your filters</p>
                        </div>
                      );
                    }

                    return filteredTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        id={`ticket-${ticket.id}`}
                        onClick={() => loadTicketDetails(ticket)}
                        className={`w-full text-left p-4 border-b border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))] transition-all group relative ${selectedTicket?.id === ticket.id ? 'bg-[rgb(var(--color-primary))/0.04] border-l-4 border-l-[rgb(var(--color-primary))]' : 'border-l-4 border-l-transparent hover:border-l-[rgb(var(--color-border))]'} ${recentlyChangedIds.has(ticket.id) ? 'bg-[rgb(var(--color-primary))/0.1] ring-2 ring-[rgb(var(--color-primary))] z-10' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {ticket.user_image || ticket.profile_image ? (
                              <Image
                                src={ticket.user_image || ticket.profile_image}
                                alt=""
                                width={40}
                                height={40}
                                unoptimized
                                className="w-10 h-10 rounded-full object-cover border border-[rgb(var(--color-border))]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] flex items-center justify-center text-[10px] font-bold text-[rgb(var(--color-text-muted))] group-hover:border-[rgb(var(--color-primary))/0.3] transition-colors">
                                {(ticket.user || 'U').charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-mono font-bold text-[rgb(var(--color-text-muted))]">
                                #{ticket.ticket_number || ticket.id?.slice(0, 8)}
                              </span>
                              <span className="text-[9px] font-bold text-[rgb(var(--color-text-muted))] opacity-60">
                                {ticket.date}
                              </span>
                            </div>
                            <h4 className="font-bold text-[rgb(var(--color-text))] text-sm mb-1 line-clamp-1 group-hover:text-[rgb(var(--color-primary))] transition-colors">
                              {ticket.subject}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-[11px] text-[rgb(var(--color-text-muted))] truncate font-medium flex-1">
                                {ticket.dealership || ticket.user}
                              </p>
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ticket.priority?.toLowerCase() === 'urgent'
                                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'
                                    : ticket.priority?.toLowerCase() === 'high'
                                      ? 'bg-orange-500'
                                      : ticket.priority?.toLowerCase() === 'medium'
                                        ? 'bg-blue-500'
                                        : 'bg-gray-400'
                                }`}
                                title={`Priority: ${ticket.priority}`}
                              />
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <User size={10} className="text-[rgb(var(--color-text-muted))]" />
                                <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] truncate max-w-[80px]">
                                  {ticket.user}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ));
                  })()
                )}
              </div>
            </div>

            {/* Ticket Detail Panel */}
            {selectedTicket ? (
              <div className="flex-1 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden flex flex-col shadow-sm">
                {/* Detail Header */}
                <div className="p-6 border-b border-[rgb(var(--color-border))] flex flex-col md:flex-row justify-between items-start gap-6 bg-[rgb(var(--color-surface))] relative z-10">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="lg:hidden p-2 -ml-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] rounded-xl transition-all"
                      >
                        <ChevronRight className="rotate-180" size={20} />
                      </button>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] px-2 py-0.5 rounded-full">
                            #{selectedTicket.ticket_number || selectedTicket.id?.slice(0, 8)}
                          </span>
                          <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest">
                            {selectedTicket.date}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-[rgb(var(--color-text))] tracking-tight">
                          {selectedTicket.subject}
                        </h2>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedTicket.user && selectedTicket.user !== 'Unknown User' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] shadow-sm group hover:border-[rgb(var(--color-primary))] transition-all">
                          <div className="w-5 h-5 rounded-full bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[10px] font-bold text-[rgb(var(--color-primary))]">
                            {selectedTicket.user.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-[rgb(var(--color-text))]">
                            {selectedTicket.user}
                          </span>
                        </div>
                      )}
                      {selectedTicket.dealership &&
                        selectedTicket.dealership !== '' &&
                        selectedTicket.dealership !== 'N/A' && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] shadow-sm">
                            <Building2 size={14} className="text-[rgb(var(--color-text-muted))]" />
                            <span className="text-xs font-bold text-[rgb(var(--color-text))]">
                              {selectedTicket.dealership}
                            </span>
                          </div>
                        )}
                      <PriorityBadge priority={selectedTicket.priority} />
                      <StatusBadge status={selectedTicket.status} />
                    </div>

                    <div className="pt-1">
                      <TagList tags={selectedTicket.tags || []} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-start">
                    {selectedTicket.sla && selectedTicket.sla !== '' && (
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider ${
                          selectedTicket.sla.includes('Breached')
                            ? 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}
                      >
                        {selectedTicket.sla.includes('Breached') ? (
                          <AlertTriangle size={12} />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        {selectedTicket.sla}
                      </div>
                    )}

                    <div className="relative">
                      <button
                        onClick={() =>
                          canManageTickets_perm &&
                          setOpenActionMenu(
                            openActionMenu === selectedTicket.id ? null : selectedTicket.id
                          )
                        }
                        disabled={!canManageTickets_perm}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-[rgb(var(--color-primary)/0.2)] transition-all active:scale-95 flex items-center gap-2 ${
                          canManageTickets_perm
                            ? 'bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-dark))]'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                        title={
                          canManageTickets_perm
                            ? 'Manage Ticket'
                            : "You don't have permission to manage tickets."
                        }
                      >
                        Manage Ticket{' '}
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${openActionMenu === selectedTicket.id ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {openActionMenu === selectedTicket.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenActionMenu(null)}
                          ></div>
                          <div className="absolute left-0 top-full mt-2 w-56 bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl border border-[rgb(var(--color-border))] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-2 space-y-1">
                              <p className="px-3 py-2 text-[10px] font-black text-[rgb(var(--color-text-muted))] uppercase tracking-widest opacity-60">
                                Status Actions
                              </p>
                              {selectedTicket.status !== 'resolved' && (
                                <button
                                  onClick={() => {
                                    handleTicketAction('Resolved', selectedTicket.id);
                                    setOpenActionMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors"
                                >
                                  <CheckCircle size={16} /> Mark as Resolved
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  handleTicketAction('Closed', selectedTicket.id);
                                  setOpenActionMenu(null);
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-xl flex items-center gap-3 transition-colors"
                              >
                                <XCircle size={16} /> Close Ticket
                              </button>

                              {selectedTicket.escalated && (
                                <button
                                  onClick={() => {
                                    handleTicketAction('De-escalate', selectedTicket.id);
                                    setOpenActionMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl flex items-center gap-3 transition-colors"
                                >
                                  <Shield size={16} /> Resolve Escalation
                                </button>
                              )}

                              <div className="h-px bg-[rgb(var(--color-border))] my-2 mx-1"></div>
                              <p className="px-3 py-2 text-[10px] font-black text-[rgb(var(--color-text-muted))] uppercase tracking-widest opacity-60">
                                System Actions
                              </p>

                              <button
                                onClick={() => {
                                  handleTicketAction('Delete', selectedTicket.id);
                                  setOpenActionMenu(null);
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"
                              >
                                <Trash2 size={16} /> Delete Ticket
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[rgb(var(--color-background))/0.3] custom-scrollbar scroll-smooth">
                  <div className="max-w-4xl mx-auto space-y-8">
                    {/* Initial Request */}
                    <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex gap-4 max-w-[80%] lg:max-w-[70%]">
                        {selectedTicket.user_image || selectedTicket.profile_image ? (
                          <Image
                            src={selectedTicket.user_image || selectedTicket.profile_image}
                            alt={selectedTicket.user}
                            width={44}
                            height={44}
                            unoptimized
                            className="w-11 h-11 rounded-2xl object-cover shadow-md border-2 border-[rgb(var(--color-surface))] ring-1 ring-[rgb(var(--color-border))]"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black shadow-md bg-[rgb(var(--color-primary))] text-white border-2 border-[rgb(var(--color-surface))] ring-1 ring-[rgb(var(--color-border))] uppercase">
                            {(selectedTicket.user || selectedTicket.user_name || 'D').charAt(0)}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 px-1">
                            <span className="text-[11px] font-black text-[rgb(var(--color-text))] uppercase tracking-wider">
                              {selectedTicket.user || selectedTicket.user_name || 'Dealer'}
                            </span>
                            <span className="text-[10px] text-[rgb(var(--color-text-muted))] font-bold opacity-60">
                              {selectedTicket.created_at
                                ? new Date(selectedTicket.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] text-[9px] font-black uppercase tracking-widest">
                              Initial Request
                            </span>
                          </div>
                          <div className="relative p-5 rounded-3xl shadow-sm border bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))] rounded-tl-none group hover:shadow-md transition-all duration-300">
                            <LinkifiedText
                              text={
                                selectedTicket.description ||
                                selectedTicket.message ||
                                'No description provided.'
                              }
                              className="text-sm text-[rgb(var(--color-text))] leading-relaxed break-words font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Responses */}
                    {selectedTicket.history &&
                      selectedTicket.history.length > 0 &&
                      selectedTicket.history.map((msg, i) => {
                        if (msg.action !== 'RESPONSE_ADDED' && !msg.comment) return null;

                        const isStaff = msg.user_id !== selectedTicket.user_id;

                        return (
                          <div
                            key={i}
                            className={`flex w-full ${isStaff ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                            style={{ animationDelay: `${(i + 1) * 50}ms` }}
                          >
                            <div
                              className={`flex gap-4 max-w-[80%] lg:max-w-[70%] ${isStaff ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              {msg.user_image || msg.profile_image ? (
                                <Image
                                  src={msg.user_image || msg.profile_image}
                                  alt={msg.user_name}
                                  width={44}
                                  height={44}
                                  unoptimized
                                  className={`w-11 h-11 rounded-2xl object-cover shadow-md border-2 border-[rgb(var(--color-surface))] ring-1 ring-[rgb(var(--color-border))] ${isStaff ? 'ring-[rgb(var(--color-primary))/0.3]' : 'ring-[rgb(var(--color-border))]/50'}`}
                                />
                              ) : (
                                <div
                                  className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black shadow-md border-2 border-[rgb(var(--color-surface))] ring-1 ring-[rgb(var(--color-border))] uppercase ${
                                    isStaff
                                      ? 'bg-[rgb(var(--color-primary))] text-white'
                                      : 'bg-[rgb(var(--color-text-muted))] text-white'
                                  }`}
                                >
                                  {(msg.user_name || (isStaff ? 'S' : 'D')).charAt(0)}
                                </div>
                              )}
                              <div className={`space-y-2 ${isStaff ? 'text-right' : 'text-left'}`}>
                                <div
                                  className={`flex items-center gap-3 px-1 ${isStaff ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                  <span className="text-[11px] font-black text-[rgb(var(--color-text))] uppercase tracking-wider">
                                    {isStaff
                                      ? msg.user_name || 'Support Team'
                                      : msg.user_name || 'Dealer'}
                                  </span>
                                  <span className="text-[10px] text-[rgb(var(--color-text-muted))] font-bold opacity-60">
                                    {msg.created_at
                                      ? new Date(msg.created_at).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : 'N/A'}
                                  </span>
                                </div>
                                <div
                                  className={`relative p-5 rounded-3xl shadow-sm border transition-all duration-300 hover:shadow-md ${
                                    isStaff
                                      ? 'bg-[rgb(var(--color-primary))/0.08] border-[rgb(var(--color-primary))/0.1] rounded-tr-none text-[rgb(var(--color-primary))] font-medium'
                                      : 'bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))] rounded-tl-none text-[rgb(var(--color-text))] font-medium'
                                  }`}
                                >
                                  <LinkifiedText
                                    text={msg.comment}
                                    className="text-sm leading-relaxed break-words whitespace-pre-wrap"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Reply Box */}
                <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
                  <div className="flex gap-3">
                    <button className="p-3 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] transition-colors">
                      <Plus size={20} />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
                        placeholder="Reply to customer..."
                        className="w-full bg-[rgb(var(--color-background))] pl-4 pr-12 py-3 rounded-xl border border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] outline-none text-sm transition-all"
                      />
                      <button
                        onClick={handleAddMessage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white transition-colors bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))]"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex flex-1 items-center justify-center bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden text-[rgb(var(--color-text-muted))] flex-col gap-4 border-dashed">
                <div className="w-20 h-20 bg-[rgb(var(--color-background))] rounded-full flex items-center justify-center">
                  <MessageSquare size={40} className="opacity-30" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">
                    No Ticket Selected
                  </h3>
                  <p className="text-sm opacity-70">
                    Select a ticket from the helpdesk list to view details.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
