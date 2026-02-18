'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Ticket,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  User,
  MessageSquare,
  ChevronRight,
  File,
  Send,
  Tag,
  Calendar,
  TrendingUp,
  Users,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ArrowRight,
  Star,
  Shield,
  Flag,
  Trash2,
  Edit,
  Building2,
  XCircle,
} from 'lucide-react';
import Loader from '@/components/common/Loader';
import Swal from 'sweetalert2';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import supportService from '@/services/supportService';
import TabNavigation from '@/components/common/TabNavigation';
import StatCard from '@/components/common/StatCard';
import GenericFormModal from '@/components/common/FormModal';
import * as yup from 'yup';
import PageHeader from '@/components/common/PageHeader';
import LinkifiedText from '@/components/common/LinkifiedText';
import { formatDate } from '@/utils/i18n';

const ticketSchema = yup.object().shape({
  subject: yup.string().required('Subject is required'),
  category: yup.string().required('Category is required'),
  priority: yup.string().required('Priority is required'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
});

const ticketFields = [
  {
    name: 'subject',
    label: 'Subject',
    placeholder: 'Brief summary of the issue',
    type: 'text',
    icon: FileText,
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    icon: Tag,
    options: [
      { value: '', label: 'Select Category' },
      { value: 'technical', label: 'Technical Issue' },
      { value: 'question', label: 'Question' },
      { value: 'billing', label: 'Billing' },
      { value: 'feature_request', label: 'Feature Request' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    icon: AlertCircle,
    options: [
      { value: '', label: 'Select Priority' },
      { value: 'low', label: 'Low - General Inquiry' },
      { value: 'medium', label: 'Medium - Standard Issue' },
      { value: 'high', label: 'High - Urgent Attention' },
      { value: 'urgent', label: 'Critical - System Blocker' },
    ],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Please provide detailed information about your request...',
    icon: MessageSquare,
  },
  { name: 'attachments', label: 'Attachments', type: 'file', multiple: true, icon: FileText },
];

export default function AdminSupportView() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketFilter, setTicketFilter] = useState('All');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [trendsTimeframe, setTrendsTimeframe] = useState(7);

  const [refreshKey, setRefreshKey] = useState(0);

  const normalizeTicket = (data, fallback = {}) => {
    if (!data) return null;
    const clean = (val) => (val === 'N/A' || val === 'undefined' || val === 'null' ? '' : val);

    return {
      ...data,
      id: data.id?.toString(),
      user:
        clean(data.user_name || data.user || data.user_email) || fallback.user || 'Unknown User',
      user_id: data.user_id || data.author_id || '',
      role:
        clean(data.user_role || data.role) ||
        fallback.role ||
        (data.user_id === data.ticket_user_id ? 'Dealer' : 'User'),
      status: clean(data.status) || fallback.status || 'open',
      priority: clean(data.priority) || fallback.priority || 'medium',
      subject: clean(data.subject || data.title) || fallback.subject || 'No Subject',
      description:
        clean(data.description || data.message || data.content) || fallback.description || '',
      dealership: clean(data.dealership_name || data.dealership) || fallback.dealership || '',
      sla: clean(data.sla || data.sla_status) || fallback.sla || '',
      date:
        clean(data.date) ||
        fallback.date ||
        (data.created_at ? formatDate(data.created_at) : 'N/A'),
      created_at:
        data.created_at || data.createdAt || fallback.created_at || new Date().toISOString(),
      history: Array.isArray(data.history)
        ? data.history.map((h) => ({
            ...h,
            comment: clean(h.comment || h.message || h.text),
            created_at: h.created_at || h.createdAt,
          }))
        : [],
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ticketsData, docsData] = await Promise.all([
          supportService.getTickets(),
          supportService.getDocs(),
        ]);

        // Normalize tickets
        const rawTickets = Array.isArray(ticketsData)
          ? ticketsData
          : ticketsData.data?.list || ticketsData.data?.tickets || ticketsData.list || [];
        const normalizedTickets = rawTickets.map((t) => normalizeTicket(t)).filter(Boolean);
        setTickets(normalizedTickets);

        // Calculate Trends
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

        setTrendData(calculateTrends(normalizedTickets, trendsTimeframe));

        // Normalize stats
        const summary = ticketsData.data?.summary || {
          total_tickets: normalizedTickets.length,
          open: normalizedTickets.filter((t) => t.status === 'open').length,
          resolved: normalizedTickets.filter((t) => t.status === 'resolved').length,
        };

        const mappedStats = [
          {
            title: 'Total Tickets',
            value: summary.total_tickets || 0,
            trend: { positive: true, label: '+ this week' },
            accent: 'rgb(var(--color-primary))',
            icon: <Ticket size={24} />,
          },
          {
            title: 'Open',
            value: summary.open || 0,
            trend: { positive: false, label: '+ this week' },
            accent: 'rgb(var(--color-warning))',
            icon: <Clock size={24} />,
          },
          {
            title: 'Resolved',
            value: summary.resolved || 0,
            trend: { positive: true, label: '+ this week' },
            accent: 'rgb(var(--color-success))',
            icon: <CheckCircle size={24} />,
          },
        ];
        setStats(mappedStats);

        // Normalize docs
        const rawDocs = Array.isArray(docsData)
          ? docsData
          : docsData.data?.data ||
            (Array.isArray(docsData.data)
              ? docsData.data
              : docsData.data?.documentation || docsData.data?.docs || docsData.docs || []);
        setDocs(
          rawDocs.map((d) => ({
            ...d,
            status: d.status || (d.isActive || d.is_active ? 'Published' : 'Draft'),
            category: d.category || d.contentType || 'user_guide',
            author: d.author || d.creatorName || d.creator_name || 'Admin',
            date:
              d.date ||
              (d.createdAt || d.created_at
                ? new Date(d.createdAt || d.created_at).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]),
          }))
        );
      } catch (error) {
        console.error('Failed to load admin support data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [trendsTimeframe, refreshKey]);

  // --- ACTIONS ---
  const handleTicketAction = async (action, ticketId) => {
    const title = action === 'Reopen' ? 'Reopen Ticket?' : `Mark as ${action}?`;
    const confirmText =
      action === 'Reopen'
        ? 'This will make the ticket active again.'
        : `Are you sure you want to mark this ticket as ${action}?`;

    Swal.fire({
      title: title,
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-primary))',
      confirmButtonText: 'Confirm',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const statusUpdate = {
            status: action === 'Reopen' ? 'open' : action.toLowerCase(),
            resolution_note: action === 'Resolved' ? 'Resolved by Admin' : undefined,
          };

          await supportService.updateTicketStatus(ticketId, statusUpdate);

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
          Swal.fire('Updated!', `Ticket status updated.`, 'success');
        } catch (error) {
          console.error('Failed to update status', error);
          Swal.fire('Error', 'Could not update ticket status', 'error');
        }
      }
    });
  };

  const handleCreateTicket = () => {
    setIsCreatingTicket(true);
  };

  const handleSaveNewTicket = async (data) => {
    try {
      const attachments = (data.attachments || []).map((file) => ({
        filename: file.name,
        url: '', // Placeholder until upload endpoint is available
      }));

      const payload = {
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        description: data.description,
        attachments: attachments,
      };

      await supportService.createTicket(payload);
      Swal.fire('Success', 'Ticket created successfully', 'success');

      // Refresh logic - Trigger re-fetch
      setRefreshKey((prev) => prev + 1);
      setIsCreatingTicket(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to create ticket', 'error');
    }
  };

  const handleTicketSelect = async (ticket) => {
    try {
      setSelectedTicket(ticket);
      const fullTicket = await supportService.getTicketById(ticket.id);
      const data = normalizeTicket(fullTicket?.data || fullTicket, ticket);
      setSelectedTicket(data);
    } catch (error) {
      console.error('Failed to fetch ticket details', error);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      await supportService.addResponse(selectedTicket.id, {
        comment: replyText,
        is_internal: false,
        attachments: [],
      });

      // Refresh ticket details
      const updatedTicket = await supportService.getTicketById(selectedTicket.id);
      const normalized = normalizeTicket(updatedTicket?.data || updatedTicket, selectedTicket);
      setSelectedTicket(normalized);

      // Update tickets list to show new info/date if needed
      setTickets((prev) => prev.map((t) => (t.id === normalized.id ? normalized : t)));

      setReplyText('');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Reply sent',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error('Failed to send reply', error);
      Swal.fire('Error', 'Failed to send reply', 'error');
    }
  };

  // --- RENDER HELPERS ---
  const StatusBadge = ({ status }) => {
    const styles =
      {
        open: 'bg-blue-50 text-blue-700 border-blue-200',
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

  // Default stats map if API returns array, else fallback
  const displayStats =
    Array.isArray(stats) && stats.length > 0
      ? stats
      : [
          {
            title: 'My Open Tickets',
            value: tickets.filter((t) => t.status?.toLowerCase() === 'open').length,
            trend: { positive: true, label: '+2 this week' },
            icon: <Ticket size={24} />,
            accent: 'rgb(var(--color-primary))',
          },
          {
            title: 'Pending Response',
            value: 0,
            trend: { positive: false, label: '0 this week' },
            icon: <Clock size={24} />,
            accent: 'rgb(var(--color-warning))',
          },
          {
            title: 'Resolved This Week',
            value: tickets.filter((t) => t.status?.toLowerCase() === 'resolved').length,
            trend: { positive: true, label: '+5 this week' },
            icon: <CheckCircle size={24} />,
            accent: 'rgb(var(--color-success))',
          },
        ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <PageHeader
        title="Support Dashboard"
        subtitle="Manage tickets and view documentation for your dealership."
        actions={
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
              { key: 'tickets', label: 'My Tickets', icon: Ticket },
              { key: 'docs', label: 'Documentation', icon: BookOpen },
            ]}
          />
        }
      />

      {/* --- DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader />
              </div>
            ) : (
              displayStats.map((stat, i) => (
                <StatCard
                  key={i}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  trend={stat.trend}
                  accent={stat.accent}
                />
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] p-6 rounded-3xl border border-[rgb(var(--color-border))] shadow-sm">
              {loading ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Loader />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">
                      Activity Trends
                    </h3>
                    <select
                      value={trendsTimeframe}
                      onChange={(e) => setTrendsTimeframe(Number(e.target.value))}
                      className="text-xs bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-3 py-1.5 outline-none font-bold"
                    >
                      <option value={7}>Last 7 Days</option>
                      <option value={30}>Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorAdminCreated" x1="0" y1="0" x2="0" y2="1">
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
                          <linearGradient id="colorAdminResolved" x1="0" y1="0" x2="0" y2="1">
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
                          fill="url(#colorAdminCreated)"
                          strokeWidth={3}
                        />
                        <Area
                          type="monotone"
                          dataKey="resolved"
                          stroke="rgb(var(--color-success))"
                          fillOpacity={1}
                          fill="url(#colorAdminResolved)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-[rgb(var(--color-surface))] p-6 rounded-3xl border border-[rgb(var(--color-border))] shadow-sm">
                <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4">
                  Support Status
                </h3>
                <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 mb-4 shadow-sm group hover:bg-emerald-100 transition-colors duration-300">
                  <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Standard Support</p>
                    <p className="text-[10px] opacity-80 font-medium">
                      Active & Response Guarantee
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateTicket}
                  className="w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-2xl font-bold shadow-lg shadow-[rgb(var(--color-primary)/0.2)] hover:bg-[rgb(var(--color-primary-dark))] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> New Ticket
                </button>
              </div>

              <div className="bg-[rgb(var(--color-surface))] p-6 rounded-3xl border border-[rgb(var(--color-border))] shadow-sm">
                <h3 className="text-sm font-black text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider opacity-60">
                  Quick Resources
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('docs')}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.04)] transition-all group text-left active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen size={16} className="text-[rgb(var(--color-primary))]" />
                      <span className="text-xs font-bold">System Guide</span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))] transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HELPDESK --- */}
      {activeTab === 'tickets' && (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
          {/* List */}
          <div
            className={`flex flex-col flex-1 lg:flex-none ${selectedTicket ? 'hidden lg:flex lg:w-1/3' : 'w-full lg:w-1/3'} bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden shadow-sm`}
          >
            <div className="p-4 border-b border-[rgb(var(--color-border))] space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[rgb(var(--color-text))]">Your Tickets</h3>
                <button
                  onClick={handleCreateTicket}
                  className="p-2 hover:bg-[rgb(var(--color-background))] rounded-lg text-[rgb(var(--color-primary))]"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  className="w-full bg-[rgb(var(--color-background))] pl-10 pr-4 py-2 text-xs rounded-xl border border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 text-[10px] overflow-x-auto no-scrollbar">
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
              {(() => {
                const filteredTickets = tickets.filter((ticket) => {
                  const matchesFilter =
                    ticketFilter === 'All' ||
                    (ticketFilter === 'Open' && ticket.status?.toLowerCase() === 'open') ||
                    (ticketFilter === 'Closed' && ticket.status?.toLowerCase() === 'closed') ||
                    (ticketFilter === 'Resolved' && ticket.status?.toLowerCase() === 'resolved');

                  const matchesSearch =
                    !searchQuery.trim() ||
                    ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ticket.id?.toLowerCase().includes(searchQuery.toLowerCase());

                  return matchesFilter && matchesSearch;
                });

                if (filteredTickets.length === 0) {
                  return (
                    <div className="p-8 text-center text-[rgb(var(--color-text-muted))] opacity-60">
                      <Ticket size={40} className="mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-bold">No tickets found</p>
                    </div>
                  );
                }

                return filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleTicketSelect(ticket)}
                    className={`w-full text-left p-4 border-b border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))] transition-all group relative ${selectedTicket?.id === ticket.id ? 'bg-[rgb(var(--color-primary))/0.04] border-l-4 border-l-[rgb(var(--color-primary))]' : 'border-l-4 border-l-transparent hover:border-l-[rgb(var(--color-border))]'}`}
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
                          <StatusBadge status={ticket.status} />
                        </div>
                      </div>
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* Ticket Detail Panel */}
          {selectedTicket ? (
            <div className="flex-1 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden flex flex-col shadow-sm">
              {/* Ticket Header */}
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
                        setOpenActionMenu(
                          openActionMenu === selectedTicket.id ? null : selectedTicket.id
                        )
                      }
                      className="px-5 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-xl text-xs font-black shadow-lg shadow-[rgb(var(--color-primary)/0.2)] hover:bg-[rgb(var(--color-primary-dark))] transition-all active:scale-95 flex items-center gap-2"
                    >
                      Manage Ticket <ChevronDown size={14} />
                    </button>

                    {openActionMenu === selectedTicket.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenActionMenu(null)}
                        ></div>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl border border-[rgb(var(--color-border))] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-2 space-y-1">
                            <p className="px-3 py-2 text-[10px] font-black text-[rgb(var(--color-text-muted))] uppercase tracking-widest opacity-60">
                              Status Actions
                            </p>
                            {selectedTicket.status !== 'resolved' && (
                              <button
                                onClick={() => handleTicketAction('Resolved', selectedTicket.id)}
                                className="w-full text-left px-3 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors"
                              >
                                <CheckCircle size={16} /> Mark as Resolved
                              </button>
                            )}

                            <button
                              onClick={() => handleTicketAction('Reopen', selectedTicket.id)}
                              className="w-full text-left px-3 py-2.5 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-emerald-50 rounded-xl flex items-center gap-3 transition-colors"
                            >
                              <Clock size={16} /> Reopen Ticket
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
                          alt={selectedTicket.user_name}
                          width={44}
                          height={44}
                          unoptimized
                          className="w-11 h-11 rounded-2xl object-cover shadow-md border-2 border-[rgb(var(--color-surface))] ring-1 ring-[rgb(var(--color-border))]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black shadow-md bg-[rgb(var(--color-primary))] text-white border-2 border-[rgb(var(--color-surface))] ring-1 ring-[rgb(var(--color-border))] uppercase">
                          {(selectedTicket.user_name || selectedTicket.user || 'D').charAt(0)}
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 px-1">
                          <span className="text-[11px] font-black text-[rgb(var(--color-text))] uppercase tracking-wider">
                            {selectedTicket.user_name || selectedTicket.user || 'Dealer'}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                      placeholder="Reply to customer..."
                      className="w-full bg-[rgb(var(--color-background))] pl-4 pr-12 py-3 rounded-xl border border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] outline-none text-sm transition-all"
                    />
                    <button
                      onClick={handleSendReply}
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
                <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Select a Ticket</h3>
                <p className="text-sm opacity-70">View details or submit a new priority request.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
              {viewingDoc && (
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 hover:bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] transition-colors"
                >
                  <ChevronRight className="rotate-180" size={20} />
                </button>
              )}
              <h2 className="text-xl font-bold text-[rgb(var(--color-text))]">
                Resources & Documentation
              </h2>
            </div>
            {!viewingDoc && (
              <div className="relative w-full md:w-80">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search resources..."
                  className="w-full bg-[rgb(var(--color-background))] pl-10 pr-4 py-2.5 rounded-xl border border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {viewingDoc ? (
            <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[rgb(var(--color-border))]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-lg bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] text-xs font-bold uppercase tracking-wide">
                    {viewingDoc.category?.replace('_', ' ')}
                  </span>
                  <span className="text-[rgb(var(--color-text-muted))] text-sm ml-auto font-medium">
                    {viewingDoc.date}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-[rgb(var(--color-text))] mb-2">
                  {viewingDoc.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-[rgb(var(--color-text-muted))]">
                  <div className="flex items-center gap-1.5">
                    <User size={14} /> Author: {viewingDoc.author}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag size={14} /> Slug: {viewingDoc.slug}
                  </div>
                </div>
              </div>
              <div className="p-8 bg-[rgb(var(--color-background))/0.3] min-h-[400px]">
                <div className="prose prose-sm max-w-none text-[rgb(var(--color-text))]">
                  <div dangerouslySetInnerHTML={{ __html: viewingDoc.content }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docs
                .filter(
                  (doc) =>
                    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setViewingDoc(doc)}
                    className="bg-[rgb(var(--color-surface))] p-5 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] px-2 py-1 rounded">
                        {doc.category?.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-[rgb(var(--color-text-muted))] text-[10px] font-medium">
                        <Calendar size={12} /> {doc.date}
                      </div>
                    </div>
                    <h3 className="font-bold text-[rgb(var(--color-text))] mb-2 group-hover:text-[rgb(var(--color-primary))] transition-colors">
                      {doc.title}
                    </h3>
                    <div className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-3 mb-4 flex-1">
                      {doc.content.substring(0, 120)}...
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[rgb(var(--color-border))] mt-auto">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                        <ArrowRight size={12} className="text-[rgb(var(--color-primary))]" /> Read
                        More
                      </div>
                      <div className="text-[10px] text-[rgb(var(--color-text-muted))] opacity-60">
                        {doc.slug}
                      </div>
                    </div>
                  </div>
                ))}
              {docs.length === 0 && !loading && (
                <div className="col-span-full py-20 bg-[rgb(var(--color-surface))] border border-dashed border-[rgb(var(--color-border))] rounded-2xl text-center">
                  <BookOpen
                    size={48}
                    className="mx-auto mb-4 opacity-10 text-[rgb(var(--color-text))]"
                  />
                  <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">
                    No resources found
                  </h3>
                  <p className="text-sm text-[rgb(var(--color-text-muted))]">
                    Please check back later for updates.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}
      <GenericFormModal
        isOpen={isCreatingTicket}
        onClose={() => setIsCreatingTicket(false)}
        onSave={handleSaveNewTicket}
        title="Create New Support Ticket"
        subtitle="Submit a new request to our support team."
        fields={ticketFields}
        validationSchema={ticketSchema}
      />
    </div>
  );
}
