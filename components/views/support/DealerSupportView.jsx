'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import Loader from '@/components/common/Loader';
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
} from 'recharts';
import supportService from '@/services/supportService';
import TabNavigation from '@/components/common/TabNavigation';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import FormModal from '@/components/common/FormModal';
import * as yup from 'yup';
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
];

export default function DealerSupportView() {
  const { user } = useAuth();
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
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [activityTrends, setActivityTrends] = useState([]);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (ticketFilter !== 'All') {
        params.status = ticketFilter.toLowerCase();
      }
      const [ticketsData, docsData] = await Promise.all([
        supportService.getTickets(params),
        supportService.getDocs(),
      ]);

      const rawTickets = Array.isArray(ticketsData)
        ? ticketsData
        : ticketsData.data?.list || ticketsData.data?.tickets || ticketsData.list || [];
      const normalizedTickets = rawTickets.map((t) => ({
        ...t,
        id: t.id?.toString(),
        status: t.status || 'open',
        priority: t.priority || 'medium',
        subject: t.subject || t.title || 'No Subject',
        date: t.date || (t.created_at ? formatDate(t.created_at) : 'N/A'),
      }));
      setTickets(normalizedTickets);

      const summary = ticketsData.data?.summary || {
        total_tickets: normalizedTickets.length,
        open: normalizedTickets.filter((t) => t.status?.toLowerCase() === 'open').length,
        in_progress: normalizedTickets.filter((t) => t.status?.toLowerCase() === 'in_progress')
          .length,
        resolved: normalizedTickets.filter((t) => t.status?.toLowerCase() === 'resolved').length,
      };

      // Calculate Trends for last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        const dateString = formatDate(date);

        const count = normalizedTickets.filter((t) => {
          if (!t.created_at) return false;
          return formatDate(t.created_at) === dateString;
        }).length;

        last7Days.push({
          name: dayName,
          created: count,
          date: dateString,
        });
      }
      setActivityTrends(last7Days);

      const mappedStats = [
        {
          title: 'My Open Tickets',
          value: summary.open || 0,
          trend: { positive: true, label: '+0' },
          accent: 'rgb(var(--color-primary))',
          icon: <Ticket size={24} />,
        },
        {
          title: 'Pending Response',
          value: summary.in_progress || 0,
          trend: { positive: false, label: '0' },
          accent: 'rgb(var(--color-warning))',
          icon: <Clock size={24} />,
        },
        {
          title: 'Resolved This Week',
          value: summary.resolved || 0,
          trend: { positive: true, label: '+0' },
          accent: 'rgb(var(--color-success))',
          icon: <CheckCircle size={24} />,
        },
      ];
      setStats(mappedStats);

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
      console.error('Failed to load dealer support data', error);
    } finally {
      setLoading(false);
    }
  }, [ticketFilter]);

  useEffect(() => {
    loadData();
  }, [loadData, ticketFilter]); // Refetch when filter changes

  // Client-side search and filtering for documentation
  const filteredDocs = useMemo(() => {
    if (!docSearchQuery.trim()) return docs;
    const query = docSearchQuery.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.title?.toLowerCase().includes(query) ||
        doc.content?.toLowerCase().includes(query) ||
        doc.category?.toLowerCase().includes(query) ||
        doc.excerpt?.toLowerCase().includes(query)
    );
  }, [docs, docSearchQuery]);

  const handleCloseTicket = async (ticketId) => {
    const { value: formValues } = await Swal.fire({
      title: 'Close Ticket',
      text: 'How would you rate our support?',
      input: 'range',
      inputLabel: 'Rating (1-5)',
      inputAttributes: {
        min: 1,
        max: 5,
        step: 1,
      },
      inputValue: 5,
      html: `
                <div class="mt-4">
                    <textarea id="swal-feedback" class="swal2-textarea" placeholder="Optional feedback..."></textarea>
                </div>
            `,
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-primary))',
      confirmButtonText: 'Yes, Close Ticket',
      preConfirm: () => {
        return {
          rating: Swal.getPopup().querySelector('.swal2-input-label').nextElementSibling.value,
          feedback: document.getElementById('swal-feedback').value,
        };
      },
    });

    if (formValues) {
      try {
        await supportService.closeTicket(ticketId, formValues);

        setTickets(tickets.map((t) => (t.id !== ticketId ? t : { ...t, status: 'closed' })));

        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: 'closed' });
        }
        Swal.fire('Closed!', 'Thank you for your feedback.', 'success');
      } catch (error) {
        console.error('Failed to close ticket', error);
        Swal.fire('Error', 'Could not close ticket', 'error');
      }
    }
  };

  const handleCreateTicket = () => {
    setIsTicketModalOpen(true);
  };

  const handleConfirmSubmitTicket = async (data) => {
    setSubmittingTicket(true);
    try {
      const response = await supportService.createTicket(data);
      const newTicket = response?.data || response;

      setTickets([newTicket, ...tickets]);
      Swal.fire({
        icon: 'success',
        title: 'Submitted',
        text: 'Your support ticket has been created.',
        confirmButtonColor: 'rgb(var(--color-primary))',
        timer: 2000,
        showConfirmButton: false,
      });
      setActiveTab('tickets');
      loadData(); // Refresh list to get proper normalization
      setIsTicketModalOpen(false);
    } catch (error) {
      console.error('Failed to create ticket', error);
      Swal.fire('Error', 'Failed to submit ticket', 'error');
    } finally {
      setSubmittingTicket(false); // Keep loading state until navigation or modal closure
    }
  };

  const handleTicketSelect = async (ticket) => {
    try {
      setSelectedTicket(ticket); // Set immediately for UI responsiveness
      const fullTicket = await supportService.getTicketById(ticket.id);
      setSelectedTicket(fullTicket?.data || fullTicket);
    } catch (error) {
      console.error('Failed to fetch ticket details', error);
    }
  };

  const handleSendResponse = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      await supportService.addResponse(selectedTicket.id, {
        comment: replyText,
        attachments: [], // Attachment support can be added later
      });

      // Refresh ticket data
      const updatedTicket = await supportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updatedTicket?.data || updatedTicket);
      setReplyText('');
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Response sent',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error('Failed to send response', error);
      Swal.fire('Error', 'Failed to send response', 'error');
    }
  };

  // --- RENDER HELPERS ---
  const StatusBadge = ({ status }) => {
    const styles =
      {
        open: 'bg-blue-50 text-blue-700 border-blue-200',
        resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        closed: 'bg-gray-50 text-gray-700 border-gray-200',
        in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
        waiting_user: 'bg-amber-50 text-amber-700 border-amber-200',
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
        urgent: 'text-red-600 bg-red-50 border-red-100',
        high: 'text-orange-600 bg-orange-50 border-orange-100',
        medium: 'text-blue-600 bg-blue-50 border-blue-100',
        low: 'text-gray-600 bg-gray-50 border-gray-100',
      }[priority.toLowerCase()] || 'text-gray-600';
    return (
      <span
        className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${styles}`}
      >
        <Flag size={10} strokeWidth={3} /> {priority}
      </span>
    );
  };

  const displayStats =
    Array.isArray(stats) && stats.length > 0
      ? stats
      : [
          {
            title: 'Open Tickets',
            value: tickets.filter((t) => t.status === 'open').length,
            trend: { positive: true, label: '+2' },
            accent: '#3b82f6',
            icon: <Ticket size={24} />,
          },
          {
            title: 'In Progress',
            value: tickets.filter((t) => t.status === 'in_progress').length,
            trend: { positive: false, label: '0' },
            accent: '#f97316',
            icon: <Clock size={24} />,
          },
          {
            title: 'Resolved',
            value: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
            trend: { positive: true, label: '+5' },
            accent: '#10b981',
            icon: <CheckCircle size={24} />,
          },
        ];

  const MOCK_TRENDS = [
    { name: 'Mon', created: 2, resolved: 1 },
    { name: 'Tue', created: 3, resolved: 2 },
    { name: 'Wed', created: 1, resolved: 3 },
    { name: 'Thu', created: 4, resolved: 2 },
    { name: 'Fri', created: 3, resolved: 4 },
    { name: 'Sat', created: 1, resolved: 1 },
    { name: 'Sun', created: 2, resolved: 2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20 p-4 lg:p-6">
      <PageHeader
        title="Support Hub"
        subtitle="Get help, manage tickets, and explore documentation."
        actions={
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
              { key: 'tickets', label: 'Support Tickets', icon: Ticket },
              { key: 'docs', label: 'Knowledge Base', icon: BookOpen },
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
            <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm">
              {loading ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Loader />
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6">
                    Activity Trends
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityTrends}>
                        <defs>
                          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
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
                            borderRadius: '12px',
                            border: '1px solid rgb(var(--color-border))',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="created"
                          stroke="rgb(var(--color-primary))"
                          fillOpacity={1}
                          fill="url(#colorCreated)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm">
                <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-2">Need Help?</h3>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mb-6">
                  Our support team is available Mon-Fri 9AM-6PM PST.
                </p>
                <button
                  onClick={handleCreateTicket}
                  className="w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold shadow-lg shadow-[rgb(var(--color-primary))/0.2] hover:bg-[rgb(var(--color-primary-dark))] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Create Ticket
                </button>
              </div>

              <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm">
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider">
                  Quick Links
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('docs')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen size={16} className="text-[rgb(var(--color-primary))]" />
                      <span className="text-xs font-bold">User Guides</span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))]"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TICKETS --- */}
      {activeTab === 'tickets' && (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
          {/* List */}
          <div
            className={`flex flex-col flex-1 lg:flex-none ${selectedTicket ? 'hidden lg:flex lg:w-1/3' : 'w-full lg:w-1/3'} bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden shadow-sm`}
          >
            <div className="p-4 border-b border-[rgb(var(--color-border))] space-y-3 bg-[rgb(var(--color-background))/0.3]">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[rgb(var(--color-text))]">My Tickets</h3>
                <button
                  onClick={handleCreateTicket}
                  className="p-2 hover:bg-[rgb(var(--color-background))] rounded-lg text-[rgb(var(--color-primary))] transition-colors"
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
            <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                    ticket.id?.toString().toLowerCase().includes(searchQuery.toLowerCase());

                  return matchesFilter && matchesSearch;
                });

                if (filteredTickets.length === 0) {
                  return (
                    <div className="p-8 text-center text-[rgb(var(--color-text-muted))] opacity-60">
                      <Ticket size={40} className="mx-auto mb-4 opacity-20" />
                      <p className="text-sm">No tickets found.</p>
                    </div>
                  );
                }

                return filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleTicketSelect(ticket)}
                    className={`w-full text-left p-4 border-b border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))] transition-colors group ${selectedTicket?.id === ticket.id ? 'bg-[rgb(var(--color-primary))/0.04] border-l-4 border-l-[rgb(var(--color-primary))]' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xs font-mono font-bold text-[rgb(var(--color-text-muted))]">
                        #{ticket.ticket_number || ticket.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[rgb(var(--color-text-muted))]">
                        {ticket.date}
                      </span>
                    </div>
                    <h4 className="font-bold text-[rgb(var(--color-text))] text-sm mb-2 line-clamp-1 group-hover:text-[rgb(var(--color-primary))]">
                      {ticket.subject}
                    </h4>
                    <div className="flex justify-between items-center">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* Detail */}
          {selectedTicket ? (
            <div className="flex-1 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden flex flex-col shadow-sm">
              <div className="p-6 border-b border-[rgb(var(--color-border))] flex justify-between items-start bg-[rgb(var(--color-background))/0.3]">
                <div className="flex-1">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="lg:hidden p-1 -ml-1 mb-2 text-[rgb(var(--color-text-muted))]"
                  >
                    <ChevronRight className="rotate-180" size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[rgb(var(--color-text))]">
                      {selectedTicket.subject}
                    </h2>
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[rgb(var(--color-text-muted))]">
                    <span className="flex items-center gap-1.5">
                      <Tag size={12} /> {selectedTicket.category || 'Support'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> Created {selectedTicket.date}
                    </span>
                  </div>
                </div>
                {selectedTicket.status.toLowerCase() !== 'closed' && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenActionMenu(
                          openActionMenu === selectedTicket.id ? null : selectedTicket.id
                        )
                      }
                      className="px-4 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-xs font-bold hover:border-[rgb(var(--color-primary))] transition-all flex items-center gap-2"
                    >
                      Actions <ChevronDown size={14} />
                    </button>
                    {openActionMenu === selectedTicket.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenActionMenu(null)}
                        ></div>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl border border-[rgb(var(--color-border))] z-20 overflow-hidden">
                          <div className="p-1.5">
                            <button
                              onClick={() => handleCloseTicket(selectedTicket.id)}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/5 rounded-xl flex items-center gap-3"
                            >
                              <CheckCircle size={16} /> Resolve & Close
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[rgb(var(--color-background))/0.3] custom-scrollbar">
                {/* Customer Original Message */}
                <div className="flex w-full justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex gap-3 max-w-[85%] flex-row-reverse">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm bg-[rgb(var(--color-primary))] text-white">
                      {(user?.name || 'M').charAt(0)}
                    </div>
                    <div className="relative p-4 rounded-2xl shadow-sm border bg-[rgb(var(--color-primary))/0.08] border-[rgb(var(--color-primary))/0.1] rounded-tr-none">
                      <div className="flex items-center gap-3 mb-2 justify-end">
                        <span className="text-[11px] font-bold text-[rgb(var(--color-text))] opacity-80">
                          You (Description)
                        </span>
                        <span className="text-[9px] text-[rgb(var(--color-text-muted))] font-medium">
                          {new Date(selectedTicket.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <LinkifiedText
                        text={selectedTicket.description}
                        className="text-sm text-[rgb(var(--color-text))] leading-relaxed break-words"
                      />
                    </div>
                  </div>
                </div>

                {/* Responses */}
                {selectedTicket.history && selectedTicket.history.length > 0
                  ? selectedTicket.history
                      .filter((h) => h.action === 'RESPONSE_ADDED')
                      .map((res, i) => {
                        // A message is "Me" if it was sent by the ticket creator
                        const isMe = res.user_id === selectedTicket.user_id;
                        const isSupport = !isMe;

                        return (
                          <div
                            key={i}
                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                          >
                            <div
                              className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              {/* Avatar */}
                              <div
                                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm ${isMe ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-[rgb(var(--color-info))] text-white'}`}
                              >
                                {(res.user_name || (isSupport ? 'S' : 'U')).charAt(0)}
                              </div>

                              {/* Message Bubble */}
                              <div
                                className={`relative p-4 rounded-2xl shadow-sm border ${
                                  isMe
                                    ? 'bg-[rgb(var(--color-primary))/0.08] border-[rgb(var(--color-primary))/0.1] rounded-tr-none'
                                    : 'bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))] rounded-tl-none'
                                }`}
                              >
                                <div
                                  className={`flex items-center gap-3 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                  <span className="text-[11px] font-bold text-[rgb(var(--color-text))] opacity-80">
                                    {isMe ? 'You' : res.user_name || 'Support Team'}
                                  </span>
                                  <span className="text-[9px] text-[rgb(var(--color-text-muted))] font-medium">
                                    {new Date(res.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <LinkifiedText
                                  text={res.comment}
                                  className="text-sm text-[rgb(var(--color-text))] leading-relaxed break-words"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                  : null}
              </div>

              {selectedTicket.status.toLowerCase() !== 'closed' && (
                <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendResponse()}
                        placeholder="Type your response..."
                        className="w-full bg-[rgb(var(--color-background))] pl-12 pr-14 py-3.5 rounded-2xl border border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] outline-none text-sm shadow-inner transition-all"
                      />
                      <button
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] transition-colors"
                        title="Attach File (Not yet supported)"
                        onClick={() => document.getElementById('ticket-attachment-input').click()}
                      >
                        <File size={18} />
                      </button>
                      <input
                        id="ticket-attachment-input"
                        type="file"
                        className="hidden"
                        onChange={() =>
                          Swal.fire(
                            'Coming Soon',
                            'Attachment support will be available in a future update.',
                            'info'
                          )
                        }
                      />
                      <button
                        onClick={handleSendResponse}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[rgb(var(--color-primary))] text-white rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition-all active:scale-95 shadow-md shadow-[rgb(var(--color-primary)/0.2)]"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl text-[rgb(var(--color-text-muted))] flex-col gap-6 border-dashed opacity-50">
              <div className="w-24 h-24 bg-[rgb(var(--color-background))] rounded-full flex items-center justify-center shadow-inner">
                <MessageSquare size={44} className="opacity-20" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-[rgb(var(--color-text))]">
                  Manage Your Tickets
                </h3>
                <p className="text-sm mt-1">
                  Select a ticket from the list to view its conversation history.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- DOCS --- */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
              {viewingDoc && (
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2.5 hover:bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] transition-all text-[rgb(var(--color-text-muted))]"
                >
                  <ChevronRight className="rotate-180" size={20} />
                </button>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest mb-1">
                  <BookOpen size={10} /> Knowledge Base
                  {viewingDoc && (
                    <>
                      <ChevronRight size={10} />
                      <button
                        onClick={() => {
                          setViewingDoc(null);
                          setDocSearchQuery(viewingDoc.category || '');
                        }}
                        className="text-[rgb(var(--color-primary))] hover:underline cursor-pointer"
                      >
                        {viewingDoc.category?.replace('_', ' ')}
                      </button>
                    </>
                  )}
                </div>
                <h2 className="text-xl font-bold text-[rgb(var(--color-text))]">
                  {viewingDoc ? viewingDoc.title : 'Resources & Knowledge Base'}
                </h2>
              </div>
            </div>
            {!viewingDoc && (
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  className="w-full bg-[rgb(var(--color-background))] pl-12 pr-4 py-3 rounded-2xl border border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] outline-none transition-all shadow-sm"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {viewingDoc ? (
            <div className="bg-[rgb(var(--color-surface))] rounded-3xl border border-[rgb(var(--color-border))] shadow-xl overflow-hidden">
              <div className="p-8 lg:p-12 border-b border-[rgb(var(--color-border))] bg-gradient-to-br from-[rgb(var(--color-background))] to-[rgb(var(--color-surface))]">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1.5 rounded-xl bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] text-[10px] font-black uppercase tracking-widest">
                    {viewingDoc.category?.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5 text-[rgb(var(--color-text-muted))] text-xs font-bold ml-auto bg-[rgb(var(--color-surface))] px-3 py-1 rounded-full border border-[rgb(var(--color-border))] shadow-sm">
                    <Calendar size={12} /> {viewingDoc.date}
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-[rgb(var(--color-text))] mb-6 leading-tight">
                  {viewingDoc.title}
                </h1>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-sm font-bold py-1 px-3 bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] rounded-lg border border-[rgb(var(--color-primary))]/20">
                    <User size={14} /> MotorQuote Support
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold py-1 px-3 bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] rounded-lg border border-[rgb(var(--color-success))]/20">
                    <CheckCircle size={14} /> Verified Guide
                  </div>
                </div>
              </div>
              <div className="p-8 lg:p-12 bg-[rgb(var(--color-surface))] min-h-[500px]">
                <article className="prose prose-blue lg:prose-lg max-w-none text-[rgb(var(--color-text))]">
                  <div
                    className="documentation-content"
                    dangerouslySetInnerHTML={{ __html: viewingDoc.content }}
                  />
                </article>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setViewingDoc(doc)}
                    className="bg-[rgb(var(--color-surface))] p-6 rounded-3xl border border-[rgb(var(--color-border))] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] px-3 py-1.5 rounded-xl border border-[rgb(var(--color-primary))/0.1]">
                        {doc.category?.replace('_', ' ')}
                      </span>
                      <div className="p-2 transition-colors">
                        <BookOpen
                          size={18}
                          className="text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))]"
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-[rgb(var(--color-text))] mb-3 group-hover:text-[rgb(var(--color-primary))] transition-colors leading-snug">
                      {doc.title}
                    </h3>
                    <div className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-3 mb-6 flex-1 font-medium leading-relaxed opacity-80">
                      {doc.excerpt ||
                        doc.content?.replace(/<[^>]*>/g, '').substring(0, 120) +
                          (doc.content?.replace(/<[^>]*>/g, '').length > 120 ? '...' : '') ||
                        'Learn more about this topic in our documentation.'}
                    </div>
                    <div className="flex items-center justify-between pt-5 border-t border-[rgb(var(--color-border))] mt-auto">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-[rgb(var(--color-primary))] uppercase tracking-widest">
                        Read Guide{' '}
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </div>
                      <div className="text-[10px] text-[rgb(var(--color-text-muted))] font-bold opacity-40">
                        {doc.date}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 bg-[rgb(var(--color-surface))] border-2 border-dashed border-[rgb(var(--color-border))] rounded-3xl text-center shadow-inner">
                  <div className="w-20 h-20 bg-[rgb(var(--color-background))] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={32} className="opacity-10 text-[rgb(var(--color-text))]" />
                  </div>
                  <h3 className="text-xl font-bold text-[rgb(var(--color-text))]">
                    No results found
                  </h3>
                  <p className="text-sm text-[rgb(var(--color-text-muted))] mt-2 font-medium">
                    Try searching for different keywords or categories.
                  </p>
                  <button
                    onClick={() => setDocSearchQuery('')}
                    className="mt-8 text-xs font-black text-[rgb(var(--color-primary))] uppercase tracking-widest hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* --- NEW TICKET MODAL --- */}
      <FormModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSave={handleConfirmSubmitTicket}
        title="Submit Support Ticket"
        subtitle="Provide details about your issue and we'll get back to you."
        fields={ticketFields}
        validationSchema={ticketSchema}
        loading={submittingTicket}
      />
    </div>
  );
}
