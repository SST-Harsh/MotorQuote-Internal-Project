'use client';
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Megaphone,
  Check,
  Plus,
  Loader2,
  ChevronDown,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import notificationService from '@/services/notificationService';
import roleService from '@/services/roleService';
import userService from '@/services/userService';
import dealershipService from '@/services/dealershipService';
import { useAuth } from '@/context/AuthContext';
import DataTable from '../../common/DataTable';
import Loader from '../../common/Loader';
import TabNavigation from '@/components/common/TabNavigation';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import { Edit, Trash2, Eye } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { useNotifications } from '@/context/NotificationContext';
import dayjs from 'dayjs';
import { formatDateTime } from '@/utils/i18n';

export default function AdminNotifications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('broadcast');
  const [prefillData, setPrefillData] = useState(null);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Notification Control Center"
        subtitle="Broadcast announcements and view history."
        icon={<Megaphone size={24} />}
        gradient
      />

      {/* Tabs */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
          { key: 'templates', label: 'Templates', icon: FileText },
          { key: 'history', label: 'History', icon: Bell },
        ]}
      />

      {/* Content */}
      <div className=" sm:p-6 shadow-sm min-h-[500px] transition-all duration-300">
        {activeTab === 'broadcast' && (
          <BroadcastForm prefillData={prefillData} onPrefillConsumed={() => setPrefillData(null)} />
        )}
        {activeTab === 'templates' && (
          <TemplateManager
            onSend={(template) => {
              setPrefillData(template);
              setActiveTab('broadcast');
            }}
          />
        )}
        {activeTab === 'history' && <NotificationHistory />}
      </div>
    </div>
  );
}

// Validation Schema for Broadcast Form
const broadcastValidationSchema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  message: yup
    .string()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must not exceed 500 characters'),
  type: yup.string().required('Type is required'),
  priority: yup.string().required('Priority is required'),
  targetAudience: yup.string().required('Target audience is required'),
  scheduledAt: yup
    .string()
    .nullable()
    .test('future-date', 'Scheduled date must be in the future', function (value) {
      if (!value) return true;
      return new Date(value) > new Date();
    }),
  expiresAt: yup
    .string()
    .nullable()
    .test('after-scheduled', 'Expiry date must be after scheduled date', function (value) {
      const { scheduledAt } = this.parent;
      if (!value) return true;
      if (!scheduledAt) return true;
      return new Date(value) > new Date(scheduledAt);
    })
    .test('future-date', 'Expiry date must be in the future', function (value) {
      if (!value) return true;
      return new Date(value) > new Date();
    }),
});

// Validation Schema for Template Form
const templateValidationSchema = yup.object({
  name: yup
    .string()
    .required('Template name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  description: yup.string().max(500, 'Description must not exceed 500 characters').nullable(),
  type: yup
    .string()
    .required('Type is required')
    .oneOf(['announcement', 'alert', 'email', 'system'], 'Invalid template type'),
  category: yup.string().required('Category is required'),
  titleTemplate: yup
    .string()
    .required('Title template is required')
    .min(3, 'Title template must be at least 3 characters')
    .max(200, 'Title template must not exceed 200 characters'),
  messageTemplate: yup
    .string()
    .required('Message template is required')
    .min(10, 'Message template must be at least 10 characters')
    .max(1000, 'Message template must not exceed 1000 characters'),
  defaultPriority: yup
    .string()
    .required('Default priority is required')
    .oneOf(['low', 'medium', 'high', 'urgent', 'critical'], 'Invalid priority level'),
  defaultTargetAudience: yup.string().required('Default target audience is required'),
});

function BroadcastForm({ prefillData, onPrefillConsumed }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: 'announcement',
    title: '',
    message: '',
    priority: 'medium',
    targetAudience: 'my_staff',
    targetDealershipId: '',
    targetUserId: '',
    expiresAt: '',
  });
  const [sending, setSending] = useState(false);
  const [roles, setRoles] = useState([]);
  const [dealerships, setDealerships] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  // Handle prefill data
  useEffect(() => {
    if (prefillData) {
      setFormData((prev) => ({
        ...prev,
        title: prefillData.title_template || prefillData.titleTemplate || '',
        message: prefillData.message_template || prefillData.messageTemplate || '',
        type: prefillData.type || 'announcement',
        priority: prefillData.default_priority || prefillData.defaultPriority || 'medium',
        targetAudience:
          prefillData.default_target_audience || prefillData.defaultTargetAudience || 'my_staff',
      }));
      if (onPrefillConsumed) onPrefillConsumed();
    }
  }, [prefillData, onPrefillConsumed]);

  // Real-time validation function
  const validateField = async (name, value) => {
    try {
      await yup.reach(broadcastValidationSchema, name).validate(value);
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    } catch (err) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: err.message,
      }));
    }
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Only validate in real-time if there's already an error for this field
    // or if it's a field we want to validate immediately
    if (validationErrors[name] || name === 'title' || name === 'message') {
      validateField(name, value);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rolesRes = await roleService.getAllRoles();
        const rolesList = Array.isArray(rolesRes)
          ? rolesRes
          : rolesRes.roles || rolesRes.data || [];

        const dealersRes = await dealershipService.getAllDealerships();
        const dealersList = Array.isArray(dealersRes)
          ? dealersRes
          : dealersRes.data || dealersRes.dealerships || [];

        const usersRes = await userService.getAllUsers();
        let usersList = Array.isArray(usersRes) ? usersRes : usersRes.data || [];

        if (user?.id) {
          usersList = usersList.filter((u) => u.creator_id === user.id || u.creatorId === user.id);
        }

        // Normalize role labels for display
        const titleCase = (str = '') =>
          str
            .replace(/_/g, ' ')
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');
        const normalizedRoles = rolesList.map((r) => ({
          ...r,
          _displayLabel: r.display_name || titleCase(r.name || r.key || ''),
        }));
        setRoles(normalizedRoles);
        setDealerships(dealersList);
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching broadcast data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form data
    try {
      await broadcastValidationSchema.validate(formData, { abortEarly: false });
    } catch (err) {
      const errors = {};
      if (err.inner) {
        err.inner.forEach((error) => {
          errors[error.path] = error.message;
        });
      }
      setValidationErrors(errors);
      return;
    }

    setSending(true);
    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        scheduled_at: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
        expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      if (formData.targetAudience === 'my_dealerships') {
        payload.target_roles = ['all']; // Scoped by admin level on backend
      } else if (formData.targetAudience === 'my_staff') {
        payload.target_roles = ['all']; // Scoped by admin level on backend
      } else if (formData.targetAudience === 'specific_dealership') {
        payload.target_dealerships = [formData.targetDealershipId];
      } else if (formData.targetAudience === 'specific_user') {
        payload.target_user_ids = [formData.targetUserId];
      } else {
        // Role targeting (e.g. "dealer_manager" from roles list)
        payload.target_roles = [formData.targetAudience];
      }

      if (formData.type === 'alert') {
        await notificationService.createBroadcast(payload);
      } else {
        await notificationService.createAnnouncement(payload);
      }

      Swal.fire({
        title: 'Success!',
        text: 'Notification has been broadcasted successfully.',
        icon: 'success',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });

      setFormData({ ...formData, title: '', message: '', expiresAt: '', scheduledAt: '' });
    } catch (error) {
      console.error('Broadcast Error:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      Swal.fire({
        title: 'Broadcast Failed',
        html: `
                    <div class="text-left space-y-2 font-sans">
                        <p className="text-sm"><strong>Status:</strong> ${status || 'Unknown'}</p>
                        <p className="text-sm"><strong>Message:</strong> ${message}</p>
                        ${error.response?.data?.error ? `<p class="text-xs text-red-500 mt-2">${error.response.data.error}</p>` : ''}
                    </div>
                `,
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setSending(false);
    }
  };

  const priorityColors = {
    low: 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]',
    medium:
      'bg-[rgb(var(--color-info))]/10 text-[rgb(var(--color-info))] border border-[rgb(var(--color-info))]/20',
    high: 'bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] border border-[rgb(var(--color-warning))]/20',
    critical:
      'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] border border-[rgb(var(--color-error))]/20',
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {(formData.title || formData.message) && (
        <div className="bg-gradient-to-br from-[rgb(var(--color-primary))]/5 to-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase">
              Preview
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[formData.priority]}`}
            >
              {formData.priority}
            </span>
          </div>
          {formData.title && (
            <h4 className="font-bold text-[rgb(var(--color-text))]">{formData.title}</h4>
          )}
          {formData.message && (
            <p className="text-sm text-[rgb(var(--color-text-muted))]">{formData.message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
            Type
          </label>
          <div className="relative group">
            <select
              value={formData.type}
              onChange={(e) => handleFieldChange('type', e.target.value)}
              className="w-full appearance-none bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2.5 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all pr-10 hover:border-[rgb(var(--color-primary)/0.5)]"
            >
              <option value="announcement">📢 Announcement</option>
              <option value="alert">⚠️ System Alert</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none group-hover:text-[rgb(var(--color-primary))] transition-colors"
              size={16}
            />
          </div>
          {validationErrors.type && (
            <p className="text-red-500 text-[10px] mt-1 font-medium">{validationErrors.type}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
            Priority
          </label>
          <div className="relative group">
            <select
              value={formData.priority}
              onChange={(e) => handleFieldChange('priority', e.target.value)}
              className="w-full appearance-none bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2.5 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all pr-10 hover:border-[rgb(var(--color-primary)/0.5)]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none group-hover:text-[rgb(var(--color-primary))] transition-colors"
              size={16}
            />
          </div>
          {validationErrors.priority && (
            <p className="text-red-500 text-[10px] mt-1 font-medium">{validationErrors.priority}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
            Scheduled At (Optional)
          </label>
          <CustomDateTimePicker
            value={formData.scheduledAt}
            onChange={(val) => setFormData({ ...formData, scheduledAt: val })}
          />
          <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
            Leave empty to send immediately.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
            Expires At (Optional)
          </label>
          <CustomDateTimePicker
            value={formData.expiresAt}
            onChange={(val) => setFormData({ ...formData, expiresAt: val })}
          />
          <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
            When this notification should be hidden.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
          Target Audience
        </label>
        <div className="relative group">
          <select
            value={formData.targetAudience}
            onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
            className={`w-full appearance-none bg-[rgb(var(--color-background))] border rounded-lg px-3 py-2.5 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all pr-10 hover:border-[rgb(var(--color-primary)/0.5)] disabled:opacity-50 ${validationErrors.targetAudience ? 'border-red-500' : 'border-[rgb(var(--color-border))]'}`}
            disabled={loadingData}
          >
            <option value="my_staff">Select the Target Audience</option>
            {roles.map((role) => (
              <option key={role.id} value={(role.name || role.key || '').toLowerCase()}>
                👥 All {role._displayLabel}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none group-hover:text-[rgb(var(--color-primary))] transition-colors"
            size={16}
          />
        </div>
        {validationErrors.targetAudience && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.targetAudience}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          className={`w-full bg-[rgb(var(--color-background))] border rounded-lg px-4 py-2.5 text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all ${validationErrors.title ? 'border-red-500 shadow-sm' : 'border-[rgb(var(--color-border))]'}`}
          placeholder="e.g., System Maintenance Scheduled"
          data-testid="broadcast-title-input"
        />
        {validationErrors.title && (
          <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
          Message *
        </label>
        <textarea
          rows="5"
          value={formData.message}
          onChange={(e) => handleFieldChange('message', e.target.value)}
          className={`w-full bg-[rgb(var(--color-background))] border rounded-lg px-4 py-3 text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all resize-none ${validationErrors.message ? 'border-red-500 shadow-sm' : 'border-[rgb(var(--color-border))]'}`}
          placeholder="Enter your message here..."
          data-testid="broadcast-message-textarea"
        ></textarea>
        {validationErrors.message && (
          <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.message}</p>
        )}
        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-2">
          {formData.message.length} characters
        </p>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="submit"
          disabled={sending}
          className="flex items-center justify-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-3 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-[rgb(var(--color-primary))]/20"
          data-testid="broadcast-submit-button"
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              Send Broadcast
            </>
          )}
        </button>
        {(formData.title || formData.message) && (
          <button
            type="button"
            onClick={() => setFormData({ ...formData, title: '', message: '' })}
            className="px-4 py-3 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}

function NotificationHistory() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const currentUserId = user?.id != null ? user.id.toString() : undefined;

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAllNotifications();
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res?.notifications) {
        list = Array.isArray(res.notifications) ? res.notifications : [];
      } else if (res?.data?.notifications) {
        list = Array.isArray(res.data.notifications) ? res.data.notifications : [];
      } else if (res?.data && Array.isArray(res.data)) {
        list = res.data;
      }
      setNotifications(list);

      try {
        if (!user) return; // Guard clause
        const currentUserId = user?.id != null ? user.id.toString() : undefined;
        const filteredList = list.filter((n) => {
          if (!n) return false;
          const senderIdRaw =
            n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
          const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
          const senderRole = (
            n.sender_role ||
            n.creator_role ||
            n.creator?.role ||
            ''
          ).toLowerCase();

          // 1. Show notifications created by this admin
          if (currentUserId != null && senderId === currentUserId) return true;

          // 2. Show notifications targeted to this specific user
          const targetUserIds = n.target_user_ids || n.targetUserIds;
          if (
            Array.isArray(targetUserIds) &&
            currentUserId != null &&
            targetUserIds.some((id) => id?.toString() === currentUserId)
          )
            return true;

          // 3. Show notifications targeted to this admin's role or "all"
          const targetRoles = n.target_roles || n.targetRoles;
          if (Array.isArray(targetRoles) && targetRoles.length > 0) {
            const normalizedTargetRoles = targetRoles.map((r) => r.toLowerCase());
            if (normalizedTargetRoles.includes('admin') || normalizedTargetRoles.includes('all'))
              return true;
          }

          // 4. Fallback to target_audience string
          const rawTarget = n.target_audience || n.targetAudience || '';
          const target = (
            typeof rawTarget === 'string' ? rawTarget : String(rawTarget || '')
          ).toLowerCase();
          if (target === 'admin' || target === 'all') return true;

          // 5. Special Oversight: Admins can see alerts/announcements sent BY Super Admins
          // IF they are targeted to Admin or All (covered above)

          // Note: We intentionally exclude notifications from Super Admin
          // targeted at "dealer_manager" or other specific roles from the Admin view.

          return false;
        });
        setNotifications(filteredList);
      } catch (filterError) {
        console.error('Filtering error:', filterError);
        // Fallback: don't crash, just show full list
      }
    } catch (error) {
      console.error('Error loading history:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load notification history: ' + (error.message || 'Unknown error'),
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const { markAllAsRead: markAllAsReadContext, updateNotification: updateNotificationContext } =
    useNotifications();

  const handleMarkAllRead = async () => {
    try {
      // Define currentUserId in this scope
      const currentUserId = user?.id != null ? user.id.toString() : undefined;

      // Identify unread notifications that are not sent by me (broadcasts/targeted)
      // This ensures persistent marking even if bulk endpoint doesn't capture these specific broadcasts
      const unreadItems = notifications.filter((n) => {
        const isRead =
          n.isRead ||
          n.is_read ||
          (Array.isArray(n.readBy) &&
            currentUserId != null &&
            n.readBy.some((id) => id?.toString() === currentUserId)) ||
          (Array.isArray(n.read_by) &&
            currentUserId != null &&
            n.read_by.some((id) => id?.toString() === currentUserId));

        const senderIdRaw =
          n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
        const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
        const isSentByMe = currentUserId != null && senderId === currentUserId;

        return !isRead && !isSentByMe;
      });

      if (unreadItems.length === 0) return;

      // Force local update for immediate feedback (Optimistic)
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          isRead: true,
          read_by: n.read_by ? [...new Set([...n.read_by, user?.id])] : [user?.id],
          readBy: n.readBy ? [...new Set([...n.readBy, user?.id])] : [user?.id],
        }))
      );

      // 1. Call API to mark all as read (Standard bulk call for user-targeted ones)
      await notificationService.markAllAsRead();

      // 2. Mark individual items from this specific history view as read
      // to ensure they are captured even if the bulk endpoint is scoped differently
      // Process in chunks to avoid overwhelming the server
      const ids = unreadItems.map((item) => item.id).filter(Boolean);
      const chunkSize = 10;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        await Promise.allSettled(chunk.map((id) => notificationService.markAsRead(id)));
      }

      // Sync with global notification context if available
      if (markAllAsReadContext) {
        markAllAsReadContext();
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'All notifications marked as read',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error('Failed to mark all read', error);
      // On failure, reload history to restore correct state
      await loadHistory();
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-[rgb(var(--color-text))]">{row.title}</p>
          <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-1">{row.message}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      type: 'badge',
      accessor: 'type',
      config: {
        red: ['alert'],
        blue: ['announcement', 'system'],
      },
    },
    {
      header: 'Audience',
      accessor: (row) => {
        if (Array.isArray(row.target_roles) && row.target_roles.length > 0) {
          return (
            <span className="text-[rgb(var(--color-text-muted))] capitalize">
              {row.target_roles.join(', ')}
            </span>
          );
        }
        if (Array.isArray(row.target_user_ids) && row.target_user_ids.length > 0) {
          return (
            <span className="text-[rgb(var(--color-text-muted))] capitalize">
              {row.target_user_ids.length} Users
            </span>
          );
        }
        if (Array.isArray(row.target_dealerships) && row.target_dealerships.length > 0) {
          return (
            <span className="text-[rgb(var(--color-text-muted))] capitalize">
              {row.target_dealerships.length} Dealerships
            </span>
          );
        }
        const rawTarget = row.target_audience || row.targetAudience || 'All';
        return <span className="text-[rgb(var(--color-text-muted))] capitalize">{rawTarget}</span>;
      },
    },
    {
      header: 'Priority',
      type: 'badge',
      accessor: 'priority',
      config: {
        red: ['critical'],
        orange: ['high'],
        blue: ['medium'],
        gray: ['low'],
      },
    },
    {
      header: 'Sent / Scheduled At',
      accessor: (row) => {
        const dateValue = row.createdAt || row.created_at || row.scheduled_at || row.scheduledAt;
        if (!dateValue)
          return <span className="text-[rgb(var(--color-text-muted))] text-xs">-</span>;

        const date = dayjs(dateValue);
        if (!date.isValid())
          return <span className="text-[rgb(var(--color-text-muted))] text-xs">-</span>;

        const isFuture = date.isAfter(dayjs());

        return (
          <div className="flex flex-col">
            <span
              className={`text-xs ${isFuture ? 'text-blue-600 font-bold' : 'text-[rgb(var(--color-text-muted))]'}`}
            >
              {isFuture ? '📅 Scheduled' : '✅ Sent'}
            </span>
            <span className="text-[rgb(var(--color-text-muted))] text-[10px]">
              {date.format('MMM D, YYYY h:mm A')}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row) => {
        const senderIdRaw = row.sender_id ?? row.senderId ?? row.sender?.id ?? row.creator_id;
        const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
        const isSentByMe = currentUserId != null && senderId === currentUserId;

        const isScheduled =
          (row.scheduled_at || row.scheduledAt) &&
          dayjs(row.scheduled_at || row.scheduledAt).isAfter(dayjs());

        if (isSentByMe) {
          return (
            <span
              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${isScheduled ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20' : 'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] border border-[rgb(var(--color-success))]/20'}`}
            >
              {isScheduled ? 'Scheduled' : 'Sent'}
            </span>
          );
        }

        const isRead =
          row.is_read ||
          row.isRead ||
          (row.readBy &&
            Array.isArray(row.readBy) &&
            currentUserId != null &&
            row.readBy.some((id) => id?.toString() === currentUserId)) ||
          (row.read_by &&
            Array.isArray(row.read_by) &&
            currentUserId != null &&
            row.read_by.some((id) => id?.toString() === currentUserId));

        return isRead ? (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]">
            Read
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20 animate-pulse">
            Unread
          </span>
        );
      },
    },
    {
      header: 'Actions',
      className: 'w-32',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={async () => {
              const isRead =
                row.is_read ||
                row.isRead ||
                (row.readBy &&
                  Array.isArray(row.readBy) &&
                  currentUserId != null &&
                  row.readBy.some((id) => id?.toString() === currentUserId)) ||
                (row.read_by &&
                  Array.isArray(row.read_by) &&
                  currentUserId != null &&
                  row.read_by.some((id) => id?.toString() === currentUserId));
              const senderIdRaw = row.sender_id ?? row.senderId ?? row.sender?.id ?? row.creator_id;
              const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
              const isSentByMe = currentUserId != null && senderId === currentUserId;

              if (!isRead && !isSentByMe) {
                // Optimistically mark as read locally
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === row.id
                      ? {
                          ...n,
                          is_read: true,
                          isRead: true,
                          readBy: [...(n.readBy || []), user?.id],
                        }
                      : n
                  )
                );

                try {
                  await notificationService.markAsRead(row.id);
                  if (updateNotificationContext) {
                    updateNotificationContext(row.id, { isRead: true });
                  }
                } catch (error) {
                  console.warn('Failed to mark as read on server', error);
                }
              }

              Swal.fire({
                title: row.title,
                html: `
                                    <div class="text-left space-y-4">
                                        <div class="flex items-center gap-2 mb-4">
                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${row.priority === 'high' ? 'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] border-[rgb(var(--color-error))]/20' : 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]/20'}">
                                                ${row.priority}
                                            </span>
                                            <span class="text-xs text-[rgb(var(--color-text-muted))]">${new Date(row.created_at || row.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div class="space-y-4">
                                            <div>
                                                <p class="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-1">Target Audience</p>
                                                <p class="text-sm text-[rgb(var(--color-text))] capitalize">
                                                    ${
                                                      Array.isArray(row.target_roles) &&
                                                      row.target_roles.length > 0
                                                        ? `Roles: ${row.target_roles.join(', ')}`
                                                        : Array.isArray(row.target_user_ids) &&
                                                            row.target_user_ids.length > 0
                                                          ? `${row.target_user_ids.length} Users`
                                                          : Array.isArray(row.target_dealerships) &&
                                                              row.target_dealerships.length > 0
                                                            ? `${row.target_dealerships.length} Dealerships`
                                                            : row.target_audience || 'All'
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p class="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-1">
                                                    ${dayjs(row.scheduled_at || row.scheduledAt).isAfter(dayjs()) ? 'Scheduled For' : 'Sent At'}
                                                </p>
                                                <p class="text-sm text-[rgb(var(--color-text))]">${formatDateTime(row.scheduled_at || row.scheduledAt)}</p>
                                            </div>
                                            <div class="pt-4 border-t border-[rgb(var(--color-border))]">
                                                <p class="text-sm text-[rgb(var(--color-text))] leading-relaxed">${row.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                `,
                icon: 'info',
                confirmButtonText: 'Close',
                confirmButtonColor: 'rgb(var(--color-primary))',
                customClass: {
                  popup:
                    'rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]',
                  title: 'text-[rgb(var(--color-text))]',
                  confirmButton: 'rounded-xl px-6',
                },
                width: '600px',
              });
            }}
            className="p-2 hover:bg-[rgb(var(--color-primary))]/10 rounded-lg transition-colors text-[rgb(var(--color-primary))]"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={async () => {
              const { value: formValues } = await Swal.fire({
                title: 'Edit Notification',
                html: `
                                    <div class="text-left space-y-4 py-2">
                                        <div class="space-y-1">
                                            <label class="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">Subject</label>
                                            <input id="swal-notif-title" class="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-[rgb(var(--color-text))] outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all" value="${row.title}">
                                        </div>
                                        <div class="space-y-1">
                                            <label class="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">Message</label>
                                            <textarea id="swal-notif-message" class="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-[rgb(var(--color-text))] outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all min-h-[120px]" rows="4">${row.message}</textarea>
                                        </div>
                                    </div>
                                `,
                showCancelButton: true,
                confirmButtonText: 'Save Changes',
                confirmButtonColor: 'rgb(var(--color-primary))',
                customClass: {
                  popup:
                    'rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]',
                  title: 'text-[rgb(var(--color-text))]',
                  confirmButton: 'rounded-xl px-6',
                  cancelButton:
                    'rounded-xl px-6 border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))]',
                },
                focusConfirm: false,
                preConfirm: () => {
                  return {
                    title: document.getElementById('swal-notif-title').value,
                    message: document.getElementById('swal-notif-message').value,
                  };
                },
              });

              if (formValues) {
                try {
                  await notificationService.updateNotification(row.id, formValues);
                  await loadHistory();
                  Swal.fire({
                    title: 'Updated!',
                    text: 'Notification has been updated.',
                    icon: 'success',
                    confirmButtonColor: 'rgb(var(--color-primary))',
                  });
                } catch (error) {
                  Swal.fire({
                    title: 'Error',
                    text: 'Failed to update notification.',
                    icon: 'error',
                    confirmButtonColor: 'rgb(var(--color-primary))',
                  });
                }
              }
            }}
            className="p-2 hover:bg-[rgb(var(--color-primary))]/10 rounded-lg transition-colors text-[rgb(var(--color-primary))]"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={async () => {
              const result = await Swal.fire({
                title: 'Delete Notification?',
                text: 'This action cannot be undone!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: 'rgb(var(--color-error))',
                cancelButtonColor: 'rgb(var(--color-background))',
                confirmButtonText: 'Yes, delete it!',
                customClass: {
                  popup:
                    'rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]',
                  title: 'text-[rgb(var(--color-text))]',
                  htmlContainer: 'text-[rgb(var(--color-text-muted))]',
                  confirmButton: 'rounded-xl px-6',
                  cancelButton:
                    'rounded-xl px-6 border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))]',
                },
              });
              if (result.isConfirmed) {
                try {
                  await notificationService.deleteNotification(row.id);
                  await loadHistory();
                  Swal.fire({
                    title: 'Deleted!',
                    text: 'Notification has been deleted.',
                    icon: 'success',
                    confirmButtonColor: 'rgb(var(--color-primary))',
                  });
                } catch (error) {
                  Swal.fire({
                    title: 'Error',
                    text: 'Failed to delete notification.',
                    icon: 'error',
                    confirmButtonColor: 'rgb(var(--color-primary))',
                  });
                }
              }
            }}
            className="p-2 hover:bg-[rgb(var(--color-error))]/10 rounded-lg transition-colors text-[rgb(var(--color-error))]"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = notifications.filter((n) => {
    const isRead =
      n.is_read ||
      n.isRead ||
      (n.readBy &&
        Array.isArray(n.readBy) &&
        currentUserId != null &&
        n.readBy.some((id) => id?.toString() === currentUserId)) ||
      (n.read_by &&
        Array.isArray(n.read_by) &&
        currentUserId != null &&
        n.read_by.some((id) => id?.toString() === currentUserId));
    const senderIdRaw = n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
    const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
    const isSentByMe = currentUserId != null && senderId === currentUserId;

    if (filter === 'unread') return !isRead && !isSentByMe;
    if (filter === 'read') return isRead;
    return true;
  });

  const hasUnread = notifications.some((n) => {
    const isRead =
      n.is_read ||
      n.isRead ||
      (n.readBy &&
        Array.isArray(n.readBy) &&
        currentUserId != null &&
        n.readBy.some((id) => id?.toString() === currentUserId)) ||
      (n.read_by &&
        Array.isArray(n.read_by) &&
        currentUserId != null &&
        n.read_by.some((id) => id?.toString() === currentUserId));
    const senderIdRaw = n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
    const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
    const isSentByMe = currentUserId != null && senderId === currentUserId;
    return !isRead && !isSentByMe;
  });

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl px-2 font-semibold text-[rgb(var(--color-text))]">Inbox</h2>

        <div className="flex gap-2 p-1.5 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-[rgb(var(--color-primary))] text-white shadow-md'
                : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-text))]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === 'unread'
                ? 'bg-[rgb(var(--color-primary))] text-white shadow-md'
                : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-text))]'
            }`}
          >
            Unread
          </button>
          <div className="w-px bg-[rgb(var(--color-border))] mx-1 my-1"></div>
          <button
            onClick={() => handleMarkAllRead()}
            disabled={!hasUnread}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all
                                ${
                                  hasUnread
                                    ? 'text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/10 cursor-pointer'
                                    : 'text-[rgb(var(--color-text-muted))] cursor-not-allowed opacity-50'
                                }`}
          >
            <Check size={14} /> Mark All Read
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        title="Broadcast History"
        onRefresh={loadHistory}
        searchable
        searchKeys={['title', 'message', 'type', 'priority']}
      />
    </div>
  );
}

function TemplateManager({ onSend }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getTemplates();
      const extractData = (response, key) => {
        if (Array.isArray(response)) return response;
        if (key && Array.isArray(response[key])) return response[key];
        if (Array.isArray(response.data)) return response.data;
        if (response.data && key && Array.isArray(response.data[key])) return response.data[key];
        if (response.data && typeof response.data === 'object') {
          for (const k of Object.keys(response.data)) {
            if (Array.isArray(response.data[k])) return response.data[k];
          }
        }
        return [];
      };

      const list = extractData(res, 'templates');
      setTemplates(list);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Template?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: 'rgb(var(--color-primary))',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await notificationService.deleteTemplate(id);
        await loadTemplates();
        Swal.fire({
          title: 'Deleted!',
          text: 'Template has been deleted.',
          icon: 'success',
          confirmButtonColor: 'rgb(var(--color-primary))',
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete template.',
          icon: 'error',
          confirmButtonColor: 'rgb(var(--color-primary))',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl p-6 h-64 animate-pulse"
          >
            <div className="h-4 w-20 bg-[rgb(var(--color-border))] rounded mb-4"></div>
            <div className="h-6 w-48 bg-[rgb(var(--color-border))] rounded mb-3"></div>
            <div className="h-10 w-full bg-[rgb(var(--color-border))] rounded mb-3"></div>
            <div className="h-20 w-full bg-[rgb(var(--color-border))] rounded mt-4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === 'form') {
    return (
      <TemplateForm
        template={editingTemplate}
        onCancel={() => {
          setViewMode('list');
          setEditingTemplate(null);
        }}
        onSuccess={() => {
          setViewMode('list');
          setEditingTemplate(null);
          loadTemplates();
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Message Templates</h3>
          <p className="text-sm text-[rgb(var(--color-text-muted))]">
            Create reusable notification templates
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setViewMode('form');
          }}
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg shadow-[rgb(var(--color-primary))]/20"
        >
          <Plus size={18} /> New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-[rgb(var(--color-surface))] border border-dashed border-[rgb(var(--color-border))] rounded-2xl">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[rgb(var(--color-background))] flex items-center justify-center">
            <FileText size={32} className="text-[rgb(var(--color-text-muted))]" />
          </div>
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-2">No Templates Yet</h3>
          <p className="text-sm text-[rgb(var(--color-text-muted))] mb-6">
            Create your first template to get started
          </p>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setViewMode('form');
            }}
            className="inline-flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} /> Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t, index) => (
            <div
              key={t.id}
              className="relative group bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl p-6 hover:shadow-lg hover:border-[rgb(var(--color-primary))]/30 transition-all duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button
                  onClick={() => onSend && onSend(t)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100 shadow-sm"
                  title="Send from Template"
                >
                  <Send size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditingTemplate(t);
                    setViewMode('form');
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 shadow-sm"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Type Badge */}
              <div className="mb-4">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    t.type === 'alert'
                      ? 'bg-red-100 text-red-700'
                      : t.type === 'announcement'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {t.type}
                </span>
              </div>

              {/* Template Name */}
              <h4 className="font-bold text-[rgb(var(--color-text))] mb-3 pr-24 line-clamp-1">
                {t.name}
              </h4>

              {/* Title Template */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase block mb-1">
                  Title
                </label>
                <p className="text-xs font-mono text-[rgb(var(--color-text))] bg-[rgb(var(--color-background))] p-2.5 rounded border border-[rgb(var(--color-border))] truncate">
                  {t.title_template || t.titleTemplate}
                </p>
              </div>

              {/* Message Template */}
              <div>
                <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase block mb-1">
                  Message
                </label>
                <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-3 leading-relaxed">
                  {t.message_template || t.messageTemplate}
                </p>
              </div>

              {/* Footer Info */}
              {t.category && (
                <div className="mt-4 pt-4 border-t border-[rgb(var(--color-border))] flex justify-between items-center">
                  <span className="text-[10px] text-[rgb(var(--color-text-muted))] capitalize bg-[rgb(var(--color-background))] px-2 py-0.5 rounded border border-[rgb(var(--color-border))]">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-[rgb(var(--color-text-muted))] capitalize">
                    Priority:{' '}
                    <span className="font-semibold text-[rgb(var(--color-primary))]">
                      {t.default_priority || t.defaultPriority || 'Medium'}
                    </span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateForm({ template, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'system',
    category: 'operational',
    titleTemplate: '',
    messageTemplate: '',
    defaultPriority: 'medium',
    defaultTargetAudience: 'all',
    isActive: true,
    variables: [],
  });

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        titleTemplate: template.title_template || template.titleTemplate || '',
        messageTemplate: template.message_template || template.messageTemplate || '',
        description: template.description || '',
        category: template.category || 'operational',
        defaultPriority: template.default_priority || template.defaultPriority || 'medium',
        defaultTargetAudience:
          template.default_target_audience || template.defaultTargetAudience || 'all',
        isActive:
          template.is_active !== undefined
            ? template.is_active
            : template.isActive !== undefined
              ? template.isActive
              : true,
      });
    }
  }, [template]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form data
    try {
      await templateValidationSchema.validate(formData, { abortEarly: false });
    } catch (err) {
      const errors = {};
      if (err.inner) {
        err.inner.forEach((error) => {
          errors[error.path] = error.message;
        });
      }
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const extractedVars = [];
      const regex = /{{([^}]+)}}/g;
      let match;
      const seen = new Set();

      const scan = (str) => {
        if (!str) return;
        while ((match = regex.exec(str)) !== null) {
          const varName = match[1].trim();
          if (!seen.has(varName)) {
            seen.add(varName);
            extractedVars.push({
              name: varName,
              required: true,
              type: 'string',
              description: `Variable for ${varName}`,
            });
          }
        }
      };

      scan(formData.titleTemplate);
      scan(formData.messageTemplate);

      const payload = {
        name: formData.name,
        description: formData.description || '',
        type: formData.type || 'system',
        category: formData.category || 'operational',
        title_template: formData.titleTemplate,
        message_template: formData.messageTemplate,
        default_priority: formData.defaultPriority || 'medium',
        default_target_audience: formData.defaultTargetAudience || 'all',
        is_active: formData.isActive !== undefined ? formData.isActive : true,
        variables: extractedVars,
      };

      if (template && template.id) {
        await notificationService.updateTemplate(template.id, payload);
      } else {
        await notificationService.createTemplate(payload);
      }

      Swal.fire({
        title: 'Success!',
        text: 'Template saved successfully.',
        icon: 'success',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });

      onSuccess();
    } catch (error) {
      console.error('Template Save Error:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      Swal.fire({
        title: 'Error Saving Template',
        html: `
                    <div class="text-left space-y-2">
                        <p><strong>Status:</strong> ${status || 'Unknown'}</p>
                        <p><strong>Message:</strong> ${message}</p>
                    </div>
                `,
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm animate-fade-in">
      {/* Form Header */}
      <div className="p-6 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-gradient-to-br from-[rgb(var(--color-primary))]/5 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            type="button"
            className="p-2 hover:bg-[rgb(var(--color-background))] rounded-xl transition-all border border-transparent hover:border-[rgb(var(--color-border))] shadow-sm"
            title="Back to List"
          >
            <ChevronLeft size={20} className="text-[rgb(var(--color-text-muted))]" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
              <FileText size={24} className="text-[rgb(var(--color-primary))]" />
              {template ? 'Edit Template' : 'Create Template'}
            </h3>
            <p className="text-sm text-[rgb(var(--color-text-muted))]">
              {template
                ? 'Update existing notification template'
                : 'Create a new reusable message template'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-6 sm:p-8">
        <form id="templateForm" onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Info Section */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-[rgb(var(--color-text))] border-l-4 border-[rgb(var(--color-primary))] pl-3 py-1">
                General Information
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2 tracking-wider">
                    Template Name *
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-[rgb(var(--color-background))] border rounded-xl px-4 py-3 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all ${validationErrors.name ? 'border-red-500 ring-2 ring-red-50' : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary)/0.5)]'}`}
                    placeholder="e.g. Quote Approval Alert"
                  />
                  {validationErrors.name && (
                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2 tracking-wider">
                      Category *
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full appearance-none bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all pr-10"
                      >
                        <option value="operational">Operational</option>
                        <option value="system">System</option>
                        <option value="marketing">Marketing</option>
                        <option value="emergency">Emergency</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2 tracking-wider">
                      Type *
                    </label>
                    <div className="relative">
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full appearance-none bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all pr-10"
                      >
                        <option value="announcement">Announcement</option>
                        <option value="alert">Alert</option>
                        <option value="system">System</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2 tracking-wider">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all resize-none hover:border-[rgb(var(--color-primary)/0.5)]"
                    placeholder="What is this template primarily used for?"
                  />
                </div>
              </div>
            </div>

            {/* Configuration Section */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-[rgb(var(--color-text))] border-l-4 border-[rgb(var(--color-primary))] pl-3 py-1">
                Defaults & Targeting
              </h4>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2 tracking-wider">
                      Default Priority
                    </label>
                    <div className="relative">
                      <select
                        name="defaultPriority"
                        value={formData.defaultPriority}
                        onChange={handleChange}
                        className="w-full appearance-none bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all pr-10"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2 tracking-wider">
                      Target Audience
                    </label>
                    <div className="relative">
                      <select
                        name="defaultTargetAudience"
                        value={formData.defaultTargetAudience}
                        onChange={handleChange}
                        className="w-full appearance-none bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all pr-10"
                      >
                        <option value="my_staff">My Staff</option>
                        <option value="dealer_manager">Dealer Managers</option>
                        <option value="all">Everyone</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg h-fit">
                      <Megaphone size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-blue-800 uppercase mb-1">
                        Portability Note
                      </h5>
                      <p className="text-[11px] text-blue-600 leading-relaxed">
                        These settings will be pre-filled when you use this template to send a new
                        broadcast.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-6 pt-4">
            <h4 className="text-sm font-bold text-[rgb(var(--color-text))] border-l-4 border-[rgb(var(--color-primary))] pl-3 py-1">
              Message Content
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2 tracking-wider font-mono">
                  Title Template *
                </label>
                <input
                  name="titleTemplate"
                  value={formData.titleTemplate}
                  onChange={handleChange}
                  className={`w-full font-mono text-sm bg-[rgb(var(--color-background))] border rounded-xl px-4 py-3 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all ${validationErrors.titleTemplate ? 'border-red-500 ring-2 ring-red-50' : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary)/0.5)]'}`}
                  placeholder="Quote #{{quoteId}} Status Update"
                />
                {validationErrors.titleTemplate && (
                  <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                    {validationErrors.titleTemplate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2 tracking-wider font-mono">
                  Message Template *
                </label>
                <textarea
                  name="messageTemplate"
                  value={formData.messageTemplate}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full font-mono text-sm bg-[rgb(var(--color-background))] border rounded-xl px-4 py-4 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all resize-none ${validationErrors.messageTemplate ? 'border-red-500 ring-2 ring-red-50' : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary)/0.5)]'}`}
                  placeholder="Hello {{customerName}}, your quote has been approved..."
                />
                {validationErrors.messageTemplate && (
                  <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                    {validationErrors.messageTemplate}
                  </p>
                )}
              </div>

              {/* Variable Helper - Visual Enhancement */}
              <div className="bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[rgb(var(--color-primary))] rounded-full"></div>
                    <h5 className="text-[11px] font-bold text-[rgb(var(--color-text))] uppercase tracking-widest">
                      Available Variables
                    </h5>
                  </div>
                  <span className="text-[10px] text-[rgb(var(--color-text-muted))] italic">
                    Use double curly braces
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {['customerName', 'quoteId', 'status', 'date', 'agency'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        const newVal = formData.messageTemplate + ` {{${v}}}`;
                        setFormData({ ...formData, messageTemplate: newVal });
                      }}
                      className="px-3 py-1.5 bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-primary))] border border-[rgb(var(--color-border))] hover:border-transparent rounded-lg text-xs font-mono text-[rgb(var(--color-text-muted))] hover:text-white transition-all shadow-sm flex items-center gap-2 group"
                    >
                      <span className="text-[rgb(var(--color-primary))] group-hover:text-white">
                        +
                      </span>
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Form Footer */}
      <div className="p-6 bg-[rgb(var(--color-background))]/30 border-t border-[rgb(var(--color-border))] flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm font-semibold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          form="templateForm"
          disabled={saving}
          className="flex items-center gap-2 px-8 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-xl hover:bg-blue-700 font-bold transition-all duration-300 disabled:opacity-50 shadow-lg shadow-[rgb(var(--color-primary))]/20 hover:shadow-[rgb(var(--color-primary))]/40 active:scale-95"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Check size={18} />
              <span>Save Template</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
