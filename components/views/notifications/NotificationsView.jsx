'use client';
import React, { useState } from 'react';
import { useNotifications } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import DataTable from '../../common/DataTable';
import GenericFormModal from '../../common/FormModal';
import Loader from '../../common/Loader';
import {
  Bell,
  Trash2,
  Plus,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  Calendar,
  Edit2,
} from 'lucide-react';
import * as yup from 'yup';
import Swal from 'sweetalert2';

const notificationSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  message: yup.string().required('Message is required'),
  type: yup.string().required('Type is required'),
  targetRole: yup.string().required('Target Audience is required'),
});

export default function NotificationsView() {
  const {
    userNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    isLoading,
  } = useNotifications(); // Use userNotifications
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);

  if (isLoading) return <Loader />;

  const getRoleOptions = () => {
    const fullOptions = [
      { value: 'all', label: 'All Users' },
      { value: 'admin', label: 'Admins' },
      { value: 'manager', label: 'Managers' },
      { value: 'seller', label: 'Sellers' },
      { value: 'dealer', label: 'Dealers' },
    ];

    if (user?.role === 'super_admin') return fullOptions;
    if (user?.role === 'admin') {
      return fullOptions.filter((opt) => ['manager', 'seller', 'dealer'].includes(opt.value));
    }
    return [];
  };

  const targetOptions = getRoleOptions();

  // The context already filters for:
  // 1. Inbox (Sent to me or my role)
  // 2. Outbox (Sent by me)
  // 3. Super Admin (sees everything)
  const filteredNotifications = userNotifications;

  const handleSave = (data) => {
    if (editingNotification) {
      updateNotification(editingNotification.id, data);
      Swal.fire({
        icon: 'success',
        title: 'Notification Updated',
        text: 'The notification has been updated successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      createNotification(data);
      Swal.fire({
        icon: 'success',
        title: 'Notification Sent',
        text: `Message broadcasted to ${data.targetRole === 'all' ? 'everyone' : data.targetRole}.`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
    setIsAddModalOpen(false);
    setEditingNotification(null);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete Notification?',
      text: "This will remove it for all users who haven't seen it yet.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteNotification(id);
        Swal.fire('Deleted', 'Notification removed.', 'success');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Notification Center</h1>
          <p className="text-[rgb(var(--color-text))] text-sm">
            Broadcast messages and manage system alerts
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)]"
        >
          <Plus size={18} />
          <span>New Broadcast</span>
        </button>
      </div>

      <DataTable
        data={filteredNotifications}
        searchKeys={['title', 'message']}
        columns={[
          {
            header: 'Message',
            accessor: (row) => (
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg mt-1 
                                    ${
                                      row.type === 'info'
                                        ? 'bg-blue-100 text-blue-600'
                                        : row.type === 'success'
                                          ? 'bg-green-100 text-green-600'
                                          : row.type === 'warning'
                                            ? 'bg-yellow-100 text-yellow-600'
                                            : 'bg-red-100 text-red-600'
                                    }`}
                >
                  {row.type === 'info' && <Info size={18} />}
                  {row.type === 'success' && <CheckCircle size={18} />}
                  {row.type === 'warning' && <AlertTriangle size={18} />}
                  {row.type === 'error' && <XCircle size={18} />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[rgb(var(--color-text))]">{row.title}</p>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-1">
                    {row.message}
                  </p>
                </div>
              </div>
            ),
          },
          {
            header: 'Target',
            accessor: (row) => (
              <div className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-background))] px-2 py-1 rounded-md border border-[rgb(var(--color-border))] self-start w-fit">
                <Users size={12} />
                {row.targetRole === 'all'
                  ? 'Everyone'
                  : row.targetRole.charAt(0).toUpperCase() + row.targetRole.slice(1)}
              </div>
            ),
          },
          {
            header: 'Status',
            accessor: (row) => {
              const isScheduled = row.scheduledAt && new Date(row.scheduledAt) > new Date();
              if (isScheduled) {
                return (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    Scheduled
                  </span>
                );
              }
              return (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                  Sent
                </span>
              );
            },
          },
          {
            header: 'Date',
            accessor: (row) => {
              const date = row.scheduledAt || row.createdAt;
              return (
                <div className="flex flex-col">
                  <span className="text-xs text-[rgb(var(--color-text))] font-medium">
                    {new Date(date).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-[rgb(var(--color-text-muted))]">
                    {new Date(date).toLocaleTimeString()}
                  </span>
                </div>
              );
            },
            sortable: true,
          },
          {
            header: 'Read Count',
            accessor: (row) => (
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                {row.readBy?.length || 0}
              </span>
            ),
          },
          {
            header: '',
            accessor: (row) => {
              const canManage =
                user?.role?.toLowerCase() === 'super_admin' || row.creatorId === user?.id;

              if (!canManage) return null;

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNotification(row);
                      setIsAddModalOpen(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            },
            className: 'w-20',
          },
        ]}
      />

      <GenericFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingNotification(null);
        }}
        onSave={handleSave}
        title={editingNotification ? 'Edit Notification' : 'Send Notification'}
        initialData={editingNotification}
        validationSchema={notificationSchema}
        fields={[
          { name: 'title', label: 'Title', placeholder: 'e.g. System Maintenance', icon: Bell },
          {
            name: 'message',
            label: 'Message',
            type: 'textarea',
            placeholder: 'Enter the full message content...',
            icon: Info,
          },
          {
            name: 'type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'info', label: 'Info' },
              { value: 'success', label: 'Success' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Critical' },
            ],
            defaultValue: 'info',
            icon: AlertTriangle,
          },
          {
            name: 'targetRole',
            label: 'Target Audience',
            type: 'select',
            options: targetOptions,
            defaultValue: targetOptions[0]?.value || 'manager',
            icon: Users,
          },
          {
            name: 'scheduledAt',
            label: 'Schedule (Optional)',
            type: 'datetime-local',
            placeholder: 'Leave blank to send immediately',
          },
        ]}
      />
    </div>
  );
}
