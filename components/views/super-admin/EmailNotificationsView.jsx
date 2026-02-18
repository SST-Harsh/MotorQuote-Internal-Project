'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Filter, Send, Trash2, Edit, Activity, User, Eye } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import Loader from '../../common/Loader';
import cmsService from '@/services/cmsService';

const EmailNotificationsView = () => {
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Simple schema for test email
  const testEmailSchema = yup.object({
    email: yup.string().email('Invalid email address').required('Email is required'),
  });

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await cmsService.getEmailTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load email templates', error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handlePreview = (template, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    e.preventDefault();

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-error))',
      cancelButtonColor: 'rgb(var(--color-primary))',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await cmsService.deleteEmailTemplate(id);
          setTemplates((prev) => prev.filter((t) => t.id !== id));
          Swal.fire('Deleted!', 'Template has been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error', 'Failed to delete template', 'error');
        }
      }
    });
  };

  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [targetValue, setTargetValue] = useState('');

  const handleSend = (template, e) => {
    e.stopPropagation();
    e.preventDefault();

    const isActive = template.isActive || template.is_active || template.status === 'Active';

    if (!isActive) {
      Swal.fire('Disabled', 'This template is disabled and cannot be sent.', 'error');
      return;
    }

    setSelectedTemplate(template);
    setTargetValue('');
    setShowSendModal(true);
  };

  const confirmSend = async () => {
    setValidationErrors({});

    try {
      await testEmailSchema.validate({ email: targetValue });
    } catch (err) {
      setValidationErrors({ email: err.message });
      return;
    }

    setIsSending(true);

    setIsSending(true);
    try {
      await cmsService.sendTestEmail(selectedTemplate.id, targetValue);
      Swal.fire('Sent!', `Test email sent to ${targetValue}`, 'success');
      setShowSendModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      Swal.fire('Error', 'Failed to send test email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const StatusBadge = ({ isActive, is_active, status }) => {
    const active = isActive || is_active || status === 'Active';
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
          active
            ? 'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] border-[rgb(var(--color-success))]/20'
            : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border-[rgb(var(--color-border))]'
        }`}
      >
        {active ? 'Active' : 'Disabled'}
      </span>
    );
  };

  const filteredTemplates = templates.filter(
    (t) =>
      (t.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (t.subject?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-4">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))] ">Email Templates</h1>
          <p className="text-sm text-[rgb(var(--color-text-muted))]">
            Manage your automated email templates and layouts.
          </p>
        </div>
        <Link
          href="/notifications/email/create"
          className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition-colors font-medium shadow-lg shadow-[rgb(var(--color-primary)/0.2)]"
        >
          <Plus size={18} />
          Create New Template
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or subject..."
            className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--color-primary))] text-sm transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handlePreview(template)}
            className="group flex flex-col bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] p-5 hover:border-[rgb(var(--color-primary))] transition-all duration-300 hover:shadow-lg hover:shadow-[rgb(var(--color-primary)/0.05)] cursor-pointer"
          >
            {/* Header: Status & Category */}
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-background))] px-2 py-0.5 rounded border border-[rgb(var(--color-border))]">
                {template.category || 'General'}
              </span>
              <StatusBadge
                isActive={template.isActive}
                is_active={template.is_active}
                status={template.status}
              />
            </div>

            <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-1 group-hover:text-[rgb(var(--color-primary))] transition-colors truncate">
              {template.name}
            </h3>

            {/* Preview Body */}
            <p className="text-xs text-[rgb(var(--color-text-muted))] mb-4 line-clamp-2 min-h-[32px] opacity-70">
              {template.description || template.subject}
            </p>

            <div className="mt-auto pt-4 border-t border-[rgb(var(--color-border))] flex items-center justify-between">
              <div className="flex flex-col text-[10px] text-[rgb(var(--color-text-muted))]">
                <span className="flex items-center gap-1">
                  <User size={10} /> {template.variables?.length || 0} Vars
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => handleSend(template, e)}
                  title="Send Test Email"
                  className="p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-white hover:bg-[rgb(var(--color-primary))] transition-colors"
                >
                  <Send size={16} />
                </button>
                <Link
                  href={`/notifications/email/create?id=${template.id}`}
                  onClick={(e) => e.stopPropagation()}
                  title="Edit Template"
                  className={`p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] transition-colors hover:text-white hover:bg-[rgb(var(--color-primary))]`}
                >
                  <Edit size={16} />
                </Link>
                <button
                  onClick={(e) => handleDelete(template.id, e)}
                  title="Delete"
                  className={`p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] transition-colors  hover:text-white hover:bg-[rgb(var(--color-error))] `}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-surface))] rounded-2xl border border-dashed border-[rgb(var(--color-border))]">
            <p>No templates found.</p>
            <Link
              href="/notifications/email/create"
              className="text-[rgb(var(--color-primary))] hover:underline mt-2"
            >
              Create your first template
            </Link>
          </div>
        )}
      </div>
      {showSendModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[rgb(var(--color-border))]">
              <h2 className="text-xl font-bold font-racing">
                Send &quot;{selectedTemplate.name}&quot;
              </h2>
              <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
                Send a test email to yourself or another address.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className={`w-full bg-[rgb(var(--color-background))] border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors ${validationErrors.email ? 'border-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))] focus:border-[rgb(var(--color-primary))]'}`}
                  autoFocus
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                    {validationErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/50 flex justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                disabled={isSending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                disabled={isSending}
                className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal &&
        selectedTemplate &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <div
              className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] z-10">
                <div>
                  <h2 className="text-xl font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
                    <Eye size={20} className="text-[rgb(var(--color-primary))]" />
                    Template Preview
                  </h2>
                  <p className="text-sm text-[rgb(var(--color-text-muted))]">
                    {selectedTemplate.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-[rgb(var(--color-background))] rounded-full transition-colors font-bold text-[rgb(var(--color-text-muted))]"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-[rgb(var(--color-surface))] p-8 flex justify-center">
                <div className="w-full max-w-3xl bg-[rgb(var(--color-surface))] shadow-lg rounded-lg overflow-hidden flex flex-col min-h-[500px]">
                  {/* Email Subject Line Mockup */}
                  <div className="p-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
                    <h4 className="text-sm font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest mb-1">
                      Subject
                    </h4>
                    <div className="font-medium text-[rgb(var(--color-text))] text-lg">
                      {selectedTemplate.subject}
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="flex-1 p-8 prose max-w-none text-[rgb(var(--color-text))]">
                    {/* Render HTML content safely with fallbacks */}
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          selectedTemplate.bodyHtml ||
                          selectedTemplate.body_html ||
                          selectedTemplate.body ||
                          '<p class="text-[rgb(var(--color-text-muted))] italic">No content available</p>',
                      }}
                    />
                  </div>

                  <div className="p-6 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] text-center text-xs text-[rgb(var(--color-text-muted))]">
                    This is a preview of how the email structure will look. Variables like{' '}
                    {'{{name}}'} will be replaced at runtime.
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default EmailNotificationsView;
